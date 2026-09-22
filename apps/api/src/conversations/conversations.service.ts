import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  FileKind,
  MembershipStatus,
  Prisma,
  TypeConversation,
  TypeMessage,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  OuvrirFilDto,
  ModifierMessageDto,
  SignalerMessageDto,
  AjouterParticipantsDto,
} from './dto/fil.dto';
import { masquerCoordonnees, EXPLICATION_MASQUAGE } from './masquage';
import {
  SELECT_MEMBRE,
  versMembreCourant,
  filtreMembresVisibles,
  peutPiloterService,
} from '../common/perimetre';

/**
 * MESSAGERIE — version complète (16/09/2026).
 *
 * UN FIL NE FLOTTE JAMAIS : IL PORTE SON CONTEXTE.
 *
 * C'est ce qui distingue les quatre usages, et surtout ce qui protège le
 * modèle économique. Un fil avec un INTERVENANT n'existe pas sans demande
 * (devis, réservation, mission) : sans ce garde-fou, le catalogue deviendrait
 * un carnet d'adresses, le premier message servirait à donner un numéro, et la
 * réservation se ferait ailleurs. C'est comme ça que meurent les places de
 * marché — et avec elles les conventions et les factures que la plateforme
 * édite, c'est-à-dire la trace qui protège l'établissement.
 *
 * QUATRE RÈGLES, toutes appliquées ici :
 *
 *   1. On n'ouvre un fil INTERVENANT qu'adossé à une demande existante.
 *   2. Tant que la demande n'est pas confirmée, les coordonnées sont retirées
 *      du corps des messages (`masquage.ts`). Le message part quand même.
 *   3. Les non-lus se comptent sur `ConversationParticipant.luJusquA`, jamais
 *      sur `Message.readAt` — qui ne sait dire « lu » que pour tout le monde à
 *      la fois, ce qui est faux dès qu'un fil compte trois personnes.
 *   4. On ne supprime pas un fil. On le ferme, ou on le quitte.
 */

/** Ce que l'écran affiche en tête de fil pour chaque type. */
const AVERTISSEMENT_USAGERS =
  'Ce fil peut être lu par plusieurs professionnels. N’y indiquez aucune ' +
  'information nominative concernant une personne accompagnée : un prénom, une ' +
  'date de naissance ou une adresse suffisent à l’identifier.';

