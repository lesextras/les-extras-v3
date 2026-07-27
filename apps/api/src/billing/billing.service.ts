import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Packs de crédits vendus via Stripe Checkout.
 * Montants en centimes d'euro — AJUSTABLES avant mise en production réelle.
 */
export const CREDIT_PACKS = [
  { id: 'pack-10', label: 'Pack Découverte', credits: 10, amountCents: 9000 },
  { id: 'pack-25', label: 'Pack Équipe', credits: 25, amountCents: 20000 },
  { id: 'pack-60', label: 'Pack Établissement', credits: 60, amountCents: 42000 },
] as const;

/**
 * Plans d'abonnement mensuel (Stripe Checkout mode=subscription).
 * Montants en centimes d'euro — AJUSTABLES avant mise en production réelle.
 */
export const SUBSCRIPTION_PLANS = [
  { id: 'plan-essentiel', label: 'Essentiel', amountCents: 14900, perks: '5 crédits offerts / mois, accès marketplace complet' },
  { id: 'plan-pro', label: 'Pro', amountCents: 29900, perks: '15 crédits offerts / mois, support prioritaire, stats avancées' },
] as const;

const STRIPE_API = 'https://api.stripe.com/v1';
/** Tolérance sur l'horodatage de la signature webhook (anti-rejeu). */
const WEBHOOK_TOLERANCE_S = 300;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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

  listPacks() {
    return CREDIT_PACKS.map((p) => ({ ...p, currency: 'eur' }));
  }

  listPlans() {
    return SUBSCRIPTION_PLANS.map((p) => ({ ...p, currency: 'eur', interval: 'month' }));
  }

  /** Vue d'ensemble facturation d'un compte : abonnement + solde + offres. */
  async overview(userId: string, accountId: string) {
    await this.requireEstablishmentMember(userId, accountId, false);
    const [account, subscription] = await this.prisma.$transaction([
      this.prisma.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { credits: true },
      }),
      this.prisma.subscription.findUnique({ where: { accountId } }),
    ]);
    return {
      balance: account.credits,
      subscription,
      packs: this.listPacks(),
      plans: this.listPlans(),
      configured: Boolean(this.config.get<string>('STRIPE_SECRET_KEY')),
    };
  }

  /** Membre ACTIF d'un compte ESTABLISHMENT ; roles OWNER/ADMIN si demandé. */
  private async requireEstablishmentMember(
    userId: string,
    accountId: string,
    manageRole = true,
  ) {
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
    if (membership.account.type !== 'ESTABLISHMENT') {
      throw new BadRequestException(
        'La facturation ne concerne que les comptes établissement.',
      );
    }
    return membership;
  }

  /**
   * Crée une session Stripe Checkout pour un pack de crédits.
   * Réservé aux membres actifs OWNER/ADMIN d'un compte ESTABLISHMENT.
   */
  async createCheckout(userId: string, accountId: string, packId: string) {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) throw new BadRequestException('Pack inconnu.');

    await this.requireEstablishmentMember(userId, accountId);

    const webUrl = this.config.get<string>('APP_WEB_URL') ?? 'https://app.les-extras.fr';
    const session = await this.stripe('/checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(pack.amountCents),
      'line_items[0][price_data][product_data][name]': `Les Extras — ${pack.label} (${pack.credits} crédits)`,
      success_url: `${webUrl}/dashboard/credits?paiement=succes`,
      cancel_url: `${webUrl}/dashboard/credits?paiement=annule`,
      'metadata[kind]': 'credit_pack',
      'metadata[accountId]': accountId,
      'metadata[packId]': pack.id,
      'metadata[credits]': String(pack.credits),
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
      },
    });

    return { url: String(session.url) };
  }

  /**
   * Abonnement mensuel via Stripe Checkout (mode subscription).
   * Un seul abonnement par compte : refuse si un abonnement actif existe déjà.
   */
  async createSubscriptionCheckout(userId: string, accountId: string, planId: string) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) throw new BadRequestException('Plan inconnu.');
    await this.requireEstablishmentMember(userId, accountId);

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
      success_url: `${webUrl}/dashboard/credits?paiement=succes`,
      cancel_url: `${webUrl}/dashboard/credits?paiement=annule`,
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
   * Paiement en une fois d'une facture émise (mode payment, sans crédits).
   * La facture passe PAID à la réception du webhook.
   */
  async createInvoiceCheckout(userId: string, accountId: string, invoiceId: string) {
    await this.requireEstablishmentMember(userId, accountId);
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.accountId !== accountId) {
      throw new BadRequestException('Facture introuvable sur ce compte.');
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
      success_url: `${webUrl}/dashboard/finance?paiement=succes`,
      cancel_url: `${webUrl}/dashboard/finance?paiement=annule`,
      'metadata[kind]': 'invoice',
      'metadata[accountId]': accountId,
      'metadata[invoiceId]': invoice.id,
      client_reference_id: accountId,
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

    await this.prisma.$transaction(async (tx) => {
      // Verrou d'idempotence : on ne crédite qu'une seule fois par session.
      const purchase = await tx.creditPurchase.findUnique({
        where: { stripeSessionId: session.id },
      });
      if (!purchase) {
        this.logger.warn(`Webhook: session inconnue ${session.id}`);
        return;
      }
      if (purchase.status === 'PAID') return; // déjà traité (relivraison Stripe)

      const account = await tx.account.findUniqueOrThrow({
        where: { id: purchase.accountId },
        select: { credits: true },
      });
      const balanceAfter = account.credits + purchase.credits;

      await tx.creditPurchase.update({
        where: { id: purchase.id },
        data: { status: 'PAID' },
      });
      await tx.account.update({
        where: { id: purchase.accountId },
        data: { credits: balanceAfter },
      });
      await tx.creditLedger.create({
        data: {
          accountId: purchase.accountId,
          delta: purchase.credits,
          balanceAfter,
          reason: 'STRIPE_PURCHASE',
        },
      });
      this.logger.log(
        `Achat ${purchase.packId} payé : +${purchase.credits} crédits pour ${purchase.accountId}`,
      );
    });

    return { received: true };
  }
}
