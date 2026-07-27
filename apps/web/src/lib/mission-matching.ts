import type { UserProfile } from "@/app/actions/user";
import type { SerializedMission } from "@/app/actions/marketplace";
import { getMissionDisplayTitle } from "@/lib/mission-display";
import { getNormalizedMissionPlanning } from "@/lib/mission-planning";

export type MissionMatchScore = {
    score: number;
    reasons: string[];
};

export type ScoredMission<TMission extends SerializedMission = SerializedMission> = {
    mission: TMission;
    score: number;
    reasons: string[];
};

type MatchUser = Pick<UserProfile, "profile"> | null | undefined;

const DAY_ALIASES: Record<number, string[]> = {
    0: ["dim", "dimanche", "sunday", "sun"],
    1: ["lun", "lundi", "monday", "mon"],
    2: ["mar", "mardi", "tuesday", "tue"],
    3: ["mer", "mercredi", "wednesday", "wed"],
    4: ["jeu", "jeudi", "thursday", "thu"],
    5: ["ven", "vendredi", "friday", "fri"],
    6: ["sam", "samedi", "saturday", "sat"],
};

function normalizeText(value: string | null | undefined) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("fr")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function textRoots(value: string) {
    return normalizeText(value)
        .split(" ")
        .filter((token) => token.length >= 5)
        .map((token) => token.slice(0, Math.min(6, token.length)));
}

function textMatches(left: string | null | undefined, right: string | null | undefined) {
    const normalizedLeft = normalizeText(left);
    const normalizedRight = normalizeText(right);

    if (!normalizedLeft || !normalizedRight) return false;
    if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
        return true;
    }

    const rightRoots = new Set(textRoots(normalizedRight));
    return textRoots(normalizedLeft).some((root) => rightRoots.has(root));
}

function hasJobTitleMatch(mission: SerializedMission, jobTitle: string | null | undefined) {
    if (!jobTitle) return false;

    const missionTitle = getMissionDisplayTitle(mission);
    return textMatches(missionTitle, jobTitle) || textMatches(mission.title, jobTitle);
}

function hasSkillMatch(missionSkills: string[] | null | undefined, profileSkills: string[] | undefined) {
    if (!missionSkills?.length || !profileSkills?.length) return false;

    return missionSkills.some((requiredSkill) =>
        profileSkills.some((profileSkill) => textMatches(requiredSkill, profileSkill)),
    );
}

function sameCity(mission: SerializedMission, profileCity: string | null | undefined) {
    const missionCity = mission.city ?? mission.establishment?.profile?.city ?? null;
    return Boolean(normalizeText(missionCity) && normalizeText(missionCity) === normalizeText(profileCity));
}

function hasAvailableDayMatch(mission: SerializedMission, availableDays: string[] | undefined) {
    if (!availableDays?.length) return false;

    const normalizedDays = new Set(availableDays.map(normalizeText).filter(Boolean));
    const missionDays = getNormalizedMissionPlanning(mission).map((line) => line.start.getDay());

    return missionDays.some((day) =>
        (DAY_ALIASES[day] ?? []).some((alias) => normalizedDays.has(normalizeText(alias))),
    );
}

function hasKnownDiplomaData(user: MatchUser) {
    const profile = user?.profile as (UserProfile["profile"] & Record<string, unknown>) | null | undefined;
    if (!profile) return false;

    const diplomaUrl = profile.diplomaUrl;
    if (typeof diplomaUrl === "string" && diplomaUrl.trim().length > 0) return true;

    const diplomas = profile.diplomas;
    if (Array.isArray(diplomas) && diplomas.length > 0) return true;

    return profile.diplomaVerified === true;
}

function missionSortTime(mission: SerializedMission) {
    const firstSlot = getNormalizedMissionPlanning(mission)[0];
    if (firstSlot) return firstSlot.start.getTime();

    const fallback = new Date(mission.dateStart).getTime();
    return Number.isNaN(fallback) ? Number.POSITIVE_INFINITY : fallback;
}

export function scoreMissionForFreelance(
    mission: SerializedMission,
    user: MatchUser,
): MissionMatchScore {
    const profile = user?.profile;
    let score = 0;
    const reasons: string[] = [];

    if (hasJobTitleMatch(mission, profile?.jobTitle)) {
        score += 30;
        reasons.push("Métier proche");
    }

    if (hasSkillMatch(mission.requiredSkills, profile?.skills)) {
        score += 25;
        reasons.push("Compétence proche");
    }

    if (sameCity(mission, profile?.city)) {
        score += 15;
        reasons.push("Même ville");
    }

    if (hasAvailableDayMatch(mission, profile?.availableDays)) {
        score += 10;
        reasons.push("Disponible ce jour");
    }

    if (mission.isUrgent) {
        score += 5;
        reasons.push("Mission urgente");
    }

    if ((mission.diplomaRequired || (mission.requiredDiploma?.length ?? 0) > 0) && !hasKnownDiplomaData(user)) {
        score -= 20;
        reasons.push("Diplôme à vérifier");
    }

    return { score, reasons };
}

export function getTopMatchingMissions<TMission extends SerializedMission>(
    missions: TMission[],
    user: MatchUser,
    limit = 3,
): ScoredMission<TMission>[] {
    return missions
        .map((mission) => ({
            mission,
            ...scoreMissionForFreelance(mission, user),
        }))
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            return missionSortTime(left.mission) - missionSortTime(right.mission);
        })
        .slice(0, limit);
}
