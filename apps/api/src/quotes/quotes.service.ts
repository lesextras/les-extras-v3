import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MESSAGE_HORS_PORTEE, reservableParCompte } from '../services/portee-salarie';
import { bornes, page } from '../common/pagination';
import { decomposerPrix, COMMISSION_DEFAUT } from '../billing/commission';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateQuoteRequestDto, SendQuoteDto } from './dto/quote.dto';
import { totauxDevis } from './totaux';
import { SELECT_PARTIE, figerPartie } from './parties';

/**
 * DURÉE DE VALIDITÉ PAR DÉFAUT, EN JOURS.
 *
 * Un devis sans durée de validité est une offre qui engage son auteur sans
 * terme : l'établissement peut l'accepter dix-huit mois plus tard, au tarif
 * d'alors. Le champ étant facultatif à la saisie, on pose un horizon
 * raisonnable plutôt que de laisser le document ouvert indéfiniment.
 */
const VALIDITE_DEFAUT_JOURS = 30;

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Référence séquentielle annuelle : DEV-YYYY-00001. */
  private async nextReference(): Promise<string> {
    const prefix = `DEV-${new Date().getFullYear()}-`;
    const count = await this.prisma.quote.count({ where: { reference: { startsWith: prefix } } });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }

  /** Membre ACTIF du compte, sinon 403 (sans divulguer l'existence du compte). */
  private async requireMembership(userId: string, accountId: string) {
    // Sans ce garde-fou, un accountId absent partait tel quel dans le
    // findUnique composite : Prisma levait une erreur de validation et le
    // client recevait un 500 opaque au lieu d'un message exploitable.
    if (!accountId) {
      throw new BadRequestException(
        'Aucun compte actif : précisez le compte concerné (paramètre accountId).',
      );
    }
    const m = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!m || m.status !== 'ACTIVE') throw new ForbiddenException('Accès refusé à ce compte.');
    return m;
  }

  /** Devis visible par le demandeur ET par l'intervenant, personne d'autre. */
  private async requireParticipant(userId: string, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        clientAccount: { select: { id: true, name: true, ownerId: true } },
        providerAccount: { select: { id: true, name: true, ownerId: true } },
        service: { select: { id: true, title: true, price: true, creditCost: true } },
      },
    });
    if (!quote) throw new NotFoundException('Devis introuvable.');
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        accountId: { in: [quote.clientAccountId, quote.providerAccountId] },
        status: 'ACTIVE',
      },
      select: { accountId: true },
    });
    if (memberships.length === 0) throw new ForbiddenException('Accès refusé à ce devis.');
    const isClient = memberships.some((m) => m.accountId === quote.clientAccountId);
    const isProvider = memberships.some((m) => m.accountId === quote.providerAccountId);
    return { quote, isClient, isProvider };
  }

  /** Devis du compte courant (comme demandeur ou comme intervenant). */
  async findAllForAccount(
    userId: string,
    accountId: string,
    filtres: { page?: number; perPage?: number } = {},
  ) {
    await this.requireMembership(userId, accountId);
    const { page: p, perPage, skip, take } = bornes(filtres);
    const where = { OR: [{ clientAccountId: accountId }, { providerAccountId: accountId }] };
    const [items, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          clientAccount: { select: { id: true, name: true } },
          providerAccount: { select: { id: true, name: true } },
          service: { select: { id: true, title: true, category: true } },
        },
      }),
      this.prisma.quote.count({ where }),
    ]);
    return page(items, total, p, perPage);
  }

  async findOne(userId: string, id: string) {
    const { quote, isClient, isProvider } = await this.requireParticipant(userId, id);
    return { ...quote, viewerIsClient: isClient, viewerIsProvider: isProvider };
  }

  /**
   * Étape 1 — un établissement demande un devis à un intervenant, en général
   * depuis la fiche d'un atelier ou d'une formation.
   */
  async request(userId: string, accountId: string, dto: CreateQuoteRequestDto) {
    await this.requireMembership(userId, accountId);
    const client = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: { type: true, name: true },
    });
    if (client.type !== 'ESTABLISHMENT') {
      throw new BadRequestException('Seul un établissement peut demander un devis.');
    }

    let providerAccountId = dto.providerAccountId ?? null;
    let title = dto.title;

    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
        select: { id: true, title: true, accountId: true, status: true },
      });
      if (!service) throw new NotFoundException('Prestation introuvable.');
      // La demande de devis est le premier pas d'une réservation : elle doit
      // obéir aux MÊMES règles que celle-ci, sinon elle devient la porte de
      // service. Une fiche encore en brouillon, ou celle d'un salarié dont
      // l'établissement demandeur n'est pas l'employeur, se demandait en devis
      // par simple identifiant — l'intervenant recevait une sollicitation pour
      // une prestation qu'il n'a légalement pas le droit de facturer.
      if (service.status !== ServiceStatus.PUBLISHED) {
        throw new NotFoundException('Prestation introuvable.');
      }
      const reservable = await reservableParCompte(this.prisma, service.id, accountId);
      if (!reservable) throw new BadRequestException(MESSAGE_HORS_PORTEE);
      providerAccountId = service.accountId;
      title = title || service.title;
    }
    if (!providerAccountId) throw new BadRequestException('Intervenant non identifié.');
    if (providerAccountId === accountId) {
      throw new BadRequestException('Vous ne pouvez pas vous demander un devis à vous-même.');
    }

    const provider = await this.prisma.account.findUniqueOrThrow({
      where: { id: providerAccountId },
      select: { ownerId: true, name: true },
    });

    const quote = await this.prisma.quote.create({
      data: {
        reference: await this.nextReference(),
        clientAccountId: accountId,
        providerAccountId,
        serviceId: dto.serviceId ?? null,
        title: title || 'Demande de devis',
        request: dto.request ?? null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
    });

    // Compteur affiché sur la fiche : « X demandes cette semaine ».
    if (dto.serviceId) {
      await this.prisma.service
        .update({ where: { id: dto.serviceId }, data: { requestsCount: { increment: 1 } } })
        .catch(() => undefined);
    }

    if (provider.ownerId) {
      await this.notifications.create(provider.ownerId, {
        type: 'QUOTE_REQUESTED',
        title: 'Nouvelle demande de devis',
        body: `${client.name} vous demande un devis pour « ${quote.title} ».`,
        link: `/dashboard/devis/${quote.id}`,
      });
    }
    return quote;
  }

  /**
   * Étape 2 — l'intervenant chiffre et envoie. Réenvoi possible tant que le
   * devis n'est pas décidé (le demandeur est renotifié).
   */
  async send(userId: string, id: string, dto: SendQuoteDto) {
    const { quote, isProvider } = await this.requireParticipant(userId, id);
    if (!isProvider) throw new ForbiddenException("Seul l'intervenant peut chiffrer ce devis.");
    if (['ACCEPTED', 'REFUSED', 'EXPIRED'].includes(quote.status)) {
      throw new BadRequestException('Ce devis est clôturé.');
    }
    if (!dto.lines?.length) throw new BadRequestException('Ajoutez au moins une ligne.');

    // UN DEVIS SIGNÉ NE SE RECHIFFRE PAS.
    //
    // La signature électronique porte sur une empreinte du contenu (voir
    // SignatureService.texteCanonique). Modifier les lignes après coup ne
    // « met pas le devis à jour » : cela rend la signature incohérente avec le
    // document, c'est-à-dire cela détruit la preuve — sans que personne ne
    // s'en aperçoive avant le jour où elle sert.
    const signe = await this.prisma.signature.findFirst({
      where: { documentType: 'DEVIS', documentId: id, statut: 'SIGNEE' },
      select: { id: true },
    });
    if (signe) {
      throw new BadRequestException(
        'Ce devis a été signé : il ne peut plus être modifié. Émettez-en un nouveau.',
      );
    }

    const totaux = totauxDevis(dto.lines);
    if (totaux.totalTtc <= 0) throw new BadRequestException('Le montant doit être supérieur à 0.');

    // Identité des deux parties, recopiée maintenant — voir parties.ts.
    const [provider, client] = await Promise.all([
      this.prisma.account.findUniqueOrThrow({
        where: { id: quote.providerAccountId },
        select: SELECT_PARTIE,
      }),
      this.prisma.account.findUniqueOrThrow({
        where: { id: quote.clientAccountId },
        select: SELECT_PARTIE,
      }),
    ]);

    const validUntil = dto.validUntil
      ? new Date(dto.validUntil)
      : new Date(Date.now() + VALIDITE_DEFAUT_JOURS * 24 * 3600 * 1000);

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        lines: dto.lines as unknown as object,
        // `amount` reste le TTC : c'est ce que lisent les écrans, les
        // notifications et la réservation créée à l'acceptation.
        amount: totaux.totalTtc,
        totalHt: totaux.totalHt,
        totalTva: totaux.totalTva,
        // Le cast traverse le typage JSON de Prisma, qui exige une signature
        // d'index que nos interfaces nommées n'ont pas. La forme reste
        // garantie par `figerPartie`, et relue par `relirePartiesFigees`.
        partiesSnapshot: {
          provider: figerPartie(provider),
          client: figerPartie(client),
        } as unknown as object,
        message: dto.message ?? null,
        title: dto.title ?? quote.title,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : quote.scheduledAt,
        validUntil,
        status: 'SENT',
        sentAt: new Date(),
      },
    });
    const amount = totaux.totalTtc;

    if (quote.clientAccount.ownerId) {
      await this.notifications.create(quote.clientAccount.ownerId, {
        type: 'QUOTE_SENT',
        title: 'Devis reçu',
        body: `${quote.providerAccount.name} vous a envoyé un devis de ${amount.toFixed(2)} € pour « ${updated.title} ».`,
        link: `/dashboard/devis/${id}`,
      });
    }
    return updated;
  }

  /**
   * Étape 3 — l'établissement accepte : le devis et la réservation naissent
   * dans la MÊME transaction (pas de devis accepté sans prestation planifiée).
   */
  async accept(userId: string, id: string) {
    const { quote, isClient } = await this.requireParticipant(userId, id);
    if (!isClient) throw new ForbiddenException("Seul l'établissement peut accepter ce devis.");
    if (quote.status !== 'SENT') {
      throw new BadRequestException('Seul un devis envoyé peut être accepté.');
    }
    if (quote.validUntil && quote.validUntil < new Date()) {
      await this.prisma.quote.update({ where: { id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('Ce devis a expiré.');
    }

    // Modèle prestataire : le montant facturé à l'établissement est le tarif
    // de l'intervenant AUGMENTÉ des frais de gestion. Rien n'est prélevé sur
    // l'intervenant, qui perçoit exactement le montant qu'il a chiffré.
    const compteClient = await this.prisma.account.findUnique({
      where: { id: quote.clientAccountId },
      select: { commissionRate: true },
    });
    const taux = compteClient?.commissionRate
      ? Number(compteClient.commissionRate)
      : COMMISSION_DEFAUT;
    const { prixClientHt } = decomposerPrix(Number(quote.amount ?? 0), taux);

    // « BON POUR ACCORD » — QUI ACCEPTE, ET À QUEL TITRE.
    //
    // Ce n'est pas « l'établissement » qui accepte : c'est une personne
    // physique qui l'engage. Son nom et sa qualité sont ce qui rend
    // l'acceptation opposable, et c'est exactement ce qu'on écrit à la main
    // sous la mention « bon pour accord » sur un devis papier. On les relève
    // au moment du clic, et on les imprime ensuite sur le document.
    const signataire = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        profile: { select: { job: true } },
      },
    });
    const membre = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId: quote.clientAccountId } },
      select: { role: true },
    });
    const acceptedByName =
      [signataire?.firstName, signataire?.lastName].filter(Boolean).join(' ').trim() ||
      signataire?.email ||
      null;
    // La fonction déclarée dans le profil dit mieux la qualité du signataire
    // que son rôle applicatif ; à défaut, le rôle dans le compte fait foi.
    const acceptedByRole = signataire?.profile?.job ?? membre?.role ?? null;

    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          accountId: quote.clientAccountId,
          serviceId: quote.serviceId,
          missionId: quote.missionId,
          status: 'CONFIRMED',
          scheduledAt: quote.scheduledAt,
          totalAmount: prixClientHt,
        },
      });
      const accepted = await tx.quote.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          decidedAt: new Date(),
          bookingId: booking.id,
          acceptedByName,
          acceptedByRole,
        },
      });
      return { accepted, booking };
    });

    if (quote.providerAccount.ownerId) {
      await this.notifications.create(quote.providerAccount.ownerId, {
        type: 'QUOTE_ACCEPTED',
        title: 'Devis accepté',
        body: `${quote.clientAccount.name} a accepté votre devis « ${quote.title} ». La prestation est confirmée.`,
        link: `/dashboard/devis/${id}`,
      });
    }
    return result.accepted;
  }

  /** Étape 3 bis — refus motivé (l'intervenant est prévenu). */
  async refuse(userId: string, id: string, reason?: string) {
    const { quote, isClient } = await this.requireParticipant(userId, id);
    if (!isClient) throw new ForbiddenException("Seul l'établissement peut refuser ce devis.");
    if (quote.status !== 'SENT') {
      throw new BadRequestException('Seul un devis envoyé peut être refusé.');
    }
    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: 'REFUSED', decidedAt: new Date(), refusalReason: reason ?? null },
    });
    if (quote.providerAccount.ownerId) {
      await this.notifications.create(quote.providerAccount.ownerId, {
        type: 'QUOTE_REFUSED',
        title: 'Devis non retenu',
        body: `${quote.clientAccount.name} n'a pas retenu votre devis « ${quote.title} ».`,
        link: `/dashboard/devis/${id}`,
      });
    }
    return updated;
  }
}
