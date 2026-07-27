"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Calendar, Clock, Users, MapPin, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { EstablishmentMission } from "@/app/actions/missions";
import { getMissionPlanning, isMissionPlanningLineMultiDay } from "@/lib/mission-planning";
import { getMissionDisplayTitle } from "@/lib/mission-display";
import { getMissionStatusLabel, getMissionStatusVariant } from "@/lib/mission-status";

interface RenfortsWidgetProps {
    missions: EstablishmentMission[];
    error?: string | null;
}

const STATUS_BORDER_CLASS = {
    amber: "border-l-[hsl(var(--amber))]",
    teal: "border-l-[hsl(var(--teal))]",
    emerald: "border-l-[hsl(var(--emerald))]",
    red: "border-l-[hsl(var(--color-red-500))]",
    info: "border-l-[hsl(var(--teal))]",
    outline: "border-l-border",
    quiet: "border-l-border",
};

export function RenfortsWidget({ missions, error }: RenfortsWidgetProps) {
    if (error) {
        return (
            <EmptyState
                icon={Users}
                title="Renforts indisponibles"
                description={error}
                className="py-8"
            />
        );
    }

    if (missions.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="Aucun renfort actif"
                description="Publiez votre premier renfort pour recevoir des candidatures."
                primaryAction={{
                    label: "Publier un renfort",
                    href: "/dashboard/renforts",
                    variant: "coral",
                }}
                className="py-8"
            />
        );
    }

    return (
        <div className="space-y-3">
            {missions.slice(0, 5).map((mission) => {
                const statusVariant = getMissionStatusVariant(mission.status);
                const candidatureCount = mission.bookings?.filter(
                    (b) => b.status !== "CANCELLED",
                ).length ?? 0;
                const pendingCount = mission.bookings?.filter(
                    (b) => b.status === "PENDING"
                ).length ?? 0;
                const planning = getMissionPlanning(mission);

                return (
                    <Link
                        key={mission.id}
                        href="/dashboard/renforts"
                        className={cn(
                            "block rounded-xl border border-l-4 border-border/60 p-4 transition-colors hover:border-border hover:bg-muted/30",
                            STATUS_BORDER_CLASS[statusVariant],
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-sm truncate">
                                        {getMissionDisplayTitle(mission)}
                                    </span>
                                    <Badge variant={statusVariant}>
                                        {getMissionStatusLabel(mission.status)}
                                    </Badge>
                                    {mission.isUrgent && (
                                        <Badge variant="coral" className="gap-1">
                                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                            Urgent
                                        </Badge>
                                    )}
                                    {mission.shift && (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "gap-1 text-xs",
                                                mission.shift === "NUIT"
                                                    ? "border-[hsl(var(--primary)/0.4)] text-[hsl(var(--primary))]"
                                                    : "border-[hsl(var(--amber)/0.5)] text-[hsl(var(--amber))]"
                                            )}
                                        >
                                            {mission.shift === "NUIT" ? (
                                                <Moon className="h-3 w-3" />
                                            ) : (
                                                <Sun className="h-3 w-3" />
                                            )}
                                            {mission.shift === "NUIT" ? "Nuit" : "Jour"}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    {planning.visibleSlots.length > 0 ? (
                                        planning.visibleSlots.map((slot) => (
                                            <span key={slot.key} className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(slot.start, "dd MMM", { locale: fr })} · {slot.heureDebut} –{" "}
                                                {isMissionPlanningLineMultiDay(slot)
                                                    ? `${format(slot.end, "dd MMM", { locale: fr })} ${slot.heureFin}`
                                                    : slot.heureFin}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Date à confirmer
                                        </span>
                                    )}
                                    {planning.extraCount > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            +{planning.extraCount} plage(s)
                                        </span>
                                    )}
                                    {mission.city && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {mission.city}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="shrink-0 text-right space-y-1">
                                <p className="font-bold text-sm">{mission.hourlyRate} €/h</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                                    <Users className="h-3 w-3" />
                                    <span>
                                        {pendingCount > 0 ? (
                                            <span className="text-[hsl(var(--coral))] font-semibold">
                                                {pendingCount} en attente
                                            </span>
                                        ) : (
                                            `${candidatureCount} candidature${candidatureCount !== 1 ? "s" : ""}`
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
            {missions.length > 5 && (
                <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link href="/dashboard/renforts">
                        Voir tous les renforts ({missions.length})
                    </Link>
                </Button>
            )}
        </div>
    );
}
