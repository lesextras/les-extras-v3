import { getEstablishmentMissions } from "@/app/actions/missions";
import type { EstablishmentMission } from "@/app/actions/missions";
import { getSession, deleteSession } from "@/lib/session";
import { UnauthorizedError, toUserFacingApiError } from "@/lib/api";
import { redirect } from "next/navigation";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { CandidateCard } from "@/components/dashboard/establishment/CandidateCard";
import { PublishRenfortButton } from "@/components/dashboard/establishment/PublishRenfortButton";
import { RenfortsEmptyState } from "@/components/dashboard/establishment/RenfortsEmptyState";
import { Calendar, Clock, MapPin, Sun, Moon, Siren } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getMissionPlanning, isMissionPlanningLineMultiDay } from "@/lib/mission-planning";
import { getMissionDisplayTitle } from "@/lib/mission-display";
import { getMissionStatusLabel, getMissionStatusVariant } from "@/lib/mission-status";

export const dynamic = "force-dynamic";

export default async function SosDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ESTABLISHMENT") {
    redirect("/login");
  }

  let missions: EstablishmentMission[] = [];
  let loadError: string | null = null;

  try {
    missions = await getEstablishmentMissions(session.token);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      await deleteSession();
      redirect("/login");
    }

    console.error("[dashboard.renforts] managed missions error", error);
    loadError = toUserFacingApiError(
      error,
      "Impossible de charger vos missions de renfort pour le moment.",
    );
  }

  const openMissions = missions.filter(
    (m) => m.status === "OPEN" || m.status === "ASSIGNED",
  );

  // Sort: missions with most candidates first
  openMissions.sort((a, b) => (b.bookings?.length ?? 0) - (a.bookings?.length ?? 0));

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <p className="text-overline uppercase tracking-widest text-muted-foreground">Espace Établissement</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-heading-xl tracking-tight">Missions de renfort</h1>
            <p className="text-body-md text-muted-foreground">
              Gérez vos missions et traitez les postulations des freelances.
            </p>
          </div>
          <PublishRenfortButton label="Nouveau renfort" size="sm" />
        </div>
      </header>

      {loadError && (
        <div className="rounded-xl border border-[hsl(var(--color-amber-300))] bg-[hsl(var(--color-amber-50))] p-4 text-sm text-[hsl(var(--color-amber-800))]">
          {loadError}
        </div>
      )}

      <div className="grid gap-6">
        {openMissions.length === 0 ? (
          <RenfortsEmptyState />
        ) : (
          openMissions.map((mission: any) => {
            const activeCandidacies = (mission.bookings ?? []).filter(
              (b: any) => b.status !== "CANCELLED",
            );
            const planning = getMissionPlanning(mission);
            return (
              <GlassCard key={mission.id} className="overflow-hidden">
                <GlassCardHeader className="border-b border-border/40">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Title + badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-heading-sm font-display">
                          {getMissionDisplayTitle(mission)}
                        </h2>
                        <Badge
                          variant={getMissionStatusVariant(mission.status)}
                        >
                          {getMissionStatusLabel(mission.status)}
                        </Badge>
                        {mission.shift && (
                          <Badge
                            variant="outline"
                            className={
                              mission.shift === "NUIT"
                                ? "border-indigo-400 text-indigo-600"
                                : "border-amber-400 text-amber-600"
                            }
                          >
                            {mission.shift === "NUIT" ? (
                              <Moon className="h-3 w-3 mr-1 inline" />
                            ) : (
                              <Sun className="h-3 w-3 mr-1 inline" />
                            )}
                            {mission.shift === "NUIT" ? "Nuit" : "Jour"}
                          </Badge>
                        )}
                      </div>
                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {planning.visibleSlots.map((slot) => (
                          <div key={slot.key} className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(slot.start, "dd MMM yyyy", { locale: fr })} · {slot.heureDebut} –{" "}
                              {isMissionPlanningLineMultiDay(slot)
                                ? `${format(slot.end, "dd MMM yyyy", { locale: fr })} ${slot.heureFin}`
                                : slot.heureFin}
                            </span>
                          </div>
                        ))}
                        {planning.extraCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>+{planning.extraCount} plage(s)</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">
                            {mission.city
                              ? `${mission.city}${mission.zipCode ? ` (${mission.zipCode})` : ""}`
                              : mission.address}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold">{mission.hourlyRate}€ /h</span>
                    </div>
                  </div>
                </GlassCardHeader>

                <GlassCardContent className="pt-6">
                  <h3 className="text-heading-xs font-semibold mb-4 flex items-center gap-2">
                    Candidatures
                    <Badge variant="outline" className="ml-1">
                      {activeCandidacies.length}
                    </Badge>
                  </h3>

                  {activeCandidacies.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Aucune candidature pour le moment.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeCandidacies.map((booking: any) => (
                        <CandidateCard
                          key={booking.id}
                          bookingId={booking.id}
                          freelance={booking.freelance}
                          status={booking.status}
                          motivation={booking.message}
                          proposedRate={booking.proposedRate}
                        />
                      ))}
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
