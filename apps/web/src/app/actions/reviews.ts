"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api";
import { getSession } from "@/lib/session";
import { lot6InvalidationPaths, reviewsQueryKeys } from "@/lib/lot6-query-keys";

type ReviewType = "ESTABLISHMENT_TO_FREELANCE" | "FREELANCE_TO_ESTABLISHMENT";

export type SerializedReview = {
  id: string;
  bookingId: string;
  authorId: string;
  targetId: string;
  rating: number;
  comment: string | null;
  type: ReviewType;
  createdAt: string;
  author?: {
    id: string;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
      avatar?: string | null;
      companyName?: string | null;
    } | null;
  };
};

export type CreateReviewInput = {
  bookingId: string;
  rating: number;
  comment?: string;
  type: ReviewType;
};

export async function getReviewsByTarget(targetId: string, token?: string): Promise<SerializedReview[]> {
  if (!targetId) return [];
  const queryKey = reviewsQueryKeys.byTarget(targetId);
  if (!queryKey.length) return [];

  const activeToken = token || (await getSession())?.token;
  return apiRequest<SerializedReview[]>(`/reviews/user/${targetId}`, {
    method: "GET",
    token: activeToken,
    label: "reviews.by-target",
  });
}

export async function getReviewByBooking(bookingId: string, token?: string): Promise<SerializedReview | null> {
  if (!bookingId) return null;
  const queryKey = reviewsQueryKeys.byBooking(bookingId);
  if (!queryKey.length) return null;

  const activeToken = token || (await getSession())?.token;
  if (!activeToken) throw new Error("Non connecté");

  return apiRequest<SerializedReview | null>(`/reviews/booking/${bookingId}`, {
    method: "GET",
    token: activeToken,
    label: "reviews.by-booking",
  });
}

export async function createReview(
  input: CreateReviewInput,
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  try {
    await apiRequest<SerializedReview>("/reviews", {
      method: "POST",
      token: session.token,
      body: input,
    });

    revalidatePath(lot6InvalidationPaths.bookings);
    revalidatePath(lot6InvalidationPaths.orders);
    revalidatePath(lot6InvalidationPaths.dashboard);
    revalidatePath(lot6InvalidationPaths.finance);

    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erreur lors de la création de l'avis",
    };
  }
}
