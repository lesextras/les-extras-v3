import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApiRequest = vi.fn();
const mockSafeApiRequest = vi.fn();
const mockGetSession = vi.fn();
const mockGetAdminSessionToken = vi.fn().mockResolvedValue("admin-tok");
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  safeApiRequest: (...args: unknown[]) => mockSafeApiRequest(...args),
}));
vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));
vi.mock("@/app/actions/_shared/admin-session", () => ({
  getAdminSessionToken: () => mockGetAdminSessionToken(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const {
  assignDeskRequest,
  createFinanceIncident,
  featureService,
  getAdminMissionDetail,
  getAdminOverview,
  getPendingKycDocuments,
  getAdminServiceDetail,
  getContactBypassEvents,
  getDeskRequests,
  hideService,
  monitorContactBypassEvent,
  reassignMission,
  reviewUserDocument,
  respondToDeskRequest,
  sendAdminOutreach,
  updateDeskRequestStatus,
} =
  await import("@/app/actions/admin");
const { createUserDeskRequest, getMyDeskRequests } = await import("@/app/actions/desk");

const fakeDeskRequest = {
  id: "dr-1",
  type: "MISSION_INFO_REQUEST",
  priority: "NORMAL",
  status: "OPEN",
  assignedToAdminId: null,
  message: "Question sur le public accueilli",
  response: null,
  answeredAt: null,
  createdAt: new Date().toISOString(),
  mission: { id: "m-1", title: "Infirmier urgences" },
  booking: null,
  requester: {
    id: "u-1",
    email: "karim@test.fr",
    profile: { firstName: "Karim", lastName: "Bensalem" },
  },
  assignedToAdmin: null,
  answeredBy: null,
};

// ─────────────────────────────────────────────
// Admin — getDeskRequests
// ─────────────────────────────────────────────

describe("getDeskRequests (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue([fakeDeskRequest]);
  });

  it("appelle GET /admin/desk-requests avec le token admin", async () => {
    await getDeskRequests();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/desk-requests",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
  });

  it("retourne la liste des demandes", async () => {
    const result = await getDeskRequests();
    expect(result).toHaveLength(1);
    const first = result[0]!;
    expect(first.id).toBe("dr-1");
    expect(first.mission?.title).toBe("Infirmier urgences");
    expect(first.requester.email).toBe("karim@test.fr");
  });

  it("propage l'erreur si l'API admin échoue", async () => {
    mockApiRequest.mockRejectedValue(new Error("Unauthorized"));
    await expect(getDeskRequests()).rejects.toThrow("Unauthorized");
  });
});

// ─────────────────────────────────────────────
// Admin — getAdminOverview
// ─────────────────────────────────────────────

describe("getAdminOverview (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({
      pendingUsersCount: 1,
      openDeskRequestsCount: 2,
      urgentOpenMissionsCount: 3,
      featuredServicesCount: 4,
      hiddenServicesCount: 5,
      awaitingPaymentCount: 6,
    });
  });

  it("appelle GET /admin/overview avec le token admin", async () => {
    await getAdminOverview();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/overview",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
  });
});

// ─────────────────────────────────────────────
// Admin — updateDeskRequestStatus
// ─────────────────────────────────────────────

describe("updateDeskRequestStatus (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({});
  });

  it("appelle PATCH /admin/desk-requests/:id/status avec le bon statut", async () => {
    await updateDeskRequestStatus("dr-1", "IN_PROGRESS");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/desk-requests/dr-1/status",
      expect.objectContaining({
        method: "PATCH",
        body: { status: "IN_PROGRESS" },
        token: "admin-tok",
      }),
    );
  });

  it("revalide la page /admin/demandes", async () => {
    await updateDeskRequestStatus("dr-1", "CLOSED");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/demandes");
  });
});

// ─────────────────────────────────────────────
// Admin — assignDeskRequest
// ─────────────────────────────────────────────

