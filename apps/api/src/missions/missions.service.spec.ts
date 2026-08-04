import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingStatus, MissionStatus } from '@prisma/client';
import { MissionsService } from './missions.service';

function createPrismaMock() {
  return {
    reliefMission: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    // candidate() vérifie que le salarié ne facture pas son propre employeur
    // (risque de requalification). Sans ce délégué, le service plantait sur un
    // TypeError et le test ne testait plus la règle métier attendue.
    account: {
      findUnique: jest.fn().mockResolvedValue({ ownerId: 'freelance-user' }),
    },
    membership: {
      findFirst: jest.fn().mockResolvedValue(null),
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
    const matching = { candidatesForMission: jest.fn().mockResolvedValue({ candidates: [] }) };
    const mail = {
      sendMissionMatch: jest.fn(),
      sendMissionFilledEstablishment: jest.fn(),
      sendMissionAcceptedFreelance: jest.fn(),
    };
    const community = { crediter: jest.fn().mockResolvedValue(null) };
    const progression = { superExtrasParmi: jest.fn().mockResolvedValue(new Set()) };
    service = new MissionsService(
      prisma as any,
      notifications as any,
      matching as any,
      mail as any,
      community as any,
      progression as any,
    );
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

  describe('create', () => {
    it('refuse un compte FREELANCE : un intervenant ne publie pas de besoin', async () => {
      await expect(
        service.create('account-1', 'FREELANCE', { title: 'x' } as never),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Court-circuité avant toute écriture Prisma.
      expect(prisma.reliefMission.create).not.toHaveBeenCalled();
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

/**
 * DIFFUSION CIBLÉE EN VAGUES — la mécanique qui décide de la couverture.
 *
 * Ce qu'on protège ici : on ne sollicite qu'une poignée d'intervenants à la
 * fois (un envoi de masse dilue la responsabilité et personne ne répond), on
 * n'écrit jamais deux fois à la même personne d'une vague à l'autre, le seuil
 * de score s'abaisse à mesure qu'on élargit, et l'e-mail dit à l'intervenant
 * qu'il fait partie d'une sélection restreinte.
 */
describe('MissionsService — diffusion ciblée par vagues', () => {
  const MISSION = {
    id: 'm1',
    accountId: 'etab',
    title: 'Renfort internat',
    city: 'Melun',
    startDate: new Date('2026-09-01'),
    job: 'Éducateur spécialisé',
    hourlyRate: null,
    emergency: false,
    visibility: 'PUBLIC',
    diffusionVague: 0,
  };

  /** 40 candidats au score décroissant : 95, 94, 93… pour couvrir les 3 seuils. */
  function candidats(n = 40) {
    return Array.from({ length: n }, (_, i) => ({
      accountId: `f${i}`,
      email: `f${i}@ex.fr`,
      available: true,
      hasConflict: false,
      total: 95 - i,
    }));
  }

  function monter(vagueCourante = 0, liste = candidats()) {
    const mission = { ...MISSION, diffusionVague: vagueCourante };
    const prisma = {
      reliefMission: {
        findUnique: jest.fn().mockResolvedValue(mission),
        update: jest.fn().mockResolvedValue(mission),
      },
    };
    const matching = { candidatesForMission: jest.fn().mockResolvedValue({ candidates: liste }) };
    const mail = { sendMissionMatch: jest.fn().mockResolvedValue(undefined) };
    const service = new MissionsService(
      prisma as any,
      { create: jest.fn() } as any,
      matching as any,
      mail as any,
      { crediter: jest.fn() } as any,
      { superExtrasParmi: jest.fn().mockResolvedValue(new Set()) } as any,
    );
    return { service, prisma, mail };
  }

  it('vague 1 : ne sollicite que les 8 meilleurs profils, pas tout le vivier', async () => {
    const { service, mail } = monter(0);
    const n = await (service as any).broadcastToMatched('m1', 'etab');
    expect(n).toBe(8);
    expect(mail.sendMissionMatch).toHaveBeenCalledTimes(8);
  });

  it("vague 1 : l'e-mail annonce à l'intervenant qu'il est dans une sélection restreinte", async () => {
    const { service, mail } = monter(0);
    await (service as any).broadcastToMatched('m1', 'etab');
    const [, payload] = mail.sendMissionMatch.mock.calls[0];
    expect(payload.vague).toBe(1);
    expect(payload.retenus).toBe(8);
  });

  it('vague 2 : écrit aux 15 suivants, jamais à ceux de la vague 1', async () => {
    const { service, mail } = monter(1);
    const n = await (service as any).broadcastToMatched('m1', 'etab');
    expect(n).toBe(15);
    const destinataires = mail.sendMissionMatch.mock.calls.map((c: any[]) => c[0]);
    // Les 8 premiers (f0..f7) ont déjà été sollicités : ils ne reçoivent rien.
    expect(destinataires).not.toContain('f0@ex.fr');
    expect(destinataires[0]).toBe('f8@ex.fr');
  });

  it('vague 3 : ouvre au reste du réseau avec le seuil le plus bas', async () => {
    const { service, mail } = monter(2);
    const n = await (service as any).broadcastToMatched('m1', 'etab');
    // Reste 40 - 23 = 17 candidats, tous au-dessus du seuil 45.
    expect(n).toBe(17);
    const [, payload] = mail.sendMissionMatch.mock.calls[0];
    expect(payload.vague).toBe(3);
  });

  it('respecte le seuil de score : un profil trop faible n’est jamais sollicité', async () => {
    // Deux bons profils, le reste sous le seuil de la vague 1 (60).
    const faibles = [
      { accountId: 'a', email: 'a@ex.fr', available: true, hasConflict: false, total: 90 },
      { accountId: 'b', email: 'b@ex.fr', available: true, hasConflict: false, total: 61 },
      { accountId: 'c', email: 'c@ex.fr', available: true, hasConflict: false, total: 50 },
    ];
    const { service, mail } = monter(0, faibles);
    const n = await (service as any).broadcastToMatched('m1', 'etab');
    expect(n).toBe(2);
    expect(mail.sendMissionMatch.mock.calls.map((c: any[]) => c[0])).not.toContain('c@ex.fr');
  });

  it('mémorise la vague atteinte pour que le planificateur enchaîne', async () => {
    const { service, prisma } = monter(0);
    await (service as any).broadcastToMatched('m1', 'etab');
    expect(prisma.reliefMission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: expect.objectContaining({ diffusionVague: 1 }),
      }),
    );
  });

  it('ne sollicite ni un indisponible ni un profil en conflit d’agenda', async () => {
    const liste = [
      { accountId: 'a', email: 'a@ex.fr', available: false, hasConflict: false, total: 95 },
      { accountId: 'b', email: 'b@ex.fr', available: true, hasConflict: true, total: 94 },
      { accountId: 'c', email: 'c@ex.fr', available: true, hasConflict: false, total: 93 },
    ];
    const { service, mail } = monter(0, liste);
    const n = await (service as any).broadcastToMatched('m1', 'etab');
    expect(n).toBe(1);
    expect(mail.sendMissionMatch).toHaveBeenCalledWith('c@ex.fr', expect.anything());
  });
});
