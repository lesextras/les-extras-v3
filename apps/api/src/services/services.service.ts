import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountType, BookingStatus, Prisma, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import { BookServiceDto } from './dto/book-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(accountId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        accountId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        categoryId: dto.categoryId ?? undefined,
        duration: dto.duration,
        maxParticipants: dto.maxParticipants,
        publicTarget: dto.publicTarget,
        price: dto.price,
        city: dto.city,
      },
    });
  }

  /** Services du compte freelance actif. */
  async findAllByAccount(accountId: string) {
    return this.prisma.service.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { bookings: true } },
        categoryRef: { select: { id: true, title: true } },
      },
    });
  }

  /** Catalogue public : services publiés + filtres catégorie/ville. */
  async findCatalog(query: QueryServicesDto) {
    const where: Prisma.ServiceWhereInput = { status: ServiceStatus.PUBLISHED };
    if (query.category) where.category = query.category;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.take ?? 20,
        skip: query.skip ?? 0,
        include: {
          account: { select: { id: true, name: true, city: true, logoUrl: true } },
          categoryRef: { select: { id: true, title: true } },
        },
      }),
      this.prisma.service.count({ where }),
    ]);
    return { items, total, take: query.take ?? 20, skip: query.skip ?? 0 };
  }

  async findOne(id: string, accountId?: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, city: true, logoUrl: true } },
        categoryRef: { select: { id: true, title: true } },
      },
    });
    if (!service) throw new NotFoundException('Service introuvable.');
    // Propriétaire : accès complet (y compris brouillon).
    if (accountId && service.accountId === accountId) return service;
    // Autre compte : uniquement les ateliers publiés.
    if (service.status === 'PUBLISHED') return service;
    throw new NotFoundException('Service introuvable.');
  }

  private async assertOwned(id: string, accountId: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service introuvable.');
    if (service.accountId !== accountId) {
      throw new ForbiddenException('Service hors de votre compte.');
    }
    return service;
  }

  async update(id: string, accountId: string, dto: UpdateServiceDto) {
    await this.assertOwned(id, accountId);
    return this.prisma.service.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string, accountId: string) {
    await this.assertOwned(id, accountId);
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Réservation d'un atelier par un ESTABLISHMENT : crée un Booking REQUESTED
   * rattaché au compte réservant, notifie le freelance propriétaire.
   */
  async book(serviceId: string, bookingAccountId: string, dto: BookServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { account: { select: { ownerId: true } } },
    });
    if (!service) throw new NotFoundException('Service introuvable.');
    if (service.status !== ServiceStatus.PUBLISHED) {
      throw new BadRequestException('Ce service n’est pas réservable.');
    }
    if (service.accountId === bookingAccountId) {
      throw new BadRequestException('Vous ne pouvez pas réserver votre propre service.');
    }

    // Le compte réservant : seuls les ESTABLISHMENT consomment des crédits.
    // (Réservations freelances / missions = pas de débit.)
    const bookingAccount = await this.prisma.account.findUniqueOrThrow({
      where: { id: bookingAccountId },
      select: { type: true, credits: true },
    });
    const cost = service.creditCost;
    const debits =
      bookingAccount.type === AccountType.ESTABLISHMENT && cost > 0;

    if (debits && bookingAccount.credits < cost) {
      throw new BadRequestException(
        `Crédits insuffisants : cette réservation coûte ${cost} crédit(s), solde actuel ${bookingAccount.credits}.`,
      );
    }

    // Création du booking + débit + grand livre dans une seule transaction.
    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          accountId: bookingAccountId,
          serviceId,
          status: BookingStatus.REQUESTED,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
          totalAmount: service.price ?? undefined,
        },
      });

      if (debits) {
        // Re-lecture du solde DANS la transaction (garde anti-course).
        const fresh = await tx.account.findUniqueOrThrow({
          where: { id: bookingAccountId },
          select: { credits: true },
        });
        if (fresh.credits < cost) {
          throw new BadRequestException('Crédits insuffisants');
        }
        const balanceAfter = fresh.credits - cost;
        await tx.account.update({
          where: { id: bookingAccountId },
          data: { credits: balanceAfter },
        });
        await tx.creditLedger.create({
          data: {
            accountId: bookingAccountId,
            delta: -cost,
            balanceAfter,
            reason: 'ATELIER_BOOKING',
            bookingId: created.id,
          },
        });
      }

      return created;
    });

    await this.notifications.create(service.account.ownerId, {
      type: 'SERVICE_BOOKING',
      title: 'Nouvelle réservation',
      body: `Votre atelier « ${service.title} » a été réservé.`,
      link: `/dashboard/bookings/${booking.id}`,
    });

    return booking;
  }
}
