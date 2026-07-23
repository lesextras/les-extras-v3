import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Catégories éditables exposées aux formulaires (missions, ateliers, articles). */
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(type?: string) {
    return this.prisma.category.findMany({
      where: { archived: false, ...(type ? { type } : {}) },
      orderBy: [{ title: 'asc' }],
      select: { id: true, title: true, type: true },
    });
  }
}
