import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MissionStatus,
  Prisma,
  ServiceCategory,
  ServiceStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { QueryPublicCatalogDto } from './dto/query-public-catalog.dto';
import { CreateContactDto } from './dto/create-contact.dto';

/**
 * Champs exposés publiquement (aucune donnée sensible : pas d'ownerId, pas de
 * bookings, pas d'email). Le compte est réduit à sa vitrine (nom, ville, logo).
 */
const PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  price: true,
  duration: true,
  durationMinutes: true,
  city: true,
  maxParticipants: true,
  publicTarget: true,
  publicTargets: true,
  images: true,
  qualiopi: true,
  verified: true,
  featured: true,
  createdAt: true,
  categoryRef: { select: { id: true, title: true } },
  account: { select: { id: true, name: true, city: true, logoUrl: true } },
} satisfies Prisma.ServiceSelect;

/**
 * Fiche publique complète : tout ce que la fiche connectée affiche, moins les
 * actions. Objectif SEO — la page vitrine doit valoir la page interne, sinon
 * Google n'indexe qu'une coquille et l'acheteur n'a aucune raison de cliquer.
 */
const PUBLIC_DETAIL_SELECT = {
  ...PUBLIC_SELECT,
  material: true,
  prerequisites: true,
  objectives: true,
  methodology: true,
  evaluation: true,
  faq: true,
  priceExtras: true,
  timeSlots: true,
  views: true,
  requestsCount: true,
  updatedAt: true,
  account: {
    select: {
      id: true,
      name: true,
      city: true,
      logoUrl: true,
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
} satisfies Prisma.ServiceSelect;

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Enregistre une demande de contact publique et notifie l'équipe par e-mail. */
  async createContact(dto: CreateContactDto) {
    const request = await this.prisma.contactRequest.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        type: dto.type,
        content: dto.content,
      },
    });
    // Notification best-effort : ne bloque pas la réponse à l'utilisateur.
    this.mail
      .sendContactNotification({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        type: dto.type,
        content: dto.content,
      })
      .catch(() => undefined);
    return { ok: true, id: request.id };
  }

  /** Construit le filtre de type (atelier / formation / all). */
  private typeWhere(type?: string): Prisma.ServiceWhereInput {
    const where: Prisma.ServiceWhereInput = { status: ServiceStatus.PUBLISHED };
    if (type === 'formation') {
      where.category = ServiceCategory.FORMATION;
    } else if (type === 'atelier') {
      where.category = { not: ServiceCategory.FORMATION };
    }
    return where;
  }

  /** Catalogue public paginé + facettes de catégories éditables. */
  async catalog(query: QueryPublicCatalogDto) {
    const where = this.typeWhere(query.type);

    if (query.category) {
      where.categoryRef = { is: { title: query.category } };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const take = query.take ?? 24;
    const skip = query.skip ?? 0;

    const [items, total, catRows] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: PUBLIC_SELECT,
      }),
      this.prisma.service.count({ where }),
      // Catégories disponibles pour ce type (indépendant de search/category)
      // afin d'alimenter un filtre stable.
      this.prisma.service.findMany({
        where: this.typeWhere(query.type),
        distinct: ['categoryId'],
        select: { categoryRef: { select: { title: true } } },
      }),
    ]);

    const categories = Array.from(
      new Set(
        catRows
          .map((r) => r.categoryRef?.title)
          .filter((t): t is string => Boolean(t)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'fr'));

    return { items, total, take, skip, categories };
  }

  /**
   * Détail PUBLIC d'un service PUBLISHED (404 sinon) — fiche vitrine complète :
   * contenu pédagogique, réputation de l'intervenant et fiches de la même
   * famille. Incrémente le compteur de consultations (preuve sociale).
   */
  async detail(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, status: ServiceStatus.PUBLISHED },
      select: PUBLIC_DETAIL_SELECT,
    });
    if (!service) throw new NotFoundException('Service introuvable.');

    // Best-effort : une erreur de compteur ne doit jamais casser la page.
    this.prisma.service
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    const ownerId = service.account?.owner?.id ?? null;
    const reviews = ownerId
      ? await this.prisma.review.findMany({
          where: { targetId: ownerId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: { select: { firstName: true, lastName: true } },
          },
        })
      : [];
    const rating =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10,
          ) / 10
        : null;

    const RELATED_SELECT = {
      id: true,
      title: true,
      price: true,
      city: true,
      duration: true,
      images: true,
    } satisfies Prisma.ServiceSelect;

    // D'abord la meme categorie editable ; si elle ne contient qu'une fiche, on
    // elargit a la famille (ATELIER, FORMATION...) pour ne jamais afficher un
    // bloc vide — le maillage interne compte autant pour le SEO que pour l'achat.
    let related = service.categoryRef?.id
      ? await this.prisma.service.findMany({
          where: {
            id: { not: id },
            status: ServiceStatus.PUBLISHED,
            categoryId: service.categoryRef.id,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: RELATED_SELECT,
        })
      : [];
    if (related.length === 0) {
      related = await this.prisma.service.findMany({
        where: {
          id: { not: id },
          status: ServiceStatus.PUBLISHED,
          category: service.category,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: RELATED_SELECT,
      });
    }

    return { ...service, reviews, rating, related };
  }

  /**
   * Détail PUBLIC d'une mission de renfort PUBLIÉE (vitrine partageable).
   * Aucune donnée sensible : ni ownerId, ni candidatures.
   */
  async missionDetail(id: string) {
    const mission = await this.prisma.reliefMission.findFirst({
      where: { id, status: MissionStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        job: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        city: true,
        postalCode: true,
        hourlyRate: true,
        headcount: true,
        emergency: true,
        attachmentUrl: true,
        status: true,
        categoryRef: { select: { id: true, title: true } },
        account: { select: { id: true, name: true, city: true, logoUrl: true } },
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    return mission;
  }
  /**
   * Fiche publique d'un intervenant : identité, présentation, réputation et
   * toutes ses interventions publiées. Équivalent des pages « host » du site
   * actuel — c'est la preuve sociale du catalogue.
   */
  async vendorDetail(accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, type: 'FREELANCE' },
      select: {
        id: true,
        name: true,
        city: true,
        logoUrl: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: { select: { job: true, bio: true, skills: true, city: true } },
          },
        },
      },
    });
    if (!account) throw new NotFoundException('Intervenant introuvable.');

    const [services, reviews] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where: { accountId, status: 'PUBLISHED' },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          price: true,
          city: true,
          duration: true,
          durationMinutes: true,
          maxParticipants: true,
          images: true,
          featured: true,
          verified: true,
        },
      }),
      account.owner?.id
        ? this.prisma.review.findMany({
            where: { targetId: account.owner.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              author: { select: { firstName: true, lastName: true } },
            },
          })
        : this.prisma.review.findMany({ where: { id: '' } }),
    ]);

    const rating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null;

    return { ...account, services, reviews, rating };
  }

}