const SELECT_PERSONNE = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // -------------------------------------------------------------------------
  // LECTURE
  // -------------------------------------------------------------------------

  /**
   * La boîte de réception : les fils où je suis participant.
   *
   * ⚠ La condition est `participants.some({ userId })`, pas « j'y ai écrit ».
   * Quelqu'un qu'on vient d'ajouter à un fil d'équipe doit le voir AVANT d'y
   * avoir écrit, sinon il n'apprend jamais qu'on lui parle.
   */
  async findAll(userId: string, filtres: { type?: TypeConversation; archives?: boolean } = {}) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId, quitteLe: null } },
        ...(filtres.type ? { type: filtres.type } : {}),
        ...(filtres.archives ? {} : { fermee: false }),
      },
      orderBy: [{ dernierMessageAt: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
      include: {
        mission: { select: { id: true, title: true } },
        orgUnit: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        quote: { select: { id: true, status: true } },
        booking: { select: { id: true, status: true } },
        participants: {
          where: { quitteLe: null },
          include: { user: { select: SELECT_PERSONNE } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, body: true, senderId: true, createdAt: true, type: true, supprimeLe: true },
        },
      },
    });

    const ids = conversations.map((c) => c.id);
    const nonLus = await this.compterNonLus(userId, ids);

    return conversations.map((c) => {
      const dernier = c.messages[0] ?? null;
      const { messages: _m, participants, ...reste } = c;
      return {
        ...reste,
        titre: this.titreFil(c.type, c.sujet, c.mission?.title, c.orgUnit?.name, c.account?.name),
        participants: participants
          .filter((p) => p.userId !== userId)
          .map((p) => p.user),
        lastMessage: dernier
          ? {
              id: dernier.id,
              body: dernier.supprimeLe ? 'Message retiré' : dernier.body,
              senderId: dernier.senderId,
              createdAt: dernier.createdAt,
              type: dernier.type,
            }
          : null,
        unreadCount: nonLus.get(c.id) ?? 0,
      };
    });
  }

  /**
   * Compte les non-lus, fil par fil, depuis `luJusquA`.
   *
   * Un seul `groupBy` pour toute la liste : compter fil par fil ferait une
   * requête par ligne affichée, et la boîte de réception est l'écran qu'on
   * ouvre le plus souvent.
   */
  private async compterNonLus(userId: string, conversationIds: string[]) {
    const resultat = new Map<string, number>();
    if (conversationIds.length === 0) return resultat;

    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId, conversationId: { in: conversationIds } },
      select: { conversationId: true, luJusquA: true },
    });

    const compte = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        supprimeLe: null,
        OR: participations.map((p) => ({
          conversationId: p.conversationId,
          ...(p.luJusquA ? { createdAt: { gt: p.luJusquA } } : {}),
        })),
      },
      _count: { _all: true },
    });

    for (const ligne of compte) resultat.set(ligne.conversationId, ligne._count._all);
    return resultat;
  }

  /** Le compteur global, pour la pastille de la barre de navigation. */
  async nonLus(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId, quitteLe: null, conversation: { fermee: false } },
      select: { conversationId: true, luJusquA: true },
    });
    if (participations.length === 0) return { total: 0, fils: 0 };

    const compte = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        senderId: { not: userId },
        supprimeLe: null,
        OR: participations.map((p) => ({
          conversationId: p.conversationId,
          ...(p.luJusquA ? { createdAt: { gt: p.luJusquA } } : {}),
        })),
      },
      _count: { _all: true },
    });

    return {
      total: compte.reduce((n, l) => n + l._count._all, 0),
      fils: compte.length,
    };
  }

  private titreFil(
    type: TypeConversation,
    sujet: string | null,
    mission?: string,
    service?: string,
    etablissement?: string,
  ): string {
    if (sujet) return sujet;
    switch (type) {
      case TypeConversation.MISSION:
        return mission ? `Renfort — ${mission}` : 'Renfort';
      case TypeConversation.SERVICE:
        return service ? `Service ${service}` : 'Service';
      case TypeConversation.INTERNE:
        return etablissement ? `Équipe — ${etablissement}` : 'Équipe';
      case TypeConversation.INTERVENANT:
        return 'Échange avec un intervenant';
      case TypeConversation.SUPPORT:
        return 'Les Extras';
      default:
        return 'Discussion';
    }
  }

  /** Charge un fil en garantissant que la personne y participe encore. */
  private async assertParticipant(conversationId: string, userId: string) {
    const participation = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      include: { conversation: true },
    });
    if (!participation || participation.quitteLe) {
      // On ne distingue pas « le fil n'existe pas » de « vous n'y êtes pas » :
      // la différence apprendrait à un tiers qu'un fil existe.
      throw new NotFoundException('Conversation introuvable.');
    }
    return participation;
  }

  async getMessages(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 500,
      include: {
        sender: { select: SELECT_PERSONNE },
        pieces: { include: { fileAsset: { select: { id: true, originalName: true, mimeType: true, size: true } } } },
      },
    });
  }

  /** UNE conversation avec ses messages — ce que l'écran de fil affiche. */
  async findOne(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);

    const [conversation, messages] = await Promise.all([
      this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          mission: { select: { id: true, title: true } },
          orgUnit: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
          quote: { select: { id: true, status: true } },
          booking: { select: { id: true, status: true } },
          participants: {
            where: { quitteLe: null },
            include: { user: { select: SELECT_PERSONNE } },
          },
        },
      }),
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        // Une conversation longue ne se lit pas d'un bloc : on rend les deux
        // cents derniers messages, l'ordre chronologique étant rétabli après.
        take: 200,
        include: {
          sender: { select: SELECT_PERSONNE },
          pieces: {
            include: {
              fileAsset: { select: { id: true, originalName: true, mimeType: true, size: true } },
            },
          },
        },
      }),
    ]);
    if (!conversation) throw new NotFoundException('Conversation introuvable.');

    // Ouvrir un fil, c'est le lire.
    await this.marquerLu(conversationId, userId);

    const coordonneesOuvertes = await this.coordonneesOuvertes(conversation);

    return {
      conversation: {
        ...conversation,
        titre: this.titreFil(
          conversation.type,
          conversation.sujet,
          conversation.mission?.title,
          conversation.orgUnit?.name,
          conversation.account?.name,
        ),
        participants: conversation.participants.map((p) => p.user),
        /** Ce que l'écran affiche en tête, et pourquoi. */
        avertissement: AVERTISSEMENT_USAGERS,
        coordonneesOuvertes,
        explicationMasquage:
          conversation.type === TypeConversation.INTERVENANT && !coordonneesOuvertes
            ? EXPLICATION_MASQUAGE
            : null,
      },
      messages: messages.map((m) => ({
        ...m,
        body: m.supprimeLe ? '' : m.body,
      })),
    };
  }

  // -------------------------------------------------------------------------
  // OUVERTURE D'UN FIL
  // -------------------------------------------------------------------------

  /**
   * OUVRIR UN FIL, quel que soit son type.
   *
   * Chaque type a sa condition d'existence, et c'est ce qui rend la messagerie
   * utilisable sans devenir un canal de démarchage vers des directions
   * d'établissement du médico-social.
   */
  async ouvrir(userId: string, accountId: string | undefined, dto: OuvrirFilDto) {
    switch (dto.type) {
      case TypeConversation.INTERVENANT:
        return this.ouvrirAvecIntervenant(userId, accountId, dto);
      case TypeConversation.INTERNE:
      case TypeConversation.SERVICE:
        return this.ouvrirInterne(userId, accountId, dto);
      case TypeConversation.SUPPORT:
        return this.ouvrirSupport(userId, accountId, dto);
      default:
        throw new BadRequestException(
          'Un fil de renfort s’ouvre depuis la mission concernée.',
        );
    }
  }

  /**
   * FIL AVEC UN INTERVENANT — TOUJOURS ADOSSÉ À UNE DEMANDE.
   *
   * ⚠ Pas de fil libre depuis le catalogue. Le jour où on ouvrira cette porte,
   * les intervenants se feront démarcher et partiront, et les réservations se
   * feront en dehors de la plateforme. La demande de devis est gratuite et
   * tient en un clic : elle est le point d'entrée.
   */
  private async ouvrirAvecIntervenant(
    userId: string,
    accountId: string | undefined,
    dto: OuvrirFilDto,
  ) {
    if (dto.serviceId) {
      return this.ouvrirDepuisFiche(userId, accountId, dto);
    }

    if (!dto.quoteId && !dto.bookingId) {
      throw new BadRequestException(
        'Un échange avec un intervenant s’ouvre depuis une demande de devis ou ' +
          'une réservation. Demandez un devis : le fil s’ouvrira aussitôt.',
      );
    }

    const demande = dto.quoteId
      ? await this.prisma.quote.findUnique({
          where: { id: dto.quoteId },
          select: {
            id: true,
            clientAccountId: true,
            providerAccountId: true,
            clientAccount: { select: { ownerId: true } },
            providerAccount: { select: { ownerId: true } },
          },
        })
      : await this.prisma.booking.findUnique({
          where: { id: dto.bookingId! },
          select: {
            id: true,
            accountId: true,
            service: { select: { accountId: true, account: { select: { ownerId: true } } } },
            account: { select: { ownerId: true } },
          },
        });
    if (!demande) throw new NotFoundException('Demande introuvable.');

    const comptes = dto.quoteId
      ? [
          (demande as { clientAccountId: string }).clientAccountId,
          (demande as { providerAccountId: string }).providerAccountId,
        ]
      : [
          (demande as { accountId: string }).accountId,
          (demande as { service: { accountId: string } | null }).service?.accountId,
        ].filter((v): v is string => Boolean(v));

    // On doit être membre actif de l'un des deux comptes de la demande.
    const lien = await this.prisma.membership.count({
      where: { userId, accountId: { in: comptes }, status: MembershipStatus.ACTIVE },
    });
    if (lien === 0) {
      throw new ForbiddenException('Cette demande ne vous concerne pas.');
    }

    const existant = await this.prisma.conversation.findFirst({
      where: {
        type: TypeConversation.INTERVENANT,
        ...(dto.quoteId ? { quoteId: dto.quoteId } : { bookingId: dto.bookingId }),
      },
    });
    if (existant) {
      await this.rejoindre(existant.id, userId);
      return this.envoyer(existant.id, userId, { body: dto.body });
    }

    // Les deux titulaires de compte, plus l'auteur : c'est le minimum pour que
    // le message arrive à quelqu'un.
    const destinataires = new Set<string>([userId]);
    const titulaires = await this.prisma.account.findMany({
      where: { id: { in: comptes } },
      select: { ownerId: true },
    });
    for (const t of titulaires) destinataires.add(t.ownerId);

    return this.creerFil({
      type: TypeConversation.INTERVENANT,
      sujet: dto.sujet ?? null,
      accountId: accountId ?? comptes[0],
      quoteId: dto.quoteId ?? null,
      bookingId: dto.bookingId ?? null,
      createdById: userId,
      participants: [...destinataires],
      auteurId: userId,
      body: dto.body,
    });
  }

  /**
   * LA QUESTION AVANT LE DEVIS — fil ouvert depuis une fiche.
   *
   * Le fil libre depuis le catalogue était refusé ici, et la raison tenait :
   * on se fait démarcher, puis on réserve dehors. Mais la plupart des gens
   * n’en sont pas à « je prends » — ils demandent si ça convient à des 6-8
   * ans, si le déplacement jusqu’à Melun est possible, si la date du 12
   * tient. Les renvoyer vers une demande de devis pour poser cette
   * question-là, c’est les perdre avant d’avoir commencé.
   *
   * ⚠ CE QUI PROTÈGE LE MODÈLE, CE N’EST PAS L’ABSENCE DE MESSAGERIE, c’est
   * le masquage des coordonnées, qui s’applique à ce fil comme aux autres :
   * on peut se parler, on ne peut pas s’échanger un numéro.
   */
  private async ouvrirDepuisFiche(
    userId: string,
    accountId: string | undefined,
    dto: OuvrirFilDto,
  ) {
    const fiche = await this.prisma.service.findUnique({
      where: { id: dto.serviceId! },
      select: {
        id: true,
        title: true,
        accountId: true,
        account: { select: { ownerId: true } },
      },
    });
    if (!fiche) throw new NotFoundException('Fiche introuvable.');

    if (accountId && accountId === fiche.accountId) {
      throw new BadRequestException(
        'C’est votre propre fiche : il n’y a personne à qui écrire.',
      );
    }

    const sujet = `À propos de « ${fiche.title} »`;

    // UN SEUL FIL PAR PERSONNE ET PAR FICHE. Une deuxième question rejoint la
    // première : deux fils sur le même atelier, et l’intervenant répond à l’un
    // en ignorant l’autre sans le savoir.
    const existant = await this.prisma.conversation.findFirst({
      where: {
        type: TypeConversation.INTERVENANT,
        accountId: fiche.accountId,
        sujet,
        quoteId: null,
        bookingId: null,
        createdById: userId,
      },
    });
    if (existant) {
      await this.rejoindre(existant.id, userId);
      return this.envoyer(existant.id, userId, { body: dto.body });
    }

    return this.creerFil({
      type: TypeConversation.INTERVENANT,
      sujet,
      accountId: fiche.accountId,
      createdById: userId,
      participants: [userId, fiche.account.ownerId],
      auteurId: userId,
      body: dto.body,
    });
  }

  /**
   * FIL INTERNE OU DE SERVICE — dans les limites de mon périmètre.
   *
   * On n'écrit qu'à des gens qu'on voit : la même règle que partout ailleurs.
   * Sans elle, la messagerie serait le trou par lequel un salarié atteindrait
   * toute une association.
   */
  private async ouvrirInterne(
    userId: string,
    accountId: string | undefined,
    dto: OuvrirFilDto,
  ) {
    if (!accountId) {
      throw new BadRequestException('Choisissez l’établissement concerné.');
    }
    const brut = await this.prisma.membership.findFirst({
      where: { userId, accountId, status: MembershipStatus.ACTIVE },
      select: SELECT_MEMBRE,
    });
    if (!brut) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    const membre = versMembreCourant(brut);

    if (dto.orgUnitId) {
      const duCompte = await this.prisma.orgUnit.count({
        where: { id: dto.orgUnitId, accountId },
      });
      if (duCompte === 0) throw new NotFoundException('Service introuvable.');
    }

    // Les destinataires demandés doivent tous être dans mon périmètre.
    const demandes = dto.participantIds ?? [];
    const visibles = await this.prisma.membership.findMany({
      where: {
        ...filtreMembresVisibles(membre),
        status: MembershipStatus.ACTIVE,
        userId: { in: demandes },
      },
      select: { userId: true },
    });
    const autorises = new Set(visibles.map((m) => m.userId));
    const refuses = demandes.filter((id) => !autorises.has(id));
    if (refuses.length > 0) {
      throw new ForbiddenException(
        'Vous ne pouvez écrire qu’aux personnes de votre périmètre.',
      );
    }

    // Un fil de SERVICE s'adresse à tout le service : on n'énumère pas.
    let participants = [userId, ...autorises];
    if (dto.type === TypeConversation.SERVICE && dto.orgUnitId) {
      if (!peutPiloterService(membre, dto.orgUnitId) && !membre.servicesRattaches.includes(dto.orgUnitId)) {
        throw new ForbiddenException("Vous n'êtes pas rattaché à ce service.");
      }
      const duService = await this.prisma.membership.findMany({
        where: {
          accountId,
          status: MembershipStatus.ACTIVE,
          services: { some: { orgUnitId: dto.orgUnitId } },
        },
        select: { userId: true },
      });
      participants = [userId, ...duService.map((m) => m.userId)];
    }

    if (participants.length < 2) {
      throw new BadRequestException('Choisissez au moins une personne à qui écrire.');
    }

    return this.creerFil({
      type: dto.type,
      sujet: dto.sujet ?? null,
      accountId,
      orgUnitId: dto.orgUnitId ?? null,
      createdById: userId,
      participants: [...new Set(participants)],
      auteurId: userId,
      body: dto.body,
    });
  }

  /**
   * FIL AVEC LES EXTRAS.
   *
   * ⚠ Il s'appuie sur le module `support` existant — même boîte, même écran
   * d'administration. Deux boîtes de réception à surveiller, c'est une boîte
   * que personne ne relève.
   */
  private async ouvrirSupport(
    userId: string,
    accountId: string | undefined,
    dto: OuvrirFilDto,
  ) {
    return this.creerFil({
      type: TypeConversation.SUPPORT,
      sujet: dto.sujet ?? 'Demande à Les Extras',
      accountId: accountId ?? null,
      createdById: userId,
      participants: [userId],
      auteurId: userId,
      body: dto.body,
    });
  }

  private async creerFil(entree: {
    type: TypeConversation;
    sujet: string | null;
    accountId?: string | null;
    orgUnitId?: string | null;
    quoteId?: string | null;
    bookingId?: string | null;
    missionId?: string | null;
    createdById: string;
    participants: string[];
    auteurId: string;
    body: string;
  }) {
    const fil = await this.prisma.conversation.create({
      data: {
        type: entree.type,
        sujet: entree.sujet,
        accountId: entree.accountId ?? null,
        orgUnitId: entree.orgUnitId ?? null,
        quoteId: entree.quoteId ?? null,
        bookingId: entree.bookingId ?? null,
        missionId: entree.missionId ?? null,
        createdById: entree.createdById,
        participants: {
          create: entree.participants.map((userId) => ({ userId })),
        },
      },
    });
    await this.envoyer(fil.id, entree.auteurId, { body: entree.body });
    return this.findOne(fil.id, entree.auteurId);
  }

  /** Ajoute (ou réactive) une participation. */
  private async rejoindre(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId },
      update: { quitteLe: null },
    });
  }

  // -------------------------------------------------------------------------
  // ÉCRITURE
  // -------------------------------------------------------------------------

  /**
   * Les coordonnées circulent-elles en clair dans ce fil ?
   *
   * Oui partout, SAUF dans un fil avec un intervenant dont la demande n'est pas
   * encore confirmée. Une fois la réservation confirmée, les deux parties
   * doivent pouvoir s'appeler le matin de l'intervention : continuer à masquer
   * serait alors nuisible, et personne ne comprendrait pourquoi.
   */
  private async coordonneesOuvertes(fil: {
    type: TypeConversation;
    quoteId: string | null;
    bookingId: string | null;
  }): Promise<boolean> {
    if (fil.type !== TypeConversation.INTERVENANT) return true;

    if (fil.bookingId) {
      const b = await this.prisma.booking.findUnique({
        where: { id: fil.bookingId },
        select: { status: true },
      });
      const confirmes: BookingStatus[] = [
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.COMPLETED,
      ];
      return Boolean(b && confirmes.includes(b.status));
    }
    if (fil.quoteId) {
      const q = await this.prisma.quote.findUnique({
        where: { id: fil.quoteId },
        select: { status: true, bookingId: true },
      });
      return Boolean(q && q.status === 'ACCEPTED');
    }
    return false;
  }

  /** Envoie un message et remonte le fil. */
  async envoyer(conversationId: string, userId: string, dto: SendMessageDto) {
    const participation = await this.assertParticipant(conversationId, userId);
    const fil = participation.conversation;
    if (fil.fermee) {
      throw new BadRequestException('Ce fil est clos : on ne peut plus y écrire.');
    }

    const ouvertes = await this.coordonneesOuvertes(fil);
    const { texte, masque } = ouvertes
      ? { texte: dto.body, masque: false }
      : masquerCoordonnees(dto.body);

    if (!texte) {
      throw new BadRequestException(
        'Ce message ne contient que des coordonnées, qui ne peuvent pas être ' +
          'transmises avant confirmation de l’intervention.',
      );
    }

    await this.assertPiecesLegitimes(userId, dto.pieceIds ?? []);

    const message = await this.prisma.$transaction(async (tx) => {
      const cree = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          body: texte,
          coordonneesMasquees: masque,
          ...(dto.pieceIds && dto.pieceIds.length > 0
            ? { pieces: { create: dto.pieceIds.map((fileAssetId) => ({ fileAssetId })) } }
            : {}),
        },
        include: {
          sender: { select: SELECT_PERSONNE },
          pieces: {
            include: {
              fileAsset: { select: { id: true, originalName: true, mimeType: true, size: true } },
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { dernierMessageAt: cree.createdAt, updatedAt: new Date() },
      });

      // Écrire, c'est avoir lu.
      await tx.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { luJusquA: cree.createdAt },
      });

      return cree;
    });

    await this.prevenir(conversationId, userId, texte);

    return {
      ...message,
      coordonneesMasquees: masque,
      explicationMasquage: masque ? EXPLICATION_MASQUAGE : null,
    };
  }

  /** On ne joint que des fichiers qu'on a soi-même déposés, famille MESSAGE. */
  private async assertPiecesLegitimes(userId: string, pieceIds: string[]) {
    if (pieceIds.length === 0) return;
    const trouves = await this.prisma.fileAsset.count({
      where: { id: { in: pieceIds }, uploaderId: userId, kind: FileKind.MESSAGE },
    });
    if (trouves !== new Set(pieceIds).size) {
      throw new BadRequestException('Pièce jointe introuvable.');
    }
  }

  /**
   * NOTIFICATION — la messagerie que personne n'ouvre ne sert à rien.
   *
   * Une notification dans l'application ET un courriel, parce que personne
   * n'ouvre tous les jours une plateforme qu'il n'utilise pas encore. Le
   * courriel ne reprend JAMAIS le contenu du message : un fil du médico-social
   * peut porter des informations sur une personne accompagnée, et un courriel
   * traverse des serveurs qu'on ne maîtrise pas. Il dit qu'il y a un message,
   * et où le lire.
   *
   * ⚠ Protégée par un `.catch()` : un serveur de messagerie lent ne doit jamais
   * faire échouer l'envoi d'un message qui est, lui, déjà enregistré.
   */
  private async prevenir(conversationId: string, auteurId: string, apercu: string) {
    try {
      const destinataires = await this.prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          quitteLe: null,
          notifications: true,
          userId: { not: auteurId },
        },
        select: {
          user: { select: { id: true, email: true, firstName: true, notifMailOptIn: true, emailVerified: true } },
        },
      });
      if (destinataires.length === 0) return;

      const auteur = await this.prisma.user.findUnique({
        where: { id: auteurId },
        select: { firstName: true, lastName: true },
      });
      const nom =
        [auteur?.firstName, auteur?.lastName].filter(Boolean).join(' ').trim() ||
        'Un membre';

      await this.prisma.notification.createMany({
        data: destinataires.map((d) => ({
          userId: d.user.id,
          type: 'MESSAGE',
          title: `Nouveau message de ${nom}`,
          // L'aperçu reste dans l'application, qui est authentifiée.
          body: apercu.slice(0, 140),
          link: `/dashboard/inbox?c=${conversationId}`,
        })),
      });

      for (const d of destinataires) {
        if (!d.user.notifMailOptIn || !d.user.emailVerified) continue;
        await this.mail
          .sendNouveauMessage(d.user.email, {
            auteur: nom,
            conversationId,
            prenom: d.user.firstName,
          })
          .catch(() => undefined);
      }
    } catch {
      // Silencieux, volontairement : le message est enregistré, c'est ce qui
      // compte. Une notification manquée se rattrape à la prochaine visite.
    }
  }

  /** Modifier son propre message — jamais celui d'un autre, jamais un système. */
  async modifier(conversationId: string, messageId: string, userId: string, dto: ModifierMessageDto) {
    const participation = await this.assertParticipant(conversationId, userId);
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
    });
    if (!message) throw new NotFoundException('Message introuvable.');
    if (message.senderId !== userId) {
      throw new ForbiddenException('On ne modifie pas le message de quelqu’un d’autre.');
    }
    if (message.type === TypeMessage.SYSTEME) {
      throw new BadRequestException('Un message de la plateforme ne se modifie pas.');
    }
    if (message.supprimeLe) {
      throw new BadRequestException('Ce message a été retiré.');
    }

    const ouvertes = await this.coordonneesOuvertes(participation.conversation);
    const { texte, masque } = ouvertes
      ? { texte: dto.body, masque: false }
      : masquerCoordonnees(dto.body);

    return this.prisma.message.update({
      where: { id: messageId },
      data: { body: texte, modifieLe: new Date(), coordonneesMasquees: masque },
    });
  }

  /**
   * Retirer son message.
   *
   * ⚠ La LIGNE reste, le corps est vidé. Faire disparaître un message d'un fil
   * lu par plusieurs personnes réécrirait une conversation professionnelle —
   * et dans ce secteur, un échange peut être versé à un dossier.
   */
  async retirer(conversationId: string, messageId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
    });
    if (!message) throw new NotFoundException('Message introuvable.');
    if (message.senderId !== userId) {
      throw new ForbiddenException('On ne retire pas le message de quelqu’un d’autre.');
    }
    if (message.type === TypeMessage.SYSTEME) {
      throw new BadRequestException('Un message de la plateforme ne se retire pas.');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { body: '', supprimeLe: new Date() },
      select: { id: true, supprimeLe: true },
    });
  }

  /** Signaler un message à Les Extras. */
  async signaler(
    conversationId: string,
    messageId: string,
    userId: string,
    dto: SignalerMessageDto,
  ) {
    await this.assertParticipant(conversationId, userId);
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
    });
    if (!message) throw new NotFoundException('Message introuvable.');
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        signaleLe: new Date(),
        signaleParId: userId,
        motifSignalement: dto.motif ?? null,
      },
      select: { id: true, signaleLe: true },
    });
  }

  // -------------------------------------------------------------------------
  // GESTION DU FIL
  // -------------------------------------------------------------------------

  /** Ajoute des participants, dans la limite du périmètre de qui les ajoute. */
  async ajouterParticipants(conversationId: string, userId: string, dto: AjouterParticipantsDto) {
    const participation = await this.assertParticipant(conversationId, userId);
    const fil = participation.conversation;

    if (fil.type === TypeConversation.INTERVENANT) {
      throw new BadRequestException(
        'Un échange avec un intervenant reste entre les parties de la demande.',
      );
    }
    if (!fil.accountId) {
      throw new BadRequestException('Ce fil n’est rattaché à aucun établissement.');
    }

    const brut = await this.prisma.membership.findFirst({
      where: { userId, accountId: fil.accountId, status: MembershipStatus.ACTIVE },
      select: SELECT_MEMBRE,
    });
    if (!brut) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    const membre = versMembreCourant(brut);

    const visibles = await this.prisma.membership.findMany({
      where: {
        ...filtreMembresVisibles(membre),
        status: MembershipStatus.ACTIVE,
        userId: { in: dto.userIds },
      },
      select: { userId: true, user: { select: { firstName: true, lastName: true } } },
    });
    if (visibles.length !== new Set(dto.userIds).size) {
      throw new ForbiddenException(
        'Vous ne pouvez ajouter que des personnes de votre périmètre.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const v of visibles) {
        await tx.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId, userId: v.userId } },
          create: { conversationId, userId: v.userId },
          update: { quitteLe: null },
        });
      }
      // Message système : dans un fil professionnel, l'arrivée de quelqu'un ne
      // se devine pas. Tout le monde doit savoir qui lit.
      const noms = visibles
        .map((v) => [v.user.firstName, v.user.lastName].filter(Boolean).join(' ').trim())
        .filter(Boolean)
        .join(', ');
      await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          type: TypeMessage.SYSTEME,
          body: `${noms || 'Une personne'} a rejoint la conversation.`,
        },
      });
    });

    return this.findOne(conversationId, userId);
  }

  /**
   * Quitter un fil.
   *
   * Coupe la visibilité pour la SUITE. Ce qui a déjà été lu reste lu : on ne
   * réécrit pas le passé d'une conversation professionnelle.
   */
  async quitter(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { quitteLe: new Date() },
    });
    return { quitte: true };
  }

  /** Clore un fil : il reste lisible, il n'est plus alimentable. */
  async fermer(conversationId: string, userId: string, fermee: boolean) {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { fermee },
    });
    return { fermee };
  }

  /** Couper les courriels pour ce fil seulement. */
  async notifications(conversationId: string, userId: string, actif: boolean) {
    await this.assertParticipant(conversationId, userId);
    return this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { notifications: actif },
      select: { conversationId: true, notifications: true },
    });
  }

  /** Marque le fil lu jusqu'à maintenant. */
  async marquerLu(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { luJusquA: new Date() },
    });
    // `Message.readAt` est conservé pour l'existant : on le tient à jour tant
    // que d'anciens écrans le lisent, mais il ne fait plus autorité.
    const res = await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: res.count };
  }

  // -------------------------------------------------------------------------
  // COMPATIBILITÉ — l'existant continue de fonctionner
  // -------------------------------------------------------------------------

  /**
   * Fil de mission de renfort. Inchangé dans ses règles d'accès ; il pose
   * désormais ses participants, sans quoi le fil créé n'apparaîtrait dans la
   * boîte de personne.
   */
  async create(userId: string, dto: CreateConversationDto) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: dto.missionId },
      select: { accountId: true, account: { select: { ownerId: true } } },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');

    const [membre, candidature, engagement] = await this.prisma.$transaction([
      this.prisma.membership.count({
        where: { userId, accountId: mission.accountId, status: MembershipStatus.ACTIVE },
      }),
      this.prisma.booking.count({
        where: { missionId: dto.missionId, account: { ownerId: userId } },
      }),
      this.prisma.missionEngagement.count({
        where: { missionId: dto.missionId, account: { ownerId: userId } },
      }),
    ]);

    if (membre === 0 && candidature === 0 && engagement === 0) {
      throw new ForbiddenException(
        'Vous ne pouvez écrire au sujet de cette mission qu’après y avoir répondu. ' +
          'Candidatez ou prenez la mission : la messagerie s’ouvrira alors avec l’établissement.',
      );
    }

    const existant = await this.prisma.conversation.findFirst({
      where: { missionId: dto.missionId, participants: { some: { userId } } },
    });
    if (existant) {
      return this.envoyer(existant.id, userId, { body: dto.body });
    }

    return this.creerFil({
      type: TypeConversation.MISSION,
      sujet: null,
      accountId: mission.accountId,
      missionId: dto.missionId,
      createdById: userId,
      participants: [...new Set([userId, mission.account.ownerId])],
      auteurId: userId,
      body: dto.body,
    });
  }

  /** Ancien nom, conservé : l'écran l'appelle encore. */
  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    return this.envoyer(conversationId, userId, dto);
  }

  async markRead(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    return this.marquerLu(conversationId, userId);
  }
}
