"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, toUserFacingApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

// ── Types ──

export type TimelineEvent = {
  id: string;
  type: string;
  label: string;
  description?: string;
  actor?: { id: string; name: string; role: string };
  timestamp: string;
};

export type OrderParticipant = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  avatar?: string;
  phone?: string;
};

export type OrderMessage = {
  id: string;
  content: string;
  senderId: string;
  type: string;
  metadata?: unknown;
  createdAt: string;
};

export type OrderQuoteLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  totalHT: number;
};

export type OrderQuote = {
  id: string;
  status: string;
  subtotalHT: number;
  vatRate: number;
  vatAmount: number;
  totalTTC: number;
  validUntil?: string;
  conditions?: string;
  notes?: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  issuer: { id: string; name: string };
  lines: OrderQuoteLine[];
};

export type OrderMissionPlanningLine = {
  dateStart: string;
  heureDebut: string;
  dateEnd: string;
  heureFin: string;
};

export type OrderMission = {
  id: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  address: string;
  hourlyRate: number;
  shift?: string;
  description?: string;
  planning?: OrderMissionPlanningLine[];
  slots?: OrderMissionPlanningLine[];
};

export type OrderService = {
  id: string;
  title: string;
  description?: string;
  price: number;
  durationMinutes: number;
  pricingType: string;
  pricePerParticipant?: number;
};

export type OrderInvoice = {
  id: string;
  amount: number;
  status: string;
  invoiceNumber?: string;
  createdAt: string;
};

export type OrderTrackerData = {
  booking: {
    id: string;
    status: string;
    paymentStatus: string;
    message?: string;
    scheduledAt: string;
    nbParticipants?: number;
    createdAt: string;
  };
  mission?: OrderMission;
  service?: OrderService;
  requester: OrderParticipant;
  provider: OrderParticipant;
  freelance: OrderParticipant;
  establishment: OrderParticipant;
  conversation?: { id: string; messages: OrderMessage[] };
  quotes: OrderQuote[];
  timeline: TimelineEvent[];
  invoice?: OrderInvoice;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  };
};

// ── Actions ──

export async function getOrderTracker(bookingId: string, token?: string): Promise<OrderTrackerData> {
  let activeToken = token;
  if (!activeToken) {
    const session = await getSession();
    if (!session) throw new Error("Non connecté");
    activeToken = session.token;
  }

  return apiRequest<OrderTrackerData>(`/bookings/${encodeURIComponent(bookingId)}/order`, {
    method: "GET",
    token: activeToken,
  });
}

export async function sendOrderMessage(receiverId: string, content: string, bookingId: string) {
  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  if (!content.trim()) return { error: "Le message ne peut pas être vide" };

  try {
    await apiRequest("/conversations/messages", {
      method: "POST",
      token: session.token,
      body: { receiverId, content },
    });
    revalidatePath(`/orders/${bookingId}`);
    return { success: true };
  } catch (e) {
    console.error("sendOrderMessage error:", e);
    return { error: toUserFacingApiError(e, "Erreur lors de l'envoi du message") };
  }
}

export async function createQuote(
  bookingId: string,
  lines: { description: string; quantity: number; unitPrice: number; unit?: string }[],
  options?: { vatRate?: number; validUntil?: string; conditions?: string; notes?: string },
) {
  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  try {
    await apiRequest("/quotes", {
      method: "POST",
      token: session.token,
      body: { bookingId, lines, ...options },
    });
    revalidatePath(`/orders/${bookingId}`);
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur lors de la création du devis";
    return { error: msg };
  }
}

export async function acceptQuote(quoteId: string, bookingId: string) {
  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  try {
    await apiRequest(`/quotes/${encodeURIComponent(quoteId)}/accept`, {
      method: "PATCH",
      token: session.token,
    });
    revalidatePath(`/orders/${bookingId}`);
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur lors de l'acceptation du devis";
    return { error: msg };
  }
}

export async function rejectQuote(quoteId: string, bookingId: string, reason?: string) {
  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  try {
    await apiRequest(`/quotes/${encodeURIComponent(quoteId)}/reject`, {
      method: "PATCH",
      token: session.token,
      body: reason ? { reason } : undefined,
    });
    revalidatePath(`/orders/${bookingId}`);
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur lors du refus du devis";
    return { error: msg };
  }
}

export async function getQuotePrefill(bookingId: string) {
  const session = await getSession();
  if (!session) return { error: "Non connecté" as const };

  try {
    const data = await apiRequest<{ lines: OrderQuoteLine[] }>(
      `/quotes/booking/${encodeURIComponent(bookingId)}/prefill`,
      { method: "GET", token: session.token },
    );
    return { lines: data.lines };
  } catch {
    return { lines: [] as OrderQuoteLine[] };
  }
}
