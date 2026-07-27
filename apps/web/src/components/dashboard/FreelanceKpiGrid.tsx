"use client";

import { BookOpen, Briefcase, CalendarClock, Star } from "lucide-react";
import { KpiTile } from "./KpiTile";

interface FreelanceKpiGridProps {
    upcomingMissions: number;
    pendingApplications: number;
    pendingServiceRequests: number;
    averageRating: number | null;
}

export function FreelanceKpiGrid({
    upcomingMissions,
    pendingApplications,
    pendingServiceRequests,
    averageRating,
}: FreelanceKpiGridProps) {
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiTile
                label="Missions à venir"
                value={upcomingMissions}
                icon={CalendarClock}
                iconColor="teal"
                href="/bookings"
            />
            <KpiTile
                label="Candidatures en attente"
                value={pendingApplications}
                icon={Briefcase}
                iconColor="coral"
                href="/bookings"
            />
            <KpiTile
                label="Services à traiter"
                value={pendingServiceRequests}
                icon={BookOpen}
                iconColor="emerald"
                href="/dashboard/ateliers"
            />
            <KpiTile
                label="Note moyenne"
                value={averageRating != null ? `${averageRating.toFixed(1)}/5` : "–"}
                icon={Star}
                iconColor="amber"
                href="/account"
            />
        </div>
    );
}
