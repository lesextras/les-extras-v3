"use client";

import { Briefcase, CalendarClock, CreditCard, Users } from "lucide-react";
import { KpiTile } from "./KpiTile";

interface EstablishmentKpiGridProps {
    renfortsToFill: number;
    pendingApplications: number;
    upcomingInterventions: number;
    availableCredits: number | null;
}

export function EstablishmentKpiGrid({
    renfortsToFill,
    pendingApplications,
    upcomingInterventions,
    availableCredits,
}: EstablishmentKpiGridProps) {
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiTile
                label="Renforts à pourvoir"
                value={renfortsToFill}
                icon={Briefcase}
                iconColor="teal"
                href="/dashboard/renforts"
                index={0}
            />
            <KpiTile
                label="Candidatures à décider"
                value={pendingApplications}
                icon={Users}
                iconColor="amber"
                href="/dashboard/renforts"
                index={1}
            />
            <KpiTile
                label="Interventions à venir"
                value={upcomingInterventions}
                icon={CalendarClock}
                iconColor="teal"
                href="/bookings"
                index={2}
            />
            <KpiTile
                label="Crédits disponibles"
                value={availableCredits ?? "—"}
                icon={CreditCard}
                iconColor="emerald"
                href="/dashboard/packs"
                index={3}
            />
        </div>
    );
}
