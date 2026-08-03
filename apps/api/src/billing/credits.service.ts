import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SUBSCRIPTION_PLANS } from './billing.service';

/**
 * Crédits LEX — la monnaie de l'assistant IA, et d'elle seule.
 *
 * Le modèle économique de la plateforme est simple : la mise en relation et
 * l'aide à la contractualisation (renforts, ateliers) sont gratuites pour
 * tout le monde ; les formations Qualiopi se facturent au devis par
 * l'association ; LEX, lui, consomme des crédits. Un crédit = une
 * génération. On recharge son solde par packs, ou par un abonnement qui
 * remet chaque jour le solde au niveau de son allocation quotidienne —
 * comme un forfait qui se renouvelle, sans cumul d'un jour sur l'autre.
 *
 * Chaque mouvement passe par le grand livre (CreditLedger) : le solde du
 * compte n'est jamais modifié sans écriture, et jamais hors transaction.
 */
@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Solde + derniers mouvements — l'écran « Utilisation » lit tout ici. */
  async utilisation(accountId: string) {
    const [account, mouvements, consomme30j] = await this.prisma.$transaction([
      this.prisma.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { credits: true, isMember: true },
      }),
      this.prisma.creditLedger.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          delta: true,
          balanceAfter: true,
          reason: true,
          createdAt: true,
        },
      }),
      this.prisma.creditLedger.aggregate({
        where: {
          accountId,
          delta: { lt: 0 },
          createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
        },
        _sum: { delta: true },
      }),
    ]);
    return {
      credits: account.credits,
      /// Accès illimité accordé manuellement (compte partenaire, test…).
      illimite: account.isMember,
      consomme30Jours: Math.abs(consomme30j._sum.delta ?? 0),
      mouvements,
    };
  }

  /**
   * Débite `montant` crédits, ou refuse si le solde est insuffisant.
   * Le décrément est conditionnel DANS la transaction : deux requêtes
   * simultanées ne peuvent pas faire passer le solde en négatif.
   */
  async consommer(accountId: string, montant: number, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const debite = await tx.account.updateMany({
        where: { id: accountId, credits: { gte: montant } },
        data: { credits: { decrement: montant } },
      });
      if (debite.count === 0) {
        throw new ForbiddenException(
          'Votre solde de crédits LEX est épuisé. Rechargez des crédits, ou attendez la recharge quotidienne si vous avez un abonnement.',
        );
      }
      const account = await tx.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { credits: true },
      });
      await tx.creditLedger.create({
        data: {
          accountId,
          delta: -montant,
          balanceAfter: account.credits,
          reason,
        },
      });
      return account.credits;
    });
  }

  /** Crédite le compte (achat de pack, geste commercial, remboursement). */
  async crediter(accountId: string, montant: number, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.update({
        where: { id: accountId },
        data: { credits: { increment: montant } },
        select: { credits: true },
      });
      await tx.creditLedger.create({
        data: {
          accountId,
          delta: montant,
          balanceAfter: account.credits,
          reason,
        },
      });
      return account.credits;
    });
  }

  /**
   * Consomme un crédit, exécute la génération, rembourse si elle échoue.
   * Un compte marqué `isMember` (accès illimité accordé à la main) ne
   * consomme rien : le drapeau sert d'interrupteur d'exonération.
   */
  async avecCredit<T>(accountId: string, reason: string, fn: () => Promise<T>): Promise<T> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { isMember: true },
    });
    if (compte?.isMember) return fn();

    await this.consommer(accountId, 1, reason);
    try {
      return await fn();
    } catch (err) {
      // La génération a échoué APRÈS le débit : on rend le crédit. L'échec
      // du remboursement lui-même est loggé mais n'écrase pas l'erreur
      // d'origine, qui est celle que l'utilisateur doit voir.
      await this.crediter(accountId, 1, `REMBOURSEMENT_${reason}`).catch((e) =>
        this.logger.error(`Remboursement impossible pour ${accountId}: ${e}`),
      );
      throw err;
    }
  }

  /**
   * Recharge quotidienne des abonnés — 6 h, heure de Paris (le serveur
   * tourne en UTC : 5 h l'hiver, 4 h l'été ; l'écart est sans enjeu).
   *
   * Le principe est celui d'un forfait, pas d'une tirelire : chaque jour,
   * le solde d'un abonné actif est REMIS AU NIVEAU de son allocation
   * quotidienne s'il est en dessous — jamais réduit s'il est au-dessus
   * (des crédits achetés en pack peuvent dépasser l'allocation, ils ne
   * s'évaporent pas). Pas de cumul : ne pas utiliser LEX un jour ne donne
   * pas double ration le lendemain.
   */
  @Cron('0 5 * * *', { name: 'lex-recharge-quotidienne' })
  async rechargeQuotidienne() {
    const abonnements = await this.prisma.subscription.findMany({
      where: { status: 'active' },
      select: { accountId: true, planId: true },
    });
    let recharges = 0;
    for (const abo of abonnements) {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === abo.planId);
      if (!plan || plan.dailyCredits <= 0) continue;
      try {
        await this.prisma.$transaction(async (tx) => {
          const account = await tx.account.findUnique({
            where: { id: abo.accountId },
            select: { credits: true },
          });
          if (!account || account.credits >= plan.dailyCredits) return;
          const delta = plan.dailyCredits - account.credits;
          await tx.account.update({
            where: { id: abo.accountId },
            data: { credits: plan.dailyCredits },
          });
          await tx.creditLedger.create({
            data: {
              accountId: abo.accountId,
              delta,
              balanceAfter: plan.dailyCredits,
              reason: 'RECHARGE_QUOTIDIENNE',
            },
          });
          recharges += 1;
        });
      } catch (err) {
        // Un compte en erreur ne doit pas priver les autres de leur recharge.
        this.logger.error(`Recharge impossible pour ${abo.accountId}: ${err}`);
      }
    }
    if (recharges > 0) {
      this.logger.log(`Recharge quotidienne LEX : ${recharges} compte(s) rechargé(s).`);
    }
  }
}
