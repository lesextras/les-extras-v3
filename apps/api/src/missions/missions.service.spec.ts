import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus, MissionStatus } from '@prisma/client';
import { MissionsService } from './missions.service';

function createPrismaMock() {
  return {
    reliefMission: {
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
}

function createNotificationsMock() {
  return {
    create: jest.fn().mockResolvedValue(undefined),
  };
}

describe('MissionsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let notifications: ReturnType<typeof createNotificationsMock>;
  let service: MissionsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    notifications = createNotificationsMock();
    service = new MissionsService(prisma as any, notifications as any);
  });

  describe('findOne', () => {
    it('lève NotFoundException pour une mission DRAFT d’un autre compte', async () => {
      prisma.reliefMission.findUnique.mockResolvedValue({
        id: 'm1',
        accountId: 'owner-account',
        status: MissionStatus.DRAFT,
        bookings: [],
      });

      await expect(
        service.findOne('m1', 'other-account'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('renvoie la vue publique (sans bookings) pour une mission PUBLISHED d’un autre compte', async () => {
      prisma.reliefMission.findUnique.mockResolvedValue({
        id: 'm1',
        accountId: 'owner-account',
        status: MissionStatus.PUBLISHED,
        title: 'Renfort week-end',
        bookings: [{ id: 'b1' }, { id: 'b2' }],
      });

      const result: any = await service.findOne('m1', 'other-account');

      expect(result).toBeDefined();
      expect(result.id).toBe('m1');
      // Le pipeline de candidatures ne doit pas fuiter aux non-propriétaires.
      expect(result.bookings).toBeUndefined();
    });

    it('renvoie le détail complet (avec bookings) au propriétaire', async () => {
      const mission = {
        id: 'm1',
        accountId: 'owner-account',
        status: MissionStatus.DRAFT,
        bookings: [{ id: 'b1' }],
      };
      prisma.reliefMission.findUnique.mockResolvedValue(mission);

      const result: any = await service.findOne('m1', 'owner-account');

      expect(result).toBe(mission);
      expect(result.bookings).toHaveLength(1);
    });
  });

  describe('candidate', () => {
    it('lève BadRequestException si le compte est de type ESTABLISHMENT', async () => {
      await expect(
        service.candidate('m1', 'account-1', 'ESTABLISHMENT'),
      ).rejects.toBeInstanceOf(BadRequestException);

      // Court-circuité avant toute lecture Prisma.
      expect(prisma.reliefMission.findUnique).not.toHaveBeenCalled();
    });

    it('lève BadRequestException en cas de double candidature (booking existant)', async () => {
      prisma.reliefMission.findUnique.mockResolvedValue({
        id: 'm1',
        accountId: 'owner-account',
        status: MissionStatus.PUBLISHED,
        startDate: new Date('2026-08-01'),
        hourlyRate: 25,
        account: { ownerId: 'owner-user', name: 'MECS Les Tilleuls' },
      });
      prisma.booking.findFirst.mockResolvedValue({ id: 'existing-booking' });

      await expect(
        service.candidate('m1', 'freelance-account', 'FREELANCE'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.booking.create).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('crée un Booking REQUESTED et notifie l’établissement quand tout est valide', async () => {
      prisma.reliefMission.findUnique.mockResolvedValue({
        id: 'm1',
        accountId: 'owner-account',
        status: MissionStatus.PUBLISHED,
        title: 'Renfort week-end',
        startDate: new Date('2026-08-01'),
        hourlyRate: 25,
        account: { ownerId: 'owner-user', name: 'MECS Les Tilleuls' },
      });
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.create.mockResolvedValue({
        id: 'new-booking',
        status: BookingStatus.REQUESTED,
      });

      const result: any = await service.candidate(
        'm1',
        'freelance-account',
        'FREELANCE',
      );

      expect(result.status).toBe(BookingStatus.REQUESTED);
      expect(prisma.booking.create).toHaveBeenCalledTimes(1);
      expect(notifications.create).toHaveBeenCalledTimes(1);
    });
  });
});