describe("assignDeskRequest (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({});
  });

  it("appelle PATCH /admin/desk-requests/:id/assign avec l'admin choisi", async () => {
    await assignDeskRequest("dr-1", "admin-2");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/desk-requests/dr-1/assign",
      expect.objectContaining({
        method: "PATCH",
        body: { adminId: "admin-2" },
        token: "admin-tok",
      }),
    );
  });

  it("permet de retirer l'assignation", async () => {
    await assignDeskRequest("dr-1", null);
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/desk-requests/dr-1/assign",
      expect.objectContaining({
        body: { adminId: null },
      }),
    );
  });
});

// ─────────────────────────────────────────────
// Admin — services moderation
// ─────────────────────────────────────────────

describe("moderation services (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({});
  });

  it("appelle l'endpoint de mise en avant et revalide les pages utiles", async () => {
    await featureService("svc-1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/services/svc-1/feature",
      expect.objectContaining({ method: "POST", token: "admin-tok" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/services");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace");
  });

  it("appelle l'endpoint de masquage et revalide les pages utiles", async () => {
    await hideService("svc-1");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/services/svc-1/hide",
      expect.objectContaining({ method: "POST", token: "admin-tok" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/services");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace");
  });
});

describe("admin detail fetchers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
  });

  it("charge le détail d'une mission via GET /admin/missions/:id", async () => {
    mockApiRequest.mockResolvedValue({
      id: "mission-1",
      title: "Mission de nuit",
      status: "OPEN",
      createdAt: "2026-04-18T08:00:00.000Z",
      updatedAt: "2026-04-18T08:00:00.000Z",
      establishmentName: "Luc Martin",
      establishmentEmail: "est@test.fr",
      establishmentId: "est-1",
      address: "12 rue des Lilas",
      city: "Paris",
      shift: "NUIT",
      dateStart: "2026-04-20T08:00:00.000Z",
      dateEnd: "2026-04-20T16:00:00.000Z",
      hourlyRate: 28,
      candidatesCount: 2,
      proposedTotalTTC: 320,
      attentionItems: [],
      assignedFreelance: null,
      linkedBooking: null,
      candidates: [],
      timeline: [],
      linkedDeskRequests: [],
    });

    await getAdminMissionDetail("mission-1");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/missions/mission-1",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
  });

  it("charge le détail d'un service via GET /admin/services/:id", async () => {
    mockApiRequest.mockResolvedValue({
      id: "service-1",
      title: "Atelier mémoire",
      type: "WORKSHOP",
      price: 140,
      freelanceName: "Nora Diallo",
      freelanceEmail: "nora@test.fr",
      isFeatured: false,
      isHidden: false,
      description: "Description",
      createdAt: "2026-04-10T08:00:00.000Z",
    });

    await getAdminServiceDetail("service-1");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/services/service-1",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
  });

  it("charge les événements de contournement via GET /admin/contact-bypass-events", async () => {
    mockApiRequest.mockResolvedValue([
      {
        id: "event-1",
        conversationId: "conv-1",
        bookingId: "booking-1",
        blockedReason: "EMAIL",
        rawExcerpt: "jo@example.com",
        createdAt: "2026-04-23T09:00:00.000Z",
        sender: {
          id: "user-1",
          name: "Aya Benali",
          email: "aya@test.fr",
          role: "FREELANCE",
          status: "VERIFIED",
        },
      },
    ]);

    const result = await getContactBypassEvents();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/contact-bypass-events",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.blockedReason).toBe("EMAIL");
    expect(result[0]!.bookingId).toBe("booking-1");
    expect(result[0]!.sender.status).toBe("VERIFIED");
  });
});

describe("mission moderation actions (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({ ok: true });
  });

  it("appelle l'endpoint d'arbitrage mission et revalide les pages utiles", async () => {
    await reassignMission("mission-1", "booking-9");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/missions/mission-1/reassign",
      expect.objectContaining({
        method: "POST",
        token: "admin-tok",
        body: { bookingId: "booking-9" },
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/missions");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/renforts");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/bookings");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/marketplace");
  });
});

