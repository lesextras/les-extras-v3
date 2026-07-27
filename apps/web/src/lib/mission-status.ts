import type { MissionStatus } from "@/app/actions/marketplace";
import type { BookingStatusVariant } from "@/lib/booking-status";

const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
    OPEN: "Ouverte",
    ASSIGNED: "Assignée",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
};

const MISSION_STATUS_VARIANTS: Record<MissionStatus, BookingStatusVariant> = {
    OPEN: "amber",
    ASSIGNED: "teal",
    COMPLETED: "emerald",
    CANCELLED: "red",
};

function isKnownMissionStatus(status: string): status is MissionStatus {
    return status in MISSION_STATUS_LABELS;
}

export function getMissionStatusLabel(status: MissionStatus | string): string {
    return isKnownMissionStatus(status)
        ? MISSION_STATUS_LABELS[status]
        : status.trim().replace(/_/g, " ") || "Statut inconnu";
}

export function getMissionStatusVariant(status: MissionStatus | string): BookingStatusVariant {
    return isKnownMissionStatus(status) ? MISSION_STATUS_VARIANTS[status] : "quiet";
}

export function isMissionOpen(status: MissionStatus | string): boolean {
    return status === "OPEN";
}

export function isMissionAssigned(status: MissionStatus | string): boolean {
    return status === "ASSIGNED";
}

export function isMissionClosed(status: MissionStatus | string): boolean {
    return status === "COMPLETED" || status === "CANCELLED";
}
