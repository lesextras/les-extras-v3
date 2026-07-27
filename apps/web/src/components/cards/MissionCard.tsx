"use client";

import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Building2, Zap, CheckCircle2, Loader2 } from "lucide-react";
import type { SerializedMission } from "@/app/actions/marketplace";
import { useApplyToMission } from "@/lib/hooks/useApplyToMission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getMissionPlanning,
  isMissionPlanningLineMultiDay,
} from "@/lib/mission-planning";
import { getMissionDisplayTitle } from "@/lib/mission-display";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type MissionCardProps = {
  mission: SerializedMission;
  isVerified?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function MissionCard({ mission, isVerified = true }: MissionCardProps) {
  const { apply, pendingMissionId, hasApplied } = useApplyToMission();
  const planning = getMissionPlanning(mission);
  const applied = hasApplied(mission.id);
  const isThisPending = pendingMissionId === mission.id;
  const displayLocation =
    mission.city ||
    mission.establishment?.profile?.city ||
    "Localisation communiquée après validation";
  const displayEstablishment =
    mission.establishmentName ||
    mission.establishment?.profile?.companyName ||
    "Établissement";
  const displayTitle = getMissionDisplayTitle(mission);

  const handleApply = () => {
    if (!isVerified || applied || isThisPending) return;
    apply(mission.id);
  };

  return (
    <Card className={cn(
      "flex flex-col h-full rounded-2xl transition-all duration-300",
      "glass-surface",
      "hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring",
      mission.isUrgent && "border-destructive/30 shadow-destructive/5"
    )}>
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <Link
              href={`/marketplace/missions/${mission.id}`}
              className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
                {displayTitle}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{displayEstablishment}</span>
            </div>
          </div>
          {mission.isUrgent && (
            <Badge variant="error" className="shrink-0 text-[10px] px-2 py-0.5 h-6">
              <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
              Renfort Immédiat
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {mission.isNetworkMatch && (
            <Badge variant="success" className="text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
              Déjà intervenu
            </Badge>
          )}
          {mission.requiredDiploma?.map(d => (
            <Badge key={d} variant="outline" className="text-[10px] text-muted-foreground">
              {d}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 pb-2">
        <div className="space-y-2 text-sm">
          {planning.visibleSlots.map((slot) => (
            <div
              key={slot.key}
              className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-2"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {dateFormatter.format(slot.start)}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Clock3 className="h-3 w-3 text-muted-foreground" />
                {slot.heureDebut} -{" "}
                {isMissionPlanningLineMultiDay(slot)
                  ? `${dateFormatter.format(slot.end)} ${slot.heureFin}`
                  : slot.heureFin}
              </span>
            </div>
          ))}
          {planning.extraCount > 0 && (
            <p className="text-xs text-muted-foreground">
              +{planning.extraCount} plage(s) supplémentaire(s)
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-dashed">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary/70" />
            <span className="truncate max-w-[140px]">{displayLocation}</span>
          </div>
          <div className="text-lg font-bold text-[hsl(var(--emerald))] tabular-nums">
            {moneyFormatter.format(mission.hourlyRate)}
            <span className="text-xs font-normal text-muted-foreground ml-1">/ h</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        {isVerified ? (
          <Button
            className="w-full gap-2"
            onClick={handleApply}
            size="lg"
            disabled={isThisPending || applied}
            variant={applied ? "secondary" : "default"}
          >
            {applied ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Mission prise
              </>
            ) : isThisPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Envoi…
              </>
            ) : (
              "Postuler"
            )}
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="w-full">
                  <Button className="w-full" disabled variant="secondary" size="lg">
                    Postuler
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Votre compte doit être validé par un administrateur pour postuler.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}
