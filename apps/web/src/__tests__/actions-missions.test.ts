import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApiRequest = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ token: "test-token" });
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/api", () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));
vi.mock("@/lib/session", () => ({ getSession: () => mockGetSession() }));
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }));

// Import after mocks are set up
const { acceptCandidate, declineCandidate } = await import("@/app/actions/missions");

describe("acceptCandidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token" });
    mockApiRequest.mockResolvedValue({});
  });

  it("appelle POST /bookings/confirm avec le bookingId", async () => {
    await acceptCandidate("booking-42");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/bookings/confirm",
      expect.objectContaining({
        method: "POST",
        body: { bookingId: "booking-42" },
      }),
    );
  });

  it("retourne { ok: true } en cas de succès", async () => {
    const result = await acceptCandidate("booking-42");
    expect(result).toEqual({ ok: true });
  });

  it("invalide /dashboard et /dashboard/renforts", async () => {
    await acceptCandidate("booking-42");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/renforts");
  });

  it("retourne { ok: false } quand la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await acceptCandidate("booking-42");
    expect(result.ok).toBe(false);
  });

  it("retourne { ok: false } quand apiRequest lance une erreur", async () => {
    mockApiRequest.mockRejectedValue(new Error("Network error"));
    const result = await acceptCandidate("booking-42");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe("declineCandidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token" });
    mockApiRequest.mockResolvedValue({});
  });

  it("appelle POST /bookings/cancel avec lineType BOOKING et le bookingId", async () => {
    await declineCandidate("booking-99");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/bookings/cancel",
      expect.objectContaining({
        method: "POST",
        body: { lineType: "BOOKING", lineId: "booking-99" },
      }),
    );
  });

  it("retourne l'erreur API comme message user-friendly", async () => {
    mockApiRequest.mockRejectedValue(new Error("Seules les candidatures en attente peuvent être refusées"));
    const result = await declineCandidate("booking-99");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Seules les candidatures en attente peuvent être refusées");
  });

  it("retourne { ok: true } en cas de succès", async () => {
    const result = await declineCandidate("booking-99");
    expect(result).toEqual({ ok: true });
  });

  it("invalide /dashboard et /dashboard/renforts", async () => {
    await declineCandidate("booking-99");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/renforts");
  });

  it("retourne { ok: false } quand la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await declineCandidate("booking-99");
    expect(result.ok).toBe(false);
  });

  it("retourne { ok: false } quand apiRequest lance une erreur", async () => {
    mockApiRequest.mockRejectedValue(new Error("Server error"));
    const result = await declineCandidate("booking-99");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
