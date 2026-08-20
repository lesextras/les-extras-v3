import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { FormationsService } from './formations.service';

/**
 * LA FACTURE DU FORMATEUR.
 *
 * Une formation vendue met en jeu DEUX factures, et une seule existait :
 * l'organisme facture l'établissement qui inscrit, puis le formateur facture à
 * l'organisme la prestation qu'il a assurée. Le modèle ne connaissait que le
 * prix de vente (`priceHt`) ; rien ne savait ce qui était dû au formateur,
 * donc la seconde facture ne pouvait pas être établie du tout.
 *
 * Ce que ces tests protègent, et c'est d'abord une question de droit :
 *
 *   1. Le formateur émet SOUS SON PROPRE SIRET, depuis son compte intervenant.
 *      La plateforme est un outil, pas un mandataire : elle n'établit aucune
 *      facture au nom d'un tiers.
 *   2. L'organisme ne peut PAS créer cette facture à sa place, même en étant
 *      propriétaire du programme. Ce serait de l'autofacturation, laquelle
 *      exige un mandat écrit que personne n'a signé.
 *   3. Le formateur ne fixe pas lui-même ce qu'on lui doit.
 *   4. Une session ne produit qu'une facture formateur, jamais deux.
 */

const FORMATEUR = 'user_formateur';
const CPT_FORMATEUR = 'acc_formateur';
const ORGANISME = 'acc_adepa';
const ETABLISSEMENT = 'acc_mecs';

interface Options {
  trainerId?: string | null;
  trainerFeeHt?: number | null;
  trainerInvoice?: { id: string; number: string } | null;
  type?: 'CERTIFIANTE' | 'INTERNE';
  /** Le compte renvoyé par `account.findUnique` pour le compte actif. */
  compte?: { id: string; type: string; ownerId: string } | null;
}

function monter(o: Options = {}) {
  const session = {
    id: 's_1',
    trainerId: o.trainerId === undefined ? FORMATEUR : o.trainerId,
    trainerFeeHt: o.trainerFeeHt === undefined ? 800 : o.trainerFeeHt,
    trainerInvoice: o.trainerInvoice ?? null,
    priceHt: 2400,
    hostAccountId: ETABLISSEMENT,
    formation: { ownerAccountId: ORGANISME, type: o.type ?? 'CERTIFIANTE' },
  };
  const prisma = {
    formationSession: {
      findUnique: jest.fn(async () => session),
      update: jest.fn(async (a: { data: Record<string, unknown> }) => ({ ...session, ...a.data })),
    },
    account: {
      findUnique: jest.fn(async () =>
        o.compte === undefined
          ? { id: CPT_FORMATEUR, type: 'FREELANCE', ownerId: FORMATEUR }
          : o.compte,
      ),
    },
    invoice: {
      findFirst: jest.fn(async () => null),
      create: jest.fn(async (a: { data: Record<string, unknown> }) => ({ id: 'inv_1', ...a.data })),
    },
  } as never;
  const notifications = { create: jest.fn(async () => undefined) } as never;
  const svc = new FormationsService(prisma, notifications);
  return { svc, prisma: prisma as unknown as Record<string, any> };
}

