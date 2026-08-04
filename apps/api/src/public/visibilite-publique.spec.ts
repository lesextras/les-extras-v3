import { FormationStatus, FormationType, MissionVisibility } from '@prisma/client';
import { FormationsService } from '../formations/formations.service';
import { MissionsService } from '../missions/missions.service';

/**
 * DEUX PROMESSES QUE LE SITE FAIT, ET QU'IL NE TENAIT PAS.
 *
 * Ces tests sont nés d'un audit mené sur la production la veille du
 * lancement. Les deux failles étaient réelles et ont été empruntées pour de
 * vrai avant d'être refermées :
 *
 *  1. « Aucune formation ne se publie sans validation d'ADéPA. » Le verrou
 *     ne regardait que le passage en ligne. Il suffisait de créer le
 *     programme en INTERNE (publication autorisée, puisqu'une formation
 *     interne est censée rester chez l'établissement), de le publier, puis
 *     de repasser le type sur CERTIFIANTE : le contrôle ne se redéclenchait
 *     jamais, et le catalogue public n'excluait pas l'interne.
 *
 *  2. « Je réserve d'abord ce renfort à mon équipe. » La mission
 *     n'apparaissait bien ni dans la marketplace ni dans les opportunités,
 *     mais son détail se lisait intégralement par son adresse directe —
 *     description, taux horaire, nom de l'établissement.
 *
 * Ce qui est vérifié ici n'est pas du code : ce sont ces deux promesses.
 */

function serviceFormations(formation: Record<string, unknown>) {
  const prisma: any = {
    formation: {
      findUnique: jest.fn().mockResolvedValue(formation),
      update: jest.fn((args: any) => Promise.resolve({ ...formation, ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn().mockResolvedValue([[], 0]),
  };
  return { service: new FormationsService(prisma, {} as any), prisma };
}

describe('Formation : on ne devient pas certifiant après coup', () => {
  const base = {
    id: 'f1',
    ownerAccountId: 'compte-intervenant',
    type: FormationType.INTERNE,
    status: FormationStatus.PUBLISHED,
    cpfEligible: false,
    certifying: false,
  };

  it('refuse de passer une formation DÉJÀ EN LIGNE de INTERNE à CERTIFIANTE', async () => {
    const { service } = serviceFormations(base);
    await expect(
      service.update('f1', 'compte-intervenant', { type: FormationType.CERTIFIANTE }),
    ).rejects.toThrow(/repasser par ADéPA/i);
  });

  it('laisse l’administration plateforme le faire', async () => {
    const { service } = serviceFormations(base);
    await expect(
      service.update('f1', 'compte-intervenant', { type: FormationType.CERTIFIANTE }, true),
    ).resolves.toBeDefined();
  });

  it('laisse changer le type tant que le programme est en brouillon', async () => {
    const { service } = serviceFormations({ ...base, status: FormationStatus.DRAFT });
    await expect(
      service.update('f1', 'compte-intervenant', { type: FormationType.CERTIFIANTE }),
    ).resolves.toBeDefined();
  });

  it('refuse toujours la publication directe d’une formation certifiante', async () => {
    const { service } = serviceFormations({
      ...base,
      type: FormationType.CERTIFIANTE,
      status: FormationStatus.DRAFT,
    });
    await expect(
      service.update('f1', 'compte-intervenant', { status: FormationStatus.PUBLISHED }),
    ).rejects.toThrow(/Qualiopi/i);
  });

});

describe('Mission réservée à l’équipe : elle ne se lit pas de l’extérieur', () => {
  function serviceMissions(mission: Record<string, unknown>) {
    const prisma: any = {
      reliefMission: { findUnique: jest.fn().mockResolvedValue(mission) },
    };
    return new MissionsService(
      prisma,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  }

  const missionInterne = {
    id: 'm1',
    accountId: 'compte-mecs',
    status: 'PUBLISHED',
    visibility: MissionVisibility.SALARIES,
    bookings: [],
  };

  it('reste lisible par l’établissement qui l’a publiée', async () => {
    const service = serviceMissions(missionInterne);
    await expect(service.findOne('m1', 'compte-mecs')).resolves.toMatchObject({ id: 'm1' });
  });

  it('est introuvable pour un autre compte', async () => {
    const service = serviceMissions(missionInterne);
    await expect(service.findOne('m1', 'compte-tiers')).rejects.toThrow(/introuvable/i);
  });

  it('est introuvable sans compte du tout', async () => {
    const service = serviceMissions(missionInterne);
    await expect(service.findOne('m1')).rejects.toThrow(/introuvable/i);
  });

  it('reste lisible quand elle est réellement ouverte', async () => {
    const service = serviceMissions({
      ...missionInterne,
      visibility: MissionVisibility.PUBLIC,
    });
    await expect(service.findOne('m1', 'compte-tiers')).resolves.toMatchObject({ id: 'm1' });
  });
});
