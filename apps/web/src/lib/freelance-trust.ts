import type { UserProfile } from "@/app/actions/user";

export type FreelanceTrustStepStatus = "COMPLETED" | "PENDING" | "MISSING";

export type FreelanceTrustStep = {
    id:
        | "identity"
        | "bio"
        | "skills"
        | "phone"
        | "siret"
        | "location"
        | "availableDays"
        | "availability";
    label: string;
    status: FreelanceTrustStepStatus;
    actionLabel?: string;
    href?: string;
};

export type FreelanceTrustProfile = {
    progress: number;
    completedCount: number;
    totalCount: number;
    steps: FreelanceTrustStep[];
};

type TrustUser = Pick<UserProfile, "isAvailable" | "profile"> | null | undefined;

const ACCOUNT_HREF = "/account";

function hasValue(value: string | null | undefined) {
    return typeof value === "string" && value.trim().length > 0;
}

function hasListValue(values: string[] | null | undefined) {
    return Array.isArray(values) && values.some((value) => value.trim().length > 0);
}

function withAction(
    id: FreelanceTrustStep["id"],
    label: string,
    status: FreelanceTrustStepStatus,
): FreelanceTrustStep {
    if (status === "COMPLETED") {
        return { id, label, status };
    }

    return {
        id,
        label,
        status,
        actionLabel: id === "availability" ? "Activer" : "Compléter",
        href: ACCOUNT_HREF,
    };
}

export function computeFreelanceTrustProfile(user: TrustUser): FreelanceTrustProfile {
    const profile = user?.profile;
    const hasFirstName = hasValue(profile?.firstName);
    const hasLastName = hasValue(profile?.lastName);
    const hasCity = hasValue(profile?.city);
    const hasAddress = hasValue(profile?.address);

    const steps: FreelanceTrustStep[] = [
        withAction(
            "identity",
            "Identité renseignée",
            hasFirstName && hasLastName
                ? "COMPLETED"
                : hasFirstName || hasLastName
                  ? "PENDING"
                  : "MISSING",
        ),
        withAction("bio", "Présentation ajoutée", hasValue(profile?.bio) ? "COMPLETED" : "MISSING"),
        withAction("skills", "Compétences renseignées", hasListValue(profile?.skills) ? "COMPLETED" : "MISSING"),
        withAction("phone", "Téléphone renseigné", hasValue(profile?.phone) ? "COMPLETED" : "MISSING"),
        withAction("siret", "SIRET renseigné", hasValue(profile?.siret) ? "COMPLETED" : "MISSING"),
        withAction(
            "location",
            "Adresse et ville renseignées",
            hasCity && hasAddress ? "COMPLETED" : hasCity || hasAddress ? "PENDING" : "MISSING",
        ),
        withAction(
            "availableDays",
            "Disponibilités définies",
            hasListValue(profile?.availableDays) ? "COMPLETED" : "MISSING",
        ),
        withAction(
            "availability",
            "Profil ouvert aux missions",
            user?.isAvailable ? "COMPLETED" : "MISSING",
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
