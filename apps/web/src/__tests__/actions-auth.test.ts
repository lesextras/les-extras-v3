// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockApiRequest = vi.fn();
const mockCreateSession = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/lib/api", () => ({ apiRequest: (...args: unknown[]) => mockApiRequest(...args) }));
vi.mock("@/lib/session", () => ({ createSession: (...args: unknown[]) => mockCreateSession(...args) }));
vi.mock("next/navigation", () => ({ redirect: (...args: unknown[]) => { mockRedirect(...args); throw new Error("NEXT_REDIRECT"); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { register, forgotPassword, resetPasswordAction } = await import("@/app/actions/auth");

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

const validRegister = { email: "new@test.com", password: "securePass1", role: "FREELANCE" };

function makeApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    accessToken: "jwt-new",
    user: { id: "u2", email: "new@test.com", role: "FREELANCE", onboardingStep: 0, ...overrides },
  };
}

// ── register ─────────────────────────────────────────────────────────────────
describe("register action", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne des erreurs si l'email est invalide", async () => {
    const result = await register(undefined, makeFormData({ email: "bad", password: "12345678", role: "FREELANCE" }));
    expect(result?.errors?.email).toBeDefined();
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("retourne des erreurs si le mot de passe < 8 chars", async () => {
    const result = await register(undefined, makeFormData({ email: "a@b.com", password: "short", role: "FREELANCE" }));
    expect(result?.errors?.password).toBeDefined();
  });

  it("retourne des erreurs si le rôle est invalide", async () => {
    const result = await register(undefined, makeFormData({ email: "a@b.com", password: "12345678", role: "BOSS" }));
    expect(result?.errors?.role).toBeDefined();
  });

  it("crée la session et redirige vers /wizard après inscription réussie", async () => {
    mockApiRequest.mockResolvedValue(makeApiResponse());
    await expect(register(undefined, makeFormData(validRegister))).rejects.toThrow("NEXT_REDIRECT");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({ method: "POST", body: expect.objectContaining({ email: "new@test.com", role: "FREELANCE" }) }),
    );
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ token: "jwt-new", user: expect.objectContaining({ role: "FREELANCE", onboardingStep: 0 }) }),
    );
    expect(mockRedirect).toHaveBeenCalledWith("/wizard");
  });

  it("retourne un message d'erreur si l'API échoue", async () => {
    mockApiRequest.mockRejectedValue(new Error("Email déjà utilisé"));
    const result = await register(undefined, makeFormData(validRegister));
    expect(result?.message).toBe("Email déjà utilisé");
  });
});

// ── forgotPassword ──────────────────────────────────────────────────────────
describe("forgotPassword action", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne une erreur si l'email est invalide", async () => {
    const result = await forgotPassword(undefined, makeFormData({ email: "nope" }));
    expect(result?.message).toContain("invalide");
  });

  it("retourne success même si l'API échoue (pas de fuite d'info)", async () => {
    mockApiRequest.mockRejectedValue(new Error("not found"));
    const result = await forgotPassword(undefined, makeFormData({ email: "a@b.com" }));
    expect(result?.success).toBe(true);
  });

  it("appelle l'API avec l'email", async () => {
    mockApiRequest.mockResolvedValue({});
    const result = await forgotPassword(undefined, makeFormData({ email: "test@test.com" }));
    expect(result?.success).toBe(true);
    expect(mockApiRequest).toHaveBeenCalledWith("/auth/forgot-password", expect.objectContaining({ body: { email: "test@test.com" } }));
  });
});

// ── resetPasswordAction ─────────────────────────────────────────────────────
describe("resetPasswordAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne une erreur si token ou password manquant", async () => {
    const result = await resetPasswordAction(undefined, makeFormData({ token: "", password: "" }));
    expect(result?.message).toContain("manquants");
  });

  it("retourne une erreur si le mot de passe < 8 chars", async () => {
    const result = await resetPasswordAction(undefined, makeFormData({ token: "abc", password: "short" }));
    expect(result?.message).toContain("8 caractères");
  });

  it("redirige vers /login après reset réussi", async () => {
    mockApiRequest.mockResolvedValue({});
    await expect(
      resetPasswordAction(undefined, makeFormData({ token: "valid-token", password: "newSecure1" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockApiRequest).toHaveBeenCalledWith("/auth/reset-password", expect.objectContaining({ body: { token: "valid-token", password: "newSecure1" } }));
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("retourne le message d'erreur si l'API échoue", async () => {
    mockApiRequest.mockRejectedValue(new Error("Token expiré"));
    const result = await resetPasswordAction(undefined, makeFormData({ token: "bad", password: "newSecure1" }));
    expect(result?.message).toBe("Token expiré");
  });
});
