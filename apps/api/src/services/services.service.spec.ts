import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { ServicesService } from "./services.service";

describe("ServicesService", () => {
  const prisma = {
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  } as any;

  const mailService = {
    sendWorkshopBookingEmail: jest.fn().mockResolvedValue(undefined),
  };

  let service: ServicesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServicesService(prisma, mailService as any);
  });

  describe("findAll", () => {
    it("retourne uniquement les services ACTIVE du catalogue", async () => {
      const activeServices = [
        { id: "service-active", title: "Atelier mémoire", status: "ACTIVE" },
      ];
      prisma.service.findMany.mockResolvedValue(activeServices);

      await expect(service.findAll()).resolves.toEqual(activeServices);

      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: {
          status: "ACTIVE",
          isHidden: false,
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          type: true,
          capacity: true,
          pricingType: true,
          pricePerParticipant: true,
          durationMinutes: true,
          category: true,
          publicCible: true,
          materials: true,
          objectives: true,
          methodology: true,
          evaluation: true,
          slots: true,
          imageUrl: true,
          scheduleInfo: true,
          owner: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  jobTitle: true,
                  bio: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("findOne", () => {
    it("retourne un service ACTIF pour tout utilisateur authentifié", async () => {
      const activeService = {
        id: "service-1",
        ownerId: "free-1",
        status: "ACTIVE",
        isHidden: false,
        owner: { profile: null },
      };

      prisma.service.findUnique.mockResolvedValue(activeService);

      await expect(service.findOne("service-1", "est-1")).resolves.toEqual({
        id: "service-1",
        owner: { profile: null },
      });
    });

    it("masque un brouillon à un utilisateur non propriétaire", async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: "service-1",
        ownerId: "free-1",
        status: "DRAFT",
        isHidden: false,
        owner: { profile: null },
      });

      await expect(service.findOne("service-1", "est-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("masque un service caché à un utilisateur non propriétaire", async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: "service-1",
        ownerId: "free-1",
        status: "ACTIVE",
        isHidden: true,
        owner: { profile: null },
      });

      await expect(service.findOne("service-1", "est-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("autorise le propriétaire à lire son brouillon", async () => {
      const draftService = {
        id: "service-1",
        ownerId: "free-1",
        status: "DRAFT",
        isHidden: false,
        owner: { profile: null },
      };

      prisma.service.findUnique.mockResolvedValue(draftService);

      await expect(service.findOne("service-1", "free-1")).resolves.toEqual({
        id: "service-1",
        owner: { profile: null },
      });
    });
  });

  describe("bookService", () => {
    const activeService = {
      id: "service-1",
      title: "Atelier mémoire",
      ownerId: "free-1",
      status: "ACTIVE",
      capacity: 10,
      type: "WORKSHOP",
    };

    it("crée une réservation valide", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue(activeService);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.create.mockResolvedValue({ id: "booking-1" });
      prisma.user.findUnique.mockResolvedValue({ email: "est@example.com" });

      await service.bookService("service-1", "est-1", scheduledAt, "Besoin urgent", 4);

      expect(prisma.booking.findFirst).toHaveBeenCalledWith({
        where: {
          serviceId: "service-1",
          establishmentId: "est-1",
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.QUOTE_SENT,
              BookingStatus.QUOTE_ACCEPTED,
              BookingStatus.CONFIRMED,
              BookingStatus.IN_PROGRESS,
            ],
          },
        },
        select: { id: true },
      });
      expect(prisma.booking.create).toHaveBeenCalledWith({
        data: {
          status: BookingStatus.PENDING,
          establishmentId: "est-1",
          freelanceId: "free-1",
          serviceId: "service-1",
          scheduledAt,
          message: "Besoin urgent",
          nbParticipants: 4,
        },
      });
      expect(mailService.sendWorkshopBookingEmail).toHaveBeenCalled();
    });

    it("autorise aussi un freelance à réserver une formation", async () => {
      const scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue({
        ...activeService,
        id: "service-2",
        title: "Formation Snoezelen",
        type: "TRAINING",
      });
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.create.mockResolvedValue({ id: "booking-2" });
      prisma.user.findUnique.mockResolvedValue({ email: "freelance@example.com" });

      await service.bookService("service-2", "free-2", scheduledAt, "Je réserve pour mon équipe", 3);

      expect(prisma.booking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          establishmentId: "free-2",
          freelanceId: "free-1",
          serviceId: "service-2",
          nbParticipants: 3,
        }),
      });
    });

    it("rejette un doublon actif", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue(activeService);
      prisma.booking.findFirst.mockResolvedValue({ id: "booking-existing" });

      await expect(
        service.bookService("service-1", "est-1", scheduledAt, undefined, 2),
      ).rejects.toThrow(ConflictException);
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it("rejette une réservation au-delà de la capacité", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue(activeService);

      await expect(
        service.bookService("service-1", "est-1", scheduledAt, undefined, 11),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.booking.findFirst).not.toHaveBeenCalled();
    });

    it("rejette une demande qui dépasse la capacité cumulée sur la même date", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue(activeService);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.findMany.mockResolvedValue([{ nbParticipants: 8 }]);

      await expect(
        service.bookService("service-1", "est-2", scheduledAt, undefined, 3),
      ).rejects.toThrow("La capacité disponible est insuffisante pour cette date.");
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it("accepte une demande qui atteint exactement la capacité cumulée", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue(activeService);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.findMany.mockResolvedValue([{ nbParticipants: 7 }]);
      prisma.booking.create.mockResolvedValue({ id: "booking-1" });
      prisma.user.findUnique.mockResolvedValue({ email: "est@example.com" });

      await expect(
        service.bookService("service-1", "est-2", scheduledAt, undefined, 3),
      ).resolves.toEqual({ id: "booking-1" });
      expect(prisma.booking.create).toHaveBeenCalled();
    });

    it("ne compte pas les réservations CANCELLED dans la capacité cumulée", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue(activeService);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.create.mockResolvedValue({ id: "booking-1" });
      prisma.user.findUnique.mockResolvedValue({ email: "est@example.com" });

      await service.bookService("service-1", "est-2", scheduledAt, undefined, 3);

      const findManyCall = prisma.booking.findMany.mock.calls[0][0];
      expect(findManyCall.where.status.in).not.toContain(BookingStatus.CANCELLED);
      expect(prisma.booking.create).toHaveBeenCalled();
    });

    it("ne compte pas les réservations d’une autre date dans la capacité cumulée", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const expectedStart = new Date(scheduledAt);
      expectedStart.setUTCHours(0, 0, 0, 0);
      const expectedEnd = new Date(expectedStart);
      expectedEnd.setUTCDate(expectedEnd.getUTCDate() + 1);

      prisma.service.findUnique.mockResolvedValue(activeService);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.create.mockResolvedValue({ id: "booking-1" });
      prisma.user.findUnique.mockResolvedValue({ email: "est@example.com" });

      await service.bookService("service-1", "est-2", scheduledAt, undefined, 3);

      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          serviceId: "service-1",
          scheduledAt: {
            gte: expectedStart,
            lt: expectedEnd,
          },
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.QUOTE_SENT,
              BookingStatus.QUOTE_ACCEPTED,
              BookingStatus.CONFIRMED,
              BookingStatus.IN_PROGRESS,
            ],
          },
        },
        select: { nbParticipants: true },
      });
      expect(prisma.booking.create).toHaveBeenCalled();
    });

    it("rejette une date passée", async () => {
      prisma.service.findUnique.mockResolvedValue(activeService);

      await expect(
        service.bookService("service-1", "est-1", new Date(Date.now() - 60 * 1000), undefined, 2),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.booking.findFirst).not.toHaveBeenCalled();
    });

    it("rejette une date invalide avec un message explicite", async () => {
      prisma.service.findUnique.mockResolvedValue(activeService);

      await expect(
        service.bookService("service-1", "est-1", new Date("bad-date"), undefined, 2),
      ).rejects.toThrow("La date de réservation est invalide.");
      expect(prisma.booking.findFirst).not.toHaveBeenCalled();
    });

    it("rejette un brouillon même pour une formation", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue({
        ...activeService,
        status: "DRAFT",
        type: "TRAINING",
      });

      await expect(
        service.bookService("service-1", "free-2", scheduledAt, undefined, 2),
      ).rejects.toThrow("Ce service n'est plus disponible à la réservation.");
      expect(prisma.booking.findFirst).not.toHaveBeenCalled();
    });

    it("interdit au propriétaire de réserver son propre service", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      prisma.service.findUnique.mockResolvedValue(activeService);

      await expect(
        service.bookService("service-1", "free-1", scheduledAt, undefined, 2),
      ).rejects.toThrow("Vous ne pouvez pas réserver votre propre service.");
      expect(prisma.booking.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("duplicateService", () => {
    const sourceService = {
      ownerId: "free-1",
      title: "Atelier mémoire",
      description: "Description",
      price: 150,
      capacity: 8,
      durationMinutes: 90,
      category: "COMMUNICATION",
      type: "WORKSHOP",
      pricingType: "SESSION",
      publicCible: [],
      slots: null,
      pricePerParticipant: null,
      materials: null,
      objectives: null,
      methodology: null,
      evaluation: null,
      imageUrl: null,
      scheduleInfo: null,
    };

    it("crée une copie DRAFT avec un titre préfixé", async () => {
      prisma.service.findUnique.mockResolvedValue(sourceService);
      prisma.service.create.mockResolvedValue({ id: "copy-1", title: "Copie de Atelier mémoire", status: "DRAFT" });

      const result = await service.duplicateService("service-1", "free-1");

      expect(prisma.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Copie de Atelier mémoire",
          status: "DRAFT",
          ownerId: "free-1",
        }),
      });
      expect(result).toMatchObject({ status: "DRAFT" });
    });

    it("lève NotFoundException si le service n'existe pas", async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.duplicateService("service-x", "free-1")).rejects.toThrow(NotFoundException);
    });

    it("lève ForbiddenException si l'appelant n'est pas le propriétaire", async () => {
      prisma.service.findUnique.mockResolvedValue(sourceService);

      await expect(service.duplicateService("service-1", "other-user")).rejects.toThrow(ForbiddenException);
      expect(prisma.service.create).not.toHaveBeenCalled();
    });
  });
});
