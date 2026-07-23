import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { messages: { some: { senderId: userId } } },
          { mission: { account: { memberships: { some: { userId } } } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        mission: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, body: true, senderId: true, createdAt: true, readAt: true },
        },
      },
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

  /** Crée une conversation avec un premier message. */
  async create(userId: string, dto: CreateConversationDto) {
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
