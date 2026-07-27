"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { apiRequest, safeApiRequest, type SafeApiResult } from "@/lib/api";
import { normalizeDeskRequestErrorMessage } from "@/lib/desk-errors";

export type MyDeskRequestStatus = "OPEN" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";

export type MyDeskRequestType =
  | "MISSION_INFO_REQUEST"
  | "PAYMENT_ISSUE"
  | "BOOKING_FAILURE"
  | "PACK_PURCHASE_FAILURE"
  | "MISSION_PUBLISH_FAILURE"
  | "TECHNICAL_ISSUE"
  | "USER_REPORT"
  | "LITIGE";

export type UserDeskRequestType =
  | "MISSION_INFO_REQUEST"
  | "BOOKING_FAILURE"
  | "PACK_PURCHASE_FAILURE"
  | "MISSION_PUBLISH_FAILURE"
  | "TECHNICAL_ISSUE"
  | "USER_REPORT"
  | "LITIGE";

export type UserDeskRequestContext = {
  missionId?: string;
  bookingId?: string;
};

export type MyDeskRequest = {
  id: string;
  type: MyDeskRequestType;
  status: MyDeskRequestStatus;
  message: string;
  response: string | null;
  answeredAt: string | null;
  createdAt: string;
  mission: { id: string; title: string } | null;
  booking: {
    id: string;
    status: string;
    paymentStatus?: string;
    reliefMission?: { title: string } | null;
    service?: { title: string } | null;
  } | null;
  answeredBy: {
    id: string;
    email: string;
    profile: { firstName: string; lastName: string } | null;
  } | null;
};

export async function createUserDeskRequest(
  type: UserDeskRequestType,
  message: string,
  context?: UserDeskRequestContext,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) return { ok: false, error: "Non connecté" };

    await apiRequest("/desk-requests", {
      method: "POST",
      token: session.token,
      body: {
        type,
        message,
        bookingId: context?.bookingId,
        missionId: context?.missionId,
      },
      label: "desk.create-user-request",
    });

    revalidatePath("/dashboard/demandes");
    revalidatePath("/dashboard");
    revalidatePath("/admin/demandes");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: normalizeDeskRequestErrorMessage(error),
    };
  }
}

export async function getMyDeskRequests(token?: string): Promise<MyDeskRequest[]> {
  try {
    let activeToken = token;
    if (!activeToken) {
      const session = await getSession();
      if (!session) return [];
      activeToken = session.token;
    }

    return await apiRequest<MyDeskRequest[]>("/desk-requests/mine", {
      method: "GET",
      token: activeToken,
    });
  } catch {
    return [];
  }
}

export async function getMyDeskRequestsSafe(
  token?: string,
): Promise<SafeApiResult<MyDeskRequest[]>> {
  let activeToken = token;
  if (!activeToken) {
    const session = await getSession();
    if (!session) return { ok: true, data: [] };
    activeToken = session.token;
  }

  return safeApiRequest<MyDeskRequest[]>(
    "/desk-requests/mine",
    {
      method: "GET",
      token: activeToken,
      label: "desk.mine",
    },
    "Impossible de charger vos demandes pour le moment.",
  );
}
