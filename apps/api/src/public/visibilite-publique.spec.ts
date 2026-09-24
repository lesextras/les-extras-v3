import { FormationStatus, FormationType, MissionVisibility } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { FormationsService } from '../formations/formations.service';
import { MissionsService } from '../missions/missions.service';
import { PublicService } from './public.service';
import { QuotesService } from '../quotes/quotes.service';

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
 *  2. « Je réserve d'abord ce renfort à mon réseau. » La mission
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

/**
 * LES ANCIENS COMPTES « PROFIL SALARIÉ », SUR TOUTES LES SURFACES PUBLIQUES.
 *
 * Le compte salarié rattaché à un établissement n'existe plus depuis le
 * 24/09/2026 (« 1 compte = 1 personne »). Ceux qui avaient été créés gardent
 * leurs fiches HORS vitrine : les ouvrir publierait d'un coup ce que personne
 * n'a choisi de publier. Annuaire, fiche intervenant, catalogue et demande de
 * devis appliquent la même règle.
 */
describe('Ancien profil salarié : ni listé, ni consultable, ni sollicitable publiquement', () => {
  it('l’annuaire des intervenants exclut les comptes salariés', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma: any = {
      account: { findMany, count: jest.fn().mockResolvedValue(0) },
      review: { groupBy: jest.fn().mockResolvedValue([]) },
    };
    const service = new PublicService(prisma, {} as any, {} as any, {} as any);

    await service.vendors({});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'FREELANCE', profilSalarie: false }),
      }),
    );
    // Le total suit le même filtre, sinon la pagination annonce des pages vides.
    expect(prisma.account.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ profilSalarie: false }),
      }),
    );
  });

  it('la fiche publique d’un salarié est introuvable, même par son adresse directe', async () => {
    const prisma: any = {
      account: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new PublicService(prisma, {} as any, {} as any, {} as any);

    await expect(service.vendorDetail('compte-salarie')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.account.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ profilSalarie: false }),
      }),
    );
  });

  it('la fiche publique ne montre que des interventions publiées d’indépendants', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma: any = {
      account: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'compte-independant',
          name: 'Camille Roux',
          city: 'Melun',
          logoUrl: null,
          createdAt: new Date(),
          owner: { id: 'u1', firstName: 'Camille', lastName: 'Roux', profile: null },
        }),
      },
      service: { findMany },
      review: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockResolvedValue([[], []]),
    };
    const progression = { palier: jest.fn().mockResolvedValue(null) };
    const service = new PublicService(prisma, {} as any, progression as any, {} as any);

    await service.vendorDetail('compte-independant');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PUBLISHED',
          // ⚠ `archivedAt: null` fait partie de la VITRINE, pas d'un filtre
          // ajouté à côté : archiver un compte doit retirer ses fiches de
          // toutes les listes publiques d'un coup. Si ce test échoue parce que
          // la clause a bougé, c'est la constante qu'il faut regarder — pas ce
          // fichier.
          account: { profilSalarie: false, archivedAt: null },
        }),
      }),
    );
  });

  it('la demande de devis refuse une fiche non publiée', async () => {
    const prisma: any = {
      membership: { findUnique: jest.fn().mockResolvedValue({ status: 'ACTIVE' }) },
      account: { findUniqueOrThrow: jest.fn().mockResolvedValue({ type: 'ESTABLISHMENT', name: 'MECS' }) },
      service: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'svc',
          title: 'Atelier',
          accountId: 'compte-intervenant',
          status: 'DRAFT',
        }),
        findFirst: jest.fn().mockResolvedValue({ id: 'svc' }),
      },
      quote: { create: jest.fn() },
    };
    const service = new QuotesService(prisma, {} as any, {} as any);

    await expect(
      service.request('user', 'compte-mecs', { serviceId: 'svc' } as any),
    ).rejects.toThrow(/introuvable/i);
    expect(prisma.quote.create).not.toHaveBeenCalled();
  });

  /**
   * La portée « visible des établissements employeurs » est retirée
   * (24/09/2026, « 1 compte = 1 personne ») : la fiche d'un ancien compte
   * salarié n'est réservable par PERSONNE, employeur compris.
   */
  it('la demande de devis refuse la fiche d’un ancien compte salarié, à tout établissement', async () => {
    const prisma: any = {
      membership: { findUnique: jest.fn().mockResolvedValue({ status: 'ACTIVE' }) },
      account: { findUniqueOrThrow: jest.fn().mockResolvedValue({ type: 'ESTABLISHMENT', name: 'MECS' }) },
      service: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'svc',
          title: 'Atelier médiation animale',
          accountId: 'compte-salarie',
          status: 'PUBLISHED',
        }),
        // `ficheReservable` ne trouve rien : la fiche appartient à un compte
        // `profilSalarie`, hors vitrine.
        findFirst: jest.fn().mockResolvedValue(null),
      },
      quote: { create: jest.fn() },
    };
    const service = new QuotesService(prisma, {} as any, {} as any);

    await expect(
      service.request('user', 'compte-mecs', { serviceId: 'svc' } as any),
    ).rejects.toThrow(/pas ouverte à la réservation/i);
    expect(prisma.quote.create).not.toHaveBeenCalled();
    // Le filtre ne dépend plus du demandeur : aucune portée « employeur ».
    expect(prisma.service.findFirst).toHaveBeenCalledWith({
      where: { id: 'svc', account: { profilSalarie: false } },
      select: { id: true },
    });
  });
});

