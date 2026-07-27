"use server";

import { z } from "zod";
import { getSession } from "@/lib/session";
import { apiRequest } from "@/lib/api";
import { revalidatePath } from "next/cache";

const establishmentSchema = z.object({
  companyName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  siret: z.string().optional(),
  tvaNumber: z.string().optional(),
  bio: z.string().optional(),
});

export type EstablishmentFormValues = z.infer<typeof establishmentSchema>;

export async function updateEstablishmentProfile(data: EstablishmentFormValues) {
  const session = await getSession();

  if (!session) {
    return { error: "Non connecté" };
  }

  const validatedFields = establishmentSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Données invalides", details: validatedFields.error.flatten() };
  }

  try {
    await apiRequest("/users/me", {
      method: "PATCH",
      token: session.token,
      body: validatedFields.data,
    });

    revalidatePath("/account/establishment");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Establishment profile update error:", error);
    return { error: "Une erreur est survenue lors de la mise à jour." };
  }
}

export async function getEstablishmentProfile() {
  const session = await getSession();
  if (!session) return null;

  try {
    const me = await apiRequest<{ profile: any }>("/users/me", {
      token: session.token,
    });
    return me.profile ?? null;
  } catch {
    return null;
  }
}
