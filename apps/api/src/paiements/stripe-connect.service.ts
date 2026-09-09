import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * RELIER SON PROPRE COMPTE D'ENCAISSEMENT.
 *
 * Jusqu'ici, toute vente — une formation, demain un produit de boutique —
 * arrivait sur le compte de la plateforme, quel que soit l'organisme qui
 * vendait. Cela convient à ADéPA, qui est la plateforme ; cela ne convient à
 * personne d'autre : une association ne confie pas sa recette à un tiers, et
 * la plateforme n'a aucune envie de détenir l'argent des autres.
 *
 * Le dossier d'identité (pièce, IBAN, représentant légal) se remplit
 * ENTIÈREMENT chez Stripe, sur ses pages : ni ce service ni cette application
 * ne voient jamais ces informations. Nous ne gardons que l'identifiant du
 * compte et l'état que Stripe nous en donne.
 */
@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private cle(): string {
    const cle = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!cle) {
      throw new ServiceUnavailableException(
        "Le paiement en ligne n'est pas branché sur ce serveur.",
      );
    }
    return cle;
  }

  /** Un appel à Stripe, en formulaire — l'API de Stripe ne parle pas JSON en entrée. */
  private async appel<T>(
    chemin: string,
    params?: Record<string, string>,
    methode: 'GET' | 'POST' = 'POST',
  ): Promise<T> {
    const corps = params ? new URLSearchParams(params).toString() : undefined;
    const url =
      methode === 'GET' && corps
        ? `https://api.stripe.com/v1/${chemin}?${corps}`
        : `https://api.stripe.com/v1/${chemin}`;
    const res = await fetch(url, {
      method: methode,
      headers: {
        Authorization: `Bearer ${this.cle()}`,
        ...(methode === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      body: methode === 'POST' ? corps : undefined,
    });
    const json = (await res.json()) as T & { error?: { message?: string; code?: string } };
    if (!res.ok) {
      const message = json.error?.message ?? 'Le prestataire de paiement a refusé la demande.';
      this.logger.warn(`Stripe ${chemin} → ${res.status} : ${message}`);
      // Le cas le plus fréquent, et le seul qui demande une action de la
      // plateforme elle-même : Connect n'est pas ouvert sur le compte.
      if (/Connect/i.test(message) || json.error?.code === 'account_invalid') {
        throw new ServiceUnavailableException(
          `Le compte d'encaissement de la plateforme n'est pas encore autorisé à relier d'autres comptes. ${message}`,
        );
      }
      throw new BadRequestException(message);
    }
    return json;
  }

  /* ══════════════════════════════════════════════════════ l'état ══════ */

  /**
   * Ce que l'écran affiche. Interroge Stripe quand un compte existe, pour ne
   * jamais annoncer « prêt » sur la foi d'un dossier commencé puis abandonné.
   */
  async etat(accountId: string) {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        name: true,
        contactEmail: true,
        stripeCompteId: true,
        stripeComptePret: true,
        commissionVentePourcent: true,
      },
    });
    if (!compte) throw new NotFoundException('Compte introuvable.');

    if (!compte.stripeCompteId) {
      return {
        relie: false as const,
        pret: false,
        compteId: null,
        versementsActifs: false,
        paiementsActifs: false,
        aFournir: [] as string[],
        commissionVentePourcent: compte.commissionVentePourcent,
      };
    }

    const distant = await this.appel<{
      id: string;
      charges_enabled?: boolean;
      payouts_enabled?: boolean;
      requirements?: { currently_due?: string[] };
    }>(`accounts/${compte.stripeCompteId}`, undefined, 'GET');

    const pret = Boolean(distant.charges_enabled);
    if (pret !== compte.stripeComptePret) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: { stripeComptePret: pret },
      });
    }

    return {
      relie: true as const,
      pret,
      compteId: distant.id,
      versementsActifs: Boolean(distant.payouts_enabled),
      paiementsActifs: Boolean(distant.charges_enabled),
      aFournir: distant.requirements?.currently_due ?? [],
      commissionVentePourcent: compte.commissionVentePourcent,
    };
  }

  /* ═══════════════════════════════════════════════════ le dossier ══════ */

  /**
   * Ouvre (ou rouvre) le dossier chez Stripe et renvoie l'adresse où le
   * remplir. Le lien est à usage unique et de courte durée : on en refabrique
   * un à chaque fois plutôt que d'en garder un qui aurait expiré.
   */
  async lier(accountId: string, retour: string) {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, name: true, contactEmail: true, stripeCompteId: true },
    });
    if (!compte) throw new NotFoundException('Compte introuvable.');

    let stripeId = compte.stripeCompteId;
    if (!stripeId) {
      const params: Record<string, string> = {
        type: 'express',
        country: 'FR',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        'business_profile[name]': compte.name.slice(0, 120),
        'metadata[accountId]': compte.id,
      };
      if (compte.contactEmail) params.email = compte.contactEmail;
      const cree = await this.appel<{ id: string }>('accounts', params);
      stripeId = cree.id;
      await this.prisma.account.update({
        where: { id: accountId },
        data: { stripeCompteId: stripeId },
      });
    }

    const racine = retour.replace(/\/$/, '');
    const lien = await this.appel<{ url: string }>('account_links', {
      account: stripeId,
      refresh_url: `${racine}?stripe=reprendre`,
      return_url: `${racine}?stripe=retour`,
      type: 'account_onboarding',
    });
    return { url: lien.url };
  }

  /** Le tableau de bord de l'organisme, chez Stripe. */
  async tableauDeBord(accountId: string) {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { stripeCompteId: true },
    });
    if (!compte?.stripeCompteId) {
      throw new BadRequestException("Aucun compte d'encaissement n'est relié.");
    }
    const lien = await this.appel<{ url: string }>(
      `accounts/${compte.stripeCompteId}/login_links`,
    );
    return { url: lien.url };
  }

  /**
   * Détache le compte de l'organisme. On ne supprime RIEN chez Stripe : les
   * paiements déjà passés, les justificatifs et l'historique appartiennent à
   * l'organisme, pas à nous. On oublie seulement le lien de notre côté.
   */
  async detacher(accountId: string) {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { stripeCompteId: null, stripeComptePret: false },
    });
    return { detache: true as const };
  }

  /** La part retenue par la plateforme sur les ventes de ce compte. */
  async definirCommission(accountId: string, pourcent: number) {
    if (!Number.isInteger(pourcent) || pourcent < 0 || pourcent > 50) {
      throw new BadRequestException('La part retenue va de 0 à 50 %.');
    }
    await this.prisma.account.update({
      where: { id: accountId },
      data: { commissionVentePourcent: pourcent },
    });
    return { commissionVentePourcent: pourcent };
  }

  /* ═════════════════════════════════════ ce que la vente en fait ══════ */

  /**
   * LES PARAMÈTRES À AJOUTER À UN PAIEMENT pour que l'argent aille chez
   * l'organisme et non chez la plateforme.
   *
   * Renvoie un objet vide quand aucun compte n'est relié : la vente se fait
   * alors comme avant, sur le compte de la plateforme. C'est ce qui permet de
   * poser ce mécanisme sans rien casser de ce qui tourne déjà.
   *
   * Le prélèvement est calculé sur le montant réellement encaissé. À 0 %, rien
   * n'est prélevé — et les frais du prestataire restent alors à la charge de
   * la plateforme, ce que l'écran dit sans détour.
   */
  async parametresDeVersement(
    accountId: string,
    montantCents: number,
  ): Promise<Record<string, string>> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { stripeCompteId: true, stripeComptePret: true, commissionVentePourcent: true },
    });
    if (!compte?.stripeCompteId || !compte.stripeComptePret) return {};

    const params: Record<string, string> = {
      'payment_intent_data[transfer_data][destination]': compte.stripeCompteId,
    };
    const part = Math.floor((montantCents * compte.commissionVentePourcent) / 100);
    if (part > 0) params['payment_intent_data[application_fee_amount]'] = String(part);
    return params;
  }
}