describe('Facture du formateur — sens et propriété du document', () => {
  it('le formateur émet depuis son compte, à destination de l’organisme', async () => {
    const { svc } = monter();
    const f: any = await svc.trainerInvoice('s_1', CPT_FORMATEUR, FORMATEUR);
    expect(f.accountId).toBe(CPT_FORMATEUR);
    expect(f.payerAccountId).toBe(ORGANISME);
    expect(Number(f.amount)).toBe(800);
    expect(f.status).toBe('DRAFT');
  });

  it('le numéro est pris dans la séquence du FORMATEUR, pas dans celle de l’organisme', async () => {
    const { svc, prisma } = monter();
    await svc.trainerInvoice('s_1', CPT_FORMATEUR, FORMATEUR);
    expect(prisma.invoice.findFirst.mock.calls[0][0].where).toMatchObject({
      accountId: CPT_FORMATEUR,
    });
  });

  it('la facture est rattachée à la session, une seule fois', async () => {
    const { svc, prisma } = monter();
    await svc.trainerInvoice('s_1', CPT_FORMATEUR, FORMATEUR);
    expect(prisma.formationSession.update.mock.calls[0][0].data).toEqual({
      trainerInvoiceId: 'inv_1',
    });
  });

  it('déjà émise : on rend la même, on n’en crée pas une seconde', async () => {
    const { svc, prisma } = monter({ trainerInvoice: { id: 'inv_ancienne', number: 'INV-2026-00004' } });
    const f: any = await svc.trainerInvoice('s_1', CPT_FORMATEUR, FORMATEUR);
    expect(f.id).toBe('inv_ancienne');
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
});

describe('Facture du formateur — ce que la plateforme refuse de faire', () => {
  it("l'organisme ne peut pas établir la facture de son formateur", async () => {
    // Ce serait de l'autofacturation (art. 289, I-2 du CGI), qui suppose un
    // mandat écrit du fournisseur. Aucun n'existe : la plateforme est un outil.
    const { svc, prisma } = monter();
    await expect(svc.trainerInvoice('s_1', ORGANISME, 'user_adepa')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it("l'établissement hôte non plus, même s'il gère la session", async () => {
    const { svc } = monter();
    await expect(svc.trainerInvoice('s_1', ETABLISSEMENT, 'user_etab')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('le formateur ne peut pas émettre depuis le compte de son employeur', async () => {
    // Un formateur salarié est membre du compte de son établissement : émettre
    // depuis ce compte-là ferait facturer l'employeur à la place de la personne.
    const { svc } = monter({
      compte: { id: ETABLISSEMENT, type: 'ESTABLISHMENT', ownerId: 'user_patron' },
    });
    await expect(svc.trainerInvoice('s_1', ETABLISSEMENT, FORMATEUR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("le formateur ne peut pas émettre depuis le compte intervenant d'un autre", async () => {
    const { svc } = monter({
      compte: { id: 'acc_tiers', type: 'FREELANCE', ownerId: 'user_quelquun_dautre' },
    });
    await expect(svc.trainerInvoice('s_1', 'acc_tiers', FORMATEUR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('sans rémunération fixée, il n’y a rien à facturer', async () => {
    const { svc, prisma } = monter({ trainerFeeHt: null });
    await expect(svc.trainerInvoice('s_1', CPT_FORMATEUR, FORMATEUR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it('une rémunération à zéro ne produit pas de facture à zéro euro', async () => {
    const { svc } = monter({ trainerFeeHt: 0 });
    await expect(svc.trainerInvoice('s_1', CPT_FORMATEUR, FORMATEUR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('une formation INTERNE ne se facture pas : la rémunération passe par la paie', async () => {
    const { svc } = monter({ type: 'INTERNE' });
    await expect(svc.trainerInvoice('s_1', CPT_FORMATEUR, FORMATEUR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('une session sans formateur désigné ne produit pas de facture', async () => {
    const { svc } = monter({ trainerId: null });
    await expect(svc.trainerInvoice('s_1', CPT_FORMATEUR, FORMATEUR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('Rémunération du formateur — qui a le droit de la fixer', () => {
  /** Prisma minimal pour `updateSession`. */
  function monterMaj(acteur: { accountId: string; userId: string }) {
    const session = {
      id: 's_1',
      hostAccountId: ETABLISSEMENT,
      trainerId: FORMATEUR,
      formation: { ownerAccountId: ORGANISME },
    };
    const update = jest.fn(async (a: { data: Record<string, unknown> }) => ({ ...session, ...a.data }));
    const prisma = {
      formationSession: { findUnique: jest.fn(async () => session), update },
    } as never;
    const svc = new FormationsService(prisma, { create: jest.fn() } as never);
    return { svc, update, acteur };
  }

  it("l'organisme fixe la rémunération", async () => {
    const { svc, update } = monterMaj({ accountId: ORGANISME, userId: 'user_adepa' });
    await svc.updateSession('s_1', ORGANISME, 'user_adepa', { trainerFeeHt: 900 } as never);
    expect(update.mock.calls[0][0].data.trainerFeeHt).toBe(900);
  });

  it("l'établissement hôte aussi — c'est lui qui commande sur le parcours interne", async () => {
    const { svc, update } = monterMaj({ accountId: ETABLISSEMENT, userId: 'user_etab' });
    await svc.updateSession('s_1', ETABLISSEMENT, 'user_etab', { trainerFeeHt: 750 } as never);
    expect(update.mock.calls[0][0].data.trainerFeeHt).toBe(750);
  });

  it('le formateur, lui, ne se fixe pas son propre tarif depuis le compte de son client', async () => {
    const { svc, update } = monterMaj({ accountId: CPT_FORMATEUR, userId: FORMATEUR });
    await svc.updateSession('s_1', CPT_FORMATEUR, FORMATEUR, {
      trainerFeeHt: 5000,
      location: 'Melun',
    } as never);
    const data = update.mock.calls[0][0].data;
    // Le champ est ignoré, pas la requête : le formateur garde l'usage de l'écran.
    expect(data.trainerFeeHt).toBeUndefined();
    expect(data.location).toBe('Melun');
  });
});
