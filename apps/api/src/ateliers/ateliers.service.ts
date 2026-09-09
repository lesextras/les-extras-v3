import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountType,
  ServiceCategory,
  ServiceStatus,
  StatutReservationAtelier,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { StripeConnectService } from '../paiements/stripe-connect.service';
import {
  PayerAtelierDto,
  ReglagePaiementDto,
  RemboursementDto,
  SuiviReservationDto,
} from './dto/ateliers.dto';

/**
 * PAYER UN ATELIER EN LIGNE.
 *
 * Ce qui existait — demande de devis, réservation par un compte établi, devis
 * chiffré, facture — n'est pas touché d'une ligne. Ce module AJOUTE un
 * troisième chemin, plus court, pour les acheteurs qui ne passeront jamais par
 * un devis : une petite structure, une famille, une association.
 *
 * TROIS CHOSES SONT VRAIES ICI ET NULLE PART AILLEURS DANS L'APPLICATION.
 *
 * 1. L'argent n'appartient pas à la plateforme et n'y transite pas. Le
 *    paiement est encaissé SUR le compte de l'intervenant : son nom sur le
 *    relevé de l'acheteur, ses frais de prestataire, sa responsabilité en cas
 *    de contestation. La plateforme ne retient que sa part, nulle par défaut.
 *
 * 2. La date reste un SOUHAIT. La fiche d'un atelier n'a pas d'agenda et rien
 *    ne vérifie la disponibilité de l'intervenant. Annoncer un créneau réservé
 *    serait un mensonge, alors on ne l'annonce pas — ni ici, ni dans les
 *    messages, ni sur l'écran.
 *
 * 3. Rien ne s'écrit avant que le prestataire ait confirmé le paiement. La
 *    page de retour ne fait pas foi : on relit la session chez lui.
 *
 * ET UNE QUATRIÈME, QUI TIENT LES TROIS AUTRES : SEUL UN INTERVENANT PEUT
 * ENCAISSER UN ATELIER.
 *
 * Une fiche d'atelier peut appartenir, techniquement, à n'importe quel type de
 * compte : rien dans `POST /services` ne l'interdit, et l'écran « Mes ateliers »
 * n'est masqué aux autres que côté navigateur. Or un établissement ou une
 * association qui encaisserait ici ne serait pas dans la même situation qu'un
 * indépendant : ce n'est pas le même statut, pas la même facturation, pas la
 * même TVA, et pas la même personne responsable si la prestation n'a pas lieu.
 * La règle est donc posée ICI, dans le service, et pas seulement dans l'écran.
 */
@Injectable()
export class AteliersService {
  private readonly logger = new Logger(AteliersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connect: StripeConnectService,
    private readonly mail: MailService,
  ) {}

  /* ═══════════════════════════════════════════ côté intervenant ══════ */

