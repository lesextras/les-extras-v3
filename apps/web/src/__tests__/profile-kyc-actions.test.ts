import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn(),
  getApiBaseUrl: () => "http://api.test",
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const { uploadFreelanceKycDocument } = await import("@/app/actions/profile");

describe("profile KYC actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "user-token" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("upload un document KYC via POST /users/me/documents/:type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          documents: [{ id: "doc-1", type: "CV", label: "CV" }],
          summary: { globalStatus: "MISSING" },
        }),
      }),
    );

    const formData = new FormData();
    formData.set("file", new Blob(["cv"], { type: "application/pdf" }), "cv.pdf");

    const result = await uploadFreelanceKycDocument("CV", formData);

    expect(fetch).toHaveBeenCalledWith(
      "http://api.test/users/me/documents/CV",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer user-token",
        },
        body: formData,
      }),
    );
    expect(result).toEqual({
      documents: [{ id: "doc-1", type: "CV", label: "CV" }],
      summary: { globalStatus: "MISSING" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/account");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("retourne une erreur si la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);

    const formData = new FormData();
    const result = await uploadFreelanceKycDocument("RIB", formData);

    expect(result).toEqual({ error: "Non connecté" });
  });
});
