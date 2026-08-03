// Board SOS Renfort (ESTABLISHMENT) : missions publiées + candidatures reçues.
// Flow SOS Renfort — vue établissement (publier -> voir candidatures -> confirmer).
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

export const metadata: Metadata = { title: "SOS Renfort" };

export default async function RenfortsPage() {
  const session = await requireSession();

  // Publier un renfort engage l'établissement : le serveur le réserve à la
  // direction, à l'administration et aux chefs de service. L'écran doit dire
  // la même chose — proposer un bouton qui renverra une erreur d'autorisation,
  // c'est faire passer une règle pour une panne.
  const peutPublier = ["OWNER", "ADMIN", "MANAGER"].includes(session.account.role);


  if (session.account.type !== "ESTABLISHMENT") {
    return (
      <div className="space-y-6">
        <PageHeader title="SOS Renfort" />
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
        title="SOS Renfort"
        subtitle="Publiez un besoin et suivez les candidatures en temps réel."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              {/* Export CSV des heures validées (pointage) — pour la paie/facturation. */}
              <a href="/api/proxy/bookings/export/heures.csv" download>
                Exporter les heures validées
              </a>
            </Button>
            {peutPublier ? <RenfortModal accountId={session.account.id} /> : null}
          </div>
        }
      />

      {error ? (
        <ErrorState retryHref="/dashboard/renforts" />
      ) : !missions || missions.length === 0 ? (
        <EmptyState
          title="Aucun renfort publié"
          description={
            peutPublier
              ? "Créez un SOS Renfort : il sera diffusé en cascade (salariés → réseau réservé → public)."
              : "Aucun besoin de remplacement n’est ouvert pour le moment. Un responsable de votre établissement peut en publier un."
          }
          action={peutPublier ? <RenfortModal accountId={session.account.id} /> : undefined}
        />
      ) : (
        <div className="space-y-5">
          {missions.map((mission) => {
            const bookings = mission.bookings ?? [];
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
                          Diffusion : {MISSION_VISIBILITY_LABEL[mission.visibility]}
                        </span>
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
                      <RepublierMission missionId={mission.id} accountId={session.account.id} />
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
                  <Tabs defaultValue="candidatures">
                    <TabsList>
                      <TabsTrigger value="candidatures">
                        Candidatures reçues ({bookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="suggeres">Candidats suggérés</TabsTrigger>
                    </TabsList>

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
                                    {b.applicant?.profile?.job ?? "Freelance"}
                                    {b.applicant?.profile?.city ? ` · ${b.applicant.profile.city}` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={bookingBadgeVariant(b.status)}>
                                  {BOOKING_STATUS_LABEL[b.status]}
                                </Badge>
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
