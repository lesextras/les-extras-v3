import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { ModerateMissionDto, ModerateServiceDto } from './dto/moderate.dto';
import { UpdateCategoryDto } from './dto/category-admin.dto';
import { UpdateArticleDto } from './dto/article-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Utilisateurs -------------------------------------------------------

  async listUsers(query: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async banUser(id: string, dto: BanUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.BANNED },
      select: { id: true, email: true, status: true },
    });
    await this.notifications.create(id, {
      type: 'ACCOUNT_BANNED',
      title: 'Compte suspendu',
      body: dto.reason ?? 'Votre compte a été suspendu par un administrateur.',
    });
    return updated;
  }

  async unbanUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.VERIFIED },
      select: { id: true, email: true, status: true },
    });
  }

  // --- Modération missions ------------------------------------------------

  async listMissions() {
    return this.prisma.reliefMission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true } } },
    });
  }

  async moderateMission(id: string, dto: ModerateMissionDto) {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    return this.prisma.reliefMission.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // --- Modération services ------------------------------------------------

  async listServices() {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true } } },
    });
  }

  async moderateService(id: string, dto: ModerateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service introuvable.');
    return this.prisma.service.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // --- Comptes / Organisations -------------------------------------------

  async listAccounts(query: { type?: string; search?: string }) {
    const where: Prisma.AccountWhereInput = {};
    if (query.type === 'ESTABLISHMENT' || query.type === 'FREELANCE') {
      where.type = query.type;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { siret: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { memberships: true, reliefMissions: true, services: true, bookings: true } },
      },
    });
  }

  async getAccount(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        memberships: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
        _count: { select: { reliefMissions: true, services: true, bookings: true, invoices: true } },
      },
    });
    if (!account) throw new NotFoundException('Compte introuvable.');
    return account;
  }

  async updateAccount(id: string, data: Prisma.AccountUpdateInput) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Compte introuvable.');
    return this.prisma.account.update({ where: { id }, data });
  }

  // --- Catégories (taxonomie éditable) -----------------------------------

  private slugify(input: string) {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);
  }

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { title: 'asc' }],
      include: {
        parent: { select: { id: true, title: true } },
        _count: { select: { children: true, articles: true } },
      },
    });
  }

  async createCategory(dto: {
    title: string;
    description?: string;
    type?: string;
    parentId?: string;
    archived?: boolean;
  }) {
    let slug = this.slugify(dto.title);
    const exists = await this.prisma.category.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    return this.prisma.category.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        type: dto.type,
        parentId: dto.parentId || null,
        archived: dto.archived ?? false,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Catégorie introuvable.');
    const data: Prisma.CategoryUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title as string;
    if (dto.description !== undefined) data.description = dto.description as string;
    if (dto.type !== undefined) data.type = dto.type as string;
    if (dto.archived !== undefined) data.archived = dto.archived as boolean;
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId ? { connect: { id: dto.parentId as string } } : { disconnect: true };
    }
    return this.prisma.category.update({ where: { id }, data });
  }

  async removeCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Catégorie introuvable.');
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Articles (contenu) -------------------------------------------------

  async listArticles() {
    return this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        category: { select: { id: true, title: true } },
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async createArticle(dto: {
    title: string;
    excerpt?: string;
    content?: string;
    coverUrl?: string;
    categoryId?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    authorId?: string;
  }) {
    let slug = this.slugify(dto.title);
    const exists = await this.prisma.article.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        coverUrl: dto.coverUrl,
        status: dto.status ?? 'DRAFT',
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
        categoryId: dto.categoryId || null,
        authorId: dto.authorId || null,
      },
    });
  }

  async updateArticle(id: string, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    const data: Prisma.ArticleUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title as string;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt as string;
    if (dto.content !== undefined) data.content = dto.content as string;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl as string;
    if (dto.status !== undefined) {
      data.status = dto.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      if (dto.status === 'PUBLISHED' && !article.publishedAt) data.publishedAt = new Date();
    }
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId as string } } : { disconnect: true };
    }
    return this.prisma.article.update({ where: { id }, data });
  }

  async removeArticle(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');
    await this.prisma.article.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Réservations (supervision) ----------------------------------------

  async listBookings(query: { status?: string }) {
    const where: Prisma.BookingWhereInput = {};
    if (query.status) where.status = query.status as never;
    return this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        account: { select: { id: true, name: true, type: true } },
        mission: { select: { id: true, title: true } },
        service: { select: { id: true, title: true } },
      },
    });
  }

  // --- Factures (supervision) --------------------------------------------

  async listInvoices(query: { status?: string }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (query.status) where.status = query.status as never;
    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true, type: true } } },
    });
  }

  // --- Stats rapides ------------------------------------------------------

  async stats() {
    const [users, accounts, missions, services, bookings, invoices, categories, articles] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.account.count(),
        this.prisma.reliefMission.count(),
        this.prisma.service.count(),
        this.prisma.booking.count(),
        this.prisma.invoice.count(),
        this.prisma.category.count(),
        this.prisma.article.count(),
      ]);
    return { users, accounts, missions, services, bookings, invoices, categories, articles };
  }
}
