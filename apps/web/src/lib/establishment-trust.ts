import type { EstablishmentMission } from "@/app/actions/missions";
import type { UserProfile } from "@/app/actions/user";

export type EstablishmentTrustStepStatus = "COMPLETED" | "MISSING" | "PENDING";

export type EstablishmentTrustStep = {
    id:
        | "companyName"
        | "bio"
        | "contact"
        | "siret"
        | "firstRenfort"
        | "credits";
    label: string;
    status: EstablishmentTrustStepStatus;
    actionLabel?: string;
    href?: string;
};

export type EstablishmentTrustProfile = {
    progress: number;
    completedCount: number;
    totalCount: number;
    steps: EstablishmentTrustStep[];
};

type EstablishmentTrustUser = Pick<UserProfile, "profile"> | null | undefined;

const PROFILE_HREF = "/account/establishment";
const RENFORTS_HREF = "/dashboard/renforts";
const CREDITS_HREF = "/dashboard/packs";

function hasValue(value: string | null | undefined) {
    return typeof value === "string" && value.trim().length > 0;
}

function hasCredits(value: number | null | undefined) {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function withAction(
    id: EstablishmentTrustStep["id"],
    label: string,
    status: EstablishmentTrustStepStatus,
    actionLabel = "Compléter",
    href = PROFILE_HREF,
): EstablishmentTrustStep {
    if (status === "COMPLETED") {
        return { id, label, status };
    }

    return { id, label, status, actionLabel, href };
}

export function computeEstablishmentTrustProfile(
    user: EstablishmentTrustUser,
    missions: EstablishmentMission[] = [],
): EstablishmentTrustProfile {
    const profile = user?.profile;
    const hasPhone = hasValue(profile?.phone);
    const hasAddress = hasValue(profile?.address);
    const hasCity = hasValue(profile?.city);
    const hasZipCode = hasValue(profile?.zipCode);
    const contactFields = [hasPhone, hasAddress, hasCity, hasZipCode];
    const completedContactFields = contactFields.filter(Boolean).length;
    const hasCompleteContact = completedContactFields === contactFields.length;
    const hasPartialContact = completedContactFields > 0 && !hasCompleteContact;
    const hasPublishedRenfort = missions.some((mission) => mission.isRenfort !== false);

    const steps: EstablishmentTrustStep[] = [
        withAction(
            "companyName",
            "Nom de l'établissement renseigné",
            hasValue(profile?.companyName) ? "COMPLETED" : "MISSING",
        ),
        withAction(
            "bio",
            "Description de la structure renseignée",
            hasValue(profile?.bio) ? "COMPLETED" : "MISSING",
        ),
        withAction(
            "contact",
            "Coordonnées complètes",
            hasCompleteContact ? "COMPLETED" : hasPartialContact ? "PENDING" : "MISSING",
        ),
        withAction(
            "siret",
            "SIRET renseigné",
            hasValue(profile?.siret) ? "COMPLETED" : "MISSING",
        ),
        withAction(
            "firstRenfort",
            "Premier renfort publié",
            hasPublishedRenfort ? "COMPLETED" : "MISSING",
            "Publier",
            RENFORTS_HREF,
        ),
        withAction(
            "credits",
            "Crédits disponibles",
            hasCredits(profile?.availableCredits) ? "COMPLETED" : "MISSING",
            "Ajouter",
            CREDITS_HREF,
        ),
    ];

    const completedCount = steps.filter((step) => step.status === "COMPLETED").length;

    return {
        progress: Math.round((completedCount / steps.length) * 100),
        completedCount,
        totalCount: steps.length,
        steps,
    };
}
