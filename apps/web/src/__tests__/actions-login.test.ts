// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockApiRequest = vi.fn();
const mockCreateSession = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/lib/api", () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));
vi.mock("@/lib/session", () => ({ createSession: (...args: unknown[]) => mockCreateSession(...args) }));
vi.mock("next/navigation", () => ({ redirect: (...args: unknown[]) => { mockRedirect(...args); throw new Error("NEXT_REDIRECT"); } }));

const { login } = await import("@/app/actions/login");

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

const validCreds = { email: "user@test.com", password: "secret123" };

function makeApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    accessToken: "jwt-token",
    user: { id: "u1", email: "user@test.com", role: "FREELANCE", onboardingStep: 2, ...overrides },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe("login action", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Validation ──
  it("retourne une erreur si l'email est invalide", async () => {
    const result = await login(undefined, makeFormData({ email: "bad", password: "pw" }));
    expect(result?.errors?.email).toBeDefined();
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("retourne une erreur si le mot de passe est vide", async () => {
    const result = await login(undefined, makeFormData({ email: "a@b.com", password: "" }));
    expect(result?.errors?.password).toBeDefined();
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  // ── Successful logins ──
  it("crée la session et redirige vers /dashboard si onboarding terminé", async () => {
    mockApiRequest.mockResolvedValue(makeApiResponse({ onboardingStep: 2, role: "FREELANCE" }));
    await expect(login(undefined, makeFormData(validCreds))).rejects.toThrow("NEXT_REDIRECT");

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ token: "jwt-token", user: expect.objectContaining({ role: "FREELANCE" }) }),
    );
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirige vers /wizard si onboarding pas fini (step < maxStep)", async () => {
    mockApiRequest.mockResolvedValue(makeApiResponse({ onboardingStep: 0, role: "ESTABLISHMENT" }));
    await expect(login(undefined, makeFormData(validCreds))).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/wizard");
  });

  it("redirige vers /wizard si freelance step 1 < 2", async () => {
    mockApiRequest.mockResolvedValue(makeApiResponse({ onboardingStep: 1, role: "FREELANCE" }));
    await expect(login(undefined, makeFormData(validCreds))).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/wizard");
  });

  // ── ADMIN rejection ──
  it("refuse la connexion pour un compte ADMIN", async () => {
    mockApiRequest.mockResolvedValue(makeApiResponse({ role: "ADMIN", onboardingStep: 0 }));
    const result = await login(undefined, makeFormData(validCreds));
    expect(result?.message).toContain("Desk");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  // ── API failure ──
  it("retourne un message d'erreur si l'API échoue (mauvais identifiants)", async () => {
    mockApiRequest.mockRejectedValue(new Error("Unauthorized"));
    const result = await login(undefined, makeFormData(validCreds));
    expect(result?.message).toBe("Email ou mot de passe incorrect.");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
