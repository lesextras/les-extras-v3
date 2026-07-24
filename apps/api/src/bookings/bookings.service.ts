import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../common/mail/mail.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

/** Transitions autorisées du cycle de vie d'un booking. */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.REQUESTED]: [BookingStatus.ACCEPTED, BookingStatus.CANCELLED],
  [BookingStatus.ACCEPTED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  /**
   * Liste les bookings visibles par le compte actif : ceux qu'il a créés
   * (accountId) ET ceux qui portent sur ses missions/services (offreur).
   */
  async findAllByAccount(accountId: string, query: QueryBookingsDto) {
    const where: Prisma.BookingWhereInput = {
      OR: [
        { accountId },
        { mission: { accountId } },
        { service: { accountId } },
      ],
    };
    if (query.status) where.status = query.status;

    return this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        mission: { select: { id: true, title: true, accountId: true, startDate: true } },
        service: { select: { id: true, title: true, accountId: true } },
        account: { select: { id: true, name: true, type: true } },
      },
    });
  }

  /** Détail d'un booking, contrôle que le compte y participe. */
  async findOne(id: string, accountId: string) {
    const booking = await this.loadForAccount(id, accountId);
    return booking;
  }

  private async loadForAccount(id: string, accountId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        mission: { select: { id: true, title: true, accountId: true, account: { select: { ownerId: true } } } },
        service: { select: { id: true, title: true, accountId: true, account: { select: { ownerId: true } } } },
        account: { select: { id: true, name: true, ownerId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking introuvable.');

    const offerAccountId = booking.mission?.accountId ?? booking.service?.accountId ?? null;
    const isParticipant = booking.accountId === accountId || offerAccountId === accountId;
    if (!isParticipant) {
      throw new ForbiddenException('Ce booking ne concerne pas votre compte.');
    }
    return booking;
  }

  private async transition(
    id: string,
    accountId: string,
    next: BookingStatus,
    extra: Prisma.BookingUpdateInput = {},
  ): Promise<Booking> {
    const booking = await this.loadForAccount(id, accountId);
    const allowed = TRANSITIONS[booking.status];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transition invalide : ${booking.status} -> ${next}.`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: next, ...extra },
    });

    // Notifie l'autre partie du changement d'état.
    const ownerIds = new Set<string>();
    if (booking.account?.ownerId) ownerIds.add(booking.account.ownerId);
    const offerOwner = booking.mission?.account?.ownerId ?? booking.service?.account?.ownerId;
    if (offerOwner) ownerIds.add(offerOwner);
    const label = booking.mission?.title ?? booking.service?.title ?? 'Réservation';
    for (const userId of ownerIds) {
      await this.notifications.create(userId, {
        type: 'BOOKING_STATUS',
        title: 'Réservation mise à jour',
        body: `« ${label} » est désormais ${next}.`,
        link: `/dashboard/bookings/${id}`,
      });
    }

    // Email de confirmation à l'établissement réservant (n'échoue jamais la requête).
    if (next === BookingStatus.CONFIRMED && booking.account?.ownerId) {
      try {
        const owner = await this.prisma.user.findUnique({
          where: { id: booking.account.ownerId },
          select: { email: true },
        });
        if (owner?.email) {
          await this.mail.sendBookingConfirmation(owner.email, {
            title: label,
            date: updated.scheduledAt,
          });
        }
      } catch (e) {
        this.logger.warn(
          `Email de confirmation de réservation non envoyé (${id}): ${(e as Error).message}`,
        );
      }
    }

    return updated;
  }

  accept(id: string, accountId: string) {
    return this.transition(id, accountId, BookingStatus.ACCEPTED);
  }

  confirm(id: string, accountId: string) {
    return this.transition(id, accountId, BookingStatus.CONFIRMED);
  }

  start(id: string, accountId: string) {
    return this.transition(id, accountId, BookingStatus.IN_PROGRESS);
  }

  complete(id: string, accountId: string) {
    return this.transition(id, accountId, BookingStatus.COMPLETED);
  }

  cancel(id: string, accountId: string, dto: CancelBookingDto) {
    return this.transition(id, accountId, BookingStatus.CANCELLED, {
      cancelReason: dto.reason,
    });
  }
}
