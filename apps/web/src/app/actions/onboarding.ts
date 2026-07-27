"use server";

import { revalidatePath } from "next/cache";
import { getSession, createSession } from "@/lib/session";
import { apiRequest } from "@/lib/api";
import { MAX_STEP_BY_ROLE } from "@/lib/constants";

export type OnboardingData = {
    // Freelance
    jobTitle?: string;
    bio?: string;
    skills?: string[];
    diplomaUrl?: string; // We'll just store the URL for now
    address?: string;

    // Establishment
    establishmentName?: string;
    establishmentType?: string; // MECS, EHPAD...
    phone?: string;
    contactName?: string;
    city?: string;
    zipCode?: string;
}

export async function saveOnboardingStep(step: number, data: OnboardingData): Promise<{ error?: string }> {
    const session = await getSession();
    if (!session) {
        return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    try {
        await apiRequest(`/users/me/onboarding`, {
            method: "PATCH",
            body: { step, ...data },
            token: session.token,
        });
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Erreur lors de la sauvegarde." };
    }

    // Update local session
    session.user.onboardingStep = step;
    await createSession(session);

    revalidatePath("/dashboard");
    revalidatePath("/marketplace");
    return {};
}

export async function completeOnboarding(): Promise<{ error?: string }> {
    const session = await getSession();
    if (!session) {
        return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    try {
        await apiRequest(`/users/me/onboarding/complete`, {
            method: "POST",
            token: session.token,
        });
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Erreur lors de la finalisation." };
    }

    // Update local session to completed state based on role
    const userRole = session.user.role as keyof typeof MAX_STEP_BY_ROLE;
    const maxStep = MAX_STEP_BY_ROLE[userRole] || 2;
    
    session.user.onboardingStep = maxStep;
    await createSession(session);

    revalidatePath("/dashboard");
    revalidatePath("/marketplace");
    return {};
}

export async function uploadDiploma(formData: FormData): Promise<{ url?: string; error?: string }> {
    const session = await getSession();
    if (!session) {
        return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    const { getApiBaseUrl } = await import("@/lib/api");
    const url = `${getApiBaseUrl()}/users/me/diploma`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            return { error: `Upload échoué (${response.status})${text ? ": " + text : ""}` };
        }

        const data = await response.json() as { url: string };
        return { url: data.url };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Erreur réseau lors de l'upload." };
    }
}

export const updateProfile = saveOnboardingStep;
