import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotImplementedException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from './credits.service';
import { FREE_MONTHLY_CREDITS, ROLLOVER_MONTHS } from './credits.constants';


/**
 * Le modèle économique, en une phrase : la mise en relation et l'aide à la
 * contractualisation (renforts, ateliers) sont GRATUITES pour les
 * intervenants comme pour les établissements ; les formations Qualiopi se
 * facturent au devis par l'association ; LEX, l'assistant IA, fonctionne au
 * quota mensuel ; et l'établissement peut s'abonner pour outiller toute son
 * équipe.
 *
 * ── Refonte du 3 août 2026, après benchmark international ────────────────
 * Trois enseignements ont dicté cette grille :
 *   1. Le prix de référence de l'IA générative est ~20 €/mois en illimité
 *      (ChatGPT, Claude). Vendre plus cher pour MOINS d'usage est intenable :
 *      l'abonnement individuel passe de 49 € à 19 €.
 *   2. Le compteur JOURNALIER est le pire mécanisme pour ce métier : la
 *      charge d'écrits est massée (bilans, synthèses, rapports avant
 *      audience). On passe à un quota MENSUEL REPORTABLE, calibré pour que
 *      la quasi-totalité des utilisateurs ne voie jamais le plafond.
 *   3. Aucun marketplace viable ne facture le côté offre. L'établissement
 *      devient le payeur principal (ESTABLISHMENT_PLAN).
 */

/**
 * Offre gratuite permanente et report : les deux valeurs vivent désormais
 * dans `credits.constants.ts`, pour que la création d'un compte puisse les
 * lire sans importer tout le module de facturation. Réexportées ici, car
 * beaucoup d'appelants les importent depuis ce fichier.
 */
export { FREE_MONTHLY_CREDITS, ROLLOVER_MONTHS } from './credits.constants';

/**
 * Packs de crédits (Stripe Checkout mode=payment), pour qui ne veut pas
 * d'abonnement. Réalignés sur le tarif de l'abonnement : le crédit y reste
 * plus cher (c'est le prix du sans-engagement) mais dans un rapport de 3 à 4,
 * et non de 40 comme dans la grille historique — un écart que le premier
 * prospect faisant la division n'aurait pas pardonné.
 */
export const CREDIT_PACKS = [
  { id: 'pack-25', label: 'Pack 25 générations', credits: 25, amountCents: 900 },
  { id: 'pack-60', label: 'Pack 60 générations', credits: 60, amountCents: 1900 },
  { id: 'pack-150', label: 'Pack 150 générations', credits: 150, amountCents: 3900 },
] as const;

/**
 * Abonnements LEX individuels (Stripe Checkout mode=subscription).
 * `monthlyCredits` est crédité au compte chaque mois et REPORTABLE : le
 * solde s'accumule jusqu'à ROLLOVER_MONTHS fois l'allocation, ce qui couvre
 * exactement les pics de bilans sans transformer le quota en tirelire.
 */
export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan-essentiel',
    label: 'LEX',
    amountCents: 1900,
    monthlyCredits: 200,
    perks: '200 générations par mois, reportables — écriture, activités, fiches, GAPiste',
  },
  {
    id: 'plan-pro',
    label: 'LEX Pro',
    amountCents: 4900,
    monthlyCredits: 600,
    perks: '600 générations par mois, reportables + support prioritaire et accompagnement',
  },
] as const;

/**
 * Abonnement ÉTABLISSEMENT — le virage du modèle économique.
 *
 * Le benchmark est sans exception : tous les marketplaces à 0 % de
 * commission qui vivent (Incredible Health, Hublo, Patchwork, Florence)
 * sont financés par la DEMANDE, jamais par le professionnel — qui est ici
 * le côté rare et le moins solvable. L'établissement, lui, a un budget de
 * remplacement déjà provisionné et compare à un coefficient d'intérim de
 * 1,8 à 2,5.
 *
 * Ce qu'il achète : la plateforme reste gratuite pour ses intervenants et
 * sans commission sur les vacations ; l'abonnement couvre l'outillage de
 * l'établissement et donne LEX à toute son équipe.
 */
