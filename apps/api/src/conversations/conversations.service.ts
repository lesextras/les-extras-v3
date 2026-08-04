import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Conversations visibles par l'utilisateur : celles où il a déjà écrit,
   * ou celles rattachées à une mission d'un de ses comptes.
   */
  async findAll(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { messages: { some: { senderId: userId } } },
          { mission: { account: { memberships: { some: { userId } } } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        mission: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true,
            body: true,
            senderId: true,
            createdAt: true,
            readAt: true,
            sender: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // L'ecran attendait trois champs que personne ne produisait : le nom de
    // l'interlocuteur, le dernier message et le compteur de non-lus. Faute de
    // quoi toutes les conversations s'appelaient « Utilisateur » et le badge
    // ne s'affichait jamais. On les fabrique ici, a partir des trente
    // derniers messages charges.
    return conversations.map((c) => {
      const dernier = c.messages[0] ?? null;
      const interlocuteurs = new Map<string, (typeof c.messages)[number]['sender']>();
      for (const m of c.messages) {
        if (m.senderId !== userId && m.sender) interlocuteurs.set(m.senderId, m.sender);
      }
      const unreadCount = c.messages.filter(
        (m) => m.senderId !== userId && !m.readAt,
      ).length;
      const { messages: _msgs, ...reste } = c;
      return {
        ...reste,
        participants: [...interlocuteurs.values()],
        lastMessage: dernier
          ? { id: dernier.id, body: dernier.body, senderId: dernier.senderId, createdAt: dernier.createdAt }
          : null,
        unreadCount,
      };
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        mission: { select: { account: { select: { memberships: { select: { userId: true } } } } } },
        messages: { select: { senderId: true } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');

    const memberIds = conversation.mission?.account?.memberships?.map((m) => m.userId) ?? [];
    const senderIds = conversation.messages.map((m) => m.senderId);
    const participant = memberIds.includes(userId) || senderIds.includes(userId);
    if (!participant) throw new ForbiddenException('Vous ne participez pas à cette conversation.');
    return conversation;
  }

  async getMessages(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  /**
   * UNE conversation avec ses messages.
   *
   * L'écran de messagerie appelait cette route depuis toujours ; elle
   * n'existait pas. Le fil restait donc vide en permanence, sans erreur
   * visible — l'échec était avalé par le chargement tolérant de la page, et
   * l'utilisateur lisait « Sélectionnez une conversation » quoi qu'il fasse.
   * L'envoi de message, lui, fonctionnait : on pouvait écrire sans jamais
   * voir ce qu'on avait écrit.
   */
  async findOne(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const [conversation, messages] = await Promise.all([
      this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          mission: { select: { id: true, title: true } },
        },
      }),
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        // Une conversation longue ne se lit pas d'un bloc : on rend les deux
        // cents derniers messages, l'ordre chronologique étant rétabli après.
        take: 200,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
    ]);
    if (!conversation) throw new NotFoundException('Conversation introuvable.');

    // Ouvrir un fil, c'est le lire : les messages reçus passent en « lu »
    // sans geste supplémentaire. Avant, aucun écran n'appelait jamais la
    // route de lecture et le compteur de non-lus ne redescendait pas.
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    // L'en-tête du fil affiche l'interlocuteur : on le déduit des messages,
    // comme dans la liste.
    const interlocuteurs = new Map<string, (typeof messages)[number]['sender']>();
    for (const m of messages) {
      if (m.senderId !== userId && m.sender) interlocuteurs.set(m.senderId, m.sender);
    }

    return {
      conversation: { ...conversation, participants: [...interlocuteurs.values()] },
      messages,
    };
  }

  /**
   * Crée une conversation avec un premier message.
   *
   * ON N'ÉCRIT PAS À UNE STRUCTURE AVEC LAQUELLE ON N'A AUCUN LIEN.
   *
   * Cette méthode ne vérifiait rien : n'importe quel compte, y compris créé
   * la minute d'avant, déposait un fil dans la boîte de n'importe quel
   * établissement en citant l'identifiant d'une de ses missions. Sur une
   * plateforme dont les destinataires sont des directions d'établissements
   * du médico-social, c'est un canal de démarchage et de harcèlement ouvert.
   *
   * Le lien légitime est simple : soit on fait partie de l'établissement qui
   * a publié la mission, soit on a répondu à cette mission (candidature ou
   * engagement). Dans tous les autres cas, il n'y a rien à se dire ici.
   */
  async create(userId: string, dto: CreateConversationDto) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: dto.missionId },
      select: { accountId: true },
    });
    // Un identifiant inconnu déclenchait une erreur 500 (violation de clé
    // étrangère non interceptée). On dit simplement que ça n'existe pas.
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

    return this.prisma.conversation.create({
      data: {
        missionId: dto.missionId,
        messages: { create: { senderId: userId, body: dto.body } },
      },
      include: { messages: true },
    });
  }

  /** Envoie un message et remonte la conversation (updatedAt). */
  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    await this.assertParticipant(conversationId, userId);
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId: userId, body: dto.body },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  /** Marque comme lus les messages reçus (non émis par l'utilisateur). */
  async markRead(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const res = await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: res.count };
  }
}