describe('Mission au palier SALARIES hérité : lue comme RESERVED, pas de l’extérieur', () => {
  /**
   * `connus` = les comptes intervenants du réseau de l'établissement, tels
   * que les calcule CiblageService. La lecture d'une mission RESERVED s'aligne
   * désormais sur cette même liste : une seule définition du réseau pour voir
   * comme pour répondre.
   */
  function serviceMissions(mission: Record<string, unknown>, connus: string[] = []) {
    const prisma: any = {
      reliefMission: { findUnique: jest.fn().mockResolvedValue(mission) },
    };
    const ciblage: any = {
      intervenantsAutorises: jest.fn().mockResolvedValue(null),
      intervenantsConnus: jest.fn().mockResolvedValue(connus),
      blocagesReponse: jest.fn().mockResolvedValue([]),
    };
    return new MissionsService(
      prisma,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      ciblage,
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

  /**
   * MÊME PROMESSE, UNE MARCHE PLUS BAS : le palier RESERVED.
   *
   * « Cette mission part d'abord aux intervenants qui connaissent la maison. »
   * La restriction tenait sur la candidature et sur la marketplace, mais pas
   * sur l'adresse directe : n'importe quel compte lisait le détail complet
   * d'une mission qui ne lui avait jamais été adressée. Une restriction qui ne
   * vaut que pour ceux qui n'ont pas le lien n'est pas une restriction.
   */
  const missionReservee = {
    id: 'm2',
    accountId: 'compte-mecs',
    status: 'PUBLISHED',
    visibility: MissionVisibility.RESERVED,
    cibleDiffusion: 'RESEAU',
    destinatairesIntervenants: [],
    bookings: [],
  };

  it('RESERVED : lisible par un intervenant du réseau de l’établissement', async () => {
    const service = serviceMissions(missionReservee, ['compte-connu']);
    await expect(service.findOne('m2', 'compte-connu')).resolves.toMatchObject({ id: 'm2' });
  });

  it('RESERVED : introuvable pour un compte hors du réseau, même avec l’URL', async () => {
    const service = serviceMissions(missionReservee, ['compte-connu']);
    await expect(service.findOne('m2', 'compte-tiers')).rejects.toThrow(/introuvable/i);
  });

  it('RESERVED : introuvable pour un visiteur non connecté', async () => {
    const service = serviceMissions(missionReservee, ['compte-connu']);
    await expect(service.findOne('m2')).rejects.toThrow(/introuvable/i);
  });

  it('RESERVED : reste lisible par l’établissement qui l’a publiée', async () => {
    const service = serviceMissions(missionReservee, []);
    await expect(service.findOne('m2', 'compte-mecs')).resolves.toMatchObject({ id: 'm2' });
  });
});
