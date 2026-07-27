import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

const { UnauthorizedError } = await import("@/lib/api");
const { fetchAdminSafe } = await import("@/lib/admin-safe-fetch");

describe("fetchAdminSafe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne les données quand l'appel admin réussit", async () => {
    const result = await fetchAdminSafe(
      async () => ({ pendingUsersCount: 2 }),
      { pendingUsersCount: 0 },
      "Synthèse Desk",
    );

    expect(result).toEqual({
      data: { pendingUsersCount: 2 },
      error: null,
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("retourne le fallback et un message si l'endpoint échoue", async () => {
    const result = await fetchAdminSafe(
      async () => {
        throw new Error("API request failed (503)");
      },
      [],
      "Demandes Desk",
    );

    expect(result).toEqual({
      data: [],
      error: "Demandes Desk indisponible pour le moment.",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[admin-safe-fetch] widget unavailable",
      expect.objectContaining({ label: "Demandes Desk" }),
    );
  });

  it("redirige vers la connexion Desk si la session admin est absente", async () => {
    await expect(
      fetchAdminSafe(
        async () => {
          throw new Error("Session admin requise.");
        },
        [],
        "Utilisateurs Desk",
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/login");

    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("redirige vers la connexion Desk si l'API renvoie une session expirée", async () => {
    await expect(
      fetchAdminSafe(
        async () => {
          throw new UnauthorizedError();
        },
        [],
        "Synthèse Desk",
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/login");

    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });
});
