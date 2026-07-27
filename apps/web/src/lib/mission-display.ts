import { getMetierLabel } from "@/lib/sos-config";

const CUSTOM_METIER_ID = "autre";
const FALLBACK_MISSION_TITLE = "Mission renfort";

export type MissionDisplayTitleSource = {
  title?: string | null;
  metier?: string | null;
};

export function getMissionDisplayTitle(mission: MissionDisplayTitleSource): string {
  const title = mission.title?.trim();
  const metier = mission.metier?.trim();

  if (metier?.toLocaleLowerCase("fr") === CUSTOM_METIER_ID) {
    return title || FALLBACK_MISSION_TITLE;
  }

  if (metier) {
    return getMetierLabel(metier);
  }

  return title || FALLBACK_MISSION_TITLE;
}
