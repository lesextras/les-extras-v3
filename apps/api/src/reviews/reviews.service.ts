import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

/** Sélection minimale d'un utilisateur affiché à côté d'un avis. */
const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

/** Compte participant à une réservation + son responsable (cible de l'avis). */
const PARTY_SELECT = {
  id: true,
  name: true,
  type: true,
  owner: { select: USER_SELECT },
} as const;

/** Un avis restant à déposer, tel que renvoyé par GET /reviews/pending. */
export interface PendingReview {
  bookingId: string;
  /** Intitulé de la mission ou de l'atelier concerné. */
  label: string;
  scheduledAt: Date | null;
  completedAt: Date;
  /** Compte de l'autre partie (établissement ou intervenant). */
  counterpart: {
    accountId: string;
    accountName: string;
    accountType: string;
  };
  /** Utilisateur qui recevra l'avis (responsable du compte d'en face). */
  target: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée un avis bidirectionnel après un booking COMPLETED. L'auteur doit
   * appartenir au compte actif, lequel doit participer à la réservation ;
   * la cible en est l'autre partie.
   *
   * Contrôles : réservation inexistante (404), réservation d'un autre compte
   * (403), prestation non terminée (400), avis déjà déposé (409).
   */
  async create(userId: string, accountId: string, dto: CreateReviewDto) {
    if (dto.targetId === userId) {
      throw new BadRequestException('Vous ne pouvez pas vous évaluer vous-même.');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        account: { select: { id: true, memberships: { select: { userId: true } } } },
        mission: {
          select: {
            accountId: true,
            account: { select: { memberships: { select: { userId: true } } } },
          },
        },
        service: {
          select: {
            accountId: true,
            account: { select: { memberships: { select: { userId: true } } } },
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Réservation introuvable.');

    // 1. Le compte actif doit être l'une des deux parties de la réservation.
    const offerAccountId = booking.mission?.accountId ?? booking.service?.accountId ?? null;
    if (booking.accountId !== accountId && offerAccountId !== accountId) {
      throw new ForbiddenException('Cette réservation ne concerne pas votre compte.');
    }

    // 2. Un avis ne se dépose qu'après une prestation réellement terminée.
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Un avis n’est possible qu’après une prestation terminée.');
    }

    // 3. Un avis par réservation ET par auteur : l'établissement et l'intervenant
    //    peuvent chacun déposer le leur sur la même prestation.
    const existing = await this.prisma.review.findFirst({
      where: { bookingId: dto.bookingId, authorId: userId },
    });
    if (existing) {
      throw new ConflictException('Un avis a déjà été déposé pour cette réservation.');
    }

    // 4. L'auteur et la cible doivent tous deux avoir participé.
    const bookingMembers = booking.account.memberships.map((m) => m.userId);
    const offerMembers =
      booking.mission?.account.memberships.map((m) => m.userId) ??
      booking.service?.account.memberships.map((m) => m.userId) ??
      [];
    const participants = new Set<string>([...bookingMembers, ...offerMembers]);

    if (!participants.has(userId)) {
      throw new ForbiddenException('Vous n’avez pas participé à cette réservation.');
    }
    if (!participants.has(dto.targetId)) {
      throw new BadRequestException('La cible de l’avis ne participe pas à cette réservation.');
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

  /**
   * Réservations terminées du compte actif pour lesquelles aucun avis n'a
   * encore été déposé. Fonctionne dans les deux sens : le compte peut être
   * celui qui a réservé (booking.accountId) ou celui qui portait l'offre
   * (mission/service). La cible proposée est le responsable d'en face.
   */
  async findPending(userId: string, accountId: string): Promise<PendingReview[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        // N'affiche que les prestations où CET utilisateur n'a pas encore donné son avis
        // (l'autre partie peut avoir déjà déposé le sien).
        reviews: { none: { authorId: userId } },
        OR: [{ accountId }, { mission: { accountId } }, { service: { accountId } }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        account: { select: PARTY_SELECT },
        mission: { select: { id: true, title: true, account: { select: PARTY_SELECT } } },
        service: { select: { id: true, title: true, account: { select: PARTY_SELECT } } },
      },
    });

    const pending: PendingReview[] = [];
    for (const booking of bookings) {
      const offer = booking.mission ?? booking.service ?? null;
      if (!offer) continue; // réservation orpheline (mission/service supprimé)

      // L'autre partie : si le compte actif a réservé, c'est le porteur de
      // l'offre ; sinon c'est le compte qui a réservé.
      const counterpart = booking.accountId === accountId ? offer.account : booking.account;
      const target = counterpart.owner;
      if (!target || target.id === userId) continue; // pas d'auto-évaluation

      pending.push({
        bookingId: booking.id,
        label: offer.title,
        scheduledAt: booking.scheduledAt,
        completedAt: booking.updatedAt,
        counterpart: {
          accountId: counterpart.id,
          accountName: counterpart.name,
          accountType: counterpart.type,
        },
        target: {
          id: target.id,
          firstName: target.firstName,
          lastName: target.lastName,
          avatarUrl: target.avatarUrl,
        },
      });
    }
    return pending;
  }

  /** Avis reçus par un utilisateur + note moyenne. */
  async findForUser(targetId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: USER_SELECT },
      },
    });
    const average =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;
    return { count: reviews.length, average, reviews };
  }

  async findForBooking(bookingId: string) {
    return this.prisma.review.findMany({ where: { bookingId } });
  }
}
