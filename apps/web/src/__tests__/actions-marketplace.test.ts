import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApiRequest = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ token: "test-token" });
const mockRevalidatePath = vi.fn();
const mockCreateUserDeskRequest = vi.fn();
const mockToUserFacingApiError = vi.fn((error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback,
);
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  toUserFacingApiError: (...args: [unknown, string]) => mockToUserFacingApiError(...args),
}));
vi.mock("@/lib/session", () => ({ getSession: () => mockGetSession() }));
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }));
vi.mock("@/app/actions/desk", () => ({
  createUserDeskRequest: (...args: unknown[]) => mockCreateUserDeskRequest(...args),
}));

const {
  createMissionFromRenfort,
  bookService,
  getMyAteliers,
  createServiceFromPublish,
  updateServiceAction,
  deleteServiceAction,
  getService,
} = await import("@/app/actions/marketplace");

const baseInput = {
  title: "Infirmier de nuit",
  dateStart: "2026-05-01T20:00:00.000Z",
  dateEnd: "2026-05-02T06:00:00.000Z",
  hourlyRate: 32,
  address: "1 rue de la Paix, 75001 Paris",
  isRenfort: true,
  metier: "INFIRMIER",
  shift: "NUIT" as const,
  city: "Paris",
};

describe("createMissionFromRenfort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token" });
    mockApiRequest.mockResolvedValue({ id: "new-mission-id" });
    mockCreateUserDeskRequest.mockResolvedValue({ ok: true });
    mockToUserFacingApiError.mockImplementation((error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
    );
  });

  it("appelle POST /missions avec les données correctes", async () => {
    await createMissionFromRenfort(baseInput);
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/missions",
      expect.objectContaining({
        method: "POST",
        label: "renfort.publish",
        body: expect.objectContaining({
          title: "Infirmier de nuit",
          isRenfort: true,
          metier: "INFIRMIER",
        }),
      }),
    );
  });

  it("retourne { ok: true } en cas de succès", async () => {
    const result = await createMissionFromRenfort(baseInput);
    expect(result).toEqual({ ok: true });
  });

  it("invalide /dashboard après création", async () => {
    await createMissionFromRenfort(baseInput);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("invalide /dashboard/renforts après création", async () => {
    await createMissionFromRenfort(baseInput);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/renforts");
  });

  it("invalide /marketplace après création", async () => {
    await createMissionFromRenfort(baseInput);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace");
  });

  it("retourne { ok: false } si la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await createMissionFromRenfort(baseInput);
    expect(result).toEqual({ ok: false, error: "Non connecté" });
  });

  it("retourne une erreur lisible et logue le contexte si POST /missions échoue", async () => {
    const error = new Error("Planning invalide");
    mockApiRequest.mockRejectedValueOnce(error);
    mockToUserFacingApiError.mockReturnValueOnce("Planning invalide");

    const result = await createMissionFromRenfort(baseInput);

    expect(result).toEqual({ ok: false, error: "Planning invalide Le Desk a été prévenu." });
    expect(mockToUserFacingApiError).toHaveBeenCalledWith(
      error,
      "Impossible de publier le renfort pour le moment.",
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      "createMissionFromRenfort error",
      expect.objectContaining({
        title: "Infirmier de nuit",
        city: "Paris",
        planningCount: 0,
        error: "Planning invalide",
      }),
    );
    expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
      "MISSION_PUBLISH_FAILURE",
      expect.stringContaining("Échec de publication d'un renfort."),
    );
  });

  it("ne masque pas l'erreur publication si le ticket Desk échoue aussi", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Planning invalide"));
    mockToUserFacingApiError.mockReturnValueOnce("Planning invalide");
    mockCreateUserDeskRequest.mockResolvedValueOnce({ ok: false, error: "Desk indisponible" });

    const result = await createMissionFromRenfort(baseInput);

    expect(result).toEqual({ ok: false, error: "Planning invalide" });
  });
});

describe("bookService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token" });
    mockCreateUserDeskRequest.mockResolvedValue({ ok: true });
  });

  it("crée un ticket Desk si la réservation atelier échoue", async () => {
    const date = new Date("2026-05-10T09:00:00.000Z");
    mockApiRequest.mockRejectedValueOnce(new Error("Service indisponible"));

    const result = await bookService("service-1", date, undefined, 3);

    expect(result).toEqual({ error: "Service indisponible Le Desk a été prévenu." });
    expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
      "BOOKING_FAILURE",
      expect.stringContaining("Service: service-1"),
    );
  });

  it("remplace une erreur technique FAIL par un message utilisateur clair", async () => {
    const date = new Date("2026-05-10T09:00:00.000Z");
    mockApiRequest.mockRejectedValueOnce(new Error("FAIL"));

    const result = await bookService("service-1", date, undefined, 3);

    expect(result).toEqual({
      error: "Impossible d'envoyer votre demande de réservation pour le moment. Le Desk a été prévenu.",
    });
    expect("error" in result ? result.error : "").not.toContain("FAIL");
    expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
      "BOOKING_FAILURE",
      expect.stringContaining("Erreur brute: FAIL"),
    );
  });

  it("refuse une date invalide avant l'appel API", async () => {
    const result = await bookService("service-1", new Date("bad-date"), undefined, 3);

    expect(result).toEqual({
      error: "Choisissez une date future pour votre demande.",
    });
    expect(mockApiRequest).not.toHaveBeenCalled();
    expect(mockCreateUserDeskRequest).not.toHaveBeenCalled();
  });

  it("refuse un nombre de participants invalide avant l'appel API", async () => {
    const date = new Date("2026-05-10T09:00:00.000Z");

    const result = await bookService("service-1", date, undefined, 0);

    expect(result).toEqual({
      error: "Le nombre de participants doit être supérieur ou égal à 1.",
    });
    expect(mockApiRequest).not.toHaveBeenCalled();
    expect(mockCreateUserDeskRequest).not.toHaveBeenCalled();
  });
});

