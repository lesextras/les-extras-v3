import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityService } from '../community/community.service';
import { PointReason } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import {
  MESSAGE_HORS_PORTEE,
  reservableParCompte,
  visibleParCompte,
} from './portee-salarie';
import { BookServiceDto } from './dto/book-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly community: CommunityService,
  ) {}

  async create(accountId: string, dto: CreateServiceDto) {
    const fiche = await this.prisma.service.create({
      data: {
        accountId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        categoryId: dto.categoryId ?? undefined,
        duration: dto.duration,
        durationMinutes: dto.durationMinutes,
        maxParticipants: dto.maxParticipants,
        publicTarget: dto.publicTarget,
        publicTargets: dto.publicTargets ?? [],
        material: dto.material,
        prerequisites: dto.prerequisites,
        objectives: dto.objectives,
        methodology: dto.methodology,
        evaluation: dto.evaluation,
        faq: (dto.faq as unknown as object) ?? undefined,
        images: dto.images ?? [],
        priceExtras: (dto.priceExtras as unknown as object) ?? undefined,
        timeSlots: dto.timeSlots ?? [],
        qualiopi: dto.qualiopi ?? false,
        price: dto.price,
        city: dto.city,
      },
    });

    // Bonus de démarrage : on compte APRÈS la création. Si le total vaut 1,
    // c'est que celle-ci était la première — la condition ne peut donc jamais
    // se déclencher deux fois, même si deux fiches partent en même temps.
    const total = await this.prisma.service.count({ where: { accountId } });
    if (total === 1) {
      await this.community
        .crediter(
          accountId,
          PointReason.PREMIERE_FICHE,
          `Première fiche créée : ${fiche.title}`,
        )
        .catch(() => undefined);
    }

    return fiche;
  }

  /** Services du compte freelance actif. */
  async findAllByAccount(accountId: string, take?: number) {
    return this.prisma.service.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, Math.trunc(Number(take) || 50))),
      include: {
        _count: { select: { bookings: true } },
        categoryRef: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Catalogue : services publiés + filtres catégorie/ville.
   *
   * `lecteurAccountId` décide de la portée : les fiches d'un salarié ne sont
   * visibles que des établissements qui l'emploient (voir `portee-salarie`).
   */
  async findCatalog(query: QueryServicesDto, lecteurAccountId?: string) {
    const where: Prisma.ServiceWhereInput = {
      status: ServiceStatus.PUBLISHED,
      AND: [visibleParCompte(lecteurAccountId)],
    };
    if (query.category) where.category = query.category;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    const recherche = query.search?.trim();
    if (recherche) {
      where.OR = [
        { title: { contains: recherche, mode: 'insensitive' } },
        { description: { contains: recherche, mode: 'insensitive' } },
      ];
    }

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
        account: {
          select: {
            id: true,
            name: true,
            city: true,
            logoUrl: true,
            slug: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: { select: { job: true, bio: true } },
              },
            },
          },
        },
        categoryRef: { select: { id: true, title: true } },
      },
    });
    if (!service) throw new NotFoundException('Service introuvable.');
    const estProprietaire = Boolean(accountId && service.accountId === accountId);
    if (!estProprietaire && service.status !== 'PUBLISHED') {
      throw new NotFoundException('Service introuvable.');
    }
    // Portée d'un salarié : sa fiche n'existe que pour les établissements qui
    // l'emploient. « Introuvable » et non « interdit » — l'existence même de
    // la fiche ne regarde pas les autres.
    if (!estProprietaire && !(await reservableParCompte(this.prisma, id, accountId ?? ''))) {
      throw new NotFoundException('Service introuvable.');
    }

    // Consultation comptabilisée pour les visiteurs (jamais pour le propriétaire).
    if (!estProprietaire) {
      this.prisma.service
        .update({ where: { id }, data: { views: { increment: 1 } } })
        .catch(() => undefined);
    }

    // Réputation : d'abord celle de CET atelier, sinon celle de l'intervenant.
    const ownerId = service.account?.owner?.id;
    const REVIEW_SELECT = {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      author: { select: { firstName: true, lastName: true } },
    };
    const avisPrestation = await this.prisma.review.findMany({
      where: { serviceId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: REVIEW_SELECT,
    });
    const [notesIntervenant, similaires] = await this.prisma.$transaction([
      ownerId && avisPrestation.length === 0
        ? this.prisma.review.findMany({
            where: { targetId: ownerId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: REVIEW_SELECT,
          })
        : this.prisma.review.findMany({ where: { id: '' } }),
      this.prisma.service.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: id },
          OR: [{ category: service.category }, { categoryId: service.categoryId ?? undefined }],
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: 3,
        select: {
          id: true,
          title: true,
          price: true,
          city: true,
          duration: true,
          images: true,
          category: true,
        },
      }),
    ]);

    const notes = avisPrestation.length > 0 ? avisPrestation : notesIntervenant;
    const moyenne =
      notes.length > 0
        ? Math.round((notes.reduce((sum, r) => sum + r.rating, 0) / notes.length) * 10) / 10
        : null;
    const ratingSource: 'service' | 'provider' | null =
      avisPrestation.length > 0 ? 'service' : notes.length > 0 ? 'provider' : null;

    return { ...service, reviews: notes, rating: moyenne, ratingSource, related: similaires };
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
    const avant = await this.assertOwned(id, accountId);
    const { faq, priceExtras, ...rest } = dto;
    // Première mise en ligne de cette fiche : elle enrichit le catalogue
    // commun, elle est créditée en points. Les republications suivantes ne
    // rapportent rien (sinon il suffirait de dépublier/republier en boucle).
    if (dto.status === 'PUBLISHED' && avant?.status !== 'PUBLISHED') {
      await this.community
        .crediter(accountId, PointReason.PUBLICATION, `Fiche publiée : ${avant?.title ?? id}`)
        .catch(() => undefined);
    }
    return this.prisma.service.update({
      where: { id },
      data: {
        ...rest,
        ...(faq !== undefined ? { faq: faq as unknown as object } : {}),
        ...(priceExtras !== undefined
          ? { priceExtras: priceExtras as unknown as object }
          : {}),
      },
    });
  }

  /**
   * ON NE SUPPRIME PAS CE QUI A DÉJÀ ÉTÉ VENDU.
   *
   * Supprimer un atelier effaçait la fiche mais laissait derrière elle le
   * devis accepté et la réservation confirmée : un engagement financier sans
   * objet, un montant de facture qui ne renvoie plus à rien, et un
   * établissement qui a payé une prestation devenue introuvable.
   *
   * Une fiche déjà réservée ou déjà devisée s'ARCHIVE : elle quitte le
   * catalogue et ne peut plus être réservée, mais tout ce qui a été engagé
   * garde son objet. La suppression pure reste possible tant que rien n'a
   * été vendu.
   */
  async remove(id: string, accountId: string) {
    await this.assertOwned(id, accountId);
    const [reservations, devis] = await Promise.all([
      this.prisma.booking.count({ where: { serviceId: id } }),
      this.prisma.quote.count({ where: { serviceId: id } }),
    ]);
    if (reservations > 0 || devis > 0) {
      await this.prisma.service.update({
        where: { id },
        data: { status: ServiceStatus.ARCHIVED },
      });
      return {
        deleted: false,
        archived: true,
        message:
          'Cette fiche a déjà donné lieu à une réservation ou à un devis : elle a été archivée plutôt que supprimée. Elle n’apparaît plus au catalogue et ne peut plus être réservée, mais les engagements en cours gardent leur objet.',
      };
    }
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
    // On rejoue la portée à la réservation. Une règle qui ne vit que dans la
    // liste se contourne avec une URL — et c'est l'engagement, pas l'affichage,
    // qui compte ici.
    if (!(await reservableParCompte(this.prisma, serviceId, bookingAccountId))) {
      throw new ForbiddenException(MESSAGE_HORS_PORTEE);
    }

    // Paiement à la prestation : aucune monnaie interne. La réservation est
    // créée telle quelle, puis facturée au tarif de la prestation (majoré des
    // frais de gestion) une fois l'intervention confirmée. Un seul prix, une
    // seule facture — rien à recharger à l'avance.
    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          accountId: bookingAccountId,
          serviceId,
          status: BookingStatus.REQUESTED,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
          participants: dto.participants ?? undefined,
          requestNote: dto.message?.trim() || undefined,
          totalAmount: service.price ?? undefined,
        },
      });

      return created;
    });

    // La notification dit ce qu'il faut pour décider sans ouvrir l'écran : le
    // nombre de participants, et s'il dépasse ce que la fiche annonce. Un
    // atelier prévu pour huit et demandé pour vingt, c'est un refus ou une
    // renégociation — pas une surprise le jour même.
    const effectif = dto.participants ?? null;
    const depasse =
      effectif !== null && service.maxParticipants !== null && effectif > service.maxParticipants;
    const precision = effectif === null ? '' : ` pour ${effectif} participant${effectif > 1 ? 's' : ''}`;
    const alerte = depasse ? ` — au-delà des ${service.maxParticipants} annoncés sur votre fiche` : '';

    await this.notifications.create(service.account.ownerId, {
      type: 'SERVICE_BOOKING',
      title: 'Nouvelle réservation',
      body: `Votre atelier « ${service.title} » a été réservé${precision}${alerte}.`,
      link: `/dashboard/reservations`,
    });

    return booking;
  }
}
