// Board RenforTeam (ESTABLISHMENT) : missions publiées + candidatures reçues.
// Flow RenforTeam — vue établissement (publier -> voir candidatures -> confirmer).
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import { RenfortModal } from "../../../_shared/modals/RenfortModal";
import { BookingActions } from "../../../_shared/BookingActions";
import { MatchingPanel } from "../../../_shared/MatchingPanel";
import { ApprouverMission } from "../../../_shared/ApprouverMission";
import { RepublierMission } from "../../../_shared/RepublierMission";
import { PublierMission } from "../../../_shared/PublierMission";
import { RetenirIntervenant } from "../../../_shared/VivierActions";
import { FileEngagement } from "../../../_shared/FileEngagement";
import {
  MISSION_CATEGORY_LABEL,
  MISSION_STATUS_LABEL,
  MISSION_VISIBILITY_LABEL,
  BOOKING_STATUS_LABEL,
  bookingBadgeVariant,
  missionBadgeVariant,
  formatDate,
  formatRate,
  fullName,
  initials,
} from "../../../_shared/format";
import type { Mission } from "../../../_shared/types";
import { renfortSalarieVisible } from "@/lib/offre";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "RenforTeam" };

/**
 * Ce que l'établissement a demandé, dit avec ses mots. Un ciblage nominatif
 * prime sur le palier de cascade : afficher « réseau réservé » quand on a
 * écrit à trois personnes nommément, c'est laisser croire à une portée qui
 * n'existe pas.
 */
function libelleDiffusion(mission: Mission): string {
  switch (mission.cibleDiffusion) {
    case "CONNUS":
      return "personnes déjà connues uniquement";
    case "UNITE":
      return "un service, en interne";
    case "SELECTION":
      return "destinataires choisis";
    default:
      return MISSION_VISIBILITY_LABEL[mission.visibility];
  }
}