describe("sendAdminOutreach (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({ ok: true });
  });

  it("appelle POST /admin/outreach/:userId avec le message et le contexte", async () => {
    await sendAdminOutreach("user-1", "Message du Desk.", {
      notifyByEmail: true,
      origin: "CONTACT_BYPASS",
      contextId: "event-1",
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/outreach/user-1",
      expect.objectContaining({
        method: "POST",
        token: "admin-tok",
        body: {
          message: "Message du Desk.",
          notifyByEmail: true,
          origin: "CONTACT_BYPASS",
          contextId: "event-1",
        },
      }),
    );
  });

  it("revalide l'inbox utilisateur après outreach", async () => {
    await sendAdminOutreach("user-1", "Message du Desk.");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/inbox");
  });
});

describe("KYC admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue([
      {
        id: "doc-1",
        type: "CV",
        label: "CV",
        filename: "cv.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        status: "PENDING",
        createdAt: "2026-04-23T09:00:00.000Z",
        user: {
          id: "free-1",
          name: "Aya Benali",
          email: "aya@test.fr",
          status: "PENDING",
        },
      },
    ]);
  });

  it("charge la file KYC via GET /admin/users/kyc/documents", async () => {
    const result = await getPendingKycDocuments();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/users/kyc/documents",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
    expect(result[0]!.label).toBe("CV");
  });

  it("envoie une review documentaire et revalide les écrans liés", async () => {
    mockApiRequest.mockResolvedValueOnce({ ok: true });

    await reviewUserDocument("doc-1", "REJECTED", "Document illisible");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/users/documents/doc-1/review",
      expect.objectContaining({
        method: "PATCH",
        token: "admin-tok",
        body: {
          status: "REJECTED",
          reviewReason: "Document illisible",
        },
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/kyc");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/account");
  });
});

describe("monitorContactBypassEvent (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({ ok: true });
  });

  it("appelle POST /admin/contact-bypass-events/:id/monitor", async () => {
    await monitorContactBypassEvent("event-1");

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/contact-bypass-events/event-1/monitor",
      expect.objectContaining({
        method: "POST",
        token: "admin-tok",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/contournements");
  });
});

// ─────────────────────────────────────────────
// Admin — respondToDeskRequest
// ─────────────────────────────────────────────

describe("respondToDeskRequest (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({});
  });

  it("appelle PATCH /admin/desk-requests/:id/respond avec la réponse", async () => {
    await respondToDeskRequest("dr-1", "Le public est composé d'adultes en situation de handicap.");
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/desk-requests/dr-1/respond",
      expect.objectContaining({
        method: "PATCH",
        body: { response: "Le public est composé d'adultes en situation de handicap." },
        token: "admin-tok",
      }),
    );
  });

  it("revalide /admin/demandes et /admin/incidents après réponse", async () => {
    await respondToDeskRequest("dr-1", "Réponse complète.");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/demandes");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/incidents");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
  });
});

// ─────────────────────────────────────────────
// Candidat — getMyDeskRequests
// ─────────────────────────────────────────────

describe("getMyDeskRequests (freelance)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockGetSession.mockResolvedValue({ token: "freelance-tok", user: { id: "u-1", role: "FREELANCE" } });
    mockApiRequest.mockResolvedValue([fakeDeskRequest]);
  });

  it("appelle GET /desk-requests/mine avec le token du candidat", async () => {
    await getMyDeskRequests();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/desk-requests/mine",
      expect.objectContaining({ method: "GET", token: "freelance-tok" }),
    );
  });

  it("utilise le token fourni sans relire la session", async () => {
    await getMyDeskRequests("direct-freelance-tok");
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/desk-requests/mine",
      expect.objectContaining({ method: "GET", token: "direct-freelance-tok" }),
    );
  });

  it("retourne uniquement les demandes du candidat connecté", async () => {
    const result = await getMyDeskRequests();
    expect(result).toHaveLength(1);
    expect(result[0]!.mission?.title).toBe("Infirmier urgences");
  });

  it("retourne un tableau vide si pas de session", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await getMyDeskRequests();
    expect(result).toEqual([]);
  });

  it("retourne un tableau vide si l'API échoue", async () => {
    mockApiRequest.mockRejectedValue(new Error("Forbidden"));
    const result = await getMyDeskRequests();
    expect(result).toEqual([]);
  });
});

