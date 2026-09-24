// Mon compte / Mon établissement : profil et réglages.
//
// ⚠ Un compte = une personne (24/09/2026) : plus de membres, d'équipe ni de
// validation des missions par un responsable. La personne qui ouvre cette
// page est le titulaire du compte, elle règle tout.
import type { Metadata } from "next";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OngletsCompte } from "../../../_shared/OngletsCompte";
// `ongletDepuisUrl` NE DOIT PAS être importée de `OngletsCompte.tsx` : ce
// fichier porte « use client », donc TOUS ses exports sont des références
// client. L'appeler ici faisait planter le rendu serveur de la page entière
// (« Une erreur est survenue », 3 → 20 août 2026). Module neutre désormais.
import { ongletDepuisUrl } from "../../../_shared/onglets-compte";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle } from "../../../_shared/ui";
import { BasculeNotifications } from "../../../_shared/BasculeNotifications";
import { ProfileForm } from "../../../_shared/ProfileForm";
import { ChangerEmail } from "../../../_shared/ChangerEmail";
import { CvManager } from "../../../_shared/CvManager";
import { FacturationSettings, type IdentiteFacturation } from "../../../_shared/FacturationSettings";
import type { Profile } from "../../../_shared/types";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage({
  searchParams: searchParamsPromesse,
}: {
  searchParams?: Promise<{ onglet?: string }>;
}) {
  const searchParams = await searchParamsPromesse;
  const session = await requireSession();
  const isFreelance = session.account.type === "FREELANCE";
  // Lien profond ?onglet=services|parametres|profil : on ouvre le bon onglet.
  const ongletDemande = ongletDepuisUrl(searchParams?.onglet);
  // « ?onglet=services » (anciens liens) retombe sur le profil.
  const onglet = ongletDemande === "services" ? "profile" : ongletDemande;
  const accountId = session.account.id;

  // /users/me renvoie l'utilisateur À PLAT, avec `profile` imbriqué — pas un
  // objet { user, profile }. L'ancienne lecture cherchait `data.user`, ne le
  // trouvait jamais, et retombait sur le jeton de connexion : les
  // modifications de prénom, nom ou téléphone ne s'affichaient qu'après une
  // reconnexion.
  const profileRes = await fetchApi<
    typeof session.user & {
      phone?: string | null;
      hebdoOptIn?: boolean;
      notifMailOptIn?: boolean;
      profile?: Profile | null;
    }
  >(session, "/users/me");

  const user = profileRes.data ?? session.user;
  const profile = profileRes.data?.profile ?? null;

  // Identité de facturation : sans elle, une facture émise depuis « Devis &
  // factures » sort sans raison sociale ni SIRET, incomplète au regard de
  // la loi. Le titulaire du compte la modifie.
  const compteRes = await fetchApi<IdentiteFacturation>(session, `/accounts/${accountId}`);
  const identiteFacturation = compteRes.data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={isFreelance ? "Mon compte" : "Mon établissement"}
        subtitle={session.account.name}
      />

      {/* Le réglage vit ici parce qu'il est propre à l'appareil, pas au compte :
          l'activer sur le téléphone n'active rien sur l'ordinateur. */}
      <BasculeNotifications />

      <OngletsCompte defaultValue={onglet} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm
            user={user as any}
            profile={profile}
            isFreelance={isFreelance}
            accountId={accountId}
          />
          {/* L’adresse de connexion se change ici, et nulle part ailleurs :
              une faute de frappe a l’inscription rendait le compte
              definitivement non verifiable. */}
          <div className="mt-6">
            <ChangerEmail emailActuel={user.email} />
          </div>
          {isFreelance ? (
            <div className="mt-6 space-y-2">
              <SectionTitle title="Mon CV" />
              <p className="text-sm text-muted-foreground">
                Diplômes et expériences visibles par les établissements qui consultent votre profil.
              </p>
              <CvManager accountId={accountId} />
            </div>
          ) : null}
        </TabsContent>

        {/* L'onglet « Services et unités » a disparu le 23/09/2026. */}

        <TabsContent value="settings" className="space-y-6">
          <FacturationSettings
            accountId={accountId}
            identite={identiteFacturation}
            canManage
          />
          <Card>
            <CardHeader>
              <SectionTitle title="Préférences" />
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {/* L'étiquette « Activé » à droite ressemblait à un interrupteur
                  posé au milieu de vrais réglages : on cliquait, rien ne se
                  passait. Tant que le choix n'existe pas, on énonce le fait
                  plutôt que de faire semblant d'offrir une bascule. */}
              <div className="border-b border-border pb-4">
                <p className="font-medium text-foreground">Notifications email</p>
                <p>Vous recevez un e-mail pour chaque candidature ou réservation.</p>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="font-medium text-foreground">Compte actif</p>
                  <p>{session.account.name}</p>
                </div>
                <Badge>
                  {session.account.type === "ESTABLISHMENT"
                    ? "Établissement"
                    : session.account.type === "PARTICULIER"
                      ? "Particulier"
                      : "Intervenant"}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-destructive">Zone de danger</p>
                <p>La suppression du compte est irréversible. Contactez le support.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </OngletsCompte>
    </div>
  );
}
