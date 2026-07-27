import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApiRequest = vi.fn();
const mockGetSession = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const { getReviewsByTarget, getReviewByBooking, createReview } = await import("@/app/actions/reviews");

describe("actions/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "token-1" });
  });

  it("query les reviews par target", async () => {
    mockApiRequest.mockResolvedValue([]);

    await getReviewsByTarget("target-1");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/reviews/user/target-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("invalide les pages métier après création d'avis", async () => {
    mockApiRequest.mockResolvedValue({ id: "review-1" });

    const result = await createReview({
      bookingId: "booking-1",
      rating: 5,
      type: "ESTABLISHMENT_TO_FREELANCE",
      comment: "Parfait",
    });

    expect(result).toEqual({ ok: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/bookings");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/finance");
  });

  it("bloque le query booking review si non connecté", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(getReviewByBooking("booking-1")).rejects.toThrow("Non connecté");
  });

  it("retourne une erreur cohérente en cas d'échec de création", async () => {
    mockApiRequest.mockRejectedValue(new Error("Conflit review"));

    const result = await createReview({
      bookingId: "booking-1",
      rating: 4,
      type: "FREELANCE_TO_ESTABLISHMENT",
    });

    expect(result).toEqual({ error: "Conflit review" });
  });
});
