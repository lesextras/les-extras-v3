import type { EstablishmentMission } from "@/app/actions/missions";
import { getAssignedUpcomingMissions } from "@/lib/establishment-renforts";

export function getNextAssignedMission(
    missions: EstablishmentMission[],
    now = new Date(),
): EstablishmentMission | null {
    return getAssignedUpcomingMissions(missions, now)[0] ?? null;
}
