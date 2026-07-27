import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApiRequest = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ token: "tok" });
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

const { requestMissionInfo } = await import("@/app/actions/missions");

describe("requestMissionInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "tok" });
    mockApiRequest.mockResolvedValue({ ok: true });
  });

  it("envoie POST /missions/:id/info-request avec le message", async () => {
    await requestMissionInfo("mission-1", "Pouvez-vous préciser le public ?");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/missions/mission-1/info-request",
      expect.objectContaining({
        method: "POST",
        body: { message: "Pouvez-vous préciser le public ?" },
      }),
    );
  });

  it("n'appelle pas un endpoint de notification directe établissement", async () => {
    await requestMissionInfo("mission-1", "Question longue et précise sur la mission.");
    const calls: string[] = mockApiRequest.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(calls).not.toContain(expect.stringContaining("notification"));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe("/missions/mission-1/info-request");
  });

  it("retourne { ok: true } en cas de succès — crée une DeskRequest", async () => {
    const result = await requestMissionInfo("m-1", "Question précise et suffisamment longue.");
    expect(result).toEqual({ ok: true });
  });

  it("revalide le dashboard et la page Mes demandes après succès", async () => {
    await requestMissionInfo("m-1", "Question précise et suffisamment longue.");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/demandes");
  });

  it("retourne { ok: false } si la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await requestMissionInfo("m-1", "Question précise.");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("remonte le message d'erreur en cas d'échec API", async () => {
    mockApiRequest.mockRejectedValue(new Error("Mission not found"));
    const result = await requestMissionInfo("m-999", "Question précise.");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Mission not found");
  });
});
