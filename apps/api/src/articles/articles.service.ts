import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, QueryArticlesDto, UpdateArticleDto } from './dto/article.dto';

/** Ce qu'un visiteur voit : ni brouillon, ni e-mail, ni donnée interne. */
const PUBLIC_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverUrl: true,
  publishedAt: true,
  views: true,
  createdAt: true,
  category: { select: { id: true, title: true } },
  account: { select: { id: true, name: true, type: true, logoUrl: true, city: true } },
  author: { select: { firstName: true, lastName: true, avatarUrl: true } },
} satisfies Prisma.ArticleSelect;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Slug lisible et unique : le titre, puis un suffixe si déjà pris. */
  private async slugify(titre: string): Promise<string> {
    const base =
      titre
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 70) || 'actualite';
    let slug = base;
    for (let i = 2; i < 60; i += 1) {
      const pris = await this.prisma.article.findUnique({ where: { slug }, select: { id: true } });
      if (!pris) return slug;
      slug = `${base}-${i}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  // ── Espace de rédaction du compte ────────────────────────────────────────

  /** Actualités du compte actif, brouillons compris. */
  findMine(accountId: string) {
    return this.prisma.article.findMany({
      where: { accountId },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: { ...PUBLIC_SELECT, status: true, content: true, linkedinSharedAt: true, linkedinUrn: true },
    });
  }

  async create(accountId: string, userId: string, dto: CreateArticleDto) {
    const publie = dto.status === ArticleStatus.PUBLISHED;
    return this.prisma.article.create({
      data: {
        accountId,
        authorId: userId,
        title: dto.title,
        slug: await this.slugify(dto.title),
        excerpt: dto.excerpt,
        content: dto.content,
        coverUrl: dto.coverUrl,
        categoryId: dto.categoryId ?? undefined,
        status: dto.status ?? ArticleStatus.DRAFT,
        publishedAt: publie ? new Date() : null,
      },
      select: { ...PUBLIC_SELECT, status: true, content: true },
    });
  }

  /** Un compte ne touche que ses propres actualités. */
  private async assertOwned(id: string, accountId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true, accountId: true, status: true, publishedAt: true, slug: true },
    });
    if (!article) throw new NotFoundException('Actualité introuvable.');
    if (article.accountId !== accountId) {
      throw new ForbiddenException('Cette actualité appartient à un autre compte.');
    }
    return article;
  }

  async update(id: string, accountId: string, dto: UpdateArticleDto) {
    const actuel = await this.assertOwned(id, accountId);
    const passeEnPublie =
      dto.status === ArticleStatus.PUBLISHED && actuel.status !== ArticleStatus.PUBLISHED;
    return this.prisma.article.update({
      where: { id },
      data: {
        ...dto,
        categoryId: dto.categoryId === null ? null : (dto.categoryId ?? undefined),
        ...(passeEnPublie ? { publishedAt: actuel.publishedAt ?? new Date() } : {}),
      },
      select: { ...PUBLIC_SELECT, status: true, content: true },
    });
  }

  async remove(id: string, accountId: string) {
    await this.assertOwned(id, accountId);
    await this.prisma.article.delete({ where: { id } });
    return { ok: true };
  }

  /** Récupère une actualité publiée du compte, pour le partage social. */
  async forSharing(id: string, accountId: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Actualité introuvable.');
    if (article.accountId !== accountId) {
      throw new ForbiddenException('Cette actualité appartient à un autre compte.');
    }
    if (article.status !== ArticleStatus.PUBLISHED) {
      throw new BadRequestException('Publiez l’actualité avant de la partager.');
    }
    return article;
  }

  markShared(id: string, urn: string) {
    return this.prisma.article.update({
      where: { id },
      data: { linkedinUrn: urn, linkedinSharedAt: new Date() },
      select: { id: true, linkedinUrn: true, linkedinSharedAt: true },
    });
  }

  // ── Fil public ───────────────────────────────────────────────────────────

  async feed(query: QueryArticlesDto) {
    const where: Prisma.ArticleWhereInput = { status: ArticleStatus.PUBLISHED };
    if (query.accountId) where.accountId = query.accountId;
    if (query.category) where.category = { is: { title: query.category } };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { excerpt: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const take = Math.min(query.take ?? 12, 50);
    const skip = query.skip ?? 0;

    const [items, total, catRows] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take,
        skip,
        select: PUBLIC_SELECT,
      }),
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where: { status: ArticleStatus.PUBLISHED },
        distinct: ['categoryId'],
        select: { category: { select: { title: true } } },
      }),
    ]);

    const categories = Array.from(
      new Set(catRows.map((r) => r.category?.title).filter((t): t is string => Boolean(t))),
    ).sort((a, b) => a.localeCompare(b, 'fr'));

    return { items, total, take, skip, categories };
  }

  /** Article public par slug, avec le contenu et les actualités liées. */
  async bySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: { ...PUBLIC_SELECT, content: true },
    });
    if (!article) throw new NotFoundException('Actualité introuvable.');

    this.prisma.article
      .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    const related = await this.prisma.article.findMany({
      where: { id: { not: article.id }, status: ArticleStatus.PUBLISHED },
      orderBy: [{ publishedAt: 'desc' }],
      take: 3,
      select: PUBLIC_SELECT,
    });
    return { ...article, related };
  }
}