describe("createUserDeskRequest (user)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "user-tok", user: { id: "u-1", role: "ESTABLISHMENT" } });
    mockApiRequest.mockResolvedValue({ id: "desk-new" });
  });

  it("crée un ticket Desk générique via POST /desk-requests", async () => {
    const result = await createUserDeskRequest("TECHNICAL_ISSUE", "Le chargement du KYC bloque.");

    expect(result).toEqual({ ok: true });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/desk-requests",
      expect.objectContaining({
        method: "POST",
        token: "user-tok",
        body: {
          type: "TECHNICAL_ISSUE",
          message: "Le chargement du KYC bloque.",
          bookingId: undefined,
          missionId: undefined,
        },
        label: "desk.create-user-request",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/demandes");
  });

  it("crée un ticket Desk opérationnel avec mission liée", async () => {
    const result = await createUserDeskRequest(
      "MISSION_PUBLISH_FAILURE",
      "Publication impossible depuis le formulaire renfort.",
      { missionId: "mission-1" },
    );

    expect(result).toEqual({ ok: true });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/desk-requests",
      expect.objectContaining({
        method: "POST",
        token: "user-tok",
        body: {
          type: "MISSION_PUBLISH_FAILURE",
          message: "Publication impossible depuis le formulaire renfort.",
          bookingId: undefined,
          missionId: "mission-1",
        },
      }),
    );
  });

  it("normalise les erreurs techniques de création Desk", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("FAIL"));

    const result = await createUserDeskRequest(
      "TECHNICAL_ISSUE",
      "Le bouton ne répond plus.",
    );

    expect(result).toEqual({
      ok: false,
      error: "Impossible d'envoyer votre demande pour le moment.",
    });
  });

  it("conserve les erreurs métier lisibles de création Desk", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Réservation liée introuvable"));

    const result = await createUserDeskRequest(
      "LITIGE",
      "Litige sur une réservation.",
      { bookingId: "booking-private" },
    );

    expect(result).toEqual({
      ok: false,
      error: "Réservation liée introuvable",
    });
  });
});

// ─────────────────────────────────────────────
// Admin — createFinanceIncident
// ─────────────────────────────────────────────

describe("createFinanceIncident (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockApiRequest.mockResolvedValue({ id: "incident-new" });
  });

  it("appelle POST /admin/desk-requests/finance avec le bon payload", async () => {
    await createFinanceIncident({
      type: "PAYMENT_ISSUE",
      priority: "HIGH",
      message: "Paiement bloqué depuis 5 jours.",
      requesterEmail: "direction@mecs.fr",
      bookingId: "booking-42",
    });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/desk-requests/finance",
      expect.objectContaining({
        method: "POST",
        token: "admin-tok",
        body: expect.objectContaining({
          type: "PAYMENT_ISSUE",
          requesterEmail: "direction@mecs.fr",
          bookingId: "booking-42",
        }),
      }),
    );
  });

  it("revalide /admin/incidents après création", async () => {
    await createFinanceIncident({
      type: "BOOKING_FAILURE",
      message: "La réservation n'a pas abouti.",
      requesterEmail: "user@test.fr",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/incidents");
  });

  it("retourne l'id de l'incident créé", async () => {
    const result = await createFinanceIncident({
      type: "PACK_PURCHASE_FAILURE",
      message: "L'achat de pack a échoué.",
      requesterEmail: "estab@test.fr",
    });
    expect(result).toEqual({ id: "incident-new" });
  });
});

// ─────────────────────────────────────────────
// Non-régression — flux Postuler
// ─────────────────────────────────────────────

describe("non-régression flux applyToMission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
    mockGetSession.mockResolvedValue({ token: "tok" });
    mockApiRequest.mockResolvedValue({});
  });

  it("appelle POST /missions/:id/apply — flux séparé de la demande info", async () => {
    const { applyToMission } = await import("@/app/actions/missions");
    await applyToMission("m-1", { motivation: "Motivé", proposedRate: 25 });
    const calls: string[] = mockApiRequest.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(calls).toContain("/missions/m-1/apply");
    expect(calls).not.toContain("/missions/m-1/info-request");
  });
});
