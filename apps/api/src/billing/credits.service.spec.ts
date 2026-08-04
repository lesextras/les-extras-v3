import { ForbiddenException } from '@nestjs/common';
import { CreditsService } from './credits.service';
import {
  SUBSCRIPTION_PLANS,
  ESTABLISHMENT_PLAN,
  FREE_MONTHLY_CREDITS,
  ROLLOVER_MONTHS,
} from './billing.service';

/**
 * LES CRÉDITS SONT LA MONNAIE DE LEX — le seul produit payant à l'usage.
 *
 * Ce qu'on protège ici : le solde ne passe jamais en négatif (le décrément
 * est conditionnel dans la transaction), chaque mouvement laisse une écriture
 * au grand livre, une génération échouée rembourse son crédit, un compte
 * exonéré ne consomme rien, et la dotation MENSUELLE s'ajoute au solde
 * (report des générations non utilisées), plafonnée à ROLLOVER_MONTHS mois,
 * idempotente dans le mois, et servie à tous — y compris à qui ne paie pas.
 */

/** Prisma en mémoire : un compte, un grand livre, des abonnements. */
function fabrique(soldeInitial = 5, isMember = false) {
  const etat = {
    credits: soldeInitial,
    isMember,
    lexTrialEndsAt: null as Date | null,
    ledger: [] as Array<{ delta: number; balanceAfter: number; reason: string }>,
    subscriptions: [] as Array<{ accountId: string; planId: string }>,
  };

  const account = {
    findUnique: jest.fn(async () => ({ credits: etat.credits, isMember: etat.isMember })),
    findUniqueOrThrow: jest.fn(async () => ({
      credits: etat.credits,
      isMember: etat.isMember,
      lexTrialEndsAt: etat.lexTrialEndsAt,
    })),
    // La dotation mensuelle sert TOUS les comptes (offre gratuite permanente).
    findMany: jest.fn(async () => [{ id: 'acc1' }]),
    update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      if (typeof data.credits === 'number') {
        etat.credits = data.credits;
      } else if (data.credits && typeof data.credits === 'object') {
        const op = data.credits as { increment?: number; decrement?: number };
        if (op.increment) etat.credits += op.increment;
        if (op.decrement) etat.credits -= op.decrement;
      }
      return { credits: etat.credits };
    }),
    updateMany: jest.fn(
      async ({
        where,
        data,
      }: {
        where: { credits?: { gte: number }; lexTrialEndsAt?: null };
        data: { credits?: { decrement: number }; lexTrialEndsAt?: Date };
      }) => {
        if (where.credits && etat.credits < where.credits.gte) return { count: 0 };
        // Réclamation d'essai : ne passe que si jamais réclamé (null).
        if ('lexTrialEndsAt' in where && where.lexTrialEndsAt === null && etat.lexTrialEndsAt !== null) {
          return { count: 0 };
        }
        if (data.credits?.decrement) etat.credits -= data.credits.decrement;
        if (data.lexTrialEndsAt) etat.lexTrialEndsAt = data.lexTrialEndsAt;
        return { count: 1 };
      },
    ),
  };
  const creditLedger = {
    create: jest.fn(async ({ data }: { data: { delta: number; balanceAfter: number; reason: string } }) => {
      etat.ledger.push({ delta: data.delta, balanceAfter: data.balanceAfter, reason: data.reason });
      return data;
    }),
    findMany: jest.fn(async () => etat.ledger),
    // Idempotence de la dotation : une écriture DOTATION_MENSUELLE déjà
    // présente dans le mois bloque une seconde dotation.
    findFirst: jest.fn(async ({ where }: { where: { reason?: string } }) =>
      etat.ledger.some((l) => l.reason === where.reason) ? { id: 'x' } : null,
    ),
    aggregate: jest.fn(async () => ({ _sum: { delta: null } })),
  };
  const subscription = {
    findMany: jest.fn(async () => etat.subscriptions),
  };
  const prisma: Record<string, unknown> = {
    account,
    creditLedger,
    subscription,
    $transaction: jest.fn(async (arg: unknown): Promise<unknown> => {
      if (typeof arg === 'function') return (arg as (tx: unknown) => Promise<unknown>)(prisma);
      return Promise.all(arg as Promise<unknown>[]);
    }),
  };
  return { credits: new CreditsService(prisma as never), etat, account, creditLedger };
}

describe('CreditsService — consommer', () => {
  it('débite et écrit le mouvement au grand livre', async () => {
    const { credits, etat } = fabrique(5);
    const solde = await credits.consommer('acc1', 1, 'LEX_ECRIT');
    expect(solde).toBe(4);
    expect(etat.ledger).toEqual([{ delta: -1, balanceAfter: 4, reason: 'LEX_ECRIT' }]);
  });

  it('refuse quand le solde est insuffisant, sans rien écrire', async () => {
    const { credits, etat } = fabrique(0);
    await expect(credits.consommer('acc1', 1, 'LEX_ECRIT')).rejects.toThrow(ForbiddenException);
    expect(etat.credits).toBe(0);
    expect(etat.ledger).toHaveLength(0);
  });

  it('ne fait jamais passer le solde en négatif', async () => {
    const { credits, etat } = fabrique(1);
    await credits.consommer('acc1', 1, 'LEX_ECRIT');
    await expect(credits.consommer('acc1', 1, 'LEX_ECRIT')).rejects.toThrow(ForbiddenException);
    expect(etat.credits).toBe(0);
  });
});

