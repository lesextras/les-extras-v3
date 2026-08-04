import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EngagementStatut, MissionStatus } from '@prisma/client';
import { EngagementsService } from './engagements.service';

/**
 * LA FILE D'ENGAGEMENT.
 *
 * Ce qu'on protège ici, dans l'ordre d'importance :
 *   1. Un intervenant ne s'attribue JAMAIS la mission tout seul. Tant que
 *      l'établissement n'a pas dit oui, rien n'est confirmé, aucun contrat.
 *   2. L'ordre d'arrivée est respecté : le deuxième n'a pas perdu, il attend.
 *   3. Un refus fait avancer la file immédiatement — sinon elle se bloque et
 *      tout le dispositif ne vaut rien.
 *   4. Une acceptation lève tous les autres engagements : personne ne reste
 *      à espérer une mission déjà pourvue.
 */

const MISSION = {
  id: 'm1',
  accountId: 'etab',
  title: 'Renfort internat',
  status: MissionStatus.PUBLISHED,
  startDate: new Date('2026-09-01'),
  startTime: '09h00',
  endTime: '17h00',
  city: 'Melun',
  hourlyRate: 25,
  emergency: false,
  modeAttribution: 'FILE_ENGAGEMENT',
  cibleDiffusion: 'RESEAU',
  orgUnitId: null,
  visibility: 'PUBLIC',
  destinatairesSalaries: [],
  destinatairesIntervenants: [],
  account: { id: 'etab', name: 'MECS Les Tilleuls', ownerId: 'etab-user' },
};

function profil(id: string, rang: number, statut: EngagementStatut) {
  return {
    id: `e-${id}`,
    missionId: 'm1',
    accountId: id,
    rang,
    statut,
    message: null,
    presenteAt: null,
    account: {
      id,
      name: id,
      owner: { id: `${id}-user`, email: `${id}@ex.fr`, firstName: 'A', lastName: id, profile: { job: 'ES' } },
    },
  };
}

