// Mon établissement : profil, services et réglages.
//
// La liste des membres a déménagé sur son propre écran (/dashboard/equipe),
// paginé et cherchable : la garder ici obligeait à charger tout le monde à
// chaque ouverture de la fiche compte, pour une information qu'on ne vient
// pas y chercher. Restent ici les services — la structure de l'établissement
// — et les réglages.
import type { Metadata } from "next";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OngletsCompte, ongletDepuisUrl } from "../../../_shared/OngletsCompte";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BasculeValidationMissions } from "../../../_shared/BasculeValidationMissions";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle } from "../../../_shared/ui";
import { BasculeNotifications } from "../../../_shared/BasculeNotifications";
import { ProfileForm } from "../../../_shared/ProfileForm";
import { CvManager } from "../../../_shared/CvManager";
import { UnitsManager } from "../../../_shared/UnitsManager";
import { FacturationSettings, type IdentiteFacturation } from "../../../_shared/FacturationSettings";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ACCOUNT_ROLE_LABEL } from "../../../_shared/format";
import type { Profile } from "../../../_shared/types";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: { onglet?: string };
}) {
  const session = await requireSession();
  const isFreelance = session.account.type === "FREELANCE";
  // Lien profond ?onglet=services|parametres|profil : on ouvre le bon onglet.
  const ongletDemande = ongletDepuisUrl(searchParams?.onglet);
  const onglet = ongletDemande === "services" && isFreelance ? "profile" : ongletDemande;
  const canManage = session.account.role === "OWNER" || session.account.role === "ADMIN";
  const accountId = session.account.id;

  // /users/me renvoie l'utilisateur À PLAT, avec `profile` imbriqué — pas un
  // objet { user, profile }. L'ancienne lecture cherchait `data.user`, ne le
  // trouvait jamais, et retombait sur le jeton de connexion : les
  // modifications de prénom, nom ou téléphone ne s'affichaient qu'après une
  // reconnexion.
  const profileRes = await fetchApi<
    typeof session.user & { phone?: string | null; hebdoOptIn?: boolean; profile?: Profile | null }
  >(session, "/users/me");

  const user = profileRes.data ?? session.user;
  const profile = profileRes.data?.profile ?? null;

  // Identité de facturation : sans elle, une facture émise depuis « Devis &
  // factures » sort sans raison sociale ni SIRET — incomplète au regard de
  // la loi. Seuls OWNER/ADMIN peuvent la modifier (canManage), mais tout le
  // monde doit pouvoir la CONSULTER pour comprendre ce qui figure déjà.
  const compteRes = await fetchApi<IdentiteFacturation>(session, `/accounts/${accountId}`);
  const identiteFacturation = compteRes.data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={isFreelance ? "Mon compte" : "Mon établissement"}
        subtitle={`${session.account.name} · Votre rôle : ${ACCOUNT_ROLE_LABEL[session.account.role]}`}
      />

      {/* Le réglage vit ici parce qu'il est propre à l'appareil, pas au compte :
          l'activer sur le téléphone n'active rien sur l'ordinateur. */}
      <BasculeNotifications />

      <OngletsCompte defaultValue={onglet} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          {!isFreelance ? <TabsTrigger value="services">Services</TabsTrigger> : null}
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm
            user={user as any}
            profile={profile}
            isFreelance={isFreelance}
            accountId={accountId}
          />
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

        <TabsContent value="services" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Services et unités</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Découpez votre établissement en services. C&apos;est ce découpage qui permet
                à chaque chef de service de ne voir que son équipe, son planning et ses
                dossiers — plutôt que la structure entière.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/dashboard/equipe">Gérer l&apos;équipe</Link>
            </Button>
          </div>
          {!isFreelance ? <UnitsManager accountId={accountId} canManage={canManage} /> : null}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <FacturationSettings
            accountId={accountId}
            identite={identiteFacturation}
            canManage={canManage}
          />
          <Card>
            <CardHeader>
              <SectionTitle title="Préférences" />
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="font-medium text-foreground">Notifications email</p>
                  <p>Recevez un email pour chaque candidature ou réservation.</p>
                </div>
                <Badge variant="outline">Activé</Badge>
              </div>
              {!isFreelance ? (
                <BasculeValidationMissions accountId={accountId} canManage={canManage} />
              ) : null}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="font-medium text-foreground">Compte actif</p>
                  <p>{session.account.name}</p>
                </div>
                <Badge>{session.account.type === "ESTABLISHMENT" ? "Établissement" : "Freelance"}</Badge>
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
