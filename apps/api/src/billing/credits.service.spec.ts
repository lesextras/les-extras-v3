import { ForbiddenException } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { SUBSCRIPTION_PLANS } from './billing.service';

/**
 * LES CRÉDITS SONT LA MONNAIE DE LEX — le seul produit payant à l'usage.
 *
 * Ce qu'on protège ici : le solde ne passe jamais en négatif (le décrément
 * est conditionnel dans la transaction), chaque mouvement laisse une écriture
 * au grand livre, une génération échouée rembourse son crédit, un compte
 * exonéré ne consomme rien, et la recharge quotidienne remet le solde AU
 * NIVEAU de l'allocation — jamais au-dessus de ce qu'on a déjà, jamais en
 * le réduisant.
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
    findMany: jest.fn(async () =>
      etat.lexTrialEndsAt && etat.lexTrialEndsAt > new Date() ? [{ id: 'acc1' }] : [],
    ),
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

describe('CreditsService — recharge quotidienne', () => {
  const plan = SUBSCRIPTION_PLANS[0];

  it("remet le solde au niveau de l'allocation quand il est en dessous", async () => {
    const { credits, etat } = fabrique(2);
    etat.subscriptions.push({ accountId: 'acc1', planId: plan.id });
    await credits.rechargeQuotidienne();
    expect(etat.credits).toBe(plan.dailyCredits);
    expect(etat.ledger).toEqual([
      {
        delta: plan.dailyCredits - 2,
        balanceAfter: plan.dailyCredits,
        reason: 'RECHARGE_QUOTIDIENNE',
      },
    ]);
  });

  it('ne touche pas un solde déjà au-dessus (crédits achetés en pack)', async () => {
    const { credits, etat } = fabrique(plan.dailyCredits + 40);
    etat.subscriptions.push({ accountId: 'acc1', planId: plan.id });
    await credits.rechargeQuotidienne();
    expect(etat.credits).toBe(plan.dailyCredits + 40);
    expect(etat.ledger).toHaveLength(0);
  });

  it('ne cumule pas : deux recharges de suite ne donnent pas double ration', async () => {
    const { credits, etat } = fabrique(0);
    etat.subscriptions.push({ accountId: 'acc1', planId: plan.id });
    await credits.rechargeQuotidienne();
    await credits.rechargeQuotidienne();
    expect(etat.credits).toBe(plan.dailyCredits);
  });

  it('ignore un plan inconnu sans casser la tournée', async () => {
    const { credits, etat } = fabrique(1);
    etat.subscriptions.push({ accountId: 'acc1', planId: 'plan-disparu' });
    await expect(credits.rechargeQuotidienne()).resolves.toBeUndefined();
    expect(etat.credits).toBe(1);
  });

  it('recharge aussi les comptes en essai Découverte, sans abonnement', async () => {
    const { credits, etat } = fabrique(0);
    etat.lexTrialEndsAt = new Date(Date.now() + 3 * 86_400_000); // essai en cours
    await credits.rechargeQuotidienne();
    expect(etat.credits).toBe(10);
    expect(etat.ledger[0].reason).toBe('RECHARGE_QUOTIDIENNE');
  });
});

describe('CreditsService — essai Découverte', () => {
  it("accorde l'essai une première fois : date de fin + première ration", async () => {
    const { credits, etat } = fabrique(0);
    const r = await credits.reclamerEssai('acc1');
    expect(etat.lexTrialEndsAt).not.toBeNull();
    expect(r.finLe.getTime()).toBeGreaterThan(Date.now() + 6 * 86_400_000);
    expect(etat.credits).toBe(10);
    expect(etat.ledger[0].reason).toBe('ESSAI_DECOUVERTE');
  });

  it("refuse une seconde réclamation : l'essai ne se prend qu'une fois", async () => {
    const { credits, etat } = fabrique(0);
    await credits.reclamerEssai('acc1');
    await expect(credits.reclamerEssai('acc1')).rejects.toThrow(/déjà été utilisé/);
    // Et surtout : pas de seconde ration.
    expect(etat.ledger).toHaveLength(1);
  });
});