export const ESTABLISHMENT_PLAN = {
  id: 'plan-etablissement',
  label: 'Les Extras — Établissement',
  amountCents: 8900,
  monthlyCredits: 1000,
  perks:
    'SOS Renfort illimité, 0 % de commission, LEX pour toute l’équipe (1 000 générations/mois partagées), coffre-fort de conformité et accompagnement',
} as const;

/**
 * Rétrocompatibilité : `lexTrialEndsAt` reste lu pour les comptes qui ont
 * connu l'ancien essai de 7 jours, mais plus aucun essai n'est accordé —
 * l'offre gratuite permanente l'a remplacé.
 */
export const TRIAL_DAYS = 7;
export const TRIAL_DAILY_CREDITS = 10;

const STRIPE_API = 'https://api.stripe.com/v1';
/** Tolérance sur l'horodatage de la signature webhook (anti-rejeu). */
const WEBHOOK_TOLERANCE_S = 300;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly credits: CreditsService,
  ) {}

  private get secretKey(): string {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new ServiceUnavailableException(
        "Paiement indisponible : STRIPE_SECRET_KEY n'est pas configurée.",
      );
    }
    return key;
  }

  /** Appel REST Stripe sans SDK (form-encoded, Bearer). */
  private async stripe(path: string, params: Record<string, string>) {
    const body = new URLSearchParams(params).toString();
    const res = await fetch(`${STRIPE_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const json = (await res.json()) as Record<string, unknown> & {
      error?: { message?: string };
    };
    if (!res.ok) {
      this.logger.error(`Stripe ${path} → ${res.status}: ${json.error?.message}`);
      throw new BadRequestException(
        json.error?.message ?? 'Erreur Stripe inconnue.',
      );
    }
    return json;
  }


  /**
   * Catalogue d'abonnements. `pour` indique à qui l'offre s'adresse : le
   * front n'affiche à un établissement que l'offre Établissement, et à un
   * intervenant que les offres individuelles — proposer les deux à tout le
   * monde brouillerait la décision d'achat.
   */
  listPlans() {
    return [
      ...SUBSCRIPTION_PLANS.map((p) => ({ ...p, pour: 'FREELANCE' as const })),
      { ...ESTABLISHMENT_PLAN, pour: 'ESTABLISHMENT' as const },
    ].map((p) => ({ ...p, currency: 'eur', interval: 'month' }));
  }

  /** Tous les plans souscriptibles, individuels et établissement confondus. */
  private tousLesPlans() {
    return [...SUBSCRIPTION_PLANS, ESTABLISHMENT_PLAN] as ReadonlyArray<{
      id: string; label: string; amountCents: number; monthlyCredits: number; perks: string;
    }>;
  }

  listPacks() {
    return CREDIT_PACKS.map((p) => ({ ...p, currency: 'eur' }));
  }

  /** Vue d'ensemble LEX d'un compte : solde, abonnement, packs et plans. */
  async overview(userId: string, accountId: string) {
    await this.requireMember(userId, accountId, false);
    const [account, subscription] = await this.prisma.$transaction([
      this.prisma.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { credits: true, isMember: true, lexTrialEndsAt: true },
      }),
      this.prisma.subscription.findUnique({ where: { accountId } }),
    ]);
    return {
      credits: account.credits,
      illimite: account.isMember,
      essai: account.lexTrialEndsAt
        ? { finLe: account.lexTrialEndsAt, actif: account.lexTrialEndsAt > new Date() }
        : null,
      offreGratuite: { mensuel: FREE_MONTHLY_CREDITS, permanente: true },
      reportMois: ROLLOVER_MONTHS,
      subscription,
      plans: this.listPlans(),
      packs: this.listPacks(),
      configured: Boolean(this.config.get<string>('STRIPE_SECRET_KEY')),
    };
  }

  /**
   * Membre ACTIF du compte, quel que soit son type — LEX se recharge depuis
   * un compte établissement COMME depuis un compte intervenant, puisque
   * l'assistant est ouvert aux deux. Rôles OWNER/ADMIN si `manageRole`.
   */
  private async requireMember(userId: string, accountId: string, manageRole = true) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId } },
      include: { account: { select: { type: true, name: true } } },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('Accès refusé à ce compte.');
    }
    if (manageRole && !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new ForbiddenException(
        'Seul un propriétaire ou administrateur du compte peut gérer la facturation.',
      );
    }
    return membership;
  }

  /**
   * Abonnement mensuel via Stripe Checkout (mode subscription).
   * Un seul abonnement par compte : refuse si un abonnement actif existe déjà.
   */
  async createSubscriptionCheckout(userId: string, accountId: string, planId: string) {
    const plan = this.tousLesPlans().find((p) => p.id === planId);
    if (!plan) throw new BadRequestException('Plan inconnu.');
    await this.requireMember(userId, accountId);

    const existing = await this.prisma.subscription.findUnique({ where: { accountId } });
    if (existing && existing.status === 'active') {
      throw new BadRequestException('Un abonnement est déjà actif sur ce compte.');
    }

    const webUrl = this.config.get<string>('APP_WEB_URL') ?? 'https://app.les-extras.fr';
    const session = await this.stripe('/checkout/sessions', {
      mode: 'subscription',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(plan.amountCents),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][price_data][product_data][name]': `Les Extras — Abonnement ${plan.label}`,
      success_url: `${webUrl}/dashboard/adhesion?paiement=succes`,
      cancel_url: `${webUrl}/dashboard/adhesion?paiement=annule`,
      'metadata[kind]': 'subscription',
      'metadata[accountId]': accountId,
      'metadata[planId]': plan.id,
      client_reference_id: accountId,
    });

    await this.prisma.subscription.upsert({
      where: { accountId },
      create: { accountId, planId: plan.id, status: 'pending' },
      update: { planId: plan.id, status: 'pending' },
    });

    return { url: String(session.url) };
  }

  /**
   * Le compte de la plateforme (association ADéPA), seul émetteur dont les
   * factures peuvent être encaissées en ligne — voir `createInvoiceCheckout`.
   *
   * Renseigné par `PLATFORM_ACCOUNT_ID` quand il est connu ; à défaut, on
   * reconnaît le compte établissement de l'association par son nom, comme le
   * fait déjà l'administration pour rattacher les formations Qualiopi.
   */
  private async compteDeLaPlateforme(): Promise<string | null> {
    const configure = this.config.get<string>('PLATFORM_ACCOUNT_ID');
    if (configure) return configure;
    const adepa = await this.prisma.account.findFirst({
      where: {
        type: 'ESTABLISHMENT',
        OR: [
          { name: { contains: 'adépa', mode: 'insensitive' } },
          { name: { contains: 'adepa', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return adepa?.id ?? null;
  }

  /**
   * Paiement en une fois d'une facture émise (mode payment, sans crédits).
   * La facture passe PAID à la réception du webhook.
   *
   * QUI PEUT PAYER. Le contrôle était inversé : il exigeait que le compte
   * actif soit l'ÉMETTEUR de la facture. Autrement dit, seul celui qui envoie
   * la facture pouvait la régler — c'est-à-dire personne — pendant que le
   * destinataire, lui, recevait une erreur « facture introuvable sur ce
   * compte ». Le payeur est `payerAccountId` : c'est ce champ, et lui seul,
   * qui désigne celui à qui la facture est adressée.
   *
   * CE QUI RESTE FERMÉ, ET POURQUOI. Encaisser sur le compte Stripe de
   * l'association une facture émise par un intervenant indépendant, c'est
   * recevoir des fonds pour le compte d'un tiers : un service de paiement au
   * sens de l'article L. 314-1 du code monétaire et financier, dont la
   * fourniture à titre habituel est réservée aux établissements agréés
   * (art. L. 521-2 et L. 522-1 CMF). L'association n'a ni agrément
   * d'établissement de paiement, ni statut d'agent, ni exemption applicable.
   * Tant que ce cadre n'est pas réglé — Stripe Connect avec comptes connectés,
   * ou statut d'agent d'un prestataire agréé —, seules les factures émises par
   * la plateforme elle-même s'encaissent en ligne. Les autres se règlent par
   * virement, directement d'établissement à intervenant : c'est d'ailleurs ce
   * que dit le reste du produit (« la plateforme ne perçoit pas les paiements
   * des missions »).
   */
  async createInvoiceCheckout(userId: string, accountId: string, invoiceId: string) {
    await this.requireMember(userId, accountId);
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.payerAccountId !== accountId) {
      throw new BadRequestException('Facture introuvable sur ce compte.');
    }
    const plateforme = await this.compteDeLaPlateforme();
    if (!plateforme || invoice.accountId !== plateforme) {
      throw new NotImplementedException(
        "Le règlement en ligne des factures d'intervenants arrive bientôt — règle cette facture par virement (IBAN sur la facture).",
      );
    }
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cette facture est déjà payée.');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cette facture est annulée.');
    }
    const amountCents = Math.round(Number(invoice.amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new BadRequestException('Montant de facture invalide.');
    }

    const webUrl = this.config.get<string>('APP_WEB_URL') ?? 'https://app.les-extras.fr';
    const session = await this.stripe('/checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(amountCents),
      'line_items[0][price_data][product_data][name]': `Les Extras — Facture ${invoice.number}`,
      // Pointer directement l'écran des factures : `/dashboard/finance` n'est
      // qu'une redirection, et elle perdait le paramètre en route — le client
      // revenait de Stripe sans la moindre confirmation.
      success_url: `${webUrl}/dashboard/facturation?vue=factures&paiement=succes`,
      cancel_url: `${webUrl}/dashboard/facturation?vue=factures&paiement=annule`,
      'metadata[kind]': 'invoice',
      'metadata[accountId]': accountId,
      'metadata[invoiceId]': invoice.id,
      client_reference_id: accountId,
    });

    return { url: String(session.url) };
  }

  /**
   * Achat d'un pack de crédits LEX (mode payment, une seule fois).
   * L'achat est enregistré PENDING avant la redirection ; c'est le webhook
   * qui le passera PAID et créditera le compte — idempotent grâce à
   * l'unicité de `stripeSessionId`.
   */
  async createCreditsCheckout(userId: string, accountId: string, packId: string) {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) throw new BadRequestException('Pack de crédits inconnu.');
    await this.requireMember(userId, accountId);

    const webUrl = this.config.get<string>('APP_WEB_URL') ?? 'https://app.les-extras.fr';
    const session = await this.stripe('/checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(pack.amountCents),
      'line_items[0][price_data][product_data][name]': `Les Extras — LEX ${pack.label} (${pack.credits} crédits)`,
      success_url: `${webUrl}/dashboard/adhesion?paiement=succes`,
      cancel_url: `${webUrl}/dashboard/adhesion?paiement=annule`,
      'metadata[kind]': 'credits',
      'metadata[accountId]': accountId,
      'metadata[packId]': pack.id,
      client_reference_id: accountId,
    });

    await this.prisma.creditPurchase.create({
      data: {
        accountId,
        userId,
        packId: pack.id,
        credits: pack.credits,
        amountCents: pack.amountCents,
        stripeSessionId: String(session.id),
        status: 'PENDING',
      },
    });

    return { url: String(session.url) };
  }

  /**
   * Vérifie la signature Stripe (header `stripe-signature`) sur le corps BRUT.
   * Implémentation manuelle du schéma t=...,v1=... (HMAC-SHA256), sans SDK.
   */
  private verifySignature(rawBody: Buffer, header: string | undefined) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException(
        "Webhook indisponible : STRIPE_WEBHOOK_SECRET n'est pas configurée.",
      );
    }
    if (!header) throw new UnauthorizedException('Signature absente.');

    const parts = new Map(
      header.split(',').map((kv) => kv.split('=', 2) as [string, string]),
    );
    const t = parts.get('t');
    const v1 = parts.get('v1');
    if (!t || !v1) throw new UnauthorizedException('Signature invalide.');

    const age = Math.abs(Date.now() / 1000 - Number(t));
    if (!Number.isFinite(age) || age > WEBHOOK_TOLERANCE_S) {
      throw new UnauthorizedException('Signature expirée.');
    }

    const expected = createHmac('sha256', secret)
      .update(`${t}.${rawBody.toString('utf8')}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Signature invalide.');
    }
  }

  /**
   * Webhook Stripe : sur `checkout.session.completed`, marque l'achat PAID et
   * crédite le compte + grand livre dans la même transaction (idempotent).
   */
  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    this.verifySignature(rawBody, signature);

    const event = JSON.parse(rawBody.toString('utf8')) as {
      type: string;
      data: {
        object: {
          id: string;
          payment_status?: string;
          customer?: string;
          subscription?: string;
          status?: string;
          current_period_end?: number;
          metadata?: Record<string, string>;
        };
      };
    };

    // Cycle de vie d'un abonnement (renouvellement, impayé, résiliation).
    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object;
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : (sub.status ?? 'active');
      await this.prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : undefined,
        },
      });
      return { received: true };
    }

    if (event.type !== 'checkout.session.completed') {
      return { received: true, ignored: event.type };
    }
    const session = event.data.object;
    if (session.payment_status && !['paid', 'no_payment_required'].includes(session.payment_status)) {
      return { received: true, ignored: 'not_paid' };
    }

    const kind = session.metadata?.kind;

    // Abonnement souscrit : activer et mémoriser les identifiants Stripe.
    if (kind === 'subscription') {
      const accountId = session.metadata?.accountId;
      if (accountId) {
        await this.prisma.subscription.updateMany({
          where: { accountId },
          data: {
            status: 'active',
            stripeCustomerId: session.customer ?? undefined,
            stripeSubscriptionId: session.subscription ?? undefined,
          },
        });
        // Dotation immédiate : on ne fait pas patienter jusqu'au 1er du
        // mois quelqu'un qui vient de payer. La dotation est idempotente,
        // le cron mensuel ne la servira donc pas deux fois.
        const planId = session.metadata?.planId;
        const plan = this.tousLesPlans().find((p) => p.id === planId);
        if (plan) {
          await this.credits
            .amorcerDotation(accountId, plan.monthlyCredits)
            .catch((e) => this.logger.error(`Dotation initiale impossible pour ${accountId}: ${e}`));
        }
        this.logger.log(`Abonnement activé pour ${accountId}`);
      }
      return { received: true };
    }

    // Paiement en une fois d'une facture : passer la facture en PAID.
    if (kind === 'invoice') {
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        await this.prisma.invoice.updateMany({
          where: { id: invoiceId, status: { not: 'PAID' } },
          data: { status: 'PAID' },
        });
        this.logger.log(`Facture ${invoiceId} payée en une fois via Stripe`);
      }
      return { received: true };
    }

    // Achat d'un pack de crédits LEX : marquer PAID et créditer le compte
    // dans la même transaction. L'idempotence tient au verrou sur le statut :
    // une relivraison Stripe retombe sur PAID et ne crédite pas deux fois.
    if (kind === 'credits') {
      await this.prisma.$transaction(async (tx) => {
        const purchase = await tx.creditPurchase.findUnique({
          where: { stripeSessionId: session.id },
        });
        if (!purchase) {
          this.logger.warn(`Webhook crédits: session inconnue ${session.id}`);
          return;
        }
        if (purchase.status === 'PAID') return; // déjà traité (relivraison)

        const account = await tx.account.update({
          where: { id: purchase.accountId },
          data: { credits: { increment: purchase.credits } },
          select: { credits: true },
        });
        await tx.creditPurchase.update({
          where: { id: purchase.id },
          data: { status: 'PAID' },
        });
        await tx.creditLedger.create({
          data: {
            accountId: purchase.accountId,
            delta: purchase.credits,
            balanceAfter: account.credits,
            reason: 'ACHAT_PACK',
          },
        });
        this.logger.log(
          `LEX ${purchase.packId} payé : +${purchase.credits} crédits pour ${purchase.accountId}`,
        );
      });
      return { received: true };
    }

    // Les paiements Stripe connus sont l'abonnement LEX, le règlement d'une
    // facture et l'achat de crédits, tous traités plus haut. Toute autre
    // session est ignorée sans erreur.
    this.logger.warn(`Webhook: session sans traitement associé (${session.id})`);
    return { received: true };
  }
}
