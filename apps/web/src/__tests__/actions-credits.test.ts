import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApiRequest = vi.fn();
const mockSafeApiRequest = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ token: "credits-token" });
const mockRevalidatePath = vi.fn();
const mockCreateUserDeskRequest = vi.fn();

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  safeApiRequest: (...args: unknown[]) => mockSafeApiRequest(...args),
  toUserFacingApiError: (error: unknown, fallback: string) =>
    error instanceof Error && !error.message.includes("API request failed (5")
      ? error.message
      : fallback,
}));
vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));
vi.mock("@/app/actions/desk", () => ({
  createUserDeskRequest: (...args: unknown[]) => mockCreateUserDeskRequest(...args),
}));

const { buyPack, getCredits, getCreditPurchaseHistory, getCreditsSummarySafe } =
  await import("@/actions/credits");

describe("credits actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "credits-token" });
    mockSafeApiRequest.mockResolvedValue({ ok: true, data: {} });
    mockCreateUserDeskRequest.mockResolvedValue({ ok: true });
  });

  it("achète un pack et retourne le nouveau solde", async () => {
    mockApiRequest.mockResolvedValue({ availableCredits: 5 });

    const result = await buyPack("PRO");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/users/me/credits/buy",
      expect.objectContaining({
        method: "POST",
        token: "credits-token",
        body: { packType: "PRO" },
      }),
    );
    expect(result).toEqual({ ok: true, availableCredits: 5 });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/packs");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/account");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/account/establishment");
  });

  it("retourne le message API lisible en cas d'erreur", async () => {
    mockApiRequest.mockRejectedValue(new Error("Pack de crédits invalide."));

    const result = await buyPack("ENTERPRISE");

    expect(result).toEqual({ error: "Pack de crédits invalide. Le Desk a été prévenu." });
    expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
      "PACK_PURCHASE_FAILURE",
      expect.stringContaining("Pack: ENTERPRISE"),
    );
  });

  it("sanitise les erreurs techniques lors de l'achat d'un pack", async () => {
    mockApiRequest.mockRejectedValue(new Error("API request failed (502)"));

    const result = await buyPack("PRO");

    expect(result).toEqual({
      error: "Impossible d'ajouter ce pack pour le moment. Le Desk a été prévenu.",
    });
  });

  it.each([
    "FAIL",
    "Internal server error",
    "API request failed",
    "Cannot read properties of undefined",
  ])(
    "ne retourne jamais un message technique à l'utilisateur: %s",
    async (message) => {
      mockApiRequest.mockRejectedValue(new Error(message));

      const result = await buyPack("PRO");

      expect(result).toEqual({
        error: "Impossible d'ajouter ce pack pour le moment. Le Desk a été prévenu.",
      });
      expect(JSON.stringify(result)).not.toContain(message);
      expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
        "PACK_PURCHASE_FAILURE",
        expect.stringContaining(`Erreur brute: ${message}`),
      );
    },
  );

  it("refuse l'achat d'un pack pour un freelance sans appeler l'API", async () => {
    mockGetSession.mockResolvedValue({
      token: "credits-token",
      user: { role: "FREELANCE" },
    });

    const result = await buyPack("STARTER");

    expect(result).toEqual({
      error: "Les packs de crédits sont réservés aux établissements.",
    });
    expect(mockApiRequest).not.toHaveBeenCalled();
    expect(mockCreateUserDeskRequest).not.toHaveBeenCalled();
  });

  it("ne masque pas l'erreur pack si le ticket Desk échoue", async () => {
    mockApiRequest.mockRejectedValue(new Error("Pack de crédits invalide."));
    mockCreateUserDeskRequest.mockResolvedValueOnce({ ok: false, error: "Desk indisponible" });

    const result = await buyPack("PRO");

    expect(result).toEqual({ error: "Pack de crédits invalide." });
  });

  it("lit le vrai endpoint crédits", async () => {
    mockApiRequest.mockResolvedValue({ availableCredits: 3 });

    const result = await getCredits();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/users/me/credits",
      expect.objectContaining({
        method: "GET",
        token: "credits-token",
      }),
    );
    expect(result).toBe(3);
  });

  it("propage l'erreur API au lieu de masquer un faux solde à 0", async () => {
    mockApiRequest.mockRejectedValue(new Error("Service crédits indisponible"));

    await expect(getCredits()).rejects.toThrow("Service crédits indisponible");
  });

  it("rejette la lecture du solde si aucune session n'est disponible", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(getCredits()).rejects.toThrow("Non connecté");
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("lit l'historique d'achat sur le nouvel endpoint dédié", async () => {
    mockApiRequest.mockResolvedValue([
      {
        id: "purchase-1",
        amount: 400,
        creditsAdded: 3,
        createdAt: "2026-04-18T10:00:00.000Z",
      },
    ]);

    const result = await getCreditPurchaseHistory();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/users/me/credits/history",
      expect.objectContaining({
        method: "GET",
        token: "credits-token",
      }),
    );
    expect(result).toEqual([
      {
        id: "purchase-1",
        amount: 400,
        creditsAdded: 3,
        createdAt: "2026-04-18T10:00:00.000Z",
      },
    ]);
  });

  it("propage l'erreur API sur l'historique d'achat", async () => {
    mockApiRequest.mockRejectedValue(new Error("Historique indisponible"));

    await expect(getCreditPurchaseHistory()).rejects.toThrow("Historique indisponible");
  });

  it("rejette l'historique si aucune session n'est disponible", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(getCreditPurchaseHistory()).rejects.toThrow("Non connecté");
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("retourne un résumé crédits dégradé sans propager les erreurs API", async () => {
    mockSafeApiRequest
      .mockResolvedValueOnce({
        ok: false,
        error: "Impossible de charger le solde de crédits pour le moment.",
      })
      .mockResolvedValueOnce({
        ok: true,
        data: [
          {
            id: "purchase-1",
            amount: 400,
            creditsAdded: 3,
            createdAt: "2026-04-18T10:00:00.000Z",
          },
        ],
      });

    const result = await getCreditsSummarySafe();

    expect(result).toEqual({
      availableCredits: null,
      purchaseHistory: [
        {
          id: "purchase-1",
          amount: 400,
          creditsAdded: 3,
          createdAt: "2026-04-18T10:00:00.000Z",
        },
      ],
      creditsError: "Impossible de charger le solde de crédits pour le moment.",
      historyError: null,
    });
  });
});
