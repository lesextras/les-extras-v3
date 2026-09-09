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
    methode: 'GET' | 'POST' | 'DELETE' = 'POST',
    /**
     * Le compte connecte AU NOM DUQUEL agir (`acct_...`).
     *
     * Sans lui, l'appel se fait pour la plateforme. Avec lui, Stripe traite la
     * demande comme si elle venait du compte de l'organisme : c'est ce qui
     * distingue un paiement encaisse chez lui d'un paiement encaisse chez nous
     * puis reverse.
     */
    compteConnecte?: string,
  ): Promise<T> {
    const corps = params ? new URLSearchParams(params).toString() : undefined;
    const url =
      methode !== 'POST' && corps
        ? `https://api.stripe.com/v1/${chemin}?${corps}`
        : `https://api.stripe.com/v1/${chemin}`;
    const res = await fetch(url, {
      method: methode,
      headers: {
        Authorization: `Bearer ${this.cle()}`,
        ...(compteConnecte ? { 'Stripe-Account': compteConnecte } : {}),
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
        // Un exemple sur cent euros : c'est plus parlant qu'un pourcentage.
        exemple: this.estimation(10000, compte.commissionVentePourcent),
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
      exemple: this.estimation(10000, compte.commissionVentePourcent),
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
   * CE QUE LE PRESTATAIRE DE PAIEMENT PRÉLÈVE, en centimes.
   *
   * Sur un versement direct, c'est la plateforme qui règle les frais du
   * prestataire, même quand l'argent part chez l'organisme. Sans les
   * répercuter, la plateforme paierait de sa poche chaque vente faite par
   * quelqu'un d'autre — ce n'est pas tenable.
   *
   * Le barème retenu est le tarif standard européen : 1,5 % du montant plus
   * 25 centimes. Une carte non européenne coûte davantage ; dans ce cas la
   * plateforme reste très légèrement en dessous du compte, et c'est assumé —
   * mieux vaut sous-estimer que prélever à l'organisme plus que le coût réel.
   */
  private static fraisPrestataire(montantCents: number): number {
    return Math.round(montantCents * 0.015) + 25;
  }

  /**
   * LES PARAMÈTRES À AJOUTER À UN PAIEMENT pour que l'argent aille chez
   * l'organisme et non chez la plateforme.
   *
   * Renvoie un objet vide quand aucun compte n'est relié : la vente se fait
   * alors comme avant, sur le compte de la plateforme. C'est ce qui permet de
   * poser ce mécanisme sans rien casser de ce qui tourne déjà.
   *
   * Ce qui est retenu se lit en deux parts. La première couvre les frais du
   * prestataire de paiement, que la plateforme avance : elle n'est pas un
   * gain, elle remet les comptes à zéro. La seconde est la part que la
   * plateforme décide de prendre en plus — à zéro par défaut, et c'est le
   * réglage recommandé : la plateforme ne perd rien et ne prend rien.
   *
   * Le total ne peut jamais dépasser le montant encaissé : on ne renvoie pas
   * un organisme avec un versement négatif.
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
    const frais = StripeConnectService.fraisPrestataire(montantCents);
    const part = Math.floor((montantCents * compte.commissionVentePourcent) / 100);
    const retenu = Math.min(frais + part, Math.max(0, montantCents - 1));
    if (retenu > 0) params['payment_intent_data[application_fee_amount]'] = String(retenu);
    return params;
  }

  /* ══════════════════════════════ la vente encaissee par l'organisme ══════ */

  /**
   * LE COMPTE D'ENCAISSEMENT D'UN ORGANISME, quand il est utilisable.
   *
   * Renvoie `null` des qu'il manque quelque chose. Aucun appel ne doit se
   * rabattre silencieusement sur le compte de la plateforme : sur une vente
   * directe, encaisser a la place de quelqu'un serait exactement le contraire
   * de ce qui est promis a l'acheteur sur la fiche.
   */
  async compteEncaisseur(accountId: string): Promise<string | null> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { stripeCompteId: true, stripeComptePret: true },
    });
    if (!compte?.stripeCompteId || !compte.stripeComptePret) return null;
    return compte.stripeCompteId;
  }

  /**
   * UN PAIEMENT ENCAISSE DIRECTEMENT PAR L'ORGANISME.
   *
   * Deux facons de faire passer l'argent chez quelqu'un d'autre existent chez
   * le prestataire, et elles ne se valent pas.
   *
   * Le VERSEMENT (`parametresDeVersement`, plus haut) encaisse sur le compte de
   * la plateforme puis reverse : c'est la plateforme qui figure sur le releve
   * bancaire de l'acheteur, c'est elle qui avance les frais, et c'est elle qui
   * se fait reprendre l'argent en cas de contestation de carte — meme si
   * l'organisme a deja ete paye. C'est acceptable quand la plateforme vend ses
   * propres produits.
   *
   * La VENTE DIRECTE, ici, encaisse SUR le compte de l'organisme. Il est le
   * vendeur : son nom sur le releve, ses frais de prestataire, sa
   * responsabilite en cas de litige, et lui seul peut rembourser. C'est la
   * seule forme honnete quand la prestation est rendue par lui et pas par
   * nous. La plateforme ne retient que sa part, nulle par defaut — d'ou
   * l'absence, ici, de la recuperation de frais qui existe sur le versement :
   * ces frais-la ne sont plus les siens.
   *
   * Renvoie `null` quand l'organisme n'a pas de compte utilisable. L'appelant
   * doit alors REFUSER la vente, pas la basculer ailleurs.
   */
  async venteDirecte(
    accountId: string,
    montantCents: number,
  ): Promise<{ compte: string; params: Record<string, string>; partPlateformeCents: number } | null> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { stripeCompteId: true, stripeComptePret: true, commissionVentePourcent: true },
    });
    if (!compte?.stripeCompteId || !compte.stripeComptePret) return null;

    const part = Math.floor((montantCents * compte.commissionVentePourcent) / 100);
    // Jamais tout le montant : un versement nul ferait passer l'organisme pour
    // paye alors qu'il ne toucherait rien.
    const retenu = Math.min(part, Math.max(0, montantCents - 1));
    const params: Record<string, string> = {};
    if (retenu > 0) params['payment_intent_data[application_fee_amount]'] = String(retenu);
    return { compte: compte.stripeCompteId, params, partPlateformeCents: retenu };
  }

  /**
   * LES PARAMETRES DE VERSEMENT POUR UN ECHEANCIER.
   *
   * Le prestataire ne prend pas les memes reglages sur un abonnement que sur
   * un paiement unique : la part de la plateforme s'y exprime en POURCENTAGE
   * de chaque prelevement, pas en centimes. On convertit donc la retenue
   * — frais avances + part de la plateforme — en un pourcentage de l'echeance.
   *
   * Le calcul se fait sur UNE echeance, et il le faut : les frais du
   * prestataire comportent une part fixe de 25 centimes qui est prelevee a
   * CHAQUE prelevement. Un echeancier en quatre fois coute donc quatre fois
   * cette part fixe, et c'est exactement ce que ce pourcentage recupere.
   *
   * Renvoie un objet vide quand aucun compte n'est relie : la vente suit alors
   * le chemin historique, sur le compte de la plateforme.
   */
  async parametresDeVersementAbonnement(
    accountId: string,
    montantEcheanceCents: number,
  ): Promise<Record<string, string>> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { stripeCompteId: true, stripeComptePret: true, commissionVentePourcent: true },
    });
    if (!compte?.stripeCompteId || !compte.stripeComptePret) return {};
    if (montantEcheanceCents <= 0) return {};

    const params: Record<string, string> = {
      'subscription_data[transfer_data][destination]': compte.stripeCompteId,
    };
    const frais = StripeConnectService.fraisPrestataire(montantEcheanceCents);
    const part = Math.floor((montantEcheanceCents * compte.commissionVentePourcent) / 100);
    const retenu = Math.min(frais + part, Math.max(0, montantEcheanceCents - 1));
    if (retenu > 0) {
      // Deux decimales : c'est la precision acceptee, et elle suffit — l'ecart
      // residuel sur une echeance se compte en fractions de centime.
      const pourcent = Math.min(100, Math.round((retenu / montantEcheanceCents) * 10000) / 100);
      if (pourcent > 0) params['subscription_data[application_fee_percent]'] = String(pourcent);
    }
    return params;
  }

  /**
   * ARRETE UN ECHEANCIER, tout de suite.
   *
   * Appele des que la derniere echeance est encaissee. C'est la garantie
   * qu'un acheteur ne sera jamais preleve plus que ce qu'il a accepte — la
   * seule erreur vraiment grave que ce mecanisme puisse commettre.
   */
  async arreterEcheancier(abonnementId: string): Promise<void> {
    await this.appel(`subscriptions/${abonnementId}`, undefined, 'DELETE');
  }

  /**
   * POSE UNE DATE DE FIN sur un echeancier, en secondes depuis l'epoque.
   *
   * Ceinture ET bretelles : l'arret propre se fait au comptage des echeances,
   * mais si un message du prestataire se perdait, cette date coupe malgre
   * tout. Sans elle, un webhook manque signifierait prelever indefiniment.
   */
  async bornerEcheancier(abonnementId: string, finTimestamp: number): Promise<void> {
    await this.appel(`subscriptions/${abonnementId}`, {
      cancel_at: String(finTimestamp),
    });
  }

  /** Ouvre une page de paiement SUR le compte de l'organisme. */
  async ouvrirPaiementDirect(
    compte: string,
    params: Record<string, string>,
  ): Promise<{ id: string; url: string }> {
    return this.appel<{ id: string; url: string }>(
      'checkout/sessions',
      params,
      'POST',
      compte,
    );
  }

  /**
   * L'ETAT D'UN PAIEMENT, relu sur le compte de l'organisme.
   *
   * Sert au retour de l'acheteur : on ne croit pas la page de retour sur
   * parole, on redemande au prestataire si l'argent est bien la.
   */
  async lireSessionDirecte(compte: string, sessionId: string) {
    return this.appel<{
      id: string;
      payment_status?: string;
      status?: string;
      amount_total?: number;
      currency?: string;
      payment_intent?: string;
      customer_details?: { email?: string | null; name?: string | null };
      metadata?: Record<string, string>;
    }>(`checkout/sessions/${sessionId}`, undefined, 'GET', compte);
  }

  /**
   * REMBOURSE, sur le compte de l'organisme et avec son argent.
   *
   * La part retenue par la plateforme est rendue en meme temps
   * (`refund_application_fee`) : garder une commission sur une prestation qui
   * n'a pas eu lieu ne se defend pas.
   */
  async rembourserDirect(compte: string, paymentIntentId: string, montantCents?: number) {
    const params: Record<string, string> = {
      payment_intent: paymentIntentId,
      refund_application_fee: 'true',
      'metadata[origine]': 'les-extras',
    };
    if (montantCents !== undefined) params.amount = String(montantCents);
    return this.appel<{ id: string; status?: string; amount?: number }>(
      'refunds',
      params,
      'POST',
      compte,
    );
  }

  /**
   * CE QUE L'ÉCRAN AFFICHE : ce qui serait retenu sur une vente donnée. Sert
   * uniquement à montrer un exemple honnête, jamais à décider quoi que ce soit.
   */
  estimation(montantCents: number, commissionVentePourcent: number) {
    const frais = StripeConnectService.fraisPrestataire(montantCents);
    const part = Math.floor((montantCents * commissionVentePourcent) / 100);
    return {
      montantCents,
      fraisPrestataireCents: frais,
      partPlateformeCents: part,
      verseCents: Math.max(0, montantCents - frais - part),
    };
  }
}
