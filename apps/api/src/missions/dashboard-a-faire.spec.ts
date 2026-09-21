import { DashboardController, type AFaire } from './dashboard.controller';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * LE BLOC « À FAIRE » NE DOIT PLUS MENTIR.
 *
 * ⚠⚠ CE FICHIER EXISTE À CAUSE D'UNE MESURE, PAS D'UNE INTUITION. Le
 * 21/09/2026, en production : dix-sept réservations, dont cinq en attente
 * d'acceptation, une acceptée, huit confirmées et une seule terminée — plus
 * six factures en brouillon. Le tableau de bord affichait « Tout est à jour.
 * Rien ne vous attend pour le moment. »
 *
 * Il ne mentait pas par malveillance : il n'avait que quatre sources, dont
 * `upcomingBookings`, qui agrège `ACCEPTED|CONFIRMED|IN_PROGRESS` en un seul
 * nombre affiché « N interventions à venir ». Un état agrégé ne dit pas quel
 * geste manque, et « à venir » ne se raye pas d'une liste de choses à faire.
 *
 * ⚠ CE QUI EST VERROUILLÉ ICI, ET QU'IL NE FAUT PAS DÉFAIRE :
 *
 *  1. ON COMPTE DU CÔTÉ DE L'OFFREUR. `assertOffreur` (bookings.service.ts)
 *     réserve `accept`, `confirm`, `start` et `complete` à celui qui a été
 *     SOLLICITÉ. Compter sur `Booking.accountId` — le DEMANDEUR — remplirait
 *     la liste de boutons qui mènent à un 403. C'est le défaut du compteur
 *     « interventions à venir », corrigé le 3/09, dans l'autre sens.
 *  2. REQUESTED EST COUPÉ EN DEUX : une candidature à un renfort s'examine sur
 *     `/dashboard/renforts`, une demande d'atelier s'accepte sur
 *     `/dashboard/ateliers`. Un compteur unique enverrait la moitié des gens
 *     au mauvais écran.
 *  3. LES FACTURES SONT CELLES DONT LE COMPTE EST L'ÉMETTEUR. `issue` est
 *     réservé à l'émetteur (`assertEmetteur`) : compter celles qu'on paie
 *     proposerait d'émettre la facture de quelqu'un d'autre.
 *  4. LES DEUX TYPES DE COMPTE REÇOIVENT LE MÊME CALCUL. Ce n'est pas le type
 *     qui décide de ce qu'on peut faire avancer — un établissement est
 *     l'offreur de ses missions, un intervenant l'offreur de ses ateliers.
 */

type Ligne = { status: string; _count: { _all: number } };

function prismaFactice(options: {
  parMission?: Ligne[];
  parService?: Ligne[];
  brouillons?: number;
}) {
  const appels: { groupBy: unknown[]; invoiceCount: unknown[] } = {
    groupBy: [],
    invoiceCount: [],
  };
  const prisma = {
    booking: {
      groupBy: (args: { where: Record<string, unknown> }) => {
        appels.groupBy.push(args.where);
        return Promise.resolve(
          'mission' in args.where ? (options.parMission ?? []) : (options.parService ?? []),
        );
      },
      count: () => Promise.resolve(0),
    },
    invoice: {
      count: (args: unknown) => {
        appels.invoiceCount.push(args);
        return Promise.resolve(options.brouillons ?? 0);
      },
      aggregate: () => Promise.resolve({ _sum: { amount: null } }),
    },
    reliefMission: {
      count: () => Promise.resolve(0),
      findMany: () => Promise.resolve([]),
    },
    message: { count: () => Promise.resolve(0) },
    account: { findUnique: () => Promise.resolve({ ownerId: 'u1' }) },
  } as unknown as PrismaService;
  return { prisma, appels };
}

const COMPTE = 'acc-1';

describe('Tableau de bord — le bloc « À faire »', () => {
  it('compte chaque état séparément, et non en un seul « à venir »', async () => {
    const { prisma } = prismaFactice({
      parMission: [
        { status: 'REQUESTED', _count: { _all: 5 } },
        { status: 'CONFIRMED', _count: { _all: 3 } },
      ],
      parService: [
        { status: 'REQUESTED', _count: { _all: 2 } },
        { status: 'ACCEPTED', _count: { _all: 1 } },
        { status: 'CONFIRMED', _count: { _all: 5 } },
        { status: 'IN_PROGRESS', _count: { _all: 4 } },
      ],
      brouillons: 6,
    });
    const res = (await new DashboardController(prisma).stats({
      id: COMPTE,
      type: 'ESTABLISHMENT',
    })) as unknown as { aFaire: AFaire };

    // ⚠ LES DEUX FILES `REQUESTED` RESTENT DISTINCTES : elles se réparent sur
    // deux écrans différents.
    expect(res.aFaire.candidaturesAExaminer).toBe(5);
    expect(res.aFaire.demandesAAccepter).toBe(2);
    expect(res.aFaire.aConfirmer).toBe(1);
    expect(res.aFaire.aDemarrer).toBe(8); // 3 côté mission + 5 côté atelier
    expect(res.aFaire.aTerminer).toBe(4);
    expect(res.aFaire.facturesBrouillon).toBe(6);
  });

  it('⚠ interroge le côté OFFREUR, jamais `Booking.accountId`', async () => {
    const { prisma, appels } = prismaFactice({});
    await new DashboardController(prisma).stats({ id: COMPTE, type: 'FREELANCE' });

    // Un `accountId` à la racine du `where` désignerait le DEMANDEUR : le
    // serveur refuserait les gestes proposés.
    for (const where of appels.groupBy as Record<string, unknown>[]) {
      expect(where.accountId).toBeUndefined();
    }
    expect(appels.groupBy).toEqual([
      { mission: { accountId: COMPTE } },
      { service: { accountId: COMPTE } },
    ]);
  });

  it('⚠ ne compte que les factures dont le compte est l’ÉMETTEUR', async () => {
    const { prisma, appels } = prismaFactice({ brouillons: 2 });
    await new DashboardController(prisma).stats({ id: COMPTE, type: 'ESTABLISHMENT' });

    const brouillons = (appels.invoiceCount as { where: Record<string, unknown> }[]).find(
      (a) => a.where?.status === 'DRAFT',
    );
    expect(brouillons?.where.accountId).toBe(COMPTE);
    // `payerAccountId` proposerait d'émettre la facture d'un autre.
    expect(brouillons?.where.payerAccountId).toBeUndefined();
  });

  it('sert le même calcul aux deux types de compte', async () => {
    const donnees = {
      parService: [{ status: 'IN_PROGRESS', _count: { _all: 7 } }],
      brouillons: 1,
    };
    const etablissement = (await new DashboardController(
      prismaFactice(donnees).prisma,
    ).stats({ id: COMPTE, type: 'ESTABLISHMENT' })) as { aFaire: unknown };
    const intervenant = (await new DashboardController(prismaFactice(donnees).prisma).stats({
      id: COMPTE,
      type: 'FREELANCE',
    })) as { aFaire: unknown };

    expect(etablissement.aFaire).toEqual(intervenant.aFaire);
  });

  it('rend des zéros — et non `undefined` — quand rien n’attend', async () => {
    const { prisma } = prismaFactice({});
    const res = (await new DashboardController(prisma).stats({
      id: COMPTE,
      type: 'FREELANCE',
    })) as unknown as { aFaire: AFaire };
    for (const v of Object.values(res.aFaire as unknown as Record<string, number>)) {
      expect(v).toBe(0);
    }
  });
});
