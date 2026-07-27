"use server";

import { getSession } from "@/lib/session";
import { apiRequest, toUserFacingApiError } from "@/lib/api";

export async function authorizePayment(bookingId: string) {
    const session = await getSession();
    if (!session) return { error: "Non autorisé" };

    try {
        await apiRequest("/bookings/authorize-payment", {
            method: "POST",
            token: session.token,
            body: { bookingId },
            label: "bookings.authorize-payment",
        });

        return { success: true };
    } catch (error) {
        return {
            error: toUserFacingApiError(
                error,
                "Erreur lors de la validation du paiement.",
            ),
        };
    }
}