function monter(overrides: { mission?: Record<string, unknown>; file?: any[] } = {}) {
  const mission = { ...MISSION, ...overrides.mission };
  const file: any[] = overrides.file ?? [];

  const prisma: any = {
    reliefMission: {
      findUnique: jest.fn().mockResolvedValue(mission),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    missionEngagement: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn((args: any) => {
        const statuts = args?.where?.statut?.in ?? [args?.where?.statut];
        const trouve = file
          .filter((e) => statuts.includes(e.statut) && (!args?.where?.id || e.id === args.where.id))
          .sort((a, b) => a.rang - b.rang)[0];
        return Promise.resolve(trouve ?? null);
      }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(file.length),
      create: jest.fn(),
      upsert: jest.fn((args: any) => {
        const cree = {
          id: 'e-neuf',
          missionId: 'm1',
          ...args.create,
          account: {
            id: args.create.accountId,
            name: args.create.accountId,
            owner: {
              id: `${args.create.accountId}-user`,
              email: `${args.create.accountId}@ex.fr`,
              firstName: 'A',
              lastName: 'B',
              profile: { job: 'ES' },
            },
          },
        };
        file.push(cree);
        return Promise.resolve(cree);
      }),
      // Prisma renvoie un objet neuf : le mock ne doit surtout pas muter celui
      // que l'appelant tient déjà, sinon on ne teste plus le même code.
      update: jest.fn((args: any) => {
        const idx = file.findIndex((e) => e.id === args.where.id);
        if (idx >= 0) {
          file[idx] = { ...file[idx], ...args.data };
          return Promise.resolve(file[idx]);
        }
        return Promise.resolve({ id: args.where.id, ...args.data });
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    booking: {
      create: jest.fn().mockResolvedValue({ id: 'b1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    account: { findUnique: jest.fn().mockResolvedValue({ owner: { id: 'f1-user', email: 'f1@ex.fr' } }) },
    user: { findUnique: jest.fn().mockResolvedValue({ email: 'etab@ex.fr' }) },
  };
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };
  const mail = {
    sendEngagementEnregistre: jest.fn().mockResolvedValue(undefined),
    sendProfilAValider: jest.fn().mockResolvedValue(undefined),
    sendEngagementEcarte: jest.fn().mockResolvedValue(undefined),
    sendFileEpuisee: jest.fn().mockResolvedValue(undefined),
    sendMissionAcceptedFreelance: jest.fn().mockResolvedValue(undefined),
    sendMissionFilledEstablishment: jest.fn().mockResolvedValue(undefined),
  };
  const community = { crediter: jest.fn().mockResolvedValue(null) };
  const ciblage = { assertCiblageRespecte: jest.fn().mockResolvedValue(undefined) };

  const service = new EngagementsService(
    prisma as any,
    notifications as any,
    mail as any,
    community as any,
    ciblage as any,
  );
  return { service, prisma, mail, notifications, community, ciblage, file };
}

describe('EngagementsService — sengager', () => {
  it('refuse un compte établissement : on ne prend pas sa propre offre', async () => {
    const { service } = monter();
    await expect(service.sengager('m1', 'etab', 'ESTABLISHMENT')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuse une mission en attribution automatique : le bouton n’est pas le même', async () => {
    const { service } = monter({ mission: { modeAttribution: 'AUTOMATIQUE' } });
    await expect(service.sengager('m1', 'f1', 'FREELANCE')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('n’attribue JAMAIS la mission : elle reste publiée après un engagement', async () => {
    const { service, prisma } = monter();
    await service.sengager('m1', 'f1', 'FREELANCE');
    // Aucun passage en FILLED : seul l'établissement peut pourvoir la mission.
    expect(prisma.reliefMission.updateMany).not.toHaveBeenCalled();
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('présente le premier engagé à l’établissement, tout de suite', async () => {
    const { service, mail } = monter();
    const res = await service.sengager('m1', 'f1', 'FREELANCE');
    expect(res.presente).toBe(true);
    expect(mail.sendProfilAValider).toHaveBeenCalledTimes(1);
  });

  it('le second engagé attend son tour, et on le lui dit', async () => {
    const { service, mail } = monter({ file: [profil('f1', 1, EngagementStatut.PRESENTE)] });
    const res = await service.sengager('m1', 'f2', 'FREELANCE');
    expect(res.presente).toBe(false);
    // Un seul profil est soumis à la fois : l'établissement n'est pas resollicité.
    expect(mail.sendProfilAValider).not.toHaveBeenCalled();
    const [, payload] = mail.sendEngagementEnregistre.mock.calls[0];
    expect(payload.presente).toBe(false);
  });

  it('applique le ciblage nominatif : un hors-cible ne peut pas s’engager', async () => {
    const { service, ciblage } = monter();
    ciblage.assertCiblageRespecte.mockRejectedValue(new BadRequestException('hors cible'));
    await expect(service.sengager('m1', 'f9', 'FREELANCE')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuse un second engagement de la même personne', async () => {
    const { service, prisma } = monter();
    prisma.missionEngagement.findUnique.mockResolvedValue({
      id: 'e1',
      statut: EngagementStatut.EN_ATTENTE,
    });
    await expect(service.sengager('m1', 'f1', 'FREELANCE')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('EngagementsService — décision de l’établissement', () => {
  it('refuse l’accès à un autre compte que le propriétaire', async () => {
    const { service } = monter();
    await expect(
      service.decider('m1', 'e-f1', 'autre-compte', 'ACCEPTE'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('acceptation : pourvoit la mission, crée la réservation confirmée et le contrat', async () => {
    const file = [profil('f1', 1, EngagementStatut.PRESENTE)];
    const { service, prisma, mail } = monter({ file });
    prisma.missionEngagement.findFirst.mockResolvedValue(file[0]);

    const res: any = await service.decider('m1', 'e-f1', 'etab', 'ACCEPTE');

    expect(prisma.reliefMission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: MissionStatus.FILLED } }),
    );
    expect(prisma.booking.create).toHaveBeenCalledTimes(1);
    expect(res.contractUrl).toBe('/documents/contrat/b1');
    // Le contrat ne part QU'ICI : c'est la validation qui déclenche tout.
    expect(mail.sendMissionAcceptedFreelance).toHaveBeenCalledTimes(1);
    expect(mail.sendMissionFilledEstablishment).toHaveBeenCalledTimes(1);
  });

  it('acceptation : les autres engagés sont prévenus que c’est terminé', async () => {
    const file = [profil('f1', 1, EngagementStatut.PRESENTE)];
    const { service, prisma, mail } = monter({ file });
    prisma.missionEngagement.findFirst.mockResolvedValue(file[0]);
    prisma.missionEngagement.findMany.mockResolvedValue([profil('f2', 2, EngagementStatut.EN_ATTENTE)]);

    await service.decider('m1', 'e-f1', 'etab', 'ACCEPTE');

    expect(mail.sendEngagementEcarte).toHaveBeenCalledTimes(1);
    const [, payload] = mail.sendEngagementEcarte.mock.calls[0];
    expect(payload.caduc).toBe(true);
  });

  it('refus : le suivant de la file est présenté immédiatement', async () => {
    const file = [
      profil('f1', 1, EngagementStatut.PRESENTE),
      profil('f2', 2, EngagementStatut.EN_ATTENTE),
    ];
    const { service, prisma, mail } = monter({ file });
    prisma.missionEngagement.findFirst.mockImplementationOnce(() => Promise.resolve(file[0]));

    const res: any = await service.decider('m1', 'e-f1', 'etab', 'REFUSE', 'Diplôme attendu');

    expect(res.suivantPresente).toBe(true);
    // L'écarté sait pourquoi : un refus muet démobilise plus qu'une mission perdue.
    const [, ecarte] = mail.sendEngagementEcarte.mock.calls[0];
    expect(ecarte.motif).toBe('Diplôme attendu');
    expect(ecarte.caduc).toBe(false);
    expect(mail.sendProfilAValider).toHaveBeenCalledTimes(1);
  });

  it('refus du dernier : l’établissement est prévenu que la file est vide', async () => {
    const file = [profil('f1', 1, EngagementStatut.PRESENTE)];
    const { service, prisma, mail } = monter({ file });
    prisma.missionEngagement.findFirst.mockImplementationOnce(() => Promise.resolve(file[0]));

    const res: any = await service.decider('m1', 'e-f1', 'etab', 'REFUSE');

    expect(res.suivantPresente).toBe(false);
    expect(mail.sendFileEpuisee).toHaveBeenCalledTimes(1);
  });

  it('un engagement déjà tranché ne se rejuge pas', async () => {
    const file = [profil('f1', 1, EngagementStatut.REFUSE)];
    const { service, prisma } = monter({ file });
    prisma.missionEngagement.findFirst.mockResolvedValue(file[0]);
    await expect(service.decider('m1', 'e-f1', 'etab', 'ACCEPTE')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('mission déjà pourvue entre-temps : l’acceptation échoue proprement', async () => {
    const file = [profil('f1', 1, EngagementStatut.PRESENTE)];
    const { service, prisma } = monter({ file });
    prisma.missionEngagement.findFirst.mockResolvedValue(file[0]);
    prisma.reliefMission.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.decider('m1', 'e-f1', 'etab', 'ACCEPTE')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('EngagementsService — retrait', () => {
  it('un intervenant non engagé ne peut pas se retirer', async () => {
    const { service } = monter();
    await expect(service.retirer('m1', 'f1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('le retrait d’un profil présenté relance la file', async () => {
    const file = [
      profil('f1', 1, EngagementStatut.PRESENTE),
      profil('f2', 2, EngagementStatut.EN_ATTENTE),
    ];
    const { service, prisma, mail } = monter({ file });
    prisma.missionEngagement.findUnique.mockResolvedValue(file[0]);

    await service.retirer('m1', 'f1');

    expect(mail.sendProfilAValider).toHaveBeenCalledTimes(1);
  });
});
