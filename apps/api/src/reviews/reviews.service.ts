import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée un avis bidirectionnel après un booking COMPLETED. L'auteur doit
   * être membre d'un des comptes participants ; la cible en est l'autre partie.
   */
  async create(userId: string, dto: CreateReviewDto) {
    if (dto.targetId === userId) {
      throw new BadRequestException('Vous ne pouvez pas vous évaluer vous-même.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        account: { select: { memberships: { select: { userId: true } } } },
        mission: { select: { account: { select: { memberships: { select: { userId: true } } } } } },
        service: { select: { account: { select: { memberships: { select: { userId: true } } } } } },
      },
    });
    if (!booking) throw new NotFoundException('Booking introuvable.');
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Un avis n’est possible qu’après une prestation terminée.');
    }

    const bookingMembers = booking.account.memberships.map((m) => m.userId);
    const offerMembers =
      booking.mission?.account.memberships.map((m) => m.userId) ??
      booking.service?.account.memberships.map((m) => m.userId) ??
      [];
    const participants = new Set<string>([...bookingMembers, ...offerMembers]);

    if (!participants.has(userId)) {
      throw new ForbiddenException('Vous n’avez pas participé à ce booking.');
    }
    if (!participants.has(dto.targetId)) {
      throw new BadRequestException('La cible de l’avis ne participe pas à ce booking.');
    }

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId },
    });
    if (existing) {
      throw new BadRequestException('Un avis existe déjà pour ce booking.');
    }

    return this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        authorId: userId,
        targetId: dto.targetId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  /** Avis reçus par un utilisateur + note moyenne. */
  async findForUser(targetId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    const average =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;
    return { count: reviews.length, average, reviews };
  }

  async findForBooking(bookingId: string) {
    return this.prisma.review.findUnique({ where: { bookingId } });
  }
}
