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
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from './credits.service';
import { EcoleService } from '../ecole/ecole.service';
import { BoutiqueService } from '../boutique/boutique.service';
import { StripeConnectService } from '../paiements/stripe-connect.service';
import { MailService } from '../common/mail/mail.service';
import { AttestationsService } from '../attestations/attestations.service';
import { FREE_MONTHLY_CREDITS, ROLLOVER_MONTHS } from './credits.constants';
import { rolesActifs } from '../common/roles';


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
 *      devient le payeur principal (ESTABLISHMENT_PLAN) — mais il paie pour
 *      LEX, jamais pour la mise en relation, qui reste gratuite des deux
 *      côtés (voir le recadrage du 2 septembre 2026 sur ESTABLISHMENT_PLAN).
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
    perks: '200 générations par mois, reportables, écriture, activités, fiches',
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
 * Abonnement ÉTABLISSEMENT — LEX pour toute l'équipe, et RIEN D'AUTRE.
 *
 * ── Recadrage du 2 septembre 2026, décidé par Siham ──────────────────────
 * Ce plan promettait « RenforTeam illimité, 0 % de commission, coffre-fort
 * de conformité ». C'était un contresens sur notre propre modèle, et une
 * promesse VIDE : RenforTeam est déjà illimité pour tout le monde, la
 * commission est déjà à zéro pour tout le monde (`commission.ts`), et le
 * coffre-fort de conformité est déjà ouvert à tous. Le plan facturait
 * 89 €/mois des choses que le compte gratuit contient déjà — un directeur
 * qui compare les deux colonnes le voit en dix secondes et perd confiance.
 *
 * Pire : la gratuité du renfort est désormais assumée PUBLIQUEMENT comme
 * différenciateur permanent face aux plateformes qui prélèvent (Brigad
 * facture 10 % HT à l'établissement et 15 % TTC au professionnel ; Hublo ne
 * publie aucun tarif et facture 2 000 à 3 000 € HT le recrutement direct
 * d'un profil de son vivier). Garder « RenforTeam illimité » derrière un
 * paywall contredisait cette promesse mot pour mot.
 *
 * Ce que l'abonnement achète RÉELLEMENT, et lui seul : LEX pour toute
 * l'équipe (1 000 générations mensuelles que le titulaire RÉPARTIT entre les
 * personnes de son choix via les enveloppes LEX, `enveloppes.service.ts`,
 * depuis « 1 compte = 1 personne » du 24/09/2026 : chacun garde son compte,
 * le titulaire voit les chiffres et jamais les écrits), et la
 * PUBLICATION DE TRAMES À PORTÉE ÉTABLISSEMENT — la trame maison d'un chef
 * de service devient le gabarit de tout le monde (`TrameMaison.portee =
 * ETABLISSEMENT`, réservée OWNER/ADMIN/MANAGER). C'est le seul avantage que
 * le compte gratuit ne donne pas, et c'est le vrai argument.
 *
 * La mise en relation, les missions, les ateliers, la contractualisation et
 * la conformité restent gratuits, avec ou sans cet abonnement.
 */
