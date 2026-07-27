"use server";

import { revalidatePath } from "next/cache";
import {
  apiRequest,
  safeApiRequest,
  toUserFacingApiError,
  type SafeApiResult,
} from "@/lib/api";
import { getSession } from "@/lib/session";

export type DashboardRole = "ESTABLISHMENT" | "FREELANCE";
export type BookingLineType = "MISSION" | "SERVICE_BOOKING";
export type BookingLineStatus =
  | "PENDING"
  | "QUOTE_SENT"
  | "QUOTE_ACCEPTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "CANCELLED"
  | "ASSIGNED"
  | "COMPLETED_AWAITING_PAYMENT";

export type BookingLine = {
  lineId: string;
  lineType: BookingLineType;
  date: string;
  typeLabel: "Mission SOS" | "Atelier" | "Formation";
  interlocutor: string;
  status: BookingLineStatus;
  address: string;
  contactEmail: string;
  viewerSide?: "REQUESTER" | "PROVIDER";
  relatedBookingId?: string;
  invoiceUrl?: string;
  title?: string;
  amount?: number;
  hasReview?: boolean;
};

export type BookingsPageData = {
  lines: BookingLine[];
  nextStep: BookingLine | null;
};

export type BookingDetails = {
  address: string;
  contactEmail: string;
  contactPhone?: string;
  contactName?: string;
  missionTitle?: string;
  dateStart?: string;
  dateEnd?: string;
  planning?: {
    dateStart: string;
    heureDebut: string;
    dateEnd: string;
    heureFin: string;
  }[];
  shift?: string;
  hourlyRate?: number;
  accessInstructions?: string;
  hasTransmissions?: boolean;
  transmissionTime?: string;
  perks?: string[];
  freelanceAcknowledged?: boolean;
};

type CancelBookingInput = {
  lineType: BookingLineType;
  lineId: string;
};

type BookingDetailsInput = {
  lineType: BookingLineType;
  lineId: string;
};

type ActionBookingInput = {
  bookingId: string;
};

type BookingActionResult = { ok: true } | { ok: false; error: string };

async function resolveActionToken(): Promise<string | null> {
  const session = await getSession();
  return session?.token ?? null;
}



export async function getBookingsPageData(token?: string): Promise<BookingsPageData> {
  let activeToken = token;
  if (!activeToken) {
    const session = await getSession();
    if (!session) throw new Error("Non connecté");
    activeToken = session.token;
  }

  return apiRequest<BookingsPageData>("/bookings", {
    method: "GET",
    token: activeToken,
    label: "bookings.page-data",
  });
}

export async function getBookingsPageDataSafe(
  token?: string,
): Promise<SafeApiResult<BookingsPageData>> {
  const activeToken = token ?? (await resolveActionToken());
  if (!activeToken) {
    return { ok: false, error: "Non connecté", unauthorized: true };
  }

  return safeApiRequest<BookingsPageData>(
    "/bookings",
    {
      method: "GET",
      token: activeToken,
      label: "bookings.page-data",
    },
    "Impossible de charger votre agenda pour le moment.",
  );
}

export async function cancelBookingLine(
  input: CancelBookingInput,
): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non connecté" };

  try {
    await apiRequest<{ ok: true }>("/bookings/cancel", {
      method: "POST",
      token: session.token,
      body: input,
      label: "bookings.cancel",
    });

    revalidatePath("/bookings");
    revalidatePath("/marketplace");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: toUserFacingApiError(
        error,
        "Impossible d'annuler cette réservation pour le moment.",
      ),
    };
  }
}

export async function getBookingLineDetails(
  input: BookingDetailsInput,
): Promise<BookingDetails> {
  const session = await getSession();
  if (!session) throw new Error("Non connecté");

  return apiRequest<BookingDetails>(
    `/bookings/${input.lineType}/${input.lineId}/details`,
    {
      method: "GET",
      token: session.token,
      label: "bookings.details",
    },
  );
}

export async function getBookingLineDetailsSafe(
  input: BookingDetailsInput,
  token?: string,
): Promise<SafeApiResult<BookingDetails>> {
  const activeToken = token ?? (await resolveActionToken());
  if (!activeToken) {
    return { ok: false, error: "Non connecté", unauthorized: true };
  }

  return safeApiRequest<BookingDetails>(
    `/bookings/${input.lineType}/${input.lineId}/details`,
    {
      method: "GET",
      token: activeToken,
      label: "bookings.details",
    },
    "Impossible de récupérer les détails pour le moment.",
  );
}

export async function confirmBookingLine(
  input: ActionBookingInput,
): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non connecté" };

  try {
    await apiRequest<{ ok: true }>("/bookings/confirm", {
      method: "POST",
      token: session.token,
      body: input,
      label: "bookings.confirm",
    });

    revalidatePath("/bookings");
    revalidatePath(`/orders/${input.bookingId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: toUserFacingApiError(
        error,
        "Impossible de confirmer cette réservation pour le moment.",
      ),
    };
  }
}

export async function completeBookingLine(
  input: ActionBookingInput,
): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non connecté" };

  try {
    await apiRequest<{ ok: true }>("/bookings/complete", {
      method: "POST",
      token: session.token,
      body: input,
      label: "bookings.complete",
    });

    revalidatePath("/bookings");
    revalidatePath(`/orders/${input.bookingId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: toUserFacingApiError(
        error,
        "Impossible de terminer cette réservation pour le moment.",
      ),
    };
  }
}

export async function acknowledgeBooking(
  input: ActionBookingInput,
): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non connecté" };

  try {
    await apiRequest<{ ok: true }>("/bookings/acknowledge", {
      method: "POST",
      token: session.token,
      body: input,
      label: "bookings.acknowledge",
    });

    revalidatePath("/bookings");
    revalidatePath(`/orders/${input.bookingId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: toUserFacingApiError(
        error,
        "Impossible de confirmer la lecture pour le moment.",
      ),
    };
  }
}
