import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SUBSCRIPTION_PLANS, ESTABLISHMENT_PLAN } from './billing.service';
import {
  FREE_MONTHLY_CREDITS,
  ROLLOVER_MONTHS,
  MOTIF_DOTATION,
} from './credits.constants';

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
/**
 * Qui a demandé la génération, et sur quoi.
 *
 * Facultatif partout : les mouvements automatiques (dotation du mois,
 * remboursement, encaissement Stripe) n'ont pas d'auteur, et il vaut mieux
 * une case vide qu'un nom inventé dans un journal qu'une direction lira.
 */
export interface Auteur {
  userId: string;
  /** Titre de l'écrit, quand il y en a un. Jamais de contenu, jamais de nom. */
  label?: string;
}

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Solde + derniers mouvements — l'écran « Utilisation » lit tout ici. */
  async utilisation(accountId: string) {
    const [account, mouvements, consomme30j] = await this.prisma.$transaction([
      this.prisma.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { credits: true, isMember: true, lexTrialEndsAt: true },
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
    const maintenant = new Date();
    return {
      credits: account.credits,
      /// Accès illimité accordé manuellement (compte partenaire, test…).
      illimite: account.isMember,
      consomme30Jours: Math.abs(consomme30j._sum.delta ?? 0),
      /// Dotation gratuite mensuelle, désormais permanente et sans date de fin.
      offreGratuite: { mensuel: FREE_MONTHLY_CREDITS, permanente: true },
      /// Héritage : ancien essai de 7 jours, conservé pour l'historique des comptes concernés.
      essai: account.lexTrialEndsAt
        ? { finLe: account.lexTrialEndsAt, actif: account.lexTrialEndsAt > maintenant }
        : null,
      mouvements,
    };
  }

  /**
   * Active l'offre GRATUITE PERMANENTE du compte.
   *
   * L'essai de 7 jours a été supprimé : le cycle de production d'écrits en
   * médico-social est mensuel à trimestriel, et une semaine ne suffisait pas
   * à rencontrer un seul cas d'usage à forte valeur. Le compte reçoit
   * désormais FREE_MONTHLY_CREDITS générations immédiatement, puis chaque
   * mois, sans date de fin et sans carte bancaire.
   *
   * Idempotent : appelable plusieurs fois, la dotation du mois n'est
   * accordée qu'une fois (voir crediterJusquA).
   */
  async activerOffreGratuite(accountId: string) {
    await this.crediterJusquA(accountId, FREE_MONTHLY_CREDITS);
    const compte = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: { credits: true },
    });
    this.logger.log(`Offre gratuite LEX activée pour ${accountId} (solde ${compte.credits}).`);
    return { credits: compte.credits, mensuel: FREE_MONTHLY_CREDITS };
  }

  /** @deprecated Conservé le temps que les clients appelants soient migrés. */
  async reclamerEssai(accountId: string) {
    return this.activerOffreGratuite(accountId);
  }

  /**
   * Débite `montant` crédits, ou refuse si le solde est insuffisant.
   * Le décrément est conditionnel DANS la transaction : deux requêtes
   * simultanées ne peuvent pas faire passer le solde en négatif.
   */
  async consommer(accountId: string, montant: number, reason: string, auteur?: Auteur) {
    return this.prisma.$transaction(async (tx) => {
      const debite = await tx.account.updateMany({
        where: { id: accountId, credits: { gte: montant } },
        data: { credits: { decrement: montant } },
      });
      if (debite.count === 0) {
        throw new ForbiddenException(
          `Vous avez utilisé toutes vos générations LEX pour ce mois. Votre dotation gratuite de ${FREE_MONTHLY_CREDITS} générations revient le 1er du mois prochain ; un abonnement ou un pack vous rend la main tout de suite.`,
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
          userId: auteur?.userId ?? null,
          label: auteur?.label ?? null,
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
  async avecCredit<T>(
    accountId: string,
    reason: string,
    fn: () => Promise<T>,
    auteur?: Auteur,
  ): Promise<T> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { isMember: true },
    });
    if (compte?.isMember) return fn();

    await this.consommer(accountId, 1, reason, auteur);
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
   * Dotation MENSUELLE — le 1er du mois à 5 h UTC.
   *
   * Remplace l'ancienne recharge quotidienne, abandonnée après benchmark :
   * un compteur journalier non reportable est inutilisable exactement les
   * jours où l'outil a le plus de valeur (période de bilans, de synthèses,
   * de rapports avant audience) et gaspillé les autres jours. La charge
   * d'écrits en MECS, IME ou EHPAD est massée, pas régulière.
   *
   * Trois populations sont servies, et chacune reçoit le plus généreux de
   * ses droits :
   *   • tout compte actif → l'offre GRATUITE permanente ;
   *   • les abonnés individuels → l'allocation de leur plan ;
   *   • les établissements abonnés → l'allocation partagée de l'équipe.
   *
   * Le crédit s'AJOUTE au solde (report), plafonné à ROLLOVER_MONTHS fois
   * l'allocation : le report couvre les pics sans devenir une tirelire.
   */
  @Cron('0 5 1 * *', { name: 'lex-dotation-mensuelle' })
  async dotationMensuelle() {
    const [abonnements, comptes] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { status: 'active' },
        select: { accountId: true, planId: true },
      }),
      // L'offre gratuite est un droit d'usage, pas une récompense : tout
      // compte non banni y a droit, y compris celui qui n'a jamais rien payé.
      this.prisma.account.findMany({ select: { id: true } }),
    ]);

    const allocations = new Map<string, number>();
    for (const compte of comptes) allocations.set(compte.id, FREE_MONTHLY_CREDITS);
    for (const abo of abonnements) {
      const plan =
        SUBSCRIPTION_PLANS.find((p) => p.id === abo.planId) ??
        (abo.planId === ESTABLISHMENT_PLAN.id ? ESTABLISHMENT_PLAN : null);
      if (!plan) continue;
      allocations.set(
        abo.accountId,
        Math.max(allocations.get(abo.accountId) ?? 0, plan.monthlyCredits),
      );
    }

    let dotes = 0;
    for (const [accountId, allocation] of allocations) {
      try {
        await this.crediterJusquA(accountId, allocation);
        dotes += 1;
      } catch (err) {
        // Un compte en erreur ne doit pas priver les autres de leur dotation.
        this.logger.error(`Dotation impossible pour ${accountId}: ${err}`);
      }
    }
    this.logger.log(`Dotation mensuelle LEX : ${dotes} compte(s) servi(s).`);
  }

  /**
   * JOURNAL DES GÉNÉRATIONS — la promesse de /confiance-lex, tenue.
   *
   * La page annonçait à une direction « qui a généré quoi, quand », et un
   * export. Ni l'un ni l'autre n'existait : le grand livre ne portait aucun
   * auteur. C'est réparé, mais avec une limite qu'il faut assumer plutôt que
   * masquer — les écritures antérieures à ce correctif n'ont pas d'auteur,
   * et rien ne permet de le reconstituer. Elles sortent avec une case vide
   * et une mention explicite, parce qu'un journal de conformité qui comble
   * ses trous ne vaut rien.
   *
   * Seules les GÉNÉRATIONS sont journalisées ici (delta négatif) : les
   * dotations, achats et remboursements sont des mouvements comptables, ils
   * restent dans l'écran « Utilisation ».
   */
  async journal(accountId: string, options: { depuis?: Date; limite?: number } = {}) {
    const lignes = await this.prisma.creditLedger.findMany({
      where: {
        accountId,
        delta: { lt: 0 },
        ...(options.depuis ? { createdAt: { gte: options.depuis } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limite ?? 500,
      select: {
        id: true,
        createdAt: true,
        reason: true,
        label: true,
        delta: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return lignes.map((l) => ({
      id: l.id,
      date: l.createdAt,
      outil: l.reason,
      intitule: l.label,
      credits: Math.abs(l.delta),
      auteur: l.user
        ? {
            id: l.user.id,
            nom: [l.user.firstName, l.user.lastName].filter(Boolean).join(' ').trim() || l.user.email,
            email: l.user.email,
          }
        : null,
    }));
  }

  /**
   * Ajoute l'allocation du mois au solde, dans la limite du report autorisé.
   * Idempotent dans le mois : une seconde exécution ne double pas la dotation
   * (on vérifie l'absence d'écriture DOTATION_MENSUELLE depuis le 1er).
   */
  private async crediterJusquA(accountId: string, allocation: number) {
    const debutDuMois = new Date();
    debutDuMois.setUTCDate(1);
    debutDuMois.setUTCHours(0, 0, 0, 0);

    await this.prisma.$transaction(async (tx) => {
      const dejaServi = await tx.creditLedger.findFirst({
        where: { accountId, reason: MOTIF_DOTATION, createdAt: { gte: debutDuMois } },
        select: { id: true },
      });
      if (dejaServi) return;

      const account = await tx.account.findUnique({
        where: { id: accountId },
        select: { credits: true },
      });
      if (!account) return;

      const plafond = allocation * ROLLOVER_MONTHS;
      const cible = Math.min(account.credits + allocation, Math.max(plafond, account.credits));
      const delta = cible - account.credits;
      if (delta <= 0) return;

      await tx.account.update({ where: { id: accountId }, data: { credits: cible } });
      await tx.creditLedger.create({
        data: { accountId, delta, balanceAfter: cible, reason: MOTIF_DOTATION },
      });
    });
  }

  /**
   * Amorce la dotation d'un compte qui vient d'être créé ou de s'abonner,
   * sans attendre le 1er du mois — personne ne doit patienter pour essayer.
   */
  async amorcerDotation(accountId: string, allocation = FREE_MONTHLY_CREDITS) {
    await this.crediterJusquA(accountId, allocation);
  }
}