export const ESTABLISHMENT_PLAN = {
  id: 'plan-etablissement',
  label: 'LEX Équipe, établissement',
  amountCents: 8900,
  monthlyCredits: 1000,
  perks:
    'LEX pour toute l’équipe : 1 000 générations par mois que vous répartissez entre les personnes de votre choix, chacune avec son compte et un plafond mensuel (écran « Partager LEX »), et vos trames maison ouvertes à toute l’équipe. Vous voyez combien chacun utilise, jamais ce qu’il écrit. La mise en relation, les missions et la contractualisation restent gratuites, avec ou sans cet abonnement.',
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
    private readonly ecole: EcoleService,
    private readonly boutique: BoutiqueService,
    private readonly connect: StripeConnectService,
    private readonly mail: MailService,
    private readonly attestations: AttestationsService,
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

  /** Lecture Stripe (GET), même authentification que `stripe()`. */
  private async stripeGet(path: string) {
    const res = await fetch(`${STRIPE_API}${path}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    const json = (await res.json()) as Record<string, unknown> & {
      error?: { message?: string };
    };
    if (!res.ok) {
      this.logger.error(`Stripe ${path} → ${res.status}: ${json.error?.message}`);
      throw new BadRequestException(json.error?.message ?? 'Erreur Stripe inconnue.');
    }
    return json;
  }

  /**
   * Rattache la facture Stripe à l'achat de crédits, une fois payé.
   *
   * Hors transaction et jamais bloquant : les crédits sont déjà sur le
   * compte ; si Stripe ne répond pas, la facture reste consultable depuis
   * le tableau de bord Stripe et l'achat garde son statut PAID.
   */
  private async joindreFacture(stripeSessionId: string, invoiceId: string | null) {
    if (!invoiceId) return;
    try {
      const facture = (await this.stripeGet(`/invoices/${invoiceId}`)) as {
        hosted_invoice_url?: string | null;
      };
      await this.prisma.creditPurchase.update({
        where: { stripeSessionId },
        data: {
          stripeInvoiceId: invoiceId,
          factureUrl: facture.hosted_invoice_url ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Facture ${invoiceId} non rattachée à ${stripeSessionId}: ${err instanceof Error ? err.message : err}`,
      );
    }
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
    // Les achats réglés, avec leur facture Stripe quand elle a pu être
    // rattachée : la structure retrouve son justificatif sans quitter la page.
    const achats = (
      await this.prisma.creditPurchase.findMany({
        where: { accountId, status: 'PAID' },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          packId: true,
          credits: true,
          amountCents: true,
          paidAt: true,
          createdAt: true,
          factureUrl: true,
        },
      })
    ).map((a) => ({
      ...a,
      label: CREDIT_PACKS.find((p) => p.id === a.packId)?.label ?? a.packId,
    }));
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
      achats,
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
    // Plus de rôles sur Les Extras (24/09/2026) ; Piloter garde ses droits d'accès.
    if (manageRole && rolesActifs(membership.account.type) && !['OWNER', 'ADMIN'].includes(membership.role)) {
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

    const webUrl = this.config.get<string>('APP_WEB_URL') ?? 'https://les-extras.fr';
    const session = await this.stripe('/checkout/sessions', {
      mode: 'subscription',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(plan.amountCents),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][price_data][product_data][name]': `Les Extras, Abonnement ${plan.label}`,
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
   * CE QUI NE PASSERA PAS PAR LA PLATEFORME, ET POURQUOI. Encaisser sur le compte Stripe de
   * l'association une facture émise par un intervenant indépendant, c'est
   * recevoir des fonds pour le compte d'un tiers : un service de paiement au
   * sens de l'article L. 314-1 du code monétaire et financier, dont la
   * fourniture à titre habituel est réservée aux établissements agréés
   * (art. L. 521-2 et L. 522-1 CMF). L'association n'a ni agrément
   * d'établissement de paiement, ni statut d'agent, ni exemption applicable.
   * C'est un choix arrêté, pas une étape : la plateforme n'encaissera pas les
   * missions. Seules les factures qu'elle émet elle-même — formations et
   * crédits LEX — s'encaissent en ligne. Les factures d'intervenants se
   * règlent par virement, directement d'établissement à intervenant, comme le
   * dit déjà le reste du produit (« la plateforme ne perçoit pas les paiements
   * des missions »). Ne pas rouvrir ce chemin sans agrément.
   */
  async createInvoiceCheckout(userId: string, accountId: string, invoiceId: string) {
    await this.requireMember(userId, accountId);
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.payerAccountId !== accountId) {
      throw new BadRequestException('Facture introuvable sur ce compte.');
    }
    const plateforme = await this.compteDeLaPlateforme();
    if (!plateforme || invoice.accountId !== plateforme) {
      // Le message annonçait « IBAN sur la facture » alors qu'aucun IBAN n'y
      // figurait : renseigner ses coordonnées bancaires reste facultatif pour
      // l'émetteur, et beaucoup de factures sortent sans. On dit donc où
      // regarder sans promettre ce qui s'y trouve.
      throw new NotImplementedException(
        "Les factures d'intervenants ne se règlent pas en ligne : l'établissement paie l'intervenant par virement, selon les coordonnées bancaires indiquées par l'émetteur sur sa facture. Si elles n'y figurent pas, demande-les-lui. Seules les factures de l'association, formations et crédits LEX, se règlent par carte.",
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

    const webUrl = this.config.get<string>('APP_WEB_URL') ?? 'https://les-extras.fr';
    const session = await this.stripe('/checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(amountCents),
      'line_items[0][price_data][product_data][name]': `Les Extras, Facture ${invoice.number}`,
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

    const webUrl = this.config.get<string>('APP_WEB_URL') ?? 'https://les-extras.fr';
    const session = await this.stripe('/checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(pack.amountCents),
      'line_items[0][price_data][product_data][name]': `Les Extras, LEX ${pack.label} (${pack.credits} crédits)`,
      success_url: `${webUrl}/dashboard/adhesion?paiement=succes`,
      cancel_url: `${webUrl}/dashboard/adhesion?paiement=annule`,
      'metadata[kind]': 'credits',
      'metadata[accountId]': accountId,
      'metadata[packId]': pack.id,
      client_reference_id: accountId,
      // Une facture Stripe est émise au paiement : c'est elle qui vaut
      // justificatif comptable pour la structure. Son lien est rattaché à
      // l'achat par le webhook, puis affiché sur la page LEX.
      'invoice_creation[enabled]': 'true',
      'invoice_creation[invoice_data][description]': `LEX, ${pack.label} (${pack.credits} générations), Les Extras`,
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
          invoice?: string | null;
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

    // ═══════════════════════ LES ECHEANCES SUIVANTES D'UN REGLEMENT ETALE ══
    //
    // La premiere echeance arrive par `checkout.session.completed`, comme un
    // paiement ordinaire. Les suivantes n'ont pas de session : elles arrivent
    // en factures. C'est ici qu'on les compte, et surtout qu'on ARRETE
    // l'echeancier des que le compte y est — un acheteur ne doit jamais etre
    // preleve plus que ce qu'il a accepte.
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const facture = event.data.object as unknown as {
        id?: string;
        subscription?: string | null;
        billing_reason?: string | null;
        amount_paid?: number;
        amount_due?: number;
      };
      const abonnement = typeof facture.subscription === 'string' ? facture.subscription : null;
      if (!abonnement) return { received: true, ignored: 'facture_sans_echeancier' };

      const vente = await this.prisma.venteCours.findUnique({
        where: { stripeAbonnementId: abonnement },
        select: {
          id: true,
          echeances: true,
          echeancesPayees: true,
          montantCents: true,
          email: true,
          accountId: true,
          coursId: true,
        },
      });
      if (!vente) return { received: true, ignored: 'echeancier_inconnu' };

      if (event.type === 'invoice.payment_failed') {
        // ON NE COUPE PAS L'ACCES. Une carte qui expire n'est pas un impaye,
        // et priver un apprenant de sa formation sur un incident technique
        // ferait plus de degats que le centime en jeu. On previent, et
        // l'organisme decide.
        await this.prisma.venteCours.update({
          where: { id: vente.id },
          data: {
            incidentAt: new Date(),
            incidentMotif: `Prélèvement ${vente.echeancesPayees + 1} sur ${vente.echeances} refusé.`,
          },
        });
        // On previent l'organisme : sans message, l'argent manque et
        // personne ne s'en apercoit avant le bilan.
        try {
          const [compte, cours] = await Promise.all([
            this.prisma.account.findUnique({
              where: { id: vente.accountId },
              select: { contactEmail: true },
            }),
            vente.coursId
              ? this.prisma.cours.findUnique({
                  where: { id: vente.coursId },
                  select: { titre: true },
                })
              : Promise.resolve(null),
          ]);
          if (compte?.contactEmail) {
            await this.mail.sendEcheanceRefusee({
              to: compte.contactEmail,
              formation: cours?.titre ?? 'une formation',
              apprenant: vente.email,
              rang: vente.echeancesPayees + 1,
              total: vente.echeances,
              montantCents: Number(facture.amount_due ?? 0),
              lienEspace: 'https://pilote.toulali.fr/academie',
            });
          }
        } catch {
          this.logger.warn(`Alerte d'échéance refusée non envoyée pour la vente ${vente.id}.`);
        }
        this.logger.warn(`Échéance refusée sur la vente ${vente.id} (${vente.email}).`);
        return { received: true };
      }

      // La premiere facture est deja comptee par la session : la recompter
      // ferait avancer l'echeancier d'un cran de trop des la souscription.
      if (facture.billing_reason === 'subscription_create') {
        return { received: true, ignored: 'premiere_echeance_deja_comptee' };
      }

      const payees = Math.min(vente.echeances, vente.echeancesPayees + 1);
      await this.prisma.venteCours.update({
        where: { id: vente.id },
        data: {
          echeancesPayees: payees,
          montantCents: vente.montantCents + Number(facture.amount_paid ?? 0),
          incidentAt: null,
          incidentMotif: null,
        },
      });

      if (payees >= vente.echeances) {
        // Le compte y est : on ferme, tout de suite. La periode en cours est
        // payee, il n'y a rien a rembourser.
        try {
          await this.connect.arreterEcheancier(abonnement);
          this.logger.log(`Échéancier ${abonnement} soldé et arrêté.`);
        } catch {
          // La date de fin posee a la souscription reste le filet.
          this.logger.warn(`Échéancier ${abonnement} soldé mais non arrêté : la date de fin prendra le relais.`);
        }
      }
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
          data: { status: 'PAID', paidAt: new Date() },
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
      await this.joindreFacture(session.id, session.invoice ?? null);
      return { received: true };
    }

    /**
     * ACHAT D'UNE ATTESTATION DE SUIVI.
     *
     * ⚠ L'IDEMPOTENCE EST DANS `AttestationsService.confirmerPaiement` : verrou
     * sur le statut, plus la contrainte d'unicité sur `stripeSessionId`. Une
     * relivraison de Stripe retombe sur une commande déjà payée et ne fait
     * rien — surtout, elle ne relance pas le courriel d'accusé.
     */
    if (kind === 'attestation') {
      await this.attestations.confirmerPaiement(session.id);
      return { received: true };
    }

    // ACHAT D'UNE FORMATION EN LIGNE.
    //
    // Rien n'a été créé au moment du clic : c'est ici que l'apprenant est
    // inscrit et la vente enregistrée. L'idempotence tient à
    // `VenteCours.stripeSessionId`, unique : une relivraison de Stripe
    // retombe sur la vente existante et n'inscrit personne deux fois.
    if (kind === 'cours') {
      const coursId = session.metadata?.coursId;
      const accountId = session.metadata?.accountId;
      const email = session.metadata?.email?.trim().toLowerCase();
      if (!coursId || !accountId || !email) {
        this.logger.warn(`Webhook cours: session incomplète ${session.id}`);
        return { received: true };
      }

      const deja = await this.prisma.venteCours.findUnique({
        where: { stripeSessionId: session.id },
        select: { id: true },
      });
      if (deja) return { received: true, ignored: 'deja_traite' };

      const montant = Number((session as unknown as { amount_total?: number }).amount_total ?? 0);
      const nom = session.metadata?.nom ?? null;

      // L'ECHEANCIER, QUAND IL Y EN A UN.
      //
      // `amount_total` ne vaut alors que la PREMIERE echeance : c'est bien ce
      // qui a ete encaisse, et le prix convenu est retenu a part. Confondre
      // les deux ferait apparaitre un bootcamp a 3 400 EUR comme une vente de
      // 850 EUR dans les recettes de l'organisme.
      const nbEcheances = Math.max(1, Number(session.metadata?.echeances ?? 1) || 1);
      const totalConvenu = Number(session.metadata?.total ?? 0) || montant;
      const abonnementId =
        typeof (session as unknown as { subscription?: string | null }).subscription === 'string'
          ? (session as unknown as { subscription: string }).subscription
          : null;

      // Le jeton d'accès, retenu hors de la transaction : c'est lui qu'on
      // enverra par courriel une fois la vente écrite.
      let jetonAcces: string | null = null;

      await this.prisma.$transaction(async (tx) => {
        const inscription = await tx.inscriptionCours.findUnique({
          where: { coursId_email: { coursId, email } },
          select: { id: true, jeton: true },
        });
        if (!inscription) {
          const creee = await tx.inscriptionCours.create({
            data: {
              coursId,
              email,
              nom,
              jeton: randomBytes(24).toString('base64url'),
            },
            select: { jeton: true },
          });
          jetonAcces = creee.jeton;
        } else {
          jetonAcces = inscription.jeton;
        }
        await tx.venteCours.create({
          data: {
            accountId,
            coursId,
            email,
            nom,
            // Ce qui vient d'etre encaisse : la premiere echeance, ou le tout.
            montantCents: montant,
            montantTotalCents: nbEcheances > 1 ? totalConvenu : null,
            echeances: nbEcheances,
            echeancesPayees: 1,
            stripeAbonnementId: abonnementId,
            statut: 'PAYEE',
            moyen: nbEcheances > 1 ? `Stripe (${nbEcheances} fois)` : 'Stripe',
            stripeSessionId: session.id,
            codePromo: session.metadata?.codePromo ?? null,
            affiliation: session.metadata?.affiliation ?? null,
          },
        });
        // Un code promo utilisé se compte : sans cela, « usageMax » ne veut rien dire.
        const code = session.metadata?.codePromo?.trim();
        if (code) {
          await tx.codePromo.updateMany({
            where: { accountId, code: code.toUpperCase() },
            data: { usages: { increment: 1 } },
          });
        }

        // L'AFFILIÉ EST PAYÉ SUR CETTE VENTE.
        //
        // La vente retenait déjà le code d'affiliation, mais les compteurs de
        // l'affilié ne bougeaient pas : sa page affichait zéro vente et zéro
        // gain, indéfiniment. On les met à jour ici, dans la même transaction
        // que la vente, pour qu'un compteur ne puisse jamais avancer sans
        // qu'une vente existe en face.
        const parrain = session.metadata?.affiliation?.trim();
        if (parrain) {
          const a = await tx.affilie.findFirst({
            where: { accountId, code: parrain, actif: true },
            select: { id: true, commissionPourcent: true },
          });
          if (a) {
            await tx.affilie.update({
              where: { id: a.id },
              data: {
                ventes: { increment: 1 },
                gainsCents: {
                  increment: Math.round((montant * a.commissionPourcent) / 100),
                },
              },
            });
          }
        }
      });

      // LA DATE DE FIN DE L'ECHEANCIER, posee tout de suite.
      //
      // L'arret propre se fait au comptage des echeances, mais si un seul
      // message du prestataire se perdait, le prelevement continuerait mois
      // apres mois. Cette borne est ce qui rend cette panne impossible. Une
      // marge de deux jours absorbe les decalages de facturation.
      if (abonnementId && nbEcheances > 1) {
        const fin = new Date();
        fin.setMonth(fin.getMonth() + nbEcheances - 1);
        fin.setDate(fin.getDate() + 2);
        try {
          await this.connect.bornerEcheancier(abonnementId, Math.floor(fin.getTime() / 1000));
        } catch {
          this.logger.warn(`Échéancier ${abonnementId} : date de fin non posée.`);
        }
      }

      // LE MESSAGE D'ACCÈS. Il part après la transaction, jamais dedans : un
      // serveur SMTP lent ne doit pas tenir une transaction ouverte, et un
      // envoi qui échoue ne doit pas annuler une vente déjà encaissée.
      if (jetonAcces) {
        const cours = await this.prisma.cours.findUnique({
          where: { id: coursId },
          select: { titre: true },
        });
        await this.ecole.envoyerAcces({
          email,
          accountId,
          titre: cours?.titre ?? 'votre formation',
          jeton: jetonAcces,
          paye: true,
          montantCents: montant,
          origine: session.metadata?.origine ?? null,
        });
      }

      this.logger.log(`Formation ${coursId} payée par ${email}`);
      return { received: true };
    }

    // UNE COMMANDE DE BOUTIQUE.
    //
    // Comme pour la formation, rien n'a été créé au moment du clic : la
    // commande et le décompte de stock naissent ici, une seule fois, garantis
    // par l'unicité de `stripeSessionId`.
    if (kind === 'boutique') {
      const accountId = session.metadata?.accountId;
      const email = session.metadata?.email?.trim().toLowerCase();
      const brut = session.metadata?.panier;
      if (!accountId || !email || !brut) {
        this.logger.warn(`Webhook boutique: session incomplète ${session.id}`);
        return { received: true };
      }
      let panier: { i: string; q: number }[] = [];
      try {
        const lu = JSON.parse(brut) as unknown;
        if (Array.isArray(lu)) {
          panier = lu
            .filter(
              (l): l is { i: string; q: number } =>
                typeof (l as { i?: unknown }).i === 'string' &&
                typeof (l as { q?: unknown }).q === 'number',
            )
            .map((l) => ({ i: l.i, q: Math.max(1, Math.min(50, Math.round(l.q))) }));
        }
      } catch {
        panier = [];
      }
      if (!panier.length) {
        this.logger.warn(`Webhook boutique: panier illisible ${session.id}`);
        return { received: true };
      }
      const montant = Number(
        (session as unknown as { amount_total?: number }).amount_total ?? 0,
      );
      await this.boutique.enregistrerCommandePayee({
        sessionId: session.id,
        accountId,
        email,
        montantCents: montant,
        portCents: Number(session.metadata?.port ?? 0) || 0,
        panier,
        nom: session.metadata?.nom ?? null,
        telephone: session.metadata?.tel ?? null,
        adresse: session.metadata?.adresse ?? null,
        codePostal: session.metadata?.cp ?? null,
        ville: session.metadata?.ville ?? null,
        pays: session.metadata?.pays ?? null,
        origine: session.metadata?.origine ?? null,
      });
      this.logger.log(`Commande de boutique payée par ${email}`);
      return { received: true };
    }

    // Les paiements Stripe connus sont l'abonnement LEX, le règlement d'une
    // facture, l'achat de crédits, l'achat d'une formation et la commande
    // d'un produit de boutique, tous traités plus haut. Toute autre session
    // est ignorée sans erreur.
    this.logger.warn(`Webhook: session sans traitement associé (${session.id})`);
    return { received: true };
  }
}
