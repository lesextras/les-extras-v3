import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceCategory, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryPublicCatalogDto } from './dto/query-public-catalog.dto';

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
  city: true,
  maxParticipants: true,
  publicTarget: true,
  createdAt: true,
  categoryRef: { select: { id: true, title: true } },
  account: { select: { id: true, name: true, city: true, logoUrl: true } },
} satisfies Prisma.ServiceSelect;

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

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

  /** Détail d'un service PUBLISHED (404 sinon). */
  async detail(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, status: ServiceStatus.PUBLISHED },
      select: PUBLIC_SELECT,
    });
    if (!service) throw new NotFoundException('Service introuvable.');
    return service;
  }
}
