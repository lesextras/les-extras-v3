"use server";

import { z } from "zod";
import { getSession } from "@/lib/session";
import { apiRequest, getApiBaseUrl } from "@/lib/api";
import { revalidatePath } from "next/cache";
import type { FreelanceKycDocumentType, UserKycDocumentsPayload } from "@/lib/kyc-documents";

const profileSchema = z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    jobTitle: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    siret: z.string().optional(), // We could add regex for SIRET validation
    tvaNumber: z.string().optional(),
    isAvailable: z.boolean().optional(),
    availableDays: z.array(z.string()).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export async function updateFreelanceProfile(data: ProfileFormValues) {
    const session = await getSession();

    if (!session) {
        return { error: "Non connecté" };
    }

    const validatedFields = profileSchema.safeParse(data);

    if (!validatedFields.success) {
        return { error: "Données invalides", details: validatedFields.error.flatten() };
    }

    try {
        await apiRequest("/users/me", {
            method: "PATCH",
            token: session.token,
            body: {
                firstName: data.firstName,
                lastName: data.lastName,
                jobTitle: data.jobTitle,
                bio: data.bio,
                skills: data.skills || [],
                phone: data.phone,
                address: data.address,
                city: data.city,
                zipCode: data.zipCode,
                siret: data.siret,
                tvaNumber: data.tvaNumber,
                isAvailable: data.isAvailable,
                availableDays: data.availableDays,
            },
        });

        revalidatePath("/account");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Une erreur est survenue lors de la mise à jour du profil." };
    }
}

export async function uploadFreelanceKycDocument(
    type: FreelanceKycDocumentType,
    formData: FormData,
): Promise<UserKycDocumentsPayload | { error: string }> {
    const session = await getSession();

    if (!session) {
        return { error: "Non connecté" };
    }

    try {
        const response = await fetch(`${getApiBaseUrl()}/users/me/documents/${type}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            return { error: `Upload échoué (${response.status})${text ? `: ${text}` : ""}` };
        }

        const payload = await response.json() as UserKycDocumentsPayload;
        revalidatePath("/account");
        revalidatePath("/dashboard");
        return payload;
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Erreur réseau lors de l'upload." };
    }
}
