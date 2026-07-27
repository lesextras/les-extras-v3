import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  CheckCircle2,
  GraduationCap,
  FileText,
  Users,
  Sparkles,
} from "lucide-react";
import { getAvailableMission } from "@/app/actions/marketplace";
import { getSession } from "@/lib/session";
import { getMetierById } from "@/lib/sos-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MissionApplyButton } from "@/components/marketplace/MissionApplyButton";
import { RequestMissionInfoModal } from "@/components/modals/RequestMissionInfoModal";
import { getMissionPlanning, isMissionPlanningLineMultiDay } from "@/lib/mission-planning";
import { getMissionDisplayTitle } from "@/lib/mission-display";

export const dynamic = "force-dynamic";

interface MissionDetailPageProps {
  params: { id: string };
}

export default async function MissionDetailPage({ params }: MissionDetailPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "FREELANCE") redirect("/marketplace");

  const mission = await getAvailableMission(params.id, session.token);
  if (!mission) notFound();

  const metier = mission.metier ? getMetierById(mission.metier) : null;
  const MetierIcon = metier?.icon;
  const displayTitle = getMissionDisplayTitle(mission);

  const establishmentName =
    mission.establishment?.profile?.companyName || "Établissement confidentiel";
  const displayCity =
    mission.city ||
    mission.establishment?.profile?.city ||
    "Localisation communiquée après validation";

  const planning = getMissionPlanning(mission);
  const isMissionOpen = mission.status === "OPEN";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'ariane">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour aux missions
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT — Main content ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {mission.isUrgent && (
                <Badge variant="coral">URGENT</Badge>
              )}
              {mission.isRenfort && !mission.isUrgent && (
                <Badge variant="teal">Renfort</Badge>
              )}
              {mission.shift && (
                <Badge variant="outline">
                  {mission.shift === "NUIT" ? "Nuit" : "Jour"}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {MetierIcon && <MetierIcon className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />}
              {displayTitle}
            </h1>

            {/* Establishment + city */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {establishmentName}
              </span>
              {displayCity && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {displayCity}
                  {mission.zipCode ? ` (${mission.zipCode})` : ""}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <Banknote className="h-4 w-4" aria-hidden="true" />
                {mission.hourlyRate} €/h
              </span>
            </div>
          </div>

          {/* Créneaux */}
          <section aria-labelledby="slots-heading" className="rounded-xl border bg-card p-6 space-y-3">
            <h2 id="slots-heading" className="font-semibold text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
              Créneaux ({planning.slots.length})
            </h2>
            <ul className="space-y-2">
              {planning.slots.map((slot) => (
                  <li key={slot.key} className="flex items-center gap-3 text-sm">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>
                      {format(slot.start, "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-2" aria-hidden="true" />
                    <span>
                      {slot.heureDebut} →{" "}
                      {isMissionPlanningLineMultiDay(slot)
                        ? `${format(slot.end, "EEEE d MMMM yyyy", { locale: fr })} ${slot.heureFin}`
                        : slot.heureFin}
                    </span>
                  </li>
              ))}
            </ul>
          </section>

          {/* Description */}
          {mission.description && (
            <section aria-labelledby="desc-heading" className="rounded-xl border bg-card p-6 space-y-3">
              <h2 id="desc-heading" className="font-semibold text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                Description
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{mission.description}</p>
            </section>
          )}

          {/* Compétences & diplôme */}
          {(mission.requiredSkills?.length || mission.diplomaRequired) && (
            <section aria-labelledby="skills-heading" className="rounded-xl border bg-card p-6 space-y-3">
              <h2 id="skills-heading" className="font-semibold text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
                Profil recherché
              </h2>
              {mission.diplomaRequired && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  Diplôme requis
                </p>
              )}
              {mission.requiredSkills && mission.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mission.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Transmissions */}
          {mission.hasTransmissions && (
            <section aria-labelledby="trans-heading" className="rounded-xl border bg-card p-6 space-y-2">
              <h2 id="trans-heading" className="font-semibold text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                Transmissions
              </h2>
              {mission.transmissionTime && (
                <p className="text-sm text-muted-foreground">
                  Durée : {mission.transmissionTime}
                </p>
              )}
            </section>
          )}

          {/* Avantages */}
          {mission.perks && mission.perks.length > 0 && (
            <section aria-labelledby="perks-heading" className="rounded-xl border bg-card p-6 space-y-3">
              <h2 id="perks-heading" className="font-semibold text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                Avantages
              </h2>
              <ul className="space-y-1.5">
                {mission.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── RIGHT — Sticky sidebar ── */}
        <aside className="space-y-4">
          <div className="lg:sticky lg:top-6 rounded-xl border bg-card p-6 space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{mission.hourlyRate} €/h</p>
              <p className="text-sm text-muted-foreground mt-1">
                {planning.slots.length} plage{planning.slots.length > 1 ? "s" : ""}
              </p>
            </div>
            {isMissionOpen ? (
              <>
                <MissionApplyButton missionId={mission.id} />
                <RequestMissionInfoModal
                  missionId={mission.id}
                  missionTitle={displayTitle}
                  triggerClassName="w-full"
                />
                <p className="text-xs text-center text-muted-foreground">
                  {planning.slots.length > 1
                    ? "Votre candidature couvrira l’ensemble du planning listé."
                    : "Votre candidature portera sur cette plage de mission."}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <Button size="lg" className="w-full font-bold" disabled>
                  Postuler à cette mission
                </Button>
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-800">
                  Cette mission est déjà prise.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
