import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  FormationStatus,
  FormationType,
  InvitationStatus,
  MissionStatus,
  Prisma,
  SessionStatus,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from './dto/user-admin.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConformiteService } from '../conformite/conformite.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { ModerateMissionDto, ModerateServiceDto } from './dto/moderate.dto';
import { UpdateCategoryDto } from './dto/category-admin.dto';
import { AuditService } from '../common/audit/audit.service';
import { UpdateArticleDto } from './dto/article-admin.dto';
import {
  CreateFormationAdminDto,
  UpdateFormationAdminDto,
  CreateSessionAdminDto,
} from './dto/formation-admin.dto';

/**
 * Hypothèse d'économie moyenne réalisée sur une mission de renfort pourvue
 * « en direct » via la plateforme, comparée au recours à une agence d'intérim.
 * 250 € = estimation prudente de la marge d'agence + frais de gestion évités
 * sur une mission courte. Constante volontairement simple et ajustable ; sert
 * uniquement d'ordre de grandeur pédagogique dans les statistiques ROI.
 */
const AVG_INTERIM_SAVINGS_EUR = 250;

/** Pagination par défaut / maximale du journal d'audit. */
const AUDIT_DEFAULT_PER_PAGE = 50;
const AUDIT_MAX_PER_PAGE = 200;

