import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmargementSlot,
  FinancingType,
  FormationStatus,
  FormationType,
  InvoiceStatus,
  MembershipStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { UpdateInscriptionDto } from './dto/update-inscription.dto';
import { SignEmargementDto } from './dto/sign-emargement.dto';
import { QueryFormationsDto } from './dto/query-formations.dto';

/** Génère un slug URL-safe + suffixe court pour garantir l'unicité. */
function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
  return `${base || 'formation'}-${Math.random().toString(36).slice(2, 7)}`;
}

@Injectable()
export class FormationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Programmes ---------------------------------------------------------

  async create(accountId: string, dto: CreateFormationDto) {
    const type = dto.type ?? FormationType.CERTIFIANTE;
    // Parcours interne : jamais de CPF ni de certificat.
    const cpfEligible = type === FormationType.INTERNE ? false : dto.cpfEligible ?? false;
    const certifying = type === FormationType.INTERNE ? false : dto.certifying ?? false;

    return this.prisma.formation.create({
      data: {
        ownerAccountId: accountId,
        type,
        title: dto.title,
        slug: slugify(dto.title),
        summary: dto.summary,
        objectives: dto.objectives,
        prerequisites: dto.prerequisites,
        program: dto.program,
        targetAudience: dto.targetAudience,
        durationHours: dto.durationHours,
        categoryId: dto.categoryId ?? undefined,
        cpfEligible,
        certifying,
        certificationName: certifying ? dto.certificationName : undefined,
        edofRef: dto.edofRef,
      },
    });
  }

  /** Programmes du compte actif (gestion : ADéPA certifiant OU interne établissement). */
  async findMine(accountId: string) {
    return this.prisma.formation.findMany({
      where: { ownerAccountId: accountId },
      orderBy: { createdAt: 'desc' },
      include: {
        categoryRef: { select: { id: true, title: true } },
        _count: { select: { sessions: true } },
      },
    });
  }

  /** Catalogue : programmes PUBLIÉS + filtres type/catégorie/recherche. */
  async findCatalog(query: QueryFormationsDto) {
    const where: Prisma.FormationWhereInput = { status: FormationStatus.PUBLISHED };
    if (query.type) where.type = query.type;
    if (query.category) where.categoryRef = { is: { title: query.category } };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const take = query.take ?? 24;
    const skip = query.skip ?? 0;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.formation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          ownerAccount: { select: { id: true, name: true, city: true, logoUrl: true } },
          categoryRef: { select: { id: true, title: true } },
          _count: { select: { sessions: true } },
        },
      }),
      this.prisma.formation.count({ where }),
    ]);
    return { items, total, take, skip };
  }

  async findOne(id: string, accountId?: string) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      include: {
        ownerAccount: { select: { id: true, name: true, city: true, logoUrl: true } },
        categoryRef: { select: { id: true, title: true } },
        sessions: {
          orderBy: { startDate: 'asc' },
          include: {
            trainer: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { inscriptions: true } },
          },
        },
      },
    });
    if (!formation) throw new NotFoundException('Formation introuvable.');

    // Satisfaction des stagiaires : la donnée est déjà collectée sur chaque
    // inscription (exigence Qualiopi, indicateur 30). On l'agrège ici pour en
    // faire une note affichable — sans elle, une formation n'a aucune preuve
    // sociale alors qu'un atelier en a une.
    const agg = await this.prisma.inscription.aggregate({
      where: { session: { formationId: id }, satisfaction: { not: null } },
      _avg: { satisfaction: true },
      _count: { satisfaction: true },
    });
    const enrichie = {
      ...formation,
      rating:
        agg._count.satisfaction > 0 && agg._avg.satisfaction != null
          ? Math.round(agg._avg.satisfaction * 10) / 10
          : null,
      ratingCount: agg._count.satisfaction,
      ratingSource: agg._count.satisfaction > 0 ? ('learners' as const) : null,
    };

    if (accountId && formation.ownerAccountId === accountId) return enrichie;
    if (formation.status === FormationStatus.PUBLISHED) return enrichie;
    throw new NotFoundException('Formation introuvable.');
  }

  private async assertOwned(id: string, accountId: string) {
    const formation = await this.prisma.formation.findUnique({ where: { id } });
    if (!formation) throw new NotFoundException('Formation introuvable.');
    if (formation.ownerAccountId !== accountId) {
      throw new ForbiddenException('Formation hors de votre compte.');
    }
    return formation;
  }

  async update(id: string, accountId: string, dto: UpdateFormationDto) {
    const current = await this.assertOwned(id, accountId);
    const type = dto.type ?? current.type;
    const isInternal = type === FormationType.INTERNE;
    return this.prisma.formation.update({
      where: { id },
      data: {
        ...dto,
        // Cohérence des deux parcours, quel que soit le payload.
        cpfEligible: isInternal ? false : dto.cpfEligible ?? current.cpfEligible,
        certifying: isInternal ? false : dto.certifying ?? current.certifying,
      },
    });
  }

  async remove(id: string, accountId: string) {
    await this.assertOwned(id, accountId);
    await this.prisma.formation.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Formateurs internes (parcours B) -----------------------------------

  /** Membres du compte mobilisables comme formateurs internes (avec leurs compétences). */
  async internalTrainers(accountId: string) {
    const members = await this.prisma.membership.findMany({
      where: { accountId, status: MembershipStatus.ACTIVE },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: { select: { job: true, skills: true } },
          },
        },
      },
    });
    return members.map((m) => ({
      userId: m.user.id,
      name: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.email,
      job: m.user.profile?.job ?? null,
      skills: m.user.profile?.skills ?? [],
    }));
  }

  // --- Sessions -----------------------------------------------------------

  async createSession(formationId: string, accountId: string, dto: CreateSessionDto) {
    const formation = await this.assertOwned(formationId, accountId);

    // Parcours interne : le formateur doit être un membre du compte hôte.
    if (dto.trainerId && formation.type === FormationType.INTERNE) {
      const membership = await this.prisma.membership.findUnique({
        where: { userId_accountId: { userId: dto.trainerId, accountId } },
      });
      if (!membership) {
        throw new BadRequestException(
          'Le formateur interne doit être un membre de votre structure.',
        );
      }
    }

    return this.prisma.formationSession.create({
      data: {
        formationId,
        hostAccountId: accountId,
        trainerId: dto.trainerId ?? undefined,
        title: dto.title,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        location: dto.location,
        maxSeats: dto.maxSeats,
        priceHt: dto.priceHt,
      },
    });
  }

  private async loadSession(sessionId: string) {
    const session = await this.prisma.formationSession.findUnique({
      where: { id: sessionId },
      include: { formation: true },
    });
    if (!session) throw new NotFoundException('Session introuvable.');
    return session;
  }

  /** Droit de gestion : compte propriétaire du programme, hôte, ou formateur (user). */
  private canManageSession(
    session: { hostAccountId: string | null; trainerId: string | null; formation: { ownerAccountId: string } },
    accountId: string,
    userId?: string,
  ) {
    return (
      session.formation.ownerAccountId === accountId ||
      session.hostAccountId === accountId ||
      (Boolean(userId) && session.trainerId === userId)
    );
  }

  async getSession(sessionId: string, accountId: string, userId?: string) {
    const session = await this.prisma.formationSession.findUnique({
      where: { id: sessionId },
      include: {
        formation: {
          select: { id: true, title: true, type: true, certifying: true, ownerAccountId: true },
        },
        trainer: { select: { id: true, firstName: true, lastName: true } },
        inscriptions: {
          orderBy: { createdAt: 'asc' },
          include: {
            learner: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        emargements: true,
      },
    });
    if (!session) throw new NotFoundException('Session introuvable.');
    if (!this.canManageSession(session, accountId, userId)) {
      throw new ForbiddenException('Accès à cette session refusé.');
    }
    return session;
  }

  async updateSession(sessionId: string, accountId: string, userId: string, dto: UpdateSessionDto) {
    const session = await this.loadSession(sessionId);
    if (!this.canManageSession(session, accountId, userId)) {
      throw new ForbiddenException('Accès à cette session refusé.');
    }
    return this.prisma.formationSession.update({
      where: { id: sessionId },
      data: {
        title: dto.title,
        trainerId: dto.trainerId,
        location: dto.location,
        maxSeats: dto.maxSeats,
        priceHt: dto.priceHt,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  /**
   * Toutes les inscriptions payées par ce compte, quelle que soit la session.
   * Sans cette vue, un établissement pouvait inscrire ses salariés mais ne
   * retrouvait plus nulle part la liste de ce qu'il avait réservé.
   */
  async mesInscriptions(accountId: string) {
    return this.prisma.inscription.findMany({
      where: { payerAccountId: accountId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        financing: true,
        learnerName: true,
        learnerEmail: true,
        attestationUrl: true,
        certificatUrl: true,
        createdAt: true,
        learner: { select: { firstName: true, lastName: true } },
        session: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            location: true,
            formation: { select: { id: true, title: true, slug: true, certifying: true, city: true } },
          },
        },
      },
    });
  }

  // --- Inscriptions -------------------------------------------------------

  async enroll(sessionId: string, accountId: string, dto: CreateInscriptionDto) {
    const session = await this.loadSession(sessionId);
    const isInternal = session.formation.type === FormationType.INTERNE;

    // Un programme interne ne s'inscrit que depuis la structure hôte/propriétaire.
    if (isInternal && !this.canManageSession(session, accountId)) {
      throw new ForbiddenException('Inscription interne réservée à la structure.');
    }
    // Sinon, la session doit être issue d'un programme publié (catalogue certifiant).
    if (!isInternal && session.formation.status !== FormationStatus.PUBLISHED) {
      throw new BadRequestException("Ce programme n'est pas ouvert aux inscriptions.");
    }
    if (!dto.learnerId && !dto.learnerName) {
      throw new BadRequestException('Précisez un apprenant (membre) ou son nom.');
    }

    // Financement : forcé INTERNE pour l'interne ; CPF interdit sur l'interne.
    let financing = dto.financing ?? (isInternal ? FinancingType.INTERNE : FinancingType.ESTABLISHMENT);
    if (isInternal) financing = FinancingType.INTERNE;
    if (!isInternal && financing === FinancingType.INTERNE) {
      financing = FinancingType.ESTABLISHMENT;
    }

    return this.prisma.inscription.create({
      data: {
        sessionId,
        learnerId: dto.learnerId ?? undefined,
        learnerName: dto.learnerName,
        learnerEmail: dto.learnerEmail,
        payerAccountId: accountId,
        financing,
      },
    });
  }

  async updateInscription(
    inscriptionId: string,
    accountId: string,
    userId: string,
    dto: UpdateInscriptionDto,
  ) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: { session: { include: { formation: true } } },
    });
    if (!inscription) throw new NotFoundException('Inscription introuvable.');
    if (!this.canManageSession(inscription.session, accountId, userId)) {
      throw new ForbiddenException('Accès à cette inscription refusé.');
    }
    return this.prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        status: dto.status,
        satisfaction: dto.satisfaction,
        evalResult: dto.evalResult,
      },
    });
  }

  // --- Émargement ---------------------------------------------------------

  async signEmargement(
    inscriptionId: string,
    accountId: string,
    userId: string,
    dto: SignEmargementDto,
  ) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: { session: { include: { formation: true } } },
    });
    if (!inscription) throw new NotFoundException('Inscription introuvable.');
    if (!this.canManageSession(inscription.session, accountId, userId)) {
      throw new ForbiddenException('Émargement refusé.');
    }
    const slot = dto.slot ?? EmargementSlot.MORNING;
    const slotDate = new Date(dto.slotDate);
    const present = dto.present ?? true;

    return this.prisma.emargement.upsert({
      where: {
        inscriptionId_slotDate_slot: { inscriptionId, slotDate, slot },
      },
      create: {
        inscriptionId,
        sessionId: inscription.sessionId,
        slotDate,
        slot,
        present,
        signedAt: present ? new Date() : undefined,
      },
      update: {
        present,
        signedAt: present ? new Date() : null,
      },
    });
  }

  // --- Phase 2 : livrables (attestation / certificat) & facturation -------

  /** Détail complet d'une inscription (pour générer le document imprimable). */
  async getInscription(inscriptionId: string, accountId: string, userId: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        session: {
          include: {
            formation: {
              include: { ownerAccount: { select: { id: true, name: true, city: true } } },
            },
            trainer: { select: { firstName: true, lastName: true } },
          },
        },
        payerAccount: { select: { id: true, name: true } },
        learner: { select: { firstName: true, lastName: true, email: true } },
        emargements: true,
      },
    });
    if (!inscription) throw new NotFoundException('Inscription introuvable.');
    if (!this.canManageSession(inscription.session, accountId, userId)) {
      throw new ForbiddenException('Accès à cette inscription refusé.');
    }
    return inscription;
  }

  private async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const count = await this.prisma.invoice.count({
      where: { number: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(5, '0')}`;
  }

  /** Génère (ou renvoie) la facture d'une inscription — payeur = compte inscripteur. */
  async invoiceInscription(
    inscriptionId: string,
    accountId: string,
    userId: string,
    amount?: number,
  ) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: { session: { include: { formation: true } }, invoice: true },
    });
    if (!inscription) throw new NotFoundException('Inscription introuvable.');
    if (!this.canManageSession(inscription.session, accountId, userId)) {
      throw new ForbiddenException('Facturation refusée.');
    }
    if (inscription.invoice) return inscription.invoice;

    const payerAccountId = inscription.payerAccountId ?? accountId;
    const amt = amount ?? Number(inscription.session.priceHt ?? 0);
    const number = await this.nextInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        accountId: payerAccountId,
        number,
        amount: amt,
        status: InvoiceStatus.DRAFT,
      },
    });
    await this.prisma.inscription.update({
      where: { id: inscriptionId },
      data: { invoiceId: invoice.id },
    });
    return invoice;
  }
}
