import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockApiRequest = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const { updateAvailabilityAction } = await import("@/app/actions/user");

describe("updateAvailabilityAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      token: "freelance-token",
      user: { id: "free-1", role: "FREELANCE" },
    });
    mockApiRequest.mockResolvedValue({});
  });

  it("persiste la disponibilité via PATCH /users/me", async () => {
    const result = await updateAvailabilityAction(true);

    expect(result).toEqual({ ok: true });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/users/me",
      expect.objectContaining({
        method: "PATCH",
        token: "freelance-token",
        body: { isAvailable: true },
        label: "user.update-availability",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/account");
  });

  it("refuse la mutation sans session", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(updateAvailabilityAction(false)).resolves.toEqual({
      ok: false,
      error: "Non connecté",
    });
    expect(mockApiRequest).not.toHaveBeenCalled();
  });
});