/** Convertit un paramètre de date en Date valide, ou `undefined` si inexploitable. */
function parseAuditDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly conformite: ConformiteService,
    private readonly audit: AuditService,
  ) {}

  // --- Coffre-fort de conformité (agrégat plateforme) ---------------------

  /** Complétude conformité agrégée de tous les comptes établissements. */
  conformiteOverview() {
    return this.conformite.summaryForAllEstablishments();
  }

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
        // Rattachements : structures + rôle interne (salarié, responsable…).
        memberships: {
          select: {
            role: true,
            status: true,
            account: { select: { id: true, name: true, type: true } },
          },
        },
        // Comptes possédés (freelance = son propre compte, ou direction d'établissement).
        ownedAccounts: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async banUser(id: string, dto: BanUserDto, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.status === UserStatus.ANONYMIZED) {
      throw new BadRequestException(
        'Ce compte a été effacé à la demande de son titulaire : son statut ne peut plus être modifié.',
      );
    }
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
    await this.audit.log({
      actorId,
      action: 'utilisateur.suspendu',
      entityType: 'User',
      entityId: id,
      summary: `Compte de ${user.email} suspendu.${dto.reason ? ` Motif : ${dto.reason}` : ''}`,
      metadata: { email: user.email, motif: dto.reason ?? null },
    });
    return updated;
  }

  async unbanUser(id: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.status === UserStatus.ANONYMIZED) {
      throw new BadRequestException(
        'Ce compte a été effacé à la demande de son titulaire : son statut ne peut plus être modifié.',
      );
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.VERIFIED },
      select: { id: true, email: true, status: true },
    });
    await this.audit.log({
      actorId,
      action: 'utilisateur.reactive',
      entityType: 'User',
      entityId: id,
      summary: `Compte de ${user.email} réactivé.`,
      metadata: { email: user.email },
    });
    return updated;
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Un utilisateur avec cet e-mail existe déjà.');
    const password = await bcrypt.hash(dto.password, 10);
    const status = dto.status ?? UserStatus.VERIFIED;
    this.refuseStatutAnonymise(status);
    return this.prisma.user.create({
      data: {
        email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role ?? 'USER',
        status,
        emailVerified: status === UserStatus.VERIFIED,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * ANONYMIZED n'est pas un statut qu'on attribue : il n'est posé que par la
   * procédure d'effacement RGPD, qui neutralise réellement les données. Le
   * poser à la main afficherait « effacé » sur un dossier resté intact.
   */
  private refuseStatutAnonymise(status?: UserStatus | null) {
    if (status === UserStatus.ANONYMIZED) {
      throw new BadRequestException(
        'Le statut « supprimé (RGPD) » ne peut pas être attribué manuellement : il résulte de la procédure d’effacement demandée par la personne.',
      );
    }
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    this.refuseStatutAnonymise(dto.status);
    if (user.status === UserStatus.ANONYMIZED) {
      throw new BadRequestException(
        'Ce compte a été effacé à la demande de son titulaire : il ne peut plus être modifié.',
      );
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        status: dto.status,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { ownedAccounts: true } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user._count.ownedAccounts > 0) {
      throw new BadRequestException(
        'Cet utilisateur possède un ou plusieurs comptes. Transférez ou supprimez ses comptes avant de le supprimer.',
      );
    }
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Modération missions ------------------------------------------------

  async listMissions() {
    return this.prisma.reliefMission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true } } },
    });
  }

  /** Détail complet d'une mission pour l'aperçu de modération (tout statut). */
  async getMission(id: string) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, city: true, type: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { bookings: true } },
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    return mission;
  }

  async moderateMission(id: string, dto: ModerateMissionDto, actorId?: string) {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    const updated = await this.prisma.reliefMission.update({
      where: { id },
      data: { status: dto.status },
    });
    await this.audit.log({
      actorId,
      action: 'mission.moderee',
      entityType: 'ReliefMission',
      entityId: id,
      accountId: mission.accountId,
      summary: `Mission « ${mission.title} » : statut ${mission.status} → ${dto.status}.`,
      metadata: { avant: mission.status, apres: dto.status },
    });
    return updated;
  }

  async deleteMission(id: string) {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    await this.prisma.reliefMission.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Modération services ------------------------------------------------

  async listServices() {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true } } },
    });
  }

  /** Détail complet d'un atelier pour l'aperçu de modération (tout statut). */
  async getService(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, city: true, type: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { bookings: true } },
      },
    });
    if (!service) throw new NotFoundException('Atelier introuvable.');
    return service;
  }

  async moderateService(id: string, dto: ModerateServiceDto, actorId?: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service introuvable.');
    const updated = await this.prisma.service.update({
      where: { id },
      data: { status: dto.status },
    });
    await this.audit.log({
      actorId,
      action: 'atelier.modere',
      entityType: 'Service',
      entityId: id,
      accountId: service.accountId,
      summary: `Atelier « ${service.title} » : statut ${service.status} → ${dto.status}.`,
      metadata: { avant: service.status, apres: dto.status },
    });
    return updated;
  }

  async deleteService(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Atelier introuvable.');
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
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
        memberships: {
          select: {
            id: true,
            role: true,
            status: true,
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: { role: 'asc' },
        },
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

  async deleteAccount(id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Compte introuvable.');
    await this.prisma.account.delete({ where: { id } });
    return { deleted: true };
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

  /** Met à jour le statut d'une réservation (back-office). */
  async updateBookingStatus(id: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    return this.prisma.booking.update({
      where: { id },
      data: { status },
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

  /** Facture complète pour l'admin plateforme (hors périmètre de compte actif). */
  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            service: { select: { title: true } },
            mission: { select: { title: true } },
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            legalName: true,
            address: true,
            city: true,
            postalCode: true,
            siret: true,
            owner: { select: { email: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    return invoice;
  }

  async updateInvoiceStatus(id: string, status: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    const data: Prisma.InvoiceUpdateInput = { status: status as never };
    if (status === 'ISSUED' && !invoice.issuedAt) data.issuedAt = new Date();
    return this.prisma.invoice.update({ where: { id }, data });
  }

  // --- Centre de formation ------------------------------------------------

  async listFormations(params: { type?: string; status?: string }) {
    const where: Prisma.FormationWhereInput = {};
    if (params.type) where.type = params.type as FormationType;
    if (params.status) where.status = params.status as FormationStatus;
    return this.prisma.formation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ownerAccount: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async listSessions(params: { status?: string }) {
    const where: Prisma.FormationSessionWhereInput = {};
    if (params.status) where.status = params.status as SessionStatus;
    return this.prisma.formationSession.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        formation: { select: { id: true, title: true, type: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { inscriptions: true } },
      },
    });
  }

  /**
   * Détermine le compte OF (Organisme de Formation) propriétaire d'un programme.
   * Choix (documenté) :
   *  1. `explicit` fourni dans le DTO → on l'utilise (après vérification d'existence) ;
   *  2. sinon, le 1er compte ESTABLISHMENT dont le nom contient « ADéPA / ADEPA » ;
   *  3. sinon, le compte ESTABLISHMENT le plus ancien (fallback catalogue) ;
   *  4. sinon → erreur explicite (aucun OF disponible).
   */
  private async resolveOwnerAccountId(explicit?: string): Promise<string> {
    if (explicit) {
      const acc = await this.prisma.account.findUnique({ where: { id: explicit } });
      if (!acc) throw new BadRequestException('Compte propriétaire introuvable.');
      return acc.id;
    }
    const adepa = await this.prisma.account.findFirst({
      where: {
        type: 'ESTABLISHMENT',
        OR: [
          { name: { contains: 'adépa', mode: 'insensitive' } },
          { name: { contains: 'adepa', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (adepa) return adepa.id;
    const anyEstablishment = await this.prisma.account.findFirst({
      where: { type: 'ESTABLISHMENT' },
      orderBy: { createdAt: 'asc' },
    });
    if (anyEstablishment) return anyEstablishment.id;
    throw new BadRequestException(
      "Aucun compte établissement (OF) disponible pour rattacher la formation. Créez d'abord un compte ADéPA.",
    );
  }

  async getFormation(id: string) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      include: {
        ownerAccount: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
        sessions: {
          orderBy: { startDate: 'desc' },
          include: {
            trainer: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { inscriptions: true } },
          },
        },
      },
    });
    if (!formation) throw new NotFoundException('Formation introuvable.');
    return formation;
  }

  async createFormation(dto: CreateFormationAdminDto) {
    const ownerAccountId = await this.resolveOwnerAccountId(dto.ownerAccountId);
    const type = dto.type ?? FormationType.CERTIFIANTE;
    const isInterne = type === FormationType.INTERNE;
    const cpfEligible = isInterne ? false : dto.cpfEligible ?? false;
    const certifying = isInterne ? false : dto.certifying ?? false;

    let slug = this.slugify(dto.title);
    const exists = await this.prisma.formation.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    return this.prisma.formation.create({
      data: {
        type,
        title: dto.title,
        slug,
        summary: dto.summary,
        objectives: dto.objectives,
        prerequisites: dto.prerequisites,
        program: dto.program,
        targetAudience: dto.targetAudience,
        durationHours: dto.durationHours,
        cpfEligible,
        certifying,
        certificationName: isInterne ? null : dto.certificationName,
        edofRef: isInterne ? null : dto.edofRef,
        status: dto.status ?? FormationStatus.DRAFT,
        ownerAccount: { connect: { id: ownerAccountId } },
        categoryRef: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      },
      include: {
        ownerAccount: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async updateFormation(id: string, dto: UpdateFormationAdminDto) {
    const formation = await this.prisma.formation.findUnique({ where: { id } });
    if (!formation) throw new NotFoundException('Formation introuvable.');

    const data: Prisma.FormationUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.objectives !== undefined) data.objectives = dto.objectives;
    if (dto.prerequisites !== undefined) data.prerequisites = dto.prerequisites;
    if (dto.program !== undefined) data.program = dto.program;
    if (dto.targetAudience !== undefined) data.targetAudience = dto.targetAudience;
    if (dto.durationHours !== undefined) data.durationHours = dto.durationHours;
    if (dto.edofRef !== undefined) data.edofRef = dto.edofRef;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.type !== undefined) data.type = dto.type;

    // Cohérence type : une formation INTERNE ne peut être ni CPF ni certifiante.
    const nextType = dto.type ?? formation.type;
    const isInterne = nextType === FormationType.INTERNE;
    if (isInterne) {
      data.cpfEligible = false;
      data.certifying = false;
      data.certificationName = null;
    } else {
      if (dto.cpfEligible !== undefined) data.cpfEligible = dto.cpfEligible;
      if (dto.certifying !== undefined) data.certifying = dto.certifying;
      if (dto.certificationName !== undefined) data.certificationName = dto.certificationName;
    }

    if (dto.categoryId !== undefined) {
      data.categoryRef = dto.categoryId
        ? { connect: { id: dto.categoryId } }
        : { disconnect: true };
    }

    return this.prisma.formation.update({
      where: { id },
      data,
      include: {
        ownerAccount: { select: { id: true, name: true } },
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  async deleteFormation(id: string) {
    const formation = await this.prisma.formation.findUnique({ where: { id } });
    if (!formation) throw new NotFoundException('Formation introuvable.');
    await this.prisma.formation.delete({ where: { id } });
    return { deleted: true };
  }

  async createFormationSession(formationId: string, dto: CreateSessionAdminDto) {
    const formation = await this.prisma.formation.findUnique({ where: { id: formationId } });
    if (!formation) throw new NotFoundException('Formation introuvable.');
    return this.prisma.formationSession.create({
      data: {
        formation: { connect: { id: formationId } },
        title: dto.title,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        location: dto.location,
        maxSeats: dto.maxSeats,
        priceHt: dto.priceHt !== undefined ? new Prisma.Decimal(dto.priceHt) : undefined,
        trainer: dto.trainerId ? { connect: { id: dto.trainerId } } : undefined,
        status: dto.status,
      },
      include: {
        trainer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { inscriptions: true } },
      },
    });
  }

  // --- Registre & BPF (Bilan Pédagogique et Financier) --------------------

  /** Registre des formations : une ligne par session avec effectifs & assiduité. */
  async registre() {
    const sessions = await this.prisma.formationSession.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        formation: { select: { title: true, type: true, durationHours: true, certifying: true } },
        _count: { select: { inscriptions: true, emargements: true } },
        inscriptions: { select: { financing: true } },
      },
    });
    return sessions.map((s) => {
      const financements: Record<string, number> = {};
      for (const i of s.inscriptions) {
        financements[i.financing] = (financements[i.financing] ?? 0) + 1;
      }
      return {
        id: s.id,
        formation: s.formation?.title ?? '—',
        type: s.formation?.type ?? null,
        certifying: s.formation?.certifying ?? false,
        startDate: s.startDate,
        durationHours: s.formation?.durationHours ?? null,
        inscrits: s._count.inscriptions,
        emargements: s._count.emargements,
        financements,
      };
    });
  }

  /** Agrégation BPF annuelle (effectifs, heures-stagiaires, produits par financement). */
  async bpf(year?: number) {
    const y = year ?? new Date().getFullYear();
    const start = new Date(`${y}-01-01T00:00:00.000Z`);
    const end = new Date(`${y + 1}-01-01T00:00:00.000Z`);
    const sessions = await this.prisma.formationSession.findMany({
      where: { startDate: { gte: start, lt: end } },
      include: {
        formation: { select: { durationHours: true } },
        inscriptions: { select: { financing: true, invoice: { select: { amount: true } } } },
      },
    });
    let stagiaires = 0;
    let heuresStagiaires = 0;
    const parFinancement: Record<string, number> = {};
    const produits: Record<string, number> = {};
    for (const s of sessions) {
      const h = s.formation?.durationHours ?? 0;
      for (const i of s.inscriptions) {
        stagiaires += 1;
        heuresStagiaires += h;
        parFinancement[i.financing] = (parFinancement[i.financing] ?? 0) + 1;
        const amt = i.invoice ? Number(i.invoice.amount) : 0;
        produits[i.financing] = (produits[i.financing] ?? 0) + amt;
      }
    }
    const produitTotal = Object.values(produits).reduce((a, b) => a + b, 0);
    return { year: y, nbSessions: sessions.length, stagiaires, heuresStagiaires, parFinancement, produits, produitTotal };
  }

  /** Export CSV du BPF (une ligne par type de financement + total). */
  async bpfCsv(year?: number): Promise<string> {
    const b = await this.bpf(year);
    const rows: string[] = [];
    rows.push('BPF;Annee;' + b.year);
    rows.push('Sessions;' + b.nbSessions);
    rows.push('Stagiaires;' + b.stagiaires);
    rows.push('Heures-stagiaires;' + b.heuresStagiaires);
    rows.push('');
    rows.push('Financement;Stagiaires;Produits (EUR)');
    const keys = new Set([...Object.keys(b.parFinancement), ...Object.keys(b.produits)]);
    for (const k of keys) {
      rows.push(`${k};${b.parFinancement[k] ?? 0};${(b.produits[k] ?? 0).toFixed(2)}`);
    }
    rows.push(`TOTAL;${b.stagiaires};${b.produitTotal.toFixed(2)}`);
    return rows.join('\n');
  }

  // --- Invitations --------------------------------------------------------

  async listInvitations(status?: string) {
    const where: Prisma.InvitationWhereInput = {};
    if (status) where.status = status as InvitationStatus;
    return this.prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        account: { select: { id: true, name: true, type: true } },
        invitedBy: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }

  async revokeInvitation(id: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invitation introuvable.');
    return this.prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
    });
  }

  async resendInvitation(id: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invitation introuvable.');
    return this.prisma.invitation.update({
      where: { id },
      data: {
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // --- Stats rapides ------------------------------------------------------

  async stats() {
    const [users, accounts, missions, services, bookings, invoices, categories, articles, formations] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.account.count(),
        this.prisma.reliefMission.count(),
        this.prisma.service.count(),
        this.prisma.booking.count(),
        this.prisma.invoice.count(),
        this.prisma.category.count(),
        this.prisma.article.count(),
        this.prisma.formation.count(),
      ]);
    return { users, accounts, missions, services, bookings, invoices, categories, articles, formations };
  }

  /**
   * Le Desk — cockpit d'exploitation piloté par alertes.
   * Remonte uniquement ce qui demande une action humaine maintenant :
   * missions urgentes non pourvues, comptes à valider, documents de
   * conformité expirés ou proches de l'échéance, heures à valider,
   * contenus en attente de modération.
   */
  async desk() {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 3600 * 1000);
    const in30d = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    const [urgentMissions, pendingUsers, expiringDocs, pendingTimeEntries, draftMissions, draftServices] =
      await this.prisma.$transaction([
        // Missions publiées qui démarrent dans moins de 48 h et ne sont pas pourvues.
        this.prisma.reliefMission.findMany({
          where: { status: 'PUBLISHED', startDate: { lte: in48h } },
          orderBy: { startDate: 'asc' },
          take: 10,
          select: {
            id: true, title: true, startDate: true, city: true, emergency: true,
            account: { select: { name: true } },
          },
        }),
        // Comptes en attente de vérification (les plus anciens d'abord).
        this.prisma.user.findMany({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          take: 10,
          select: {
            id: true, email: true, role: true, createdAt: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        }),
        // Documents de conformité expirés ou qui expirent sous 30 jours.
        this.prisma.complianceDocument.findMany({
          where: { expiresAt: { not: null, lte: in30d } },
          orderBy: { expiresAt: 'asc' },
          take: 10,
          select: {
            id: true, type: true, label: true, expiresAt: true, accountId: true,
            user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
          },
        }),
        // Heures déclarées en attente de validation.
        this.prisma.timeEntry.count({ where: { status: 'PENDING' } }),
        this.prisma.reliefMission.count({ where: { status: 'DRAFT' } }),
        this.prisma.service.count({ where: { status: 'DRAFT' } }),
      ]);

    const expired = expiringDocs.filter((d) => d.expiresAt && d.expiresAt < now).length;

    return {
      generatedAt: now.toISOString(),
      urgentMissions,
      pendingUsers,
      expiringDocuments: expiringDocs,
      counts: {
        urgentMissions: urgentMissions.length,
        pendingUsers: pendingUsers.length,
        expiredDocuments: expired,
        expiringDocuments: expiringDocs.length - expired,
        pendingTimeEntries,
        pendingModeration: draftMissions + draftServices,
      },
    };
  }

  /**
   * Statistiques ROI & performance de la marketplace de renfort.
   * Toutes les valeurs sont calculées à partir des données réelles (missions +
   * bookings). Voir AVG_INTERIM_SAVINGS_EUR pour l'hypothèse d'économie.
   */
  async roiStats() {
    // On ne charge que le nécessaire : statut + date de publication de chaque
    // mission, et les bookings associés (date + statut) triés chronologiquement.
    const missions = await this.prisma.reliefMission.findMany({
      select: {
        id: true,
        status: true,
        publishedAt: true,
        bookings: {
          select: { createdAt: true, status: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Prépare les 6 derniers mois glissants (mois courant inclus).
    const now = new Date();
    const monthsIndex: Record<string, number> = {};
    const missionsPerMonth: { mois: string; count: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsIndex[key] = missionsPerMonth.length;
      missionsPerMonth.push({ mois: key, count: 0 });
    }

    // Une réservation « qui pourvoit » = statut CONFIRMED, IN_PROGRESS ou COMPLETED.
    const COVERING: BookingStatus[] = [
      BookingStatus.CONFIRMED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
    ];

    let publishedMissions = 0;
    let filledMissions = 0;
    let delaySumHours = 0;
    let delayCount = 0;

    for (const m of missions) {
      // Null-safety : sans publishedAt, la mission n'est pas considérée publiée.
      if (!m.publishedAt) continue;
      publishedMissions += 1;

      // Répartition mensuelle (uniquement dans la fenêtre des 6 mois).
      const key = `${m.publishedAt.getFullYear()}-${String(m.publishedAt.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthsIndex) missionsPerMonth[monthsIndex[key]].count += 1;

      // Mission pourvue : statut FILLED OU au moins un booking « couvrant ».
      const hasCovering = m.bookings.some((b) => COVERING.includes(b.status));
      if (m.status === MissionStatus.FILLED || hasCovering) filledMissions += 1;

      // Délai jusqu'à la 1ère candidature (bookings triés asc → [0] = 1er).
      if (m.bookings.length > 0) {
        const diffH = (m.bookings[0].createdAt.getTime() - m.publishedAt.getTime()) / 3_600_000;
        if (diffH >= 0) {
          delaySumHours += diffH;
          delayCount += 1;
        }
      }
    }

    const coverageRate =
      publishedMissions > 0 ? Math.round((filledMissions / publishedMissions) * 1000) / 10 : 0;
    const avgFirstApplicationHours =
      delayCount > 0 ? Math.round((delaySumHours / delayCount) * 10) / 10 : null;

    // Répartition des bookings par statut (tous statuts, sur toute la base).
    const grouped = await this.prisma.booking.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const bookingsByStatus: Record<string, number> = {};
    for (const g of grouped) bookingsByStatus[g.status] = g._count._all;

    return {
      coverageRate, // %
      publishedMissions,
      filledMissions,
      avgFirstApplicationHours, // heures (null si aucune candidature)
      estimatedSavingsEur: filledMissions * AVG_INTERIM_SAVINGS_EUR,
      savingsPerMissionEur: AVG_INTERIM_SAVINGS_EUR,
      missionsPerMonth,
      bookingsByStatus,
    };
  }

  // ── Demandes de contact (formulaire public) ────────────────────────────────
  /** Liste des demandes de contact, optionnellement filtrées par statut. */
  async listContacts(status?: string) {
    const where =
      status === 'NEW' || status === 'HANDLED'
        ? { status: status as 'NEW' | 'HANDLED' }
        : {};
    const items = await this.prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const newCount = await this.prisma.contactRequest.count({ where: { status: 'NEW' } });
    return { items, newCount };
  }

  /** Marque une demande de contact comme traitée / à traiter. */
  async setContactStatus(id: string, status?: string) {
    const next = status === 'HANDLED' ? 'HANDLED' : 'NEW';
    const found = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Demande introuvable.');
    return this.prisma.contactRequest.update({
      where: { id },
      data: { status: next as 'NEW' | 'HANDLED' },
    });
  }

  // --- Journal d'audit (traçabilité) --------------------------------------

  /**
   * Journal d'audit paginé pour le back-office, du plus récent au plus ancien.
   * Lecture directe via Prisma (le journal est append-only : aucune écriture ici).
   */
  async listAudit(filters: {
    action?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    perPage?: number;
  }) {
    const page = Math.max(1, Math.trunc(Number(filters.page) || 1));
    const perPage = Math.min(
      AUDIT_MAX_PER_PAGE,
      Math.max(1, Math.trunc(Number(filters.perPage) || AUDIT_DEFAULT_PER_PAGE)),
    );

    const where: Prisma.AuditLogWhereInput = {};
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.actorId) where.actorId = filters.actorId;

    const from = parseAuditDate(filters.from);
    const to = parseAuditDate(filters.to);
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
          account: { select: { id: true, name: true, type: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    };
  }
}