describe('CreditsService — crediter', () => {
  it('crédite et journalise', async () => {
    const { credits, etat } = fabrique(2);
    const solde = await credits.crediter('acc1', 10, 'ACHAT_PACK');
    expect(solde).toBe(12);
    expect(etat.ledger).toEqual([{ delta: 10, balanceAfter: 12, reason: 'ACHAT_PACK' }]);
  });
});

describe('CreditsService — avecCredit', () => {
  it('consomme un crédit puis exécute la génération', async () => {
    const { credits, etat } = fabrique(3);
    const resultat = await credits.avecCredit('acc1', 'LEX_ECRIT', async () => 'ok');
    expect(resultat).toBe('ok');
    expect(etat.credits).toBe(2);
  });

  it("rembourse le crédit si la génération échoue, et relance l'erreur d'origine", async () => {
    const { credits, etat } = fabrique(3);
    await expect(
      credits.avecCredit('acc1', 'LEX_ECRIT', async () => {
        throw new Error('Mistral en panne');
      }),
    ).rejects.toThrow('Mistral en panne');
    expect(etat.credits).toBe(3);
    // Deux écritures : le débit puis le remboursement — la trace reste.
    expect(etat.ledger.map((l) => l.delta)).toEqual([-1, 1]);
    expect(etat.ledger[1].reason).toBe('REMBOURSEMENT_LEX_ECRIT');
  });

  it('ne consomme rien pour un compte exonéré (isMember)', async () => {
    const { credits, etat } = fabrique(0, true);
    const resultat = await credits.avecCredit('acc1', 'LEX_ECRIT', async () => 'ok');
    expect(resultat).toBe('ok');
    expect(etat.credits).toBe(0);
    expect(etat.ledger).toHaveLength(0);
  });
});

describe('CreditsService — dotation mensuelle', () => {
  const plan = SUBSCRIPTION_PLANS[0];

  it("ajoute l'allocation du plan au solde (report, pas remise à niveau)", async () => {
    const { credits, etat } = fabrique(2);
    etat.subscriptions.push({ accountId: 'acc1', planId: plan.id });
    await credits.dotationMensuelle();
    // Le report est le cœur de la refonte : les 2 crédits restants ne sont
    // pas effacés, ils s'ajoutent — c'est ce qui couvre les pics de bilans.
    expect(etat.credits).toBe(2 + plan.monthlyCredits);
    expect(etat.ledger[0]).toEqual({
      delta: plan.monthlyCredits,
      balanceAfter: 2 + plan.monthlyCredits,
      reason: 'DOTATION_MENSUELLE',
    });
  });

  it('sert aussi un compte sans abonnement : offre gratuite permanente', async () => {
    const { credits, etat } = fabrique(0);
    await credits.dotationMensuelle();
    expect(etat.credits).toBe(FREE_MONTHLY_CREDITS);
    expect(etat.ledger[0].reason).toBe('DOTATION_MENSUELLE');
  });

  it("est idempotente dans le mois : deux passages ne dotent qu'une fois", async () => {
    const { credits, etat } = fabrique(0);
    etat.subscriptions.push({ accountId: 'acc1', planId: plan.id });
    await credits.dotationMensuelle();
    await credits.dotationMensuelle();
    expect(etat.credits).toBe(plan.monthlyCredits);
    expect(etat.ledger).toHaveLength(1);
  });

  it("plafonne le report à ROLLOVER_MONTHS fois l'allocation", async () => {
    const dejaPlein = plan.monthlyCredits * ROLLOVER_MONTHS;
    const { credits, etat } = fabrique(dejaPlein);
    etat.subscriptions.push({ accountId: 'acc1', planId: plan.id });
    await credits.dotationMensuelle();
    // Le quota est un droit d'usage, pas une tirelire : au plafond, on n'ajoute rien.
    expect(etat.credits).toBe(dejaPlein);
    expect(etat.ledger).toHaveLength(0);
  });

  it('ignore un plan inconnu sans priver le compte de son offre gratuite', async () => {
    const { credits, etat } = fabrique(0);
    etat.subscriptions.push({ accountId: 'acc1', planId: 'plan-disparu' });
    await expect(credits.dotationMensuelle()).resolves.toBeUndefined();
    expect(etat.credits).toBe(FREE_MONTHLY_CREDITS);
  });

  it("dote l'établissement abonné au niveau de son allocation d'équipe", async () => {
    const { credits, etat } = fabrique(0);
    etat.subscriptions.push({ accountId: 'acc1', planId: ESTABLISHMENT_PLAN.id });
    await credits.dotationMensuelle();
    expect(etat.credits).toBe(ESTABLISHMENT_PLAN.monthlyCredits);
  });
});

describe('CreditsService — offre gratuite permanente', () => {
  it('accorde la dotation immédiatement, sans attendre le 1er du mois', async () => {
    const { credits, etat } = fabrique(0);
    const r = await credits.activerOffreGratuite('acc1');
    expect(r.mensuel).toBe(FREE_MONTHLY_CREDITS);
    expect(etat.credits).toBe(FREE_MONTHLY_CREDITS);
    expect(etat.ledger[0].reason).toBe('DOTATION_MENSUELLE');
  });

  it("ne double pas la dotation si elle a déjà été servie ce mois-ci", async () => {
    const { credits, etat } = fabrique(0);
    await credits.activerOffreGratuite('acc1');
    await credits.activerOffreGratuite('acc1');
    expect(etat.credits).toBe(FREE_MONTHLY_CREDITS);
    expect(etat.ledger).toHaveLength(1);
  });
});
