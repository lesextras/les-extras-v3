import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { ConversationsService } from '../conversations/conversations.service';
import { BookingStatus, ReliefMissionStatus, UserRole, UserStatus } from '@prisma/client';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;
  let notifications: NotificationsService;
  let mailService: MailService;

  const mockPrisma = {
    booking: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    conversation: {
      updateMany: jest.fn(),
    },
    reliefMission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    invoice: {
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((run: any) => {
      if (Array.isArray(run)) {
        return Promise.all(run);
      }
      return run(mockPrisma);
    }),
  } as any;

  const mockNotifications = {
    create: jest.fn(),
  };

  const mockMail = {
    sendMissionConfirmedEmail: jest.fn().mockResolvedValue(undefined),
    sendMissionCompletedEmail: jest.fn().mockResolvedValue(undefined),
    sendCandidatureDeclinedEmail: jest.fn().mockResolvedValue(undefined),
    sendReviewInvitationEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockConversations = {
    getOrCreateConversation: jest.fn().mockResolvedValue({ id: 'conv-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: MailService, useValue: mockMail },
        { provide: ConversationsService, useValue: mockConversations },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
    notifications = module.get<NotificationsService>(NotificationsService);
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();
  });

  describe('claimOpenMissionForFreelance', () => {
    const mission = {
      id: 'mission-1',
      title: 'Mission Test',
      establishmentId: 'est-1',
      dateStart: new Date('2026-03-20T08:00:00Z'),
      dateEnd: new Date('2026-03-20T16:00:00Z'),
      hourlyRate: 25,
      slots: null,
      establishment: { role: UserRole.ESTABLISHMENT },
    };

    const confirmedBooking = {
      id: 'booking-claim-1',
      status: BookingStatus.CONFIRMED,
      establishmentId: 'est-1',
      freelanceId: 'free-1',
      reliefMissionId: 'mission-1',
      serviceId: null,
      scheduledAt: mission.dateStart,
      message: 'Disponible',
      proposedRate: 25,
      paymentStatus: 'PENDING',
      nbParticipants: null,
      freelanceAcknowledged: false,
      createdAt: new Date('2026-03-01T09:00:00Z'),
      updatedAt: new Date('2026-03-01T09:00:00Z'),
    };

    it('attribue une mission OPEN au premier freelance et crée un booking CONFIRMED avec facture à 10 %', async () => {
      mockPrisma.reliefMission.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.reliefMission.findUnique.mockResolvedValue(mission);
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.booking.create.mockResolvedValue(confirmedBooking);
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'invoice-claim-1' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'free-1', email: 'free@test.com', profile: { firstName: 'Karim' } })
        .mockResolvedValueOnce({ id: 'est-1', email: 'est@test.com', profile: { companyName: 'Clinique Test' } });
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const result = await service.claimOpenMissionForFreelance('mission-1', 'free-1', {
        motivation: 'Disponible',
        proposedRate: 25,
      });

      expect(mockPrisma.reliefMission.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'mission-1',
          status: ReliefMissionStatus.OPEN,
        },
        data: {
          status: ReliefMissionStatus.ASSIGNED,
        },
      });
      expect(mockPrisma.booking.create).toHaveBeenCalledWith({
        data: {
          status: BookingStatus.CONFIRMED,
          establishmentId: 'est-1',
          freelanceId: 'free-1',
          reliefMissionId: 'mission-1',
          scheduledAt: mission.dateStart,
          message: 'Disponible',
          proposedRate: 25,
        },
      });
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-claim-1',
            amount: 220,
            status: 'UNPAID',
          }),
        }),
      );
      expect(mockConversations.getOrCreateConversation).toHaveBeenCalledWith('free-1', 'est-1');
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'free-1', type: 'SUCCESS' }),
      );
      expect(result).toMatchObject({
        id: 'booking-claim-1',
        status: BookingStatus.CONFIRMED,
        reliefMissionId: 'mission-1',
      });
      expect(result).not.toHaveProperty('reliefMission');
    });

    it("n'annule pas la prise de mission si les effets secondaires échouent", async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockPrisma.reliefMission.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.reliefMission.findUnique.mockResolvedValue(mission);
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.booking.create.mockResolvedValue(confirmedBooking);
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'invoice-claim-1' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'free-1', email: 'free@test.com', profile: { firstName: 'Karim' } })
        .mockResolvedValueOnce({ id: 'est-1', email: 'est@test.com', profile: { companyName: 'Clinique Test' } });
      mockNotifications.create.mockRejectedValueOnce(new Error('Notification down'));

      await expect(
        service.claimOpenMissionForFreelance('mission-1', 'free-1', {
          motivation: 'Disponible',
          proposedRate: 25,
        }),
      ).resolves.toMatchObject({
        id: 'booking-claim-1',
        status: BookingStatus.CONFIRMED,
        reliefMissionId: 'mission-1',
      });

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-claim-1',
            amount: 220,
          }),
        }),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'runMissionConfirmationSideEffects failed',
        expect.objectContaining({
          bookingId: 'booking-claim-1',
          reliefMissionId: 'mission-1',
          error: 'Notification down',
        }),
      );
      consoleSpy.mockRestore();
    });

    it('ne laisse gagner qu’un freelance quand deux candidatures arrivent ensemble', async () => {
      mockPrisma.reliefMission.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      mockPrisma.reliefMission.findUnique
        .mockResolvedValueOnce(mission)
        .mockResolvedValueOnce({ id: 'mission-1' });
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.booking.create.mockResolvedValue(confirmedBooking);
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'invoice-claim-1' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'free-1', email: 'free@test.com', profile: { firstName: 'Karim' } })
        .mockResolvedValueOnce({ id: 'est-1', email: 'est@test.com', profile: { companyName: 'Clinique Test' } });
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const results = await Promise.allSettled([
        service.claimOpenMissionForFreelance('mission-1', 'free-1'),
        service.claimOpenMissionForFreelance('mission-1', 'free-2'),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[1]).toMatchObject({
        reason: expect.objectContaining({
          message: 'Cette mission est déjà prise.',
        }),
      });
      expect(mockPrisma.booking.create).toHaveBeenCalledTimes(1);
    });

    it('refuse une mission existante mais déjà prise', async () => {
      mockPrisma.reliefMission.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.reliefMission.findUnique.mockResolvedValue({ id: 'mission-1' });

      await expect(
        service.claimOpenMissionForFreelance('mission-1', 'free-2'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.claimOpenMissionForFreelance('mission-1', 'free-2'),
      ).rejects.toThrow('Cette mission est déjà prise.');
      expect(mockPrisma.booking.create).not.toHaveBeenCalled();
    });

    it('retourne une erreur claire si la mission n’existe pas', async () => {
      mockPrisma.reliefMission.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.reliefMission.findUnique.mockResolvedValue(null);

      await expect(
        service.claimOpenMissionForFreelance('mission-404', 'free-2'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.claimOpenMissionForFreelance('mission-404', 'free-2'),
      ).rejects.toThrow('Mission introuvable');
      expect(mockPrisma.booking.create).not.toHaveBeenCalled();
    });
  });

  describe('completeBooking', () => {
    it('should complete a confirmed booking without creating a new invoice and notify both parties', async () => {
      const user = { id: 'est-1', email: 'est@est.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };
      const booking = {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        establishmentId: 'est-1',
        freelanceId: 'free-1',
        reliefMissionId: 'mission-1',
        reliefMission: { 
          establishmentId: 'est-1',
          title: 'Mission Test',
          dateStart: new Date('2026-03-20T08:00:00Z'),
          dateEnd: new Date('2026-03-22T12:00:00Z'),
          hourlyRate: 25,
          slots: [
            {
              dateStart: '2026-03-20',
              heureDebut: '08:00',
              dateEnd: '2026-03-20',
              heureFin: '12:00',
            },
            {
              dateStart: '2026-03-22',
              heureDebut: '08:00',
              dateEnd: '2026-03-22',
              heureFin: '12:00',
            },
          ],
        },
        invoice: null,
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: BookingStatus.COMPLETED });
      mockPrisma.reliefMission.update.mockResolvedValue({ id: 'mission-1', status: ReliefMissionStatus.COMPLETED });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'free-1', email: 'free@test.com' });

      await service.completeBooking('booking-1', user);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
      // Should notify both freelance and establishment
      expect(mockNotifications.create).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequest if booking is not CONFIRMED', async () => {
      const user = { id: 'est-1', email: 'est@est.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };
      const booking = {
        id: 'booking-1',
        status: BookingStatus.PENDING,
        reliefMission: { establishmentId: 'est-1' },
        invoice: null,
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(service.completeBooking('booking-1', user)).rejects.toThrow(BadRequestException);
    });

    it('should throw Forbidden if user is not the establishment owner', async () => {
      const user = { id: 'other-user', email: 'other@est.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };
      const booking = {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        establishmentId: 'est-1',
        reliefMission: { establishmentId: 'est-1' },
        invoice: null,
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(service.completeBooking('booking-1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markPaymentSettled', () => {
    it('should mark a completed booking as PAID and update invoice', async () => {
      const user = { id: 'est-1', email: 'est@est.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };
      const booking = {
        id: 'booking-1',
        status: BookingStatus.COMPLETED,
        establishmentId: 'est-1',
        freelanceId: 'free-1',
        invoice: { id: 'inv-1', status: 'UNPAID' },
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue({ ...booking, paymentStatus: 'PAID' });
      mockPrisma.invoice.update.mockResolvedValue({ id: 'inv-1', status: 'PAID' });

      await service.markPaymentSettled('booking-1', user);

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { paymentStatus: 'PAID', status: 'PAID' },
      });
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'PAID' },
      });
      expect(mockNotifications.create).toHaveBeenCalled();
    });

    it('should throw Forbidden if user is not the establishment', async () => {
      const user = { id: 'free-1', email: 'free@est.com', role: UserRole.FREELANCE, status: UserStatus.VERIFIED, onboardingStep: 4 };
      const booking = {
        id: 'booking-1',
        status: BookingStatus.COMPLETED,
        establishmentId: 'est-1',
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(service.markPaymentSettled('booking-1', user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequest if booking is not COMPLETED', async () => {
      const user = { id: 'est-1', email: 'est@est.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };
      const booking = {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED, // Not completed yet
        establishmentId: 'est-1',
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(service.markPaymentSettled('booking-1', user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acknowledgeBooking', () => {
    const freelanceUser = { id: 'free-1', email: 'free@test.com', role: UserRole.FREELANCE, status: UserStatus.VERIFIED, onboardingStep: 4 };
    const estUser = { id: 'est-1', email: 'est@test.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };

    it('should acknowledge a confirmed booking', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        freelanceId: 'free-1',
        freelanceAcknowledged: false,
        establishmentId: 'est-1',
        reliefMission: { title: 'Mission Test' },
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue({ ...booking, freelanceAcknowledged: true });

      await service.acknowledgeBooking('booking-1', freelanceUser);

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { freelanceAcknowledged: true },
      });
      expect(mockNotifications.create).toHaveBeenCalledWith({
        userId: 'est-1',
        message: expect.stringContaining('confirmé sa venue'),
        type: 'SUCCESS',
      });
    });

    it('should be idempotent when already acknowledged', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        freelanceId: 'free-1',
        freelanceAcknowledged: true,
        establishmentId: 'est-1',
        reliefMission: { title: 'Mission Test' },
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      const result = await service.acknowledgeBooking('booking-1', freelanceUser);

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.booking.update).not.toHaveBeenCalled();
    });

    it('should throw Forbidden if user is not FREELANCE', async () => {
      await expect(service.acknowledgeBooking('booking-1', estUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw Forbidden if booking belongs to another freelance', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        freelanceId: 'other-free',
        freelanceAcknowledged: false,
        establishmentId: 'est-1',
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(service.acknowledgeBooking('booking-1', freelanceUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequest if booking is not CONFIRMED', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.PENDING,
        freelanceId: 'free-1',
        freelanceAcknowledged: false,
        establishmentId: 'est-1',
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(service.acknowledgeBooking('booking-1', freelanceUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmBooking', () => {
    const estUser = { id: 'est-1', email: 'est@test.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };
    const freelanceProviderUser = { id: 'free-1', email: 'free@test.com', role: UserRole.FREELANCE, status: UserStatus.VERIFIED, onboardingStep: 4 };

    it('should confirm a mission, consume one credit, create an invoice and notify rejected freelances', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.PENDING,
        establishmentId: 'est-1',
        freelanceId: 'free-1',
        reliefMissionId: 'mission-1',
        establishment: { role: UserRole.ESTABLISHMENT },
        reliefMission: {
          establishmentId: 'est-1',
          title: 'Mission Test',
          dateStart: new Date('2026-03-20T08:00:00Z'),
          dateEnd: new Date('2026-03-20T16:00:00Z'),
          hourlyRate: 25,
        },
        service: null,
        invoice: null,
        quotes: [],
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: BookingStatus.CONFIRMED });
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.reliefMission.update.mockResolvedValue({ id: 'mission-1' });
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-1' });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'free-1', email: 'free@test.com', profile: { firstName: 'Karim' } })
        .mockResolvedValueOnce({ id: 'est-1', email: 'est@test.com', profile: { companyName: 'Clinique Test' } });
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 'booking-2',
          freelanceId: 'free-2',
          freelance: { email: 'free2@test.com', profile: { firstName: 'Ali' } },
        },
      ]);

      await service.confirmBooking('booking-1', estUser);

      expect(mockPrisma.profile.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'est-1',
          availableCredits: { gte: 1 },
        },
        data: {
          availableCredits: {
            decrement: 1,
          },
        },
      });
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-1',
            amount: expect.any(Number),
            status: 'UNPAID',
          }),
        }),
      );
      // Should create conversation
      expect(mockConversations.getOrCreateConversation).toHaveBeenCalledWith('free-1', 'est-1');
      // Should notify the confirmed freelance
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'free-1', type: 'SUCCESS' }),
      );
      // Should notify rejected freelances
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'free-2', type: 'WARNING' }),
      );
    });

    it('refuses mission confirmation when the requester has no credit left', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.PENDING,
        establishmentId: 'est-1',
        freelanceId: 'free-1',
        reliefMissionId: 'mission-1',
        establishment: { role: UserRole.ESTABLISHMENT },
        reliefMission: {
          establishmentId: 'est-1',
          title: 'Mission Test',
          dateStart: new Date('2026-03-20T08:00:00Z'),
          dateEnd: new Date('2026-03-20T16:00:00Z'),
          hourlyRate: 25,
        },
        service: null,
        invoice: null,
        quotes: [],
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'est-1' });

      await expect(service.confirmBooking('booking-1', estUser)).rejects.toThrow(
        'Crédits insuffisants pour valider cette réservation.',
      );
      expect(mockPrisma.booking.update).not.toHaveBeenCalled();
      expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
    });

    it('confirms a training service after quote acceptance, consumes one credit and creates an invoice', async () => {
      const booking = {
        id: 'booking-service-1',
        status: BookingStatus.QUOTE_ACCEPTED,
        establishmentId: 'free-requester',
        freelanceId: 'free-1',
        reliefMissionId: null,
        establishment: { role: UserRole.ESTABLISHMENT },
        reliefMission: null,
        service: {
          id: 'service-1',
          ownerId: 'free-1',
          title: 'Formation Snoezelen',
          type: 'TRAINING',
          pricingType: 'QUOTE',
          price: 0,
          pricePerParticipant: null,
        },
        invoice: null,
        quotes: [{ totalTTC: 180 }],
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: BookingStatus.CONFIRMED });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-service-1' });

      await expect(service.confirmBooking('booking-service-1', freelanceProviderUser)).resolves.toEqual({ ok: true });

      expect(mockPrisma.profile.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'free-requester',
          availableCredits: { gte: 1 },
        },
        data: {
          availableCredits: {
            decrement: 1,
          },
        },
      });
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-service-1',
            amount: 180,
            status: 'UNPAID',
          }),
        }),
      );
      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'free-requester',
          type: 'SUCCESS',
        }),
      );
    });

    it('confirms a workshop service with enough credits using the same validation flow', async () => {
      const booking = {
        id: "booking-1",
        status: BookingStatus.PENDING,
        establishmentId: 'est-1',
        freelanceId: 'free-1',
        reliefMissionId: null,
        reliefMission: null,
        service: {
          id: 'service-2',
          ownerId: 'free-1',
          title: 'Atelier mémoire',
          type: 'WORKSHOP',
          pricingType: 'SESSION',
          price: 120,
          pricePerParticipant: null,
        },
        invoice: null,
        quotes: [],
      };

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: BookingStatus.CONFIRMED });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-2' });

      await expect(service.confirmBooking('booking-1', freelanceProviderUser)).resolves.toEqual({ ok: true });
      expect(mockPrisma.booking.update).toHaveBeenCalled();
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-1',
            amount: 120,
            status: 'UNPAID',
          }),
        }),
      );
      expect(mockConversations.getOrCreateConversation).toHaveBeenCalledWith('free-1', 'est-1');
    });
  });

  describe('cancelBookingLine — lineType BOOKING', () => {
    const estUser = { id: 'est-1', email: 'est@test.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };
    const freeUser = { id: 'free-1', email: 'free@test.com', role: UserRole.FREELANCE, status: UserStatus.VERIFIED, onboardingStep: 4 };

    it('annule le booking PENDING et retourne { ok: true }', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.PENDING,
        freelanceId: 'free-1',
        reliefMission: { establishmentId: 'est-1' },
      };
      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: BookingStatus.CANCELLED });

      const result = await service.cancelBookingLine(
        { lineType: 'BOOKING', lineId: 'booking-1' },
        estUser,
      );

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.CANCELLED },
      });
    });

    it('lève ForbiddenException si le rôle est FREELANCE', async () => {
      await expect(
        service.cancelBookingLine({ lineType: 'BOOKING', lineId: 'booking-1' }, freeUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.booking.findUnique).not.toHaveBeenCalled();
    });

    it('lève NotFoundException si le booking est introuvable', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelBookingLine({ lineType: 'BOOKING', lineId: 'ghost-id' }, estUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si la mission appartient à un autre établissement', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.PENDING,
        freelanceId: 'free-1',
        reliefMission: { establishmentId: 'other-est' },
      };
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        service.cancelBookingLine({ lineType: 'BOOKING', lineId: 'booking-1' }, estUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lève BadRequestException si le booking n\'est pas PENDING', async () => {
      const booking = {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        freelanceId: 'free-1',
        reliefMission: { establishmentId: 'est-1' },
      };
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        service.cancelBookingLine({ lineType: 'BOOKING', lineId: 'booking-1' }, estUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── P1-2 regression: credit refund on confirmed mission cancellation ──

  describe('cancelBookingLine — MISSION establishment avec remboursement crédit', () => {
    const estUser = { id: 'est-1', email: 'est@test.com', role: UserRole.ESTABLISHMENT, status: UserStatus.VERIFIED, onboardingStep: 3 };

    it('rembourse 1 crédit quand une mission CONFIRMED est annulée', async () => {
      mockPrisma.reliefMission.findUnique.mockResolvedValue({
        id: 'mission-1',
        establishmentId: 'est-1',
      });
      // Before update: one confirmed booking exists
      mockPrisma.booking.findFirst.mockResolvedValue({ id: 'booking-confirmed-1' });
      mockPrisma.reliefMission.update.mockResolvedValue({ id: 'mission-1' });
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.cancelBookingLine(
        { lineType: 'MISSION', lineId: 'mission-1' },
        estUser,
      );

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.profile.updateMany).toHaveBeenCalledWith({
        where: { userId: 'est-1' },
        data: { availableCredits: { increment: 1 } },
      });
    });

    it('ne rembourse pas de crédit quand seuls des bookings PENDING existent', async () => {
      mockPrisma.reliefMission.findUnique.mockResolvedValue({
        id: 'mission-2',
        establishmentId: 'est-1',
      });
      // No confirmed booking
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.reliefMission.update.mockResolvedValue({ id: 'mission-2' });
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 2 });

      await service.cancelBookingLine(
        { lineType: 'MISSION', lineId: 'mission-2' },
        estUser,
      );

      expect(mockPrisma.profile.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('cancelBookingLine — retrait freelance mission', () => {
    const freeUser = { id: 'free-1', email: 'free@test.com', role: UserRole.FREELANCE, status: UserStatus.VERIFIED, onboardingStep: 4 };

    it('autorise le retrait d’une candidature PENDING', async () => {
      mockPrisma.reliefMission.findUnique.mockResolvedValue({
        id: 'mission-1',
        establishmentId: 'est-1',
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking-pending',
        status: BookingStatus.PENDING,
      });
      mockPrisma.booking.update.mockResolvedValue({
        id: 'booking-pending',
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.cancelBookingLine({ lineType: 'MISSION', lineId: 'mission-1' }, freeUser),
      ).resolves.toEqual({ ok: true });

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-pending' },
        data: { status: BookingStatus.CANCELLED },
      });
    });

    it('refuse l’annulation freelance d’une mission CONFIRMED et ne modifie pas le booking ni la mission', async () => {
      mockPrisma.reliefMission.findUnique.mockResolvedValue({
        id: 'mission-1',
        establishmentId: 'est-1',
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking-confirmed',
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.cancelBookingLine({ lineType: 'MISSION', lineId: 'mission-1' }, freeUser),
      ).rejects.toThrow('Pour annuler une mission déjà validée, contactez Le Desk.');

      expect(mockPrisma.booking.update).not.toHaveBeenCalled();
      expect(mockPrisma.reliefMission.update).not.toHaveBeenCalled();
      expect(mockPrisma.reliefMission.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('getBookingsPageData', () => {
    it('inclut les candidatures freelance PENDING sur une mission encore OPEN', async () => {
      const freelanceUser = {
        id: 'free-1',
        email: 'free@test.com',
        role: UserRole.FREELANCE,
        status: UserStatus.VERIFIED,
        onboardingStep: 4,
      };

      mockPrisma.booking.findMany
        .mockResolvedValueOnce([
          {
            id: 'booking-mission-1',
            status: BookingStatus.PENDING,
            reliefMission: {
              id: 'mission-open-1',
              title: 'Renfort éducateur',
              dateStart: new Date('2026-04-20T10:00:00Z'),
              dateEnd: new Date('2026-04-20T18:00:00Z'),
              slots: null,
              hourlyRate: 28,
              address: '12 rue des Lilas',
              status: ReliefMissionStatus.OPEN,
              establishment: { email: 'ime@example.com' },
            },
            reviews: [],
            invoice: null,
          },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getBookingsPageData(freelanceUser);

      expect(mockPrisma.booking.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: {
            freelanceId: 'free-1',
            reliefMissionId: {
              not: null,
            },
          },
        }),
      );
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toMatchObject({
        lineId: 'mission-open-1',
        lineType: 'MISSION',
        typeLabel: 'Mission SOS',
        interlocutor: 'Coordonnées disponibles après confirmation',
        contactEmail: 'Coordonnées disponibles après confirmation',
        status: BookingStatus.PENDING,
        viewerSide: 'PROVIDER',
      });
    });

    it('inclut les réservations de service demandées par un freelance avec le bon interlocuteur et le bon libellé', async () => {
      const freelanceUser = {
        id: 'free-requester',
        email: 'requester@test.com',
        role: UserRole.FREELANCE,
        status: UserStatus.VERIFIED,
        onboardingStep: 4,
      };

      mockPrisma.booking.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'booking-service-1',
            establishmentId: 'free-requester',
            status: BookingStatus.PENDING,
            scheduledAt: new Date('2026-04-20T10:00:00Z'),
            establishment: { email: 'requester@test.com' },
            service: {
              title: 'Formation Snoezelen',
              price: 180,
              type: 'TRAINING',
              owner: { email: 'provider@test.com' },
            },
            reviews: [],
            invoice: null,
          },
        ]);

      const result = await service.getBookingsPageData(freelanceUser);

      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toMatchObject({
        lineId: 'booking-service-1',
        lineType: 'SERVICE_BOOKING',
        typeLabel: 'Formation',
        interlocutor: 'Coordonnées disponibles après confirmation',
        contactEmail: 'Coordonnées disponibles après confirmation',
        viewerSide: 'REQUESTER',
      });
    });
  });

  describe('getBookingLineDetails', () => {
    it('masque les coordonnées directes avant confirmation sur une mission', async () => {
      mockPrisma.reliefMission.findUnique.mockResolvedValue({
        establishmentId: 'est-1',
        address: '12 rue des Lilas',
        title: 'Renfort éducateur',
        dateStart: new Date('2026-04-20T10:00:00Z'),
        dateEnd: new Date('2026-04-20T18:00:00Z'),
        slots: null,
        shift: null,
        hourlyRate: 28,
        exactAddress: null,
        accessInstructions: 'Code 1234',
        hasTransmissions: true,
        transmissionTime: '15 min',
        perks: ['Repas'],
        establishment: {
          email: 'ime@example.com',
          profile: { firstName: 'Claire', lastName: 'Martin', phone: '0601020304', companyName: 'IME' },
        },
        bookings: [
          {
            id: 'booking-1',
            status: BookingStatus.PENDING,
            freelanceId: 'free-1',
            freelanceAcknowledged: false,
            freelance: {
              email: 'free@example.com',
              profile: { firstName: 'Nora', lastName: 'Diallo', phone: '0601020304' },
            },
          },
        ],
      });

      const result = await service.getBookingLineDetails('MISSION', 'mission-1', {
        id: 'free-1',
        email: 'free@example.com',
        role: UserRole.FREELANCE,
        status: UserStatus.VERIFIED,
        onboardingStep: 4,
      });

      expect(result.contactEmail).toBe('Coordonnées disponibles après confirmation');
      expect(result.contactPhone).toBeUndefined();
      expect(result.accessInstructions).toBeUndefined();
    });

    it('expose les coordonnées directes après confirmation sur une mission', async () => {
      mockPrisma.reliefMission.findUnique.mockResolvedValue({
        establishmentId: 'est-1',
        address: '12 rue des Lilas',
        title: 'Renfort éducateur',
        dateStart: new Date('2026-04-20T10:00:00Z'),
        dateEnd: new Date('2026-04-20T18:00:00Z'),
        slots: null,
        shift: null,
        hourlyRate: 28,
        exactAddress: null,
        accessInstructions: 'Code 1234',
        hasTransmissions: true,
        transmissionTime: '15 min',
        perks: ['Repas'],
        establishment: {
          email: 'ime@example.com',
          profile: { firstName: 'Claire', lastName: 'Martin', phone: '0601020304', companyName: 'IME' },
        },
        bookings: [
          {
            id: 'booking-1',
            status: BookingStatus.IN_PROGRESS,
            freelanceId: 'free-1',
            freelanceAcknowledged: true,
            freelance: {
              email: 'free@example.com',
              profile: { firstName: 'Nora', lastName: 'Diallo', phone: '0601020304' },
            },
          },
        ],
      });

      const result = await service.getBookingLineDetails('MISSION', 'mission-1', {
        id: 'free-1',
        email: 'free@example.com',
        role: UserRole.FREELANCE,
        status: UserStatus.VERIFIED,
        onboardingStep: 4,
      });

      expect(result.contactEmail).toBe('ime@example.com');
      expect(result.contactPhone).toBe('0601020304');
      expect(result.accessInstructions).toBe('Code 1234');
    });
  });

  describe('getOrderTracker', () => {
    it('masque requester/provider avant confirmation pour une réservation de service', async () => {
      const requester = {
        id: 'free-requester',
        email: 'requester@test.com',
        role: UserRole.FREELANCE,
        profile: {
          firstName: 'Samir',
          lastName: 'Requester',
          companyName: null,
          avatar: null,
          phone: null,
        },
      };
      const provider = {
        id: 'free-provider',
        email: 'provider@test.com',
        role: UserRole.FREELANCE,
        profile: {
          firstName: 'Nora',
          lastName: 'Provider',
          companyName: null,
          avatar: null,
          phone: null,
        },
      };

      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.PENDING,
        paymentStatus: 'UNPAID',
        message: null,
        scheduledAt: new Date('2026-04-20T10:00:00Z'),
        nbParticipants: 2,
        createdAt: new Date('2026-04-10T08:00:00Z'),
        establishmentId: 'free-requester',
        freelanceId: 'free-provider',
        establishment: requester,
        freelance: provider,
        reliefMission: null,
        service: {
          id: 'service-1',
          title: 'Atelier mémoire',
          description: null,
          price: 120,
          durationMinutes: 90,
          pricingType: 'SESSION',
          pricePerParticipant: null,
        },
        invoice: null,
        reviews: [],
        quotes: [],
        conversation: null,
      });

      const result = await service.getOrderTracker('booking-1', {
        id: 'free-requester',
        email: 'requester@test.com',
        role: UserRole.FREELANCE,
        status: UserStatus.VERIFIED,
        onboardingStep: 4,
      });

      expect(result.requester).toMatchObject({
        id: 'free-requester',
        role: 'FREELANCE',
        email: 'Coordonnées disponibles après confirmation',
      });
      expect(result.provider).toMatchObject({
        id: 'free-provider',
        role: 'FREELANCE',
        email: 'Coordonnées disponibles après confirmation',
      });
    });

    it('réaffiche email et téléphone dans le tracker après confirmation', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-2',
        status: BookingStatus.CONFIRMED,
        paymentStatus: 'UNPAID',
        message: null,
        scheduledAt: new Date('2026-04-20T10:00:00Z'),
        nbParticipants: 2,
        createdAt: new Date('2026-04-10T08:00:00Z'),
        establishmentId: 'est-1',
        freelanceId: 'free-1',
        establishment: {
          id: 'est-1',
          email: 'est@test.com',
          role: UserRole.ESTABLISHMENT,
          profile: {
            firstName: 'Claire',
            lastName: 'Martin',
            companyName: 'IME',
            avatar: null,
            phone: '0601020304',
          },
        },
        freelance: {
          id: 'free-1',
          email: 'free@test.com',
          role: UserRole.FREELANCE,
          profile: {
            firstName: 'Nora',
            lastName: 'Diallo',
            companyName: null,
            avatar: null,
            phone: '0605060708',
          },
        },
        reliefMission: null,
        service: null,
        invoice: null,
        reviews: [],
        quotes: [],
        conversation: null,
      });

      const result = await service.getOrderTracker('booking-2', {
        id: 'est-1',
        email: 'est@test.com',
        role: UserRole.ESTABLISHMENT,
        status: UserStatus.VERIFIED,
        onboardingStep: 3,
      });

      expect(result.provider).toMatchObject({
        email: 'free@test.com',
        phone: '0605060708',
      });
    });
  });

  describe('confirmBooking — crédit conditionnel', () => {
    const serviceOwner = { id: 'free-owner', ownerId: 'free-owner' };

    const baseBooking = {
      id: 'booking-1',
      establishmentId: 'requester-id',
      freelanceId: 'free-owner',
      reliefMissionId: null,
      status: BookingStatus.PENDING,
      reliefMission: null,
      service: { id: 'svc-1', ownerId: 'free-owner', title: 'Atelier', price: 100, pricingType: 'SESSION', pricePerParticipant: null },
      invoice: null,
      quotes: [],
    };

    it('consomme 1 crédit quand le demandeur est un ESTABLISHMENT', async () => {
      const bookingWithEstab = {
        ...baseBooking,
        establishment: { role: UserRole.ESTABLISHMENT },
      };
      mockPrisma.booking.findUnique.mockResolvedValue(bookingWithEstab);
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.booking.update.mockResolvedValue({ ...bookingWithEstab, status: 'CONFIRMED' });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-1' });

      const user = { id: 'free-owner', email: 'owner@test.com', role: UserRole.FREELANCE, status: UserStatus.VERIFIED, onboardingStep: 4 };
      await service.confirmBooking('booking-1', user);

      expect(mockPrisma.profile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'requester-id' }) }),
      );
    });

    it('ne consomme pas de crédit quand le demandeur est un FREELANCE', async () => {
      const bookingWithFreelance = {
        ...baseBooking,
        establishment: { role: UserRole.FREELANCE },
      };
      mockPrisma.booking.findUnique.mockResolvedValue(bookingWithFreelance);
      mockPrisma.booking.update.mockResolvedValue({ ...bookingWithFreelance, status: 'CONFIRMED' });
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-1' });

      const user = { id: 'free-owner', email: 'owner@test.com', role: UserRole.FREELANCE, status: UserStatus.VERIFIED, onboardingStep: 4 };
      await service.confirmBooking('booking-1', user);

      expect(mockPrisma.profile.updateMany).not.toHaveBeenCalled();
    });
  });
});