// ─── getMyAteliers ────────────────────────────────────────────────────────────

const mockService = {
  id: "svc-1",
  title: "Zumba thérapeutique",
  description: null,
  price: 100,
  type: "WORKSHOP" as const,
  capacity: 12,
  pricingType: "SESSION" as const,
  pricePerParticipant: null,
  durationMinutes: 60,
  category: null,
  publicCible: null,
  materials: null,
  objectives: null,
  methodology: null,
  evaluation: null,
  slots: null,
};

describe("getMyAteliers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token", user: { id: "u-1" } });
    mockApiRequest.mockResolvedValue([mockService]);
  });

  it("appelle GET /services/my (endpoint dédié)", async () => {
    await getMyAteliers();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/services/my",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("n'appelle jamais GET /services (pas de sur-fetch)", async () => {
    await getMyAteliers();
    expect(mockApiRequest).not.toHaveBeenCalledWith(
      "/services",
      expect.anything(),
    );
  });

  it("ajoute status ACTIVE à chaque atelier retourné", async () => {
    const result = await getMyAteliers();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "svc-1", status: "ACTIVE" });
  });

  it("trie les ateliers par titre (locale fr)", async () => {
    mockApiRequest.mockResolvedValue([
      { ...mockService, id: "2", title: "Yoga doux" },
      { ...mockService, id: "1", title: "Atelier bien-être" },
      { ...mockService, id: "3", title: "Méditation" },
    ]);
    const result = await getMyAteliers();
    expect(result.map((s) => s.title)).toEqual([
      "Atelier bien-être",
      "Méditation",
      "Yoga doux",
    ]);
  });

  it("retourne [] si la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await getMyAteliers();
    expect(result).toEqual([]);
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("propage l'erreur en cas d'échec API au lieu de simuler une liste vide", async () => {
    mockApiRequest.mockRejectedValue(new Error("Network error"));
    await expect(getMyAteliers()).rejects.toThrow("Network error");
  });
});

// ─── createServiceFromPublish ─────────────────────────────────────────────────

const baseServiceInput = {
  title: "Zumba thérapeutique",
  price: 100,
  type: "WORKSHOP" as const,
  capacity: 12,
  durationMinutes: 60,
};

describe("createServiceFromPublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token" });
    mockApiRequest.mockResolvedValue({ id: "new-service-id" });
  });

  it("appelle POST /services avec les données correctes", async () => {
    await createServiceFromPublish(baseServiceInput);
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/services",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({
          title: "Zumba thérapeutique",
          type: "WORKSHOP",
          capacity: 12,
        }),
      }),
    );
  });

  it("retourne { ok: true } en cas de succès", async () => {
    const result = await createServiceFromPublish(baseServiceInput);
    expect(result).toEqual({ ok: true });
  });

  it("invalide /marketplace après création (atelierInvalidationPaths.catalogue)", async () => {
    await createServiceFromPublish(baseServiceInput);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace");
  });

  it("invalide /dashboard/ateliers après création (atelierInvalidationPaths.mesAteliers)", async () => {
    await createServiceFromPublish(baseServiceInput);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/ateliers");
  });

  it("invalide /dashboard après création", async () => {
    await createServiceFromPublish(baseServiceInput);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("invalide /bookings après création", async () => {
    await createServiceFromPublish(baseServiceInput);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/bookings");
  });

  it("lance une erreur si la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(createServiceFromPublish(baseServiceInput)).rejects.toThrow("Non connecté");
  });
});

describe("updateServiceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token" });
  });

  it("retourne un résultat explicite en cas de succès", async () => {
    mockApiRequest.mockResolvedValue({ id: "svc-1", title: "Atelier" });

    const result = await updateServiceAction("svc-1", { status: "ACTIVE" });

    expect(result).toEqual({
      ok: true,
      data: { id: "svc-1", title: "Atelier" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace/services/svc-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/ateliers/svc-1");
  });

  it("retourne une erreur explicite au lieu de null", async () => {
    mockApiRequest.mockRejectedValue(new Error("Impossible de publier ce brouillon."));

    const result = await updateServiceAction("svc-1", { status: "ACTIVE" });

    expect(result).toEqual({
      ok: false,
      error: "Impossible de publier ce brouillon.",
    });
  });
});

describe("deleteServiceAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token" });
  });

  it("retourne un résultat explicite en cas de succès", async () => {
    mockApiRequest.mockResolvedValue(undefined);

    const result = await deleteServiceAction("svc-1");

    expect(result).toEqual({ ok: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace/services/svc-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/ateliers/svc-1");
  });

  it("retourne une erreur explicite au lieu de false", async () => {
    mockApiRequest.mockRejectedValue(new Error("Suppression impossible"));

    const result = await deleteServiceAction("svc-1");

    expect(result).toEqual({
      ok: false,
      error: "Suppression impossible",
    });
  });
});

describe("getService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "test-token" });
  });

  it("retourne null pour un 404 attendu", async () => {
    mockApiRequest.mockRejectedValue(new Error("Service not found"));

    await expect(getService("svc-404")).resolves.toBeNull();
  });

  it("relance les erreurs inattendues au lieu de masquer une panne", async () => {
    mockApiRequest.mockRejectedValue(new Error("Timeout API"));

    await expect(getService("svc-1")).rejects.toThrow("Timeout API");
  });
});
