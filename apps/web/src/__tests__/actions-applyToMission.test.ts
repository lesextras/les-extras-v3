import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApiRequest = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ token: "tok" });
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/api", () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));
vi.mock("@/lib/session", () => ({ getSession: () => mockGetSession() }));
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }));

const { applyToMission } = await import("@/app/actions/missions");

describe("applyToMission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "tok" });
    mockApiRequest.mockResolvedValue({});
  });

  it("appelle POST /missions/:id/apply avec le bon body", async () => {
    await applyToMission("mission-1", { motivation: "Motivé", proposedRate: 25 });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/missions/mission-1/apply",
      expect.objectContaining({
        method: "POST",
        body: { motivation: "Motivé", proposedRate: 25 },
      }),
    );
  });

  it("retourne { ok: true } en cas de succès", async () => {
    const result = await applyToMission("mission-1");
    expect(result).toEqual({ ok: true });
  });

  it("invalide /marketplace et /dashboard en cas de succès", async () => {
    await applyToMission("mission-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("retourne { ok: false } quand la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await applyToMission("mission-1");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("retourne le message d'erreur spécifique pour un doublon (409)", async () => {
    mockApiRequest.mockRejectedValue(new Error("Already applied to this mission"));
    const result = await applyToMission("mission-1");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("déjà postulé");
  });

  it("retourne un message clair quand la mission est déjà prise", async () => {
    mockApiRequest.mockRejectedValue(new Error("Cette mission n'est plus ouverte"));
    const result = await applyToMission("mission-1");
    expect(result).toEqual({ ok: false, error: "Cette mission est déjà prise." });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("retourne { ok: false } pour une erreur générique", async () => {
    mockApiRequest.mockRejectedValue(new Error("Réseau indisponible"));
    const result = await applyToMission("mission-1");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Réseau indisponible");
  });
});
