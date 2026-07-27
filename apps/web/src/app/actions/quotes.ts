"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api";
import { getSession } from "@/lib/session";

export type QuoteStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type SerializedQuote = {
  id: string;
  amount: number;
  description: string;
  startDate: string | null;
  endDate: string | null;
  status: QuoteStatus;
  freelanceId: string;
  establishmentId: string;
  serviceId: string | null;
  createdAt: string;
  updatedAt: string;
  freelance?: {
    id: string;
    profile?: {
      firstName: string;
      lastName: string;
      avatar: string | null;
      jobTitle: string | null;
    } | null;
  };
  establishment?: {
    id: string;
    profile?: {
      companyName: string | null;
      firstName: string;
      lastName: string;
    } | null;
  };
  service?: {
    id: string;
    title: string;
    type: string;
    category: string | null;
  } | null;
  booking?: {
    id: string;
    status: string;
    scheduledAt: string;
    nbParticipants: number | null;
    message: string | null;
  } | null;
};

export async function getMyQuotes(): Promise<SerializedQuote[]> {
  const session = await getSession();
  if (!session) return [];

  try {
    return await apiRequest<SerializedQuote[]>("/quotes", {
      method: "GET",
      token: session.token,
    });
  } catch (error) {
    console.error("getMyQuotes error", error);
    return [];
  }
}

export type UpdateQuoteInput = {
  amount: number;
  description: string;
  startDate?: string;
  endDate?: string;
};

export async function updateQuote(
  quoteId: string,
  data: UpdateQuoteInput,
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  try {
    await apiRequest(`/quotes/${quoteId}`, {
      method: "PATCH",
      token: session.token,
      body: data,
    });

    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erreur lors de la mise à jour du devis",
    };
  }
}

export async function acceptQuote(quoteId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  try {
    await apiRequest(`/quotes/${quoteId}/accept`, {
      method: "PATCH",
      token: session.token,
    });

    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erreur lors de l'acceptation du devis",
    };
  }
}

export async function rejectQuote(quoteId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  try {
    await apiRequest(`/quotes/${quoteId}/reject`, {
      method: "PATCH",
      token: session.token,
    });

    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erreur lors du refus du devis",
    };
  }
}
