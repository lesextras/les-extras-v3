import { NotFoundException } from "@nestjs/common";
import {
  BookingStatus,
  PaymentStatus,
  QuoteStatus,
  ReliefMissionStatus,
  UserRole,
} from "@prisma/client";
import { AdminOffersService } from "./admin-offers.service";

describe("AdminOffersService", () => {
  const bookingsService = {
    confirmBooking: jest.fn(),
  };
  const prisma = {
    reliefMission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      updateMany: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    adminActionLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((queries: Array<Promise<unknown>>) => Promise.all(queries)),
  } as any;

  let service: AdminOffersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminOffersService(prisma, bookingsService as any);
  });

  it("journalise la suppression logique d'une mission", async () => {
    prisma.reliefMission.findUnique.mockResolvedValue({
      id: "mission-1",
      status: ReliefMissionStatus.OPEN,
    });
    prisma.reliefMission.update.mockResolvedValue({});
    prisma.booking.updateMany.mockResolvedValue({ count: 1 });
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(service.deleteMission("mission-1", "admin-1")).resolves.toEqual({ ok: true });

    expect(prisma.reliefMission.update).toHaveBeenCalledWith({
      where: { id: "mission-1" },
      data: { status: ReliefMissionStatus.CANCELLED },
    });
    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: {
        reliefMissionId: "mission-1",
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
      },
      data: { status: BookingStatus.CANCELLED },
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "MISSION",
        entityId: "mission-1",
        action: "MISSION_DELETE",
      }),
    });
  });

  it("retourne le détail d'une mission avec ses demandes Desk liées", async () => {
    prisma.reliefMission.findUnique.mockResolvedValue({
      id: "mission-1",
      title: "Mission de nuit",
      status: ReliefMissionStatus.OPEN,
      createdAt: new Date("2026-04-18T09:00:00.000Z"),
      updatedAt: new Date("2026-04-18T09:00:00.000Z"),
      address: "12 rue du Test, Paris",
      city: "Paris",
      shift: "NUIT",
      dateStart: new Date("2026-04-20T08:00:00.000Z"),
      dateEnd: new Date("2026-04-20T16:00:00.000Z"),
      hourlyRate: 28,
      establishmentId: "est-1",
      establishment: {
        id: "est-1",
        email: "est@example.com",
        profile: {
          companyName: "Clinique Test",
          firstName: "Luc",
          lastName: "Martin",
        },
      },
      bookings: [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          message: "Je suis disponible.",
          scheduledAt: new Date("2026-04-20T08:00:00.000Z"),
          proposedRate: 30,
          freelanceAcknowledged: false,
          createdAt: new Date("2026-04-18T10:00:00.000Z"),
          updatedAt: new Date("2026-04-18T10:00:00.000Z"),
          freelance: {
            id: "free-1",
            email: "free-1@test.fr",
            profile: { firstName: "Aya", lastName: "Benali" },
          },
          invoice: null,
          quotes: [],
          conversation: null,
        },
        {
          id: "booking-2",
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          message: "Confirmé côté établissement.",
          scheduledAt: new Date("2026-04-20T08:00:00.000Z"),
          proposedRate: 32,
          freelanceAcknowledged: false,
          createdAt: new Date("2026-04-18T11:00:00.000Z"),
          updatedAt: new Date("2026-04-19T09:30:00.000Z"),
          freelance: {
            id: "free-2",
            email: "free-2@test.fr",
            profile: { firstName: "Nora", lastName: "Diallo" },
          },
          invoice: {
            id: "inv-1",
            status: "UNPAID",
            amount: 320,
            invoiceNumber: "INV-001",
            createdAt: new Date("2026-04-19T09:35:00.000Z"),
            updatedAt: new Date("2026-04-19T09:35:00.000Z"),
          },
          quotes: [
            {
              id: "quote-1",
              status: QuoteStatus.ACCEPTED,
              totalTTC: 320,
              createdAt: new Date("2026-04-18T12:00:00.000Z"),
              acceptedAt: new Date("2026-04-18T13:00:00.000Z"),
              rejectedAt: null,
            },
          ],
          conversation: {
            id: "conv-1",
            createdAt: new Date("2026-04-19T09:40:00.000Z"),
            updatedAt: new Date("2026-04-19T10:00:00.000Z"),
            messages: [
              {
                id: "msg-1",
                type: "USER",
                content: "Je confirme ma disponibilité.",
                createdAt: new Date("2026-04-19T10:00:00.000Z"),
                sender: {
                  email: "free-2@test.fr",
                  profile: { firstName: "Nora", lastName: "Diallo", companyName: null },
                },
              },
            ],
          },
        },
      ],
      deskRequests: [
        {
          id: "desk-1",
          type: "MISSION_INFO_REQUEST",
          status: "OPEN",
          priority: "HIGH",
          createdAt: new Date("2026-04-18T10:00:00.000Z"),
          message: "Bonjour, je voudrais des informations complémentaires sur le rythme de nuit prévu sur cette mission.",
          requester: {
            id: "free-1",
            email: "free-1@test.fr",
            profile: { firstName: "Aya", lastName: "Benali", companyName: null },
          },
        },
      ],
    });

    await expect(service.getMissionById("mission-1")).resolves.toEqual({
      id: "mission-1",
      title: "Mission de nuit",
      status: ReliefMissionStatus.OPEN,
      createdAt: "2026-04-18T09:00:00.000Z",
      updatedAt: "2026-04-18T09:00:00.000Z",
      establishmentName: "Clinique Test",
      establishmentEmail: "est@example.com",
      establishmentId: "est-1",
      address: "12 rue du Test, Paris",
      city: "Paris",
      shift: "NUIT",
      dateStart: "2026-04-20T08:00:00.000Z",
      dateEnd: "2026-04-20T16:00:00.000Z",
      hourlyRate: 28,
      candidatesCount: 2,
      proposedTotalTTC: 320,
      attentionItems: [
        "Le freelance assigné n'a pas encore confirmé sa venue.",
        "1 ticket(s) Desk encore ouvert(s).",
      ],
      assignedFreelance: {
        id: "free-2",
        name: "Nora Diallo",
        email: "free-2@test.fr",
      },
      linkedBooking: expect.objectContaining({
        id: "booking-2",
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        assignedFreelance: {
          id: "free-2",
          name: "Nora Diallo",
          email: "free-2@test.fr",
        },
        conversation: expect.objectContaining({
          id: "conv-1",
          recentMessages: [
            expect.objectContaining({
              senderName: "Nora Diallo",
            }),
          ],
        }),
        invoice: expect.objectContaining({
          id: "inv-1",
          amount: 320,
        }),
      }),
      candidates: [
        expect.objectContaining({
          bookingId: "booking-1",
          canAssign: false,
        }),
        expect.objectContaining({
          bookingId: "booking-2",
          canAssign: false,
        }),
      ],
      timeline: expect.arrayContaining([
        expect.objectContaining({ type: "MISSION_CREATED" }),
        expect.objectContaining({ type: "CANDIDATE_RECEIVED" }),
        expect.objectContaining({ type: "MISSION_ASSIGNED" }),
        expect.objectContaining({ type: "DESK_REQUEST_OPENED" }),
      ]),
      linkedDeskRequests: [
        expect.objectContaining({
          id: "desk-1",
          type: "MISSION_INFO_REQUEST",
          status: "OPEN",
          priority: "HIGH",
          createdAt: "2026-04-18T10:00:00.000Z",
          requester: {
            id: "free-1",
            name: "Aya Benali",
            email: "free-1@test.fr",
          },
        }),
      ],
    });
  });

  it("arbitre une candidature pending sans casser le flux de confirmation existant", async () => {
    prisma.reliefMission.findUnique.mockResolvedValue({
      id: "mission-1",
      title: "Mission de nuit",
      status: ReliefMissionStatus.OPEN,
      establishmentId: "est-1",
      bookings: [
        { id: "booking-1", status: BookingStatus.PENDING },
        { id: "booking-2", status: BookingStatus.CANCELLED },
      ],
    });
    prisma.adminActionLog.create.mockResolvedValue({});
    bookingsService.confirmBooking.mockResolvedValue({ ok: true });

    await expect(service.reassignMission("mission-1", "booking-1", "admin-1")).resolves.toEqual({
      ok: true,
    });

    expect(bookingsService.confirmBooking).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        id: "est-1",
        role: UserRole.ESTABLISHMENT,
      }),
    );
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "MISSION",
        entityId: "mission-1",
        action: "MISSION_REASSIGN",
      }),
    });
  });

  it("toggle isFeatured et journalise l'action", async () => {
    prisma.service.findUnique.mockResolvedValue({
      id: "service-1",
      isFeatured: false,
    });
    prisma.service.update.mockResolvedValue({});
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(service.featureService("service-1", "admin-1")).resolves.toEqual({ ok: true });

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "service-1" },
      data: { isFeatured: true },
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "SERVICE",
        entityId: "service-1",
        action: "SERVICE_FEATURE",
        meta: {
          previousIsFeatured: false,
          nextIsFeatured: true,
        },
      }),
    });
  });

  it("retourne le détail d'un service", async () => {
    prisma.service.findUnique.mockResolvedValue({
      id: "service-1",
      title: "Atelier mémoire",
      type: "WORKSHOP",
      price: 140,
      isFeatured: true,
      isHidden: false,
      description: "Un atelier en petit groupe.",
      createdAt: new Date("2026-04-10T08:00:00.000Z"),
      owner: {
        email: "freelance@example.com",
        profile: {
          firstName: "Nora",
          lastName: "Diallo",
        },
      },
    });

    await expect(service.getServiceById("service-1")).resolves.toEqual({
      id: "service-1",
      title: "Atelier mémoire",
      type: "WORKSHOP",
      price: 140,
      freelanceName: "Nora Diallo",
      freelanceEmail: "freelance@example.com",
      isFeatured: true,
      isHidden: false,
      description: "Un atelier en petit groupe.",
      createdAt: "2026-04-10T08:00:00.000Z",
    });
  });

  it("toggle isHidden et journalise l'action", async () => {
    prisma.service.findUnique.mockResolvedValue({
      id: "service-1",
      isHidden: true,
    });
    prisma.service.update.mockResolvedValue({});
    prisma.adminActionLog.create.mockResolvedValue({});

    await expect(service.hideService("service-1", "admin-1")).resolves.toEqual({ ok: true });

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: "service-1" },
      data: { isHidden: false },
    });
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: "admin-1",
        entityType: "SERVICE",
        entityId: "service-1",
        action: "SERVICE_HIDE",
        meta: {
          previousIsHidden: true,
          nextIsHidden: false,
        },
      }),
    });
  });

  it("lève NotFoundException si le service à modérer n'existe pas", async () => {
    prisma.service.findUnique.mockResolvedValue(null);

    await expect(service.featureService("missing", "admin-1")).rejects.toThrow(NotFoundException);
  });
});
