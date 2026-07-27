import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/conversations.dto';
import { MailService } from '../mail/mail.service';
import { EventsService } from '../events/events.service';
import { detectContactBypass } from './contact-bypass';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly events: EventsService,
  ) {}

  async findAllForUser(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        participantAUser: {
          include: { profile: true },
        },
        participantBUser: {
          include: { profile: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: userId,
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv: any) => {
      const otherParticipant =
        conv.participantAId === userId
          ? conv.participantBUser
          : conv.participantAUser;

      return {
        id: conv.id,
        updatedAt: conv.updatedAt,
        bookingId: (conv as any).bookingId ?? null,
        otherParticipant: {
          id: otherParticipant.id,
          firstName: otherParticipant.profile?.firstName,
          lastName: otherParticipant.profile?.lastName,
          avatar: otherParticipant.profile?.avatar,
          role: otherParticipant.role,
        },
        lastMessage: conv.messages[0] || null,
        unreadCount: conv._count.messages,
      };
    });
  }

  async findMessages(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participantAId !== userId &&
      conversation.participantBId !== userId
    ) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async getOrCreateConversation(userAId: string, userBId: string) {
    const conversation = await this.findConversationBetweenUsers(userAId, userBId);

    if (conversation) {
      return conversation;
    }

    const [participantAId, participantBId] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    return this.prisma.conversation.create({
      data: {
        participantAId,
        participantBId,
      },
    });
  }

  private async findConversationBetweenUsers(userAId: string, userBId: string) {
    const [participantAId, participantBId] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    return this.prisma.conversation.findUnique({
      where: {
        participantAId_participantBId: {
          participantAId,
          participantBId,
        },
      },
    });
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const { receiverId, content } = dto;

    // Only allow messaging when a confirmed booking links the two users
    const ALLOWED_STATUSES: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.AWAITING_PAYMENT, BookingStatus.PAID];
    const validBooking = await this.prisma.booking.findFirst({
      where: {
        status: { in: ALLOWED_STATUSES },
        OR: [
          { freelanceId: senderId, establishmentId: receiverId },
          { freelanceId: receiverId, establishmentId: senderId },
        ],
      },
      select: { id: true },
    });
    if (!validBooking) {
      throw new ForbiddenException("La messagerie est disponible uniquement après validation d'un achat.");
    }

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const blockedAttempt = detectContactBypass(content);
    if (blockedAttempt) {
      const existingConversation = await this.findConversationBetweenUsers(senderId, receiverId);

      await this.prisma.contactBypassEvent.create({
        data: {
          conversationId: existingConversation?.id ?? null,
          senderId,
          blockedReason: blockedAttempt.reason,
          rawExcerpt: content.trim().slice(0, 240),
        },
      });

      throw new BadRequestException(blockedAttempt.message);
    }

    const conversation = await this.getOrCreateConversation(senderId, receiverId);

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        conversationId: conversation.id,
      },
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      include: { profile: true },
    });

    if (receiver.email && sender) {
      const senderName = sender.profile?.firstName || sender.email.split('@')[0];
      if (senderName) {
        this.mailService.sendMessageNotificationEmail(receiver.email, senderName).catch((e: unknown) => console.error(e));
      }
    }

    // Emit SSE event for real-time updates
    this.emitMessageEvent(conversation.id, senderId, receiverId).catch(() => {});

    return message;
  }

  /**
   * Emit SSE MESSAGE_NEW event if the conversation is linked to a booking.
   */
  private async emitMessageEvent(conversationId: string, senderId: string, receiverId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { bookingId: true },
    });
    if (conversation?.bookingId) {
      this.events.emitToMany([senderId, receiverId], {
        type: 'MESSAGE_NEW',
        bookingId: conversation.bookingId,
        payload: { conversationId },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.participantAId !== userId &&
      conversation.participantBId !== userId
    ) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    const { count } = await this.prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true, count };
  }
}
