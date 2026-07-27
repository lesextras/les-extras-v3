"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { apiRequest } from "@/lib/api";

export type UserProfile = {
    id: string;
    email: string;
    role: "ESTABLISHMENT" | "FREELANCE" | "ADMIN";
    status: string;
    onboardingStep: number;
    isAvailable: boolean;
    createdAt: string;
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        companyName: string | null;
        jobTitle: string | null;
        bio: string | null;
        skills: string[];
        availableDays?: string[];
        address: string | null;
        city: string | null;
        zipCode: string | null;
        phone: string | null;
        siret: string | null;
        tvaNumber: string | null;
        availableCredits: number;
    } | null;
};

export async function getCurrentUser(): Promise<UserProfile | null> {
    const session = await getSession();
    if (!session) return null;

    try {
        return await apiRequest<UserProfile>("/users/me", {
            token: session.token,
        });
    } catch {
        return null;
    }
}

export async function updateAvailabilityAction(
    isAvailable: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
    const session = await getSession();

    if (!session) {
        return { ok: false, error: "Non connecté" };
    }

    if (session.user.role !== "FREELANCE") {
        return { ok: false, error: "Action réservée aux freelances." };
    }

    try {
        await apiRequest("/users/me", {
            method: "PATCH",
            token: session.token,
            body: { isAvailable },
            label: "user.update-availability",
        });

        revalidatePath("/dashboard");
        revalidatePath("/account");

        return { ok: true };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error
                ? error.message
                : "Impossible de mettre à jour votre disponibilité.",
        };
    }
}
