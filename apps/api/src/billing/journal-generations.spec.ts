import { CreditsService } from './credits.service';

/**
 * LE JOURNAL DES GÉNÉRATIONS.
 *
 * /confiance-lex promet à une direction « qui a généré quoi, quand », et un
 * export. Ni l'un ni l'autre n'existait : le grand livre ne portait aucun
 * auteur. Une page de confiance qui promet une preuve inexistante est pire
 * qu'une page sans promesse — c'est exactement ce qu'un directeur vérifiera.
 *
 * Ce que ces tests verrouillent :
 *  - l'auteur est bien imputé au débit, et seulement au débit ;
 *  - une écriture sans auteur sort avec une case VIDE, jamais un nom deviné ;
 *  - le journal ne montre que des générations, pas les mouvements comptables.
 */

function monter(lignes: unknown[] = []) {
  const findMany = jest.fn().mockResolvedValue(lignes);
  const creerEcriture = jest.fn().mockResolvedValue({});

  // La transaction est simulée : on rejoue le callback avec un `tx` minimal,
  // en réutilisant la MÊME fonction `create` que celle qu'on inspecte ensuite.
  const $transaction = jest.fn(async (arg: unknown): Promise<unknown> => {
    if (typeof arg !== 'function') return arg;
    return (arg as (tx: unknown) => Promise<unknown>)({
      account: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ credits: 9 }),
        update: jest.fn().mockResolvedValue({ credits: 11 }),
      },
      creditLedger: { create: creerEcriture },
    });
  });

  const prisma = {
    creditLedger: { findMany, create: creerEcriture, findFirst: jest.fn() },
    account: {
      findUnique: jest.fn().mockResolvedValue({ isMember: false, credits: 10 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ credits: 9 }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({ credits: 10 }),
    },
    $transaction,
  };
  return { service: new CreditsService(prisma as never), prisma, findMany };
}

describe('Imputation de l’auteur au débit', () => {
  it('inscrit l’auteur et l’intitulé quand ils sont fournis', async () => {
    const { service, prisma } = monter();

    await service.consommer('acc_1', 1, 'LEX_ECRIT', {
      userId: 'u_claire',
      label: 'Rapport de situation',
    });

    expect(prisma.creditLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u_claire',
          label: 'Rapport de situation',
          reason: 'LEX_ECRIT',
        }),
      }),
    );
  });

  /**
   * Le remboursement d'une génération ratée, la dotation du mois et
   * l'encaissement Stripe n'ont pas d'auteur humain. Écrire `null` est la
   * seule réponse honnête ; deviner serait fabriquer une trace.
   */
  it('laisse l’auteur VIDE quand personne n’est identifié', async () => {
    const { service, prisma } = monter();

    await service.consommer('acc_1', 1, 'LEX_ECRIT');

    expect(prisma.creditLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: null, label: null }),
      }),
    );
  });

  it('fait remonter l’auteur depuis avecCredit jusqu’au grand livre', async () => {
    const { service, prisma } = monter();

    await service.avecCredit('acc_1', 'LEX_FICHE', async () => 'ok', {
      userId: 'u_claire',
      label: 'ATELIER',
    });

    expect(prisma.creditLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'u_claire' }) }),
    );
  });
});

describe('Lecture du journal', () => {
  it('ne demande QUE les débits : le journal n’est pas le grand livre', async () => {
    const { service, findMany } = monter();

    await service.journal('acc_1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 'acc_1', delta: { lt: 0 } }),
      }),
    );
  });

  it('rend un nombre de crédits positif et un auteur lisible', async () => {
    const { service } = monter([
      {
        id: 'l1',
        createdAt: new Date('2026-03-04T09:00:00Z'),
        reason: 'LEX_ECRIT',
        label: 'Rapport de situation',
        delta: -1,
        user: {
          id: 'u_claire',
          firstName: 'Claire',
          lastName: 'Meunier',
          email: 'claire@mecs-exemple.fr',
        },
      },
    ]);

    const [ligne] = await service.journal('acc_1');

    expect(ligne.credits).toBe(1);
    expect(ligne.auteur?.nom).toBe('Claire Meunier');
    expect(ligne.intitule).toBe('Rapport de situation');
  });

  it('n’invente aucun auteur pour les écritures antérieures au correctif', async () => {
    const { service } = monter([
      {
        id: 'l0',
        createdAt: new Date('2026-01-02T09:00:00Z'),
        reason: 'LEX_ECRIT',
        label: null,
        delta: -1,
        user: null,
      },
    ]);

    const [ligne] = await service.journal('acc_1');

    expect(ligne.auteur).toBeNull();
  });

  it('se rabat sur l’e-mail quand la personne n’a pas renseigné son nom', async () => {
    const { service } = monter([
      {
        id: 'l2',
        createdAt: new Date('2026-03-04T09:00:00Z'),
        reason: 'LEX_ACTIVITE',
        label: null,
        delta: -1,
        user: { id: 'u2', firstName: null, lastName: null, email: 'chef@mecs-exemple.fr' },
      },
    ]);

    const [ligne] = await service.journal('acc_1');

    expect(ligne.auteur?.nom).toBe('chef@mecs-exemple.fr');
  });

  it('applique le filtre de date quand on lui en donne un', async () => {
    const { service, findMany } = monter();
    const depuis = new Date('2026-01-01T00:00:00Z');

    await service.journal('acc_1', { depuis });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ createdAt: { gte: depuis } }),
      }),
    );
  });
});
