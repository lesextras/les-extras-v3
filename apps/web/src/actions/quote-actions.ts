"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function createQuote(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: "Non connecté" };

    const amount = parseFloat(formData.get("amount") as string);
    const description = formData.get("description") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const establishmentId = formData.get("establishmentId") as string;
    const freelanceId = formData.get("freelanceId") as string;

    // Basic validation
    if (!amount || !description || !startDate || !endDate || !establishmentId || !freelanceId) {
        return { error: "Tous les champs sont requis" };
    }

    try {
        const res = await fetch(`${API_URL}/quotes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({
                amount,
                description,
                startDate,
                endDate,
                establishmentId,
                freelanceId,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            return { error: errorData.message || "Erreur lors de la création du devis" };
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Create quote error:", error);
        return { error: "Erreur serveur" };
    }
}