export default async function RenfortsPage() {
  const session = await requireSession();

  // Publier un renfort engage l'établissement : le serveur le réserve à la
  // direction, à l'administration et aux chefs de service. L'écran doit dire
  // la même chose — proposer un bouton qui renverra une erreur d'autorisation,
  // c'est faire passer une règle pour une panne.
  const peutPublier = ["OWNER", "ADMIN", "MANAGER"].includes(session.account.role);
  // Le remplacement de poste en CDD est hors offre publique depuis le
  // 19/09/2026 (`@/lib/offre`). Voir le bloc des deux cartes, plus bas.
  const montreCdd = renfortSalarieVisible();


  if (session.account.type !== "ESTABLISHMENT") {
    return (
      <div className="space-y-6">
        <PageHeader title="RenforTeam" />
        <EmptyState
          title="Réservé aux établissements"
          description="Le board de publication des renforts est accessible depuis un compte établissement."
          action={
            <Button asChild>
              <Link href="/marketplace">Voir les missions ouvertes</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { data: missions, error } = await fetchApi<Mission[]>(
    session,
    "/missions?scope=account&include=bookings",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="RenforTeam"
        subtitle="Dites de quel besoin il s’agit : le montage en découle, pas l’inverse."
        actions={
          <div className="flex items-center gap-2">
            {/* L'export porte les heures et les montants de tout le compte :
                le serveur le réserve désormais aux responsables, l'écran dit
                la même chose. */}
            {peutPublier ? (
              <Button asChild variant="outline" size="sm">
                <a href="/api/proxy/bookings/export/heures.csv" download>
                  Exporter les heures validées
                </a>
              </Button>
            ) : null}
          </div>
        }
      />

      {/*
        ⚠⚠ LES DEUX BESOINS, ET LEURS DEUX CONTRATS — C'EST LA PORTE D'ENTRÉE.
        ------------------------------------------------------------------
        Cet écran ne proposait qu'une chose : « publier un besoin », c'est-à-dire
        un poste à couvrir, qui se conclut en CDD. Le renfort personnalisé —
        un accompagnement 1 pour 1, facturé en prestation par la structure de
        l'intervenant — n'avait AUCUNE porte d'entrée côté demande : des
        intervenants pouvaient s'y déclarer disponibles, aucun établissement ne
        pouvait en demander un.

        La règle que ces deux cartes rendent visible est celle de Siham :
        CE N'EST PAS LA PERSONNE QUI CHOISIT LE MONTAGE, C'EST LE BESOIN.

        ⚠ LE MONTAGE EST ÉCRIT SUR CHAQUE CARTE, et il doit le rester. Les deux
        s'appellent « renfort » dans la bouche des gens et se concluent par des
        contrats opposés (CE 11/02/2025 n° 491128 ; LFSS 2025 art. 70). Deux
        cartes côte à côte sans leur montage, c'est l'erreur qui ne se voit
        jamais à l'écran et se découvre au contrôle.
      */}
      {/*
        ⚠⚠ LA CARTE « REMPLACEMENT · CDD » SUIT L'OFFRE PUBLIQUE (21/09/2026).

        Le recentrage du 19/09 a sorti le remplacement de poste en CDD de
        l'offre, et cet écran ne l'avait pas suivi : le site public disait que
        ce montage n'existait plus pendant que le tableau de bord proposait
        toujours de publier un poste. Un établissement lisait deux offres
        différentes selon qu'il était connecté ou non.

        ⚠ RIEN N'EST SUPPRIMÉ. `RenfortModal`, les routes missions, la cascade
        et le générateur de CDD restent en place ; la carte revient avec
        NEXT_PUBLIC_OFFRE_PUBLIQUE=complete.

        ⚠ CE QUE CE MASQUAGE COÛTE, ET IL FAUT LE SAVOIR : hors offre complète,
        cet écran ne porte plus AUCUN bouton de publication. La demande d'un
        renfort personnalisé passe alors par le catalogue et le devis — c'est
        le montage voulu (prestation, pas emploi), mais le chemin n'est plus le
        même, et la carte restante est la seule porte.
      */}
      {peutPublier ? (
        <div className={cn('grid gap-4', montreCdd && 'md:grid-cols-2')}>
          {montreCdd ? (
            <section className="rounded-xl border-2 border-primary/35 bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Remplacement · CDD
              </p>
              <h2 className="mt-1 text-base font-semibold">Un poste à couvrir</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground" lang="fr">
                Une absence, un arrêt, un renfort d’équipe. Vous embauchez la
                personne en CDD, et le contrat s’édite ici.
              </p>
              <div className="mt-3">
                <RenfortModal accountId={session.account.id} />
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border-2 border-secondary/35 bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Renfort personnalisé · prestation
            </p>
            <h2 className="mt-1 text-base font-semibold">
              Un accompagnement 1 pour 1
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground" lang="fr">
              Un enfant à accompagner sur ses sorties, un suivi individuel : ce
              n’est pas un poste. L’intervenant facture par sa structure, sur
              devis.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/marketplace?type=services&format=INDIVIDUEL">
                  Voir les intervenants
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/dashboard/vivier-ouvert">Qui est disponible</Link>
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {error ? (
        <ErrorState retryHref="/dashboard/renforts" />
      ) : !missions || missions.length === 0 ? (
        <EmptyState
          title="Aucun renfort publié"
          description={
            peutPublier
              ? "Créez un RenforTeam : il sera diffusé en cascade (salariés → réseau réservé → public)."
              : "Aucun besoin de remplacement n’est ouvert pour le moment. Un responsable de votre établissement peut en publier un."
          }
          action={peutPublier ? <RenfortModal accountId={session.account.id} /> : undefined}
        />
      ) : (
        <div className="space-y-5">
          {missions.map((mission) => {
            const bookings = mission.bookings ?? [];
            // En file d'engagement, on ne trie pas des candidatures : on répond
            // à une personne à la fois. L'onglet par défaut doit être celui où
            // l'action se trouve, sinon la file reste bloquée sans qu'on sache
            // pourquoi.
            const enFileDEngagement = mission.modeAttribution === "FILE_ENGAGEMENT";
            return (
              <Card key={mission.id} id={mission.id}>
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={missionBadgeVariant(mission.status)}>
                          {MISSION_STATUS_LABEL[mission.status]}
                        </Badge>
                        {mission.attenteValidation ? (
                          <Badge variant="outline">En attente de validation</Badge>
                        ) : null}
                        <Badge variant="outline">
                          {MISSION_CATEGORY_LABEL[mission.category]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Diffusion : {libelleDiffusion(mission)}
                        </span>
                        {enFileDEngagement ? (
                          <Badge variant="outline">Vous validez chaque profil</Badge>
                        ) : null}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{mission.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(mission.startDate)}
                        {mission.city ? ` · ${mission.city}` : ""}
                        {mission.hourlyRate ? ` · ${formatRate(mission.hourlyRate)}` : ""}
                        {` · ${mission.headcount} poste(s)`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Publier une mission restee en brouillon : l'impasse
                          historique. Le message d'erreur du modal renvoyait
                          vers un bouton « Publier » qui n'existait nulle part. */}
                      {mission.status === "DRAFT" && peutPublier ? (
                        <PublierMission missionId={mission.id} accountId={session.account.id} />
                      ) : null}
                      {peutPublier ? (
                        <RepublierMission missionId={mission.id} accountId={session.account.id} />
                      ) : null}
                      {mission.attenteValidation &&
                      (session.account.role === "OWNER" || session.account.role === "ADMIN") ? (
                        <ApprouverMission missionId={mission.id} accountId={session.account.id} />
                      ) : null}
                      <Badge variant="secondary">
                        {bookings.length} candidature{bookings.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={enFileDEngagement ? "engagements" : "candidatures"}>
                    <TabsList>
                      {enFileDEngagement ? (
                        <TabsTrigger value="engagements">Profils à valider</TabsTrigger>
                      ) : (
                        <TabsTrigger value="candidatures">
                          Candidatures reçues ({bookings.length})
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="suggeres">Candidats suggérés</TabsTrigger>
                    </TabsList>

                    {enFileDEngagement ? (
                      <TabsContent value="engagements">
                        <FileEngagement
                          missionId={mission.id}
                          accountId={session.account.id}
                          peutDecider={peutPublier}
                        />
                      </TabsContent>
                    ) : null}

                    <TabsContent value="candidatures">
                      {bookings.length === 0 ? (
                        <p className="rounded-lg bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                          En attente de candidatures. La diffusion est en cours.
                        </p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {bookings.map((b) => (
                            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={b.applicant?.avatarUrl ?? undefined} />
                                  <AvatarFallback>
                                    {initials(b.applicant?.firstName, b.applicant?.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {fullName(b.applicant?.firstName, b.applicant?.lastName)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {b.applicant?.profile?.job ?? "Intervenant"}
                                    {b.applicant?.profile?.city ? ` · ${b.applicant.profile.city}` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={bookingBadgeVariant(b.status)}>
                                  {BOOKING_STATUS_LABEL[b.status]}
                                </Badge>
                                {/* Le bon moment pour retenir quelqu'un, c'est
                                    ici : on vient de travailler avec lui et on
                                    sait déjà si on veut le revoir. Le renvoyer
                                    vers un autre écran, c'est ne jamais le
                                    faire. */}
                                {b.accountId && b.accountId !== session.account.id ? (
                                  <RetenirIntervenant
                                    intervenantAccountId={b.accountId}
                                    nom={fullName(b.applicant?.firstName, b.applicant?.lastName)}
                                    accountId={session.account.id}
                                    retenu={false}
                                  />
                                ) : null}
                                <BookingActions
                                  bookingId={b.id}
                                  accountId={session.account.id}
                                  status={b.status}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>

                    <TabsContent value="suggeres">
                      <MatchingPanel missionId={mission.id} accountId={session.account.id} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
