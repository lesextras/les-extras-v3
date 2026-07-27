"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { SerializedMission } from "@/app/actions/marketplace";

/**
 * A managed mission as returned by /missions/managed — extends SerializedMission
 * with the embedded bookings array used by the renforts board.
 */
export type EstablishmentMission = SerializedMission & {
    bookings: Array<{ id: string; status: string; freelanceId?: string }>;
    metierLabel?: string;
};

type ApplyInput = {
    motivation?: string;
    proposedRate?: number;
};

export async function applyToMission(
    missionId: string,
    input?: ApplyInput,
): Promise<{ ok: boolean; error?: string }> {
    try {
        const session = await getSession();
        if (!session) return { ok: false, error: "Non connecté" };

        await apiRequest(`/missions/${missionId}/apply`, {
            method: "POST",
            token: session.token,
            body: input ?? {},
            label: "missions.apply",
        });

        revalidatePath("/marketplace");
        revalidatePath("/dashboard");
        return { ok: true };
    } catch (error) {
        console.error("applyToMission error", error);
        const message = error instanceof Error ? error.message : "Erreur lors de la candidature";
        const normalizedMessage = message.toLowerCase();

        if (
            normalizedMessage.includes("déjà prise") ||
            normalizedMessage.includes("n'est plus ouverte") ||
            normalizedMessage.includes("plus ouverte")
        ) {
            revalidatePath("/marketplace");
            revalidatePath("/dashboard");
            return { ok: false, error: "Cette mission est déjà prise." };
        }

        if (
            normalizedMessage.includes("already applied") ||
            normalizedMessage.includes("déjà postulé")
        ) {
            return { ok: false, error: "Vous avez déjà postulé à cette mission." };
        }

        return { ok: false, error: message };
    }
}

export async function acceptCandidate(bookingId: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const session = await getSession();
        if (!session) return { ok: false, error: "Non connecté" };

        await apiRequest(`/bookings/confirm`, {
            method: "POST",
            token: session.token,
            body: { bookingId },
            label: "missions.accept-candidate",
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/renforts");
        revalidatePath("/marketplace");
        return { ok: true };
    } catch (error) {
        console.error("acceptCandidate error", error);
        return { ok: false, error: error instanceof Error ? error.message : "Erreur lors de la validation" };
    }
}

export async function declineCandidate(bookingId: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const session = await getSession();
        if (!session) return { ok: false, error: "Non connecté" };

        await apiRequest(`/bookings/cancel`, {
            method: "POST",
            token: session.token,
            body: { lineType: "BOOKING", lineId: bookingId },
            label: "missions.decline-candidate",
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/renforts");
        revalidatePath("/marketplace");
        return { ok: true };
    } catch (error) {
        console.error("declineCandidate error", error);
        return { ok: false, error: error instanceof Error ? error.message : "Erreur lors du refus" };
    }
}

export async function requestMissionInfo(
    missionId: string,
    message: string,
): Promise<{ ok: boolean; error?: string }> {
    try {
        const session = await getSession();
        if (!session) return { ok: false, error: "Non connecté" };

        await apiRequest(`/missions/${missionId}/info-request`, {
            method: "POST",
            token: session.token,
            body: { message },
            label: "missions.info-request",
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/demandes");
        return { ok: true };
    } catch (error) {
        console.error("requestMissionInfo error", error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : "Erreur lors de l'envoi de la demande",
        };
    }
}

export async function getEstablishmentMissions(token?: string) {
    const resolvedToken = token ?? (await getSession())?.token;
    if (!resolvedToken) return [];

    const missions = await apiRequest("/missions/managed", {
        method: "GET",
        token: resolvedToken,
        label: "missions.managed",
    });
    return Array.isArray(missions) ? (missions as EstablishmentMission[]) : [];
}

export async function getAvailableMissions(token: string): Promise<SerializedMission[]> {
    const missions = await apiRequest("/missions", {
        method: "GET",
        token,
        label: "missions.available",
    });
    return Array.isArray(missions) ? (missions as SerializedMission[]) : [];
}