  /**
   * CE QU'IL MANQUE POUR ENCAISSER EN LIGNE, dit en clair.
   *
   * Rendu même quand tout va bien : l'écran a besoin de montrer la liste
   * cochée, pas seulement un refus au moment de basculer l'interrupteur.
   */
  async conditions(accountId: string, serviceId: string) {
    const service = await this.exigerService(accountId, serviceId);
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { siret: true, stripeCompteId: true, stripeComptePret: true },
    });

    const prix = service.price === null ? 0 : Number(service.price);
    const manques: string[] = [];
    if (!compte?.stripeCompteId || !compte.stripeComptePret) {
      manques.push("Relier un compte d'encaissement à votre nom.");
    }
    if (!compte?.siret?.trim()) {
      manques.push('Déclarer votre SIRET : encaisser est un acte commercial.');
    }
    if (!(prix > 0)) {
      manques.push('Indiquer un tarif sur cette fiche : on ne peut pas encaisser « sur devis ».');
    }
    if (!service.annulationTexte?.trim()) {
      manques.push('Écrire vos conditions d’annulation : elles sont affichées avant le paiement.');
    }

    return {
      paiementEnLigne: service.paiementEnLigne,
      annulationTexte: service.annulationTexte,
      prixCents: Math.round(prix * 100),
      manques,
      possible: manques.length === 0,
    };
  }

  /**
   * Bascule l'option, ou réécrit les conditions d'annulation.
   *
   * On ne peut ALLUMER que si tout est réuni ; on peut toujours ÉTEINDRE, sans
   * condition — quelqu'un qui veut arrêter d'encaisser doit pouvoir le faire
   * tout de suite, quel que soit l'état de son dossier.
   */
  async reglerPaiement(accountId: string, serviceId: string, dto: ReglagePaiementDto) {
    await this.exigerService(accountId, serviceId);

    if (dto.annulationTexte !== undefined) {
      await this.prisma.service.update({
        where: { id: serviceId },
        data: { annulationTexte: dto.annulationTexte.trim() || null },
      });
    }

    if (dto.paiementEnLigne === true) {
      const etat = await this.conditions(accountId, serviceId);
      if (!etat.possible) {
        throw new BadRequestException(
          `Il manque encore quelque chose : ${etat.manques.join(' ')}`,
        );
      }
      await this.prisma.service.update({
        where: { id: serviceId },
        data: { paiementEnLigne: true },
      });
    } else if (dto.paiementEnLigne === false) {
      await this.prisma.service.update({
        where: { id: serviceId },
        data: { paiementEnLigne: false },
      });
    }

    return this.conditions(accountId, serviceId);
  }

  /** Les réservations payées, toutes fiches confondues. */
  listerReservations(accountId: string) {
    return this.prisma.reservationAtelier.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { service: { select: { id: true, title: true, slug: true } } },
    });
  }

  /** Le suivi : où en est la prestation, et la note que l'intervenant garde. */
  async suivre(accountId: string, id: string, dto: SuiviReservationDto) {
    const r = await this.prisma.reservationAtelier.findFirst({ where: { id, accountId } });
    if (!r) throw new NotFoundException('Cette réservation est introuvable.');

    // REMBOURSÉE ne se pose pas à la main : c'est le remboursement réel qui
    // l'écrit. Le laisser cochable ferait croire à un acheteur qu'il a été
    // remboursé alors que rien n'est parti.
    if (dto.statut === StatutReservationAtelier.REMBOURSEE && !r.rembourseeAt) {
      throw new BadRequestException(
        'Un remboursement se fait avec le bouton « Rembourser » : cocher la case ne rend pas l’argent.',
      );
    }

    return this.prisma.reservationAtelier.update({
      where: { id },
      data: {
        ...(dto.statut !== undefined ? { statut: dto.statut } : {}),
        ...(dto.noteInterne !== undefined ? { noteInterne: dto.noteInterne.trim() || null } : {}),
      },
    });
  }

  /**
   * REMBOURSE POUR DE VRAI, depuis le compte de l'intervenant.
   *
   * L'argent n'a jamais été chez la plateforme : elle ne peut pas le rendre à
   * sa place. Ce bouton demande au prestataire de reprendre la somme sur le
   * compte de l'intervenant et de la rendre à l'acheteur.
   */
  async rembourser(accountId: string, id: string, dto: RemboursementDto) {
    const r = await this.prisma.reservationAtelier.findFirst({ where: { id, accountId } });
    if (!r) throw new NotFoundException('Cette réservation est introuvable.');
    if (r.rembourseeAt) throw new BadRequestException('Cette réservation est déjà remboursée.');
    if (!r.stripePaymentIntentId) {
      throw new BadRequestException(
        "Ce paiement n'a pas d'identifiant chez le prestataire : le remboursement doit se faire depuis votre tableau de bord.",
      );
    }

    const montant = dto.montantCents ?? r.montantCents;
    if (montant > r.montantCents) {
      throw new BadRequestException('On ne peut pas rendre plus que ce qui a été payé.');
    }

    const compte = await this.connect.compteEncaisseur(accountId);
    if (!compte) {
      throw new BadRequestException(
        "Votre compte d'encaissement n'est plus relié : le remboursement doit se faire depuis votre tableau de bord.",
      );
    }

    await this.connect.rembourserDirect(compte, r.stripePaymentIntentId, montant);

    return this.prisma.reservationAtelier.update({
      where: { id },
      data: {
        statut: StatutReservationAtelier.REMBOURSEE,
        rembourseeAt: new Date(),
        montantRembourseCents: montant,
      },
    });
  }

  /* ══════════════════════════════════════════════ côté acheteur ══════ */

  /**
   * Ouvre la page de paiement. Rien n'est enregistré ici : tant que l'argent
   * n'est pas arrivé, il n'y a pas de réservation.
   */
  async payer(serviceId: string, dto: PayerAtelierDto, origine: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, status: ServiceStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        price: true,
        accountId: true,
        paiementEnLigne: true,
        annulationTexte: true,
        maxParticipants: true,
        category: true,
        account: { select: { name: true, type: true } },
      },
    });
    if (!service) throw new NotFoundException("Cet atelier n'existe pas.");
    // Le garde vaut aussi ICI, et pas seulement à l'activation : une fiche
    // dont le compte changerait de type après coup resterait sinon payable.
    if (service.account.type !== AccountType.FREELANCE) {
      throw new BadRequestException(
        'Cet atelier ne se règle pas en ligne : passez par la demande de devis.',
      );
    }
    if (!service.paiementEnLigne) {
      throw new BadRequestException(
        "Cet atelier ne se règle pas en ligne : passez par la demande de devis.",
      );
    }
    if (service.category !== ServiceCategory.ATELIER) {
      // Garde-fou : le paiement immédiat suppose un montant connu d'avance.
      // Une prestation au temps passé se règle sur facture, après coup.
      throw new BadRequestException(
        "Seuls les ateliers se règlent en ligne : le montant d'un renfort n'est connu qu'après la mission.",
      );
    }

    const montant = Math.round(Number(service.price ?? 0) * 100);
    if (!(montant > 0)) throw new BadRequestException("Cet atelier n'a pas de tarif affiché.");
    if (
      dto.participants &&
      service.maxParticipants &&
      dto.participants > service.maxParticipants
    ) {
      throw new BadRequestException(
        `Cet atelier accueille ${service.maxParticipants} personnes au maximum.`,
      );
    }

    const vente = await this.connect.venteDirecte(service.accountId, montant);
    if (!vente) {
      // On REFUSE plutôt que d'encaisser à sa place : la fiche promet que
      // l'intervenant est payé directement.
      throw new BadRequestException(
        "Le paiement en ligne n'est pas disponible sur cet atelier pour le moment. Passez par la demande de devis.",
      );
    }

    const racine = origine.replace(/\/$/, '');
    const email = dto.email.trim().toLowerCase();
    const params: Record<string, string> = {
      mode: 'payment',
      customer_email: email,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(montant),
      'line_items[0][price_data][product_data][name]': service.title.slice(0, 200),
      success_url: `${racine}/ateliers/${service.id}?paiement=succes&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${racine}/ateliers/${service.id}?paiement=annule`,
      'metadata[kind]': 'atelier',
      'metadata[serviceId]': service.id,
      'metadata[accountId]': service.accountId,
      'metadata[email]': email,
      'metadata[part]': String(vente.partPlateformeCents),
      ...vente.params,
    };
    if (dto.nom?.trim()) params['metadata[nom]'] = dto.nom.trim().slice(0, 120);
    if (dto.telephone?.trim()) params['metadata[tel]'] = dto.telephone.trim().slice(0, 40);
    if (dto.organisation?.trim()) params['metadata[orga]'] = dto.organisation.trim().slice(0, 160);
    if (dto.creneau?.trim()) params['metadata[creneau]'] = dto.creneau.trim().slice(0, 80);
    if (dto.participants) params['metadata[participants]'] = String(dto.participants);
    if (dto.dateSouhaitee) params['metadata[date]'] = dto.dateSouhaitee.slice(0, 40);
    // Le message peut être long ; les métadonnées du prestataire ne le sont
    // pas. On le coupe ici plutôt que de faire échouer le paiement.
    if (dto.message?.trim()) params['metadata[mot]'] = dto.message.trim().slice(0, 480);

    const session = await this.connect.ouvrirPaiementDirect(vente.compte, params);
    return { url: session.url, sessionId: session.id };
  }

  /**
   * AU RETOUR DE L'ACHETEUR : on relit le paiement chez le prestataire et on
   * écrit la réservation. Idempotent — l'unicité de la session fait le verrou,
   * donc recharger la page ne crée pas de doublon et ne renvoie pas de message.
   */
  async confirmer(serviceId: string, sessionId: string, origine: string) {
    const deja = await this.prisma.reservationAtelier.findUnique({
      where: { stripeSessionId: sessionId },
      include: { service: { select: { title: true } } },
    });
    if (deja) return this.resumer(deja, deja.service.title);

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        title: true,
        accountId: true,
        annulationTexte: true,
        account: { select: { name: true, contactEmail: true } },
      },
    });
    if (!service) throw new NotFoundException("Cet atelier n'existe pas.");

    const compte = await this.connect.compteEncaisseur(service.accountId);
    if (!compte) throw new BadRequestException('Ce paiement ne peut pas être vérifié.');

    const session = await this.connect.lireSessionDirecte(compte, sessionId);
    if (session.payment_status !== 'paid') {
      return { paye: false as const, statut: session.payment_status ?? 'inconnu' };
    }

    const m = session.metadata ?? {};
    // La session appartient bien à CET atelier : sans cette vérification, un
    // identifiant de session recopié d'une fiche à l'autre écrirait une
    // réservation sur la mauvaise.
    if (m.serviceId && m.serviceId !== service.id) {
      throw new BadRequestException('Ce paiement ne concerne pas cet atelier.');
    }

    const montant = session.amount_total ?? 0;
    const email = (m.email || session.customer_details?.email || '').trim().toLowerCase();
    if (!email) throw new BadRequestException("Ce paiement n'a pas d'adresse e-mail.");

    const date = m.date ? new Date(m.date) : null;
    const reservation = await this.prisma.reservationAtelier.create({
      data: {
        serviceId: service.id,
        accountId: service.accountId,
        email,
        nom: m.nom || session.customer_details?.name || null,
        telephone: m.tel || null,
        organisation: m.orga || null,
        message: m.mot || null,
        dateSouhaitee: date && !Number.isNaN(date.getTime()) ? date : null,
        creneau: m.creneau || null,
        participants: m.participants ? Number(m.participants) || null : null,
        montantCents: montant,
        partPlateformeCents: Number(m.part) || 0,
        annulationTexte: service.annulationTexte,
        statut: StatutReservationAtelier.PAYEE,
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        payeeAt: new Date(),
      },
    });

    await this.prevenir(reservation, service, origine);
    return this.resumer(reservation, service.title);
  }

  /** La fiche publique de la réservation : le strict nécessaire, jamais plus. */
  private resumer(
    r: {
      id: string;
      email: string;
      montantCents: number;
      dateSouhaitee: Date | null;
      creneau: string | null;
      participants: number | null;
      annulationTexte: string | null;
    },
    titre: string,
  ) {
    return {
      paye: true as const,
      id: r.id,
      atelier: titre,
      email: r.email,
      montantCents: r.montantCents,
      dateSouhaitee: r.dateSouhaitee ? r.dateSouhaitee.toISOString() : null,
      creneau: r.creneau,
      participants: r.participants,
      annulationTexte: r.annulationTexte,
    };
  }

  /**
   * Les deux messages : le reçu à l'acheteur, l'alerte à l'intervenant.
   * Ne lève jamais — un message qui ne part pas ne doit pas faire croire à un
   * paiement raté.
   */
  private async prevenir(
    r: {
      id: string;
      email: string;
      nom: string | null;
      telephone: string | null;
      message: string | null;
      montantCents: number;
      dateSouhaitee: Date | null;
      creneau: string | null;
      participants: number | null;
      annulationTexte: string | null;
    },
    service: {
      id: string;
      title: string;
      annulationTexte: string | null;
      account: { name: string; contactEmail: string | null };
    },
    origine: string,
  ) {
    const racine = origine.replace(/\/$/, '');
    const date = r.dateSouhaitee
      ? r.dateSouhaitee.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;

    try {
      await this.mail.sendRecuAtelier({
        to: r.email,
        atelier: service.title,
        intervenant: service.account.name,
        montantCents: r.montantCents,
        dateSouhaitee: date,
        creneau: r.creneau,
        participants: r.participants,
        annulationTexte: r.annulationTexte,
        lienFiche: `${racine}/ateliers/${service.id}`,
      });
    } catch {
      this.logger.warn(`Reçu d'atelier non envoyé pour la réservation ${r.id}.`);
    }

    if (!service.account.contactEmail) return;
    try {
      await this.mail.sendReservationAtelierPayee({
        to: service.account.contactEmail,
        atelier: service.title,
        montantCents: r.montantCents,
        acheteur: r.nom || 'Sans nom',
        email: r.email,
        telephone: r.telephone,
        dateSouhaitee: date,
        creneau: r.creneau,
        participants: r.participants,
        message: r.message,
        lienEspace: `${racine}/dashboard/ateliers#payes`,
      });
    } catch {
      this.logger.warn(`Alerte intervenant non envoyée pour la réservation ${r.id}.`);
    }
  }

  /* ═══════════════════════════════════════════════════ outillage ══════ */

  private async exigerService(accountId: string, serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        accountId: true,
        price: true,
        category: true,
        paiementEnLigne: true,
        annulationTexte: true,
        account: { select: { type: true } },
      },
    });
    if (!service) throw new NotFoundException("Cette fiche n'existe pas.");
    if (service.accountId !== accountId) {
      throw new ForbiddenException("Cette fiche n'est pas la vôtre.");
    }
    if (service.account.type !== AccountType.FREELANCE) {
      throw new ForbiddenException(
        'Seuls les intervenants peuvent proposer un atelier payé en ligne.',
      );
    }
    if (service.category !== ServiceCategory.ATELIER) {
      throw new BadRequestException(
        "Le paiement en ligne ne concerne que les ateliers : le montant d'un renfort n'est connu qu'après la mission.",
      );
    }
    return service;
  }
}
