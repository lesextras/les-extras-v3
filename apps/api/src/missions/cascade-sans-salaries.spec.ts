import { CibleDiffusion, MissionStatus, MissionVisibility } from '@prisma/client';
import { MissionsService } from './missions.service';
import { CiblageService, cibleEffective, palierEffectif } from './ciblage.service';

/**
 * LA CASCADE NE PASSE PLUS JAMAIS PAR « SALARIES » (24/09/2026).
 *
 * « 1 compte = 1 personne » (décision de Siham) : il n'y a plus d'équipe
 * interne à qui proposer un créneau d'abord. La cascade part donc du réseau
 * connu (RESERVED) quand l'établissement en a un, sinon de la marketplace
 * (PUBLIC). La valeur SALARIES reste dans l'énumération pour ne rien détruire
 * en base, mais aucune écriture ne la produit, et toute lecture la ramène à
 * RESERVED.
 */

function monter(options: { connus?: string[]; mission?: Record<string, unknown> } = {}) {
  const mission = {
    id: 'm1',
    accountId: 'etab',
    title: 'Renfort internat',
    status: MissionStatus.DRAFT,
    visibility: MissionVisibility.PUBLIC,
    cibleDiffusion: CibleDiffusion.RESEAU,
    destinatairesIntervenants: [],
    modeAttribution: 'AUTOMATIQUE',
    diffusionVague: 0,
    startDate: new Date('2026-10-01'),
    ...options.mission,
  };
  const prisma = {
    reliefMission: {
      findUnique: jest.fn().mockResolvedValue(mission),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mission, ...data })),
    },
    membership: { count: jest.fn().mockResolvedValue(12) },
  };
  const ciblage = {
    intervenantsConnus: jest.fn().mockResolvedValue(options.connus ?? []),
    intervenantsAutorises: jest.fn().mockResolvedValue(null),
  };
  const service = new MissionsService(
    prisma as never,
    { create: jest.fn() } as never,
    { candidatesForMissionInterne: jest.fn().mockResolvedValue({ candidates: [] }) } as never,
    { sendMissionMatch: jest.fn() } as never,
    { crediter: jest.fn() } as never,
    { superExtrasParmi: jest.fn().mockResolvedValue(new Set()) } as never,
    ciblage as never,
    { sengager: jest.fn() } as never,
    { log: jest.fn().mockResolvedValue(null) } as never,
  );
  const palierEcrit = () => prisma.reliefMission.update.mock.calls[0][0].data.visibility;
  return { service, prisma, palierEcrit };
}

describe('Cascade de diffusion sans palier SALARIES', () => {
  it('démarre au réseau connu (RESERVED) quand l’établissement en a un', async () => {
    const { service, palierEcrit } = monter({ connus: ['f1'] });
    await service.publish('m1', 'etab');
    expect(palierEcrit()).toBe(MissionVisibility.RESERVED);
  });

  it('démarre au public sans réseau connu, même avec beaucoup de membres', async () => {
    // Avant, plus d'un membre sur le compte suffisait à démarrer en SALARIES.
    const { service, palierEcrit, prisma } = monter({ connus: [] });
    await service.publish('m1', 'etab');
    expect(palierEcrit()).toBe(MissionVisibility.PUBLIC);
    expect(prisma.membership.count).not.toHaveBeenCalled();
  });

  it('un palier SALARIES demandé par un ancien écran est écrit RESERVED', async () => {
    const { service, palierEcrit } = monter();
    await service.publish('m1', 'etab', MissionVisibility.SALARIES);
    expect(palierEcrit()).toBe(MissionVisibility.RESERVED);
  });

  it('une cible UNITE héritée ne verrouille plus rien et n’impose pas SALARIES', async () => {
    const { service, palierEcrit } = monter({
      connus: [],
      mission: { cibleDiffusion: CibleDiffusion.UNITE },
    });
    await service.publish('m1', 'etab');
    expect(palierEcrit()).toBe(MissionVisibility.PUBLIC);
  });

  it('une sélection de seuls salariés (sans intervenant) retombe sur le réseau', () => {
    const m = { cibleDiffusion: CibleDiffusion.SELECTION, destinatairesIntervenants: [] };
    expect(cibleEffective(m)).toBe(CibleDiffusion.RESEAU);
    expect(CiblageService.palierImpose(m)).toBeNull();
    expect(CiblageService.estVerrouillee(m)).toBe(false);
  });

  it('les ciblages nominatifs imposent RESERVED, jamais SALARIES', () => {
    for (const cible of [CibleDiffusion.CONNUS, CibleDiffusion.SELECTION]) {
      expect(
        CiblageService.palierImpose({ cibleDiffusion: cible, destinatairesIntervenants: ['f1'] }),
      ).toBe(MissionVisibility.RESERVED);
    }
  });

  it('élargir : RESERVED puis PUBLIC, et SALARIES hérité passe directement au public', () => {
    expect(MissionsService.visibiliteSuivante(MissionVisibility.RESERVED)).toBe(MissionVisibility.PUBLIC);
    expect(MissionsService.visibiliteSuivante(MissionVisibility.PUBLIC)).toBeNull();
    expect(MissionsService.visibiliteSuivante(MissionVisibility.SALARIES)).toBe(MissionVisibility.PUBLIC);
    expect(palierEffectif(MissionVisibility.SALARIES)).toBe(MissionVisibility.RESERVED);
  });

  it('aucune combinaison de publication n’écrit SALARIES', async () => {
    const cas: Array<{ connus: string[]; demande?: MissionVisibility; cible: CibleDiffusion; inter: string[] }> = [];
    for (const connus of [[], ['f1']])
      for (const demande of [undefined, ...Object.values(MissionVisibility)])
        for (const cible of Object.values(CibleDiffusion))
          for (const inter of [[], ['f1']]) cas.push({ connus, demande, cible, inter });
    for (const c of cas) {
      const { service, palierEcrit } = monter({
        connus: c.connus,
        mission: { cibleDiffusion: c.cible, destinatairesIntervenants: c.inter },
      });
      await service.publish('m1', 'etab', c.demande);
      expect(palierEcrit()).not.toBe(MissionVisibility.SALARIES);
    }
  });
});
