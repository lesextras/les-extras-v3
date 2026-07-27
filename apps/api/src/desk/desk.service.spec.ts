import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DeskRequestStatus, UserRole } from "@prisma/client";
import { DeskService } from "./desk.service";

describe("DeskService", () => {
  const prisma = {
    deskRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    contactBypassEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
    },
    reliefMission: {
      findFirst: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    adminActionLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((queriesOrFn: unknown) => {
      if (typeof queriesOrFn === "function") {
        // callback form — pass prisma as the transaction client
        return (queriesOrFn as (tx: unknown) => Promise<unknown>)(prisma);
      }
      // array form
      return Promise.all(queriesOrFn as Array<Promise<unknown>>);
    }),
  } as any;

  const mailService = {
    sendAdminOutreachEmail: jest.fn().mockResolvedValue(undefined),
  };

  let service: DeskService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DeskService(prisma, mailService as any);
  });

  // ─── updateStatus ──────────────────────────────────────────────────────────

  it("met à jour le statut et journalise l'action", async () => {
    prisma.deskRequest.findUnique.mockResolvedValue({
      id: "desk-1",
      status: DeskRequestStatus.OPEN,
    });
    prisma.deskRequest.update.mockResolvedValue({
      id: "desk-1",
      status: DeskRequestStatus.IN_PROGRESS,
    });
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(
      service.updateStatus("desk-1", "admin-1", { status: DeskRequestStatus.IN_PROGRESS }),
    ).resolves.toMatchObject({ status: DeskRequestStatus.IN_PROGRESS });

    expect(prisma.deskRequest.update).toHaveBeenCalledWith({
      where: { id: "desk-1" },
      data: { status: DeskRequestStatus.IN_PROGRESS },
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "DESK_REQUEST",
        entityId: "desk-1",
        action: "DESK_REQUEST_STATUS_UPDATE",
        meta: {
          previousStatus: DeskRequestStatus.OPEN,
          nextStatus: DeskRequestStatus.IN_PROGRESS,
        },
      }),
    });
  });

  // ─── assign ────────────────────────────────────────────────────────────────

  it("assigne une demande à un admin et journalise l'action", async () => {
    prisma.deskRequest.findUnique.mockResolvedValue({
      id: "desk-1",
      assignedToAdminId: null,
    });
    prisma.user.findFirst.mockResolvedValue({ id: "admin-2" });
    prisma.deskRequest.update.mockResolvedValue({
      id: "desk-1",
      assignedToAdminId: "admin-2",
    });
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(service.assign("desk-1", "admin-1", { adminId: "admin-2" })).resolves.toMatchObject({
      assignedToAdminId: "admin-2",
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: "admin-2", role: UserRole.ADMIN },
      select: { id: true },
    });
    expect(prisma.deskRequest.update).toHaveBeenCalledWith({
      where: { id: "desk-1" },
      data: { assignedToAdminId: "admin-2" },
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "DESK_REQUEST_ASSIGN",
        meta: {
          previousAssignedToAdminId: null,
          nextAssignedToAdminId: "admin-2",
        },
      }),
    });
  });

  // ─── respond ───────────────────────────────────────────────────────────────

  it("répond à une demande mission, notifie le candidat et journalise l'action", async () => {
    prisma.deskRequest.findUnique.mockResolvedValue({
      id: "desk-1",
      requesterId: "free-1",
      missionId: "mission-1",
      type: "MISSION_INFO_REQUEST",
      status: DeskRequestStatus.IN_PROGRESS,
      response: null,
      mission: { title: "Mission de nuit" },
    });
    prisma.deskRequest.update.mockResolvedValue({
      id: "desk-1",
      status: DeskRequestStatus.ANSWERED,
    });
    prisma.notification.create.mockResolvedValue({});
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(
      service.respond("desk-1", "admin-1", { response: "Réponse complète." }),
    ).resolves.toMatchObject({ status: DeskRequestStatus.ANSWERED });

    expect(prisma.deskRequest.update).toHaveBeenCalledWith({
      where: { id: "desk-1" },
      data: {
        response: "Réponse complète.",
        answeredById: "admin-1",
        answeredAt: expect.any(Date),
        status: DeskRequestStatus.ANSWERED,
      },
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "free-1",
        type: "INFO",
        message: expect.stringContaining("Mission de nuit"),
      }),
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "DESK_REQUEST",
        entityId: "desk-1",
        action: "DESK_REQUEST_RESPOND",
        meta: {
          previousStatus: DeskRequestStatus.IN_PROGRESS,
          nextStatus: DeskRequestStatus.ANSWERED,
          hadExistingResponse: false,
        },
      }),
    });
  });

  it("répond à un incident finance (mission null) et utilise un label générique", async () => {
    prisma.deskRequest.findUnique.mockResolvedValue({
      id: "desk-2",
      requesterId: "estab-1",
      missionId: null,
      type: "PAYMENT_ISSUE",
      status: DeskRequestStatus.OPEN,
      response: null,
      mission: null,
    });
    prisma.deskRequest.update.mockResolvedValue({
      id: "desk-2",
      status: DeskRequestStatus.ANSWERED,
    });
    prisma.notification.create.mockResolvedValue({});
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(
      service.respond("desk-2", "admin-1", { response: "Paiement régularisé." }),
    ).resolves.toMatchObject({ status: DeskRequestStatus.ANSWERED });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "estab-1",
        message: expect.stringContaining("incident de paiement"),
      }),
    });
  });

  // ─── NotFoundException ──────────────────────────────────────────────────────

  it("lève NotFoundException si la demande n'existe pas", async () => {
    prisma.deskRequest.findUnique.mockResolvedValue(null);

    await expect(
      service.updateStatus("missing", "admin-1", { status: DeskRequestStatus.CLOSED }),
    ).rejects.toThrow(NotFoundException);
  });

  // ─── findContactBypassEvents ────────────────────────────────────────────────

  it("crée une demande utilisateur générique et la rattache au requérant", async () => {
    prisma.deskRequest.create.mockResolvedValue({
      id: "desk-generic-1",
      type: "TECHNICAL_ISSUE",
      requesterId: "free-1",
    });

    await expect(
      service.createUserRequest("free-1", {
        type: "TECHNICAL_ISSUE",
        message: "Impossible de déposer mon document KYC.",
      }),
    ).resolves.toMatchObject({
      id: "desk-generic-1",
      type: "TECHNICAL_ISSUE",
    });

    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
    expect(prisma.deskRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "TECHNICAL_ISSUE",
        requesterId: "free-1",
        bookingId: null,
        missionId: null,
        priority: "NORMAL",
        status: "OPEN",
        message: "Impossible de déposer mon document KYC.",
      }),
    });
  });

  it("autorise un incident utilisateur opérationnel sans exposer PAYMENT_ISSUE", async () => {
    prisma.deskRequest.create.mockResolvedValue({
      id: "desk-publish-failure-1",
      type: "MISSION_PUBLISH_FAILURE",
    });

    await expect(
      service.createUserRequest("est-1", {
        type: "MISSION_PUBLISH_FAILURE",
        message: "La publication du renfort a échoué.",
      }),
    ).resolves.toMatchObject({
      id: "desk-publish-failure-1",
      type: "MISSION_PUBLISH_FAILURE",
    });

    await expect(
      service.createUserRequest("est-1", {
        type: "PAYMENT_ISSUE",
        message: "Paiement bloqué.",
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("vérifie qu'une mission liée est accessible au requérant", async () => {
    prisma.reliefMission.findFirst.mockResolvedValue({ id: "mission-1" });
    prisma.deskRequest.create.mockResolvedValue({
      id: "desk-mission-1",
      type: "MISSION_INFO_REQUEST",
    });

    await expect(
      service.createUserRequest("free-1", {
        type: "MISSION_INFO_REQUEST",
        message: "Pouvez-vous préciser le contexte ?",
        missionId: "mission-1",
      }),
    ).resolves.toMatchObject({ id: "desk-mission-1" });

    expect(prisma.reliefMission.findFirst).toHaveBeenCalledWith({
      where: {
        id: "mission-1",
        OR: [
          { establishmentId: "free-1" },
          { status: "OPEN" },
          {
            bookings: {
              some: {
                OR: [
                  { establishmentId: "free-1" },
                  { freelanceId: "free-1" },
                ],
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    expect(prisma.deskRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requesterId: "free-1",
        missionId: "mission-1",
        status: "OPEN",
      }),
    });
  });

  it("refuse une mission liée hors périmètre utilisateur", async () => {
    prisma.reliefMission.findFirst.mockResolvedValue(null);

    await expect(
      service.createUserRequest("free-1", {
        type: "MISSION_INFO_REQUEST",
        message: "Demande liée à une mission privée.",
        missionId: "mission-private",
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.deskRequest.create).not.toHaveBeenCalled();
  });

  it("vérifie qu'une réservation liée appartient au requérant", async () => {
    prisma.booking.findFirst.mockResolvedValue({ id: "booking-1" });
    prisma.deskRequest.create.mockResolvedValue({ id: "desk-litige-1", type: "LITIGE" });

    await expect(
      service.createUserRequest("est-1", {
        type: "LITIGE",
        message: "Je souhaite ouvrir un litige sur cette réservation.",
        bookingId: "booking-1",
      }),
    ).resolves.toMatchObject({ id: "desk-litige-1" });

    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: "booking-1",
        OR: [
          { establishmentId: "est-1" },
          { freelanceId: "est-1" },
          { service: { ownerId: "est-1" } },
        ],
      },
      select: { id: true },
    });
  });

  it("refuse une réservation liée hors périmètre utilisateur", async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(
      service.createUserRequest("free-1", {
        type: "USER_REPORT",
        message: "Signalement lié à une réservation.",
        bookingId: "booking-private",
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.deskRequest.create).not.toHaveBeenCalled();
  });

  it("retourne les événements de contournement avec le résumé expéditeur", async () => {
    prisma.contactBypassEvent.findMany.mockResolvedValue([
      {
        id: "event-1",
        conversationId: "conv-1",
        conversation: { bookingId: "booking-1" },
        blockedReason: "EMAIL",
        rawExcerpt: "jo@example.com",
        createdAt: new Date("2026-04-23T09:00:00.000Z"),
        sender: {
          id: "user-1",
          email: "sender@example.com",
          role: "FREELANCE",
          status: "VERIFIED",
          profile: { firstName: "Aya", lastName: "Benali" },
        },
      },
    ]);

    await expect(service.findContactBypassEvents()).resolves.toEqual([
      {
        id: "event-1",
        conversationId: "conv-1",
        bookingId: "booking-1",
        blockedReason: "EMAIL",
        rawExcerpt: "jo@example.com",
        createdAt: "2026-04-23T09:00:00.000Z",
        sender: {
          id: "user-1",
          email: "sender@example.com",
          name: "Aya Benali",
          role: "FREELANCE",
          status: "VERIFIED",
        },
      },
    ]);
  });

  // ─── sendAdminOutreach ──────────────────────────────────────────────────────

  it("envoie un outreach Desk, notifie le user et journalise l'action", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "aya@example.com",
      role: "FREELANCE",
      status: "VERIFIED",
      profile: { firstName: "Aya", lastName: "Benali" },
    });
    prisma.notification.create.mockResolvedValue({});
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(
      service.sendAdminOutreach("user-1", "admin-1", {
        message: "Merci de passer par la plateforme.",
        origin: "CONTACT_BYPASS",
        contextId: "event-1",
      }),
    ).resolves.toEqual({ ok: true });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "INFO",
        message: "Message du Desk : Merci de passer par la plateforme.",
      },
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "USER",
        entityId: "user-1",
        action: "USER_OUTREACH_SEND",
      }),
    });
    expect(mailService.sendAdminOutreachEmail).toHaveBeenCalledWith(
      "aya@example.com",
      "Aya Benali",
      "Merci de passer par la plateforme.",
    );
  });

  it("refuse un outreach Desk vers un admin", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "admin-2",
      email: "admin2@example.com",
      role: "ADMIN",
      status: "VERIFIED",
      profile: null,
    });

    await expect(
      service.sendAdminOutreach("admin-2", "admin-1", { message: "Test outreach" }),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── monitorContactBypassEvent ─────────────────────────────────────────────

  it("journalise la mise sous surveillance d'un contournement", async () => {
    prisma.contactBypassEvent.findUnique.mockResolvedValue({
      id: "event-1",
      senderId: "user-1",
      blockedReason: "EMAIL",
      conversationId: "conv-1",
    });
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(service.monitorContactBypassEvent("event-1", "admin-1")).resolves.toEqual({
      ok: true,
    });

    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: {
        adminId: "admin-1",
        entityType: "CONTACT_BYPASS_EVENT",
        entityId: "event-1",
        action: "CONTACT_BYPASS_MONITOR",
        meta: {
          senderId: "user-1",
          blockedReason: "EMAIL",
          conversationId: "conv-1",
        },
      },
    });
  });

  // ─── createFinanceIncident ─────────────────────────────────────────────────

  it("crée un incident finance et journalise l'action admin", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "estab-1",
      role: "ESTABLISHMENT",
      email: "direction@mecs.fr",
    });
    prisma.booking.findFirst.mockResolvedValue({ id: "booking-42" });
    prisma.deskRequest.create.mockResolvedValue({
      id: "incident-1",
      type: "PAYMENT_ISSUE",
      priority: "HIGH",
    });
    prisma.adminActionLog.create.mockResolvedValue({});

    const result = await service.createFinanceIncident("admin-1", {
      type: "PAYMENT_ISSUE",
      priority: "HIGH",
      message: "L'établissement signale un paiement bloqué depuis 5 jours.",
      requesterEmail: "direction@mecs.fr",
      bookingId: "booking-42",
    });

    expect(result).toMatchObject({ id: "incident-1", type: "PAYMENT_ISSUE" });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: "direction@mecs.fr" },
      select: { id: true, role: true, email: true },
    });
    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: "booking-42",
        OR: [
          { establishmentId: "estab-1" },
          { freelanceId: "estab-1" },
          { service: { ownerId: "estab-1" } },
        ],
      },
      select: { id: true },
    });
    expect(prisma.deskRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "PAYMENT_ISSUE",
        priority: "HIGH",
        requesterId: "estab-1",
        bookingId: "booking-42",
      }),
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "DESK_REQUEST",
        entityId: "incident-1",
        action: "FINANCE_INCIDENT_CREATE",
        meta: expect.objectContaining({
          type: "PAYMENT_ISSUE",
          bookingId: "booking-42",
        }),
      }),
    });
  });

  it("crée un incident finance sans bookingId", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "free-1",
      role: "FREELANCE",
      email: "karim@test.fr",
    });
    prisma.deskRequest.create.mockResolvedValue({ id: "incident-2", type: "PACK_PURCHASE_FAILURE" });
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(
      service.createFinanceIncident("admin-1", {
        type: "PACK_PURCHASE_FAILURE",
        message: "L'achat de pack n'a pas abouti.",
        requesterEmail: "karim@test.fr",
      }),
    ).resolves.toMatchObject({ id: "incident-2" });

    expect(prisma.deskRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ bookingId: null }),
    });
    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
  });

  it("refuse de créer un incident finance avec une réservation hors périmètre", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "estab-1",
      role: "ESTABLISHMENT",
      email: "direction@mecs.fr",
    });
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(
      service.createFinanceIncident("admin-1", {
        type: "BOOKING_FAILURE",
        message: "Incident lié à une réservation étrangère.",
        requesterEmail: "direction@mecs.fr",
        bookingId: "booking-private",
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: "booking-private",
        OR: [
          { establishmentId: "estab-1" },
          { freelanceId: "estab-1" },
          { service: { ownerId: "estab-1" } },
        ],
      },
      select: { id: true },
    });
    expect(prisma.deskRequest.create).not.toHaveBeenCalled();
  });

  it("refuse de créer un incident finance si le type est MISSION_INFO_REQUEST", async () => {
    await expect(
      service.createFinanceIncident("admin-1", {
        type: "MISSION_INFO_REQUEST",
        message: "Test invalide.",
        requesterEmail: "user@test.fr",
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("refuse de créer un incident si l'utilisateur est introuvable", async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.createFinanceIncident("admin-1", {
        type: "BOOKING_FAILURE",
        message: "Réservation échouée.",
        requesterEmail: "inconnu@test.fr",
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("refuse de créer un incident si le requérant est un admin", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "admin-2",
      role: "ADMIN",
      email: "admin2@lesextras.local",
    });

    await expect(
      service.createFinanceIncident("admin-1", {
        type: "PAYMENT_ISSUE",
        message: "Test interdit.",
        requesterEmail: "admin2@lesextras.local",
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
