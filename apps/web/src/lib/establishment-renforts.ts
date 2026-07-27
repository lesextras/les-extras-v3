import type { EstablishmentMission } from "@/app/actions/missions";
import { getNormalizedMissionPlanning } from "@/lib/mission-planning";

const ASSIGNED_BOOKING_STATUSES = new Set(["CONFIRMED", "ASSIGNED"]);
const PENDING_BOOKING_STATUS = "PENDING";
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export type RenfortPriority = {
    score: number;
    isUrgent: boolean;
    isWithin48h: boolean;
    pendingCandidates: number;
    hasAssignedFreelance: boolean;
};

function getFutureMissionStart(mission: EstablishmentMission, now: Date) {
    return (
        getNormalizedMissionPlanning(mission).find(
            (slot) => slot.start.getTime() >= now.getTime(),
        )?.start ?? null
    );
}

function getPendingCandidateCount(mission: EstablishmentMission) {
    return mission.bookings?.filter((booking) => booking.status === PENDING_BOOKING_STATUS).length ?? 0;
}

function hasAssignedBooking(mission: EstablishmentMission) {
    return mission.bookings?.some((booking) => ASSIGNED_BOOKING_STATUSES.has(booking.status)) ?? false;
}

function hasAssignedFreelance(mission: EstablishmentMission) {
    return mission.status === "ASSIGNED" || hasAssignedBooking(mission);
}

function withFutureStart(missions: EstablishmentMission[], now: Date) {
    return missions
        .map((mission) => ({
            mission,
            start: getFutureMissionStart(mission, now),
        }))
        .filter((entry): entry is { mission: EstablishmentMission; start: Date } => entry.start !== null);
}

function compareByUrgencyThenDate(
    left: { mission: EstablishmentMission; start: Date },
    right: { mission: EstablishmentMission; start: Date },
) {
    const urgentDelta = Number(Boolean(right.mission.isUrgent)) - Number(Boolean(left.mission.isUrgent));
    if (urgentDelta !== 0) return urgentDelta;

    return left.start.getTime() - right.start.getTime();
}

export function getRenfortsToFill(
    missions: EstablishmentMission[],
    now = new Date(),
): EstablishmentMission[] {
    return withFutureStart(
        missions.filter(
            (mission) => mission.status === "OPEN" && !hasAssignedBooking(mission),
        ),
        now,
    )
        .sort((left, right) => {
            const priorityDelta =
                getRenfortPriority(right.mission, now).score - getRenfortPriority(left.mission, now).score;
            if (priorityDelta !== 0) return priorityDelta;

            return left.start.getTime() - right.start.getTime();
        })
        .map((entry) => entry.mission);
}

export function getMissionsWithPendingCandidates(
    missions: EstablishmentMission[],
    now = new Date(),
): EstablishmentMission[] {
    return withFutureStart(
        missions.filter((mission) => getPendingCandidateCount(mission) > 0),
        now,
    )
        .sort(compareByUrgencyThenDate)
        .map((entry) => entry.mission);
}

export function getAssignedUpcomingMissions(
    missions: EstablishmentMission[],
    now = new Date(),
): EstablishmentMission[] {
    return withFutureStart(
        missions.filter(
            (mission) =>
                mission.status !== "CANCELLED" &&
                mission.status !== "COMPLETED" &&
                hasAssignedFreelance(mission),
        ),
        now,
    )
        .sort((left, right) => left.start.getTime() - right.start.getTime())
        .map((entry) => entry.mission);
}

export function getRenfortPriority(
    mission: EstablishmentMission,
    now = new Date(),
): RenfortPriority {
    const start = getFutureMissionStart(mission, now);
    const pendingCandidates = getPendingCandidateCount(mission);
    const hasFreelance = hasAssignedFreelance(mission);
    const timeUntilStart = start ? start.getTime() - now.getTime() : Number.POSITIVE_INFINITY;
    const isWithin48h = timeUntilStart >= 0 && timeUntilStart < FORTY_EIGHT_HOURS_MS;
    const isUrgent = Boolean(mission.isUrgent);

    return {
        score:
            (isUrgent ? 100 : 0) +
            (isWithin48h ? 50 : 0) +
            (pendingCandidates > 0 ? 25 : 0) +
            (!hasFreelance ? 15 : 0),
        isUrgent,
        isWithin48h,
        pendingCandidates,
        hasAssignedFreelance: hasFreelance,
    };
}
