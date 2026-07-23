import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  MissionStatus,
  MissionVisibility,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { QueryMissionsDto } from './dto/query-missions.dto';

/** Ordre de la diffusion en cascade : SALARIES -> RESERVED -> PUBLIC. */
const CASCADE: MissionVisibility[] = [
  MissionVisibility.SALARIES,
  MissionVisibility.RESERVED,
  MissionVisibility.PUBLIC,
];

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Crée une mission (statut DRAFT) rattachée au compte établissement actif. */
  async create(accountId: string, dto: CreateMissionDto) {
    if (dto.endDate && new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }
    return this.prisma.reliefMission.create({
      data: {
        accountId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        job: dto.job,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        city: dto.city,
        postalCode: dto.postalCode,
        hourlyRate: dto.hourlyRate,
        headcount: dto.headcount ?? 1,
      },
    });
  }

  /** Missions appartenant au compte actif (back-office établissement). */
  async findAllByAccount(accountId: string) {
    return this.prisma.reliefMission.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true } } },
    });
  }

  /** Marketplace : missions publiées filtrées (statut/visibilité/ville/dates). */
  async findMarketplace(query: QueryMissionsDto) {
    const where: Prisma.ReliefMissionWhereInput = {
      status: query.status ?? MissionStatus.PUBLISHED,
    };
    if (query.visibility) where.visibility = query.visibility;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.postalCode) where.postalCode = { startsWith: query.postalCode.slice(0, 2) };
    if (query.job) where.job = { contains: query.job, mode: 'insensitive' };
    if (query.category) where.category = query.category;
    if (query.minRate !== undefined || query.maxRate !== undefined) {
      where.hourlyRate = {};
      if (query.minRate !== undefined) (where.hourlyRate as any).gte = query.minRate;
      if (query.maxRate !== undefined) (where.hourlyRate as any).lte = query.maxRate;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.from || query.to) {
      where.startDate = {};
      if (query.from) where.startDate.gte = new Date(query.from);
      if (query.to) where.startDate.lte = new Date(query.to);
    }

    // Pagination : page/limit ont priorité sur take/skip s'ils sont fournis.
    const take = query.limit ?? query.take ?? 20;
    const skip = query.page ? (query.page - 1) * take : (query.skip ?? 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reliefMission.findMany({
        where,
        orderBy: { startDate: 'asc' },
        take,
        skip,
        include: {
          account: { select: { id: true, name: true, city: true, logoUrl: true } },
        },
      }),
      this.prisma.reliefMission.count({ where }),
    ]);
    return { items, total, take, skip, page: query.page ?? Math.floor(skip / take) + 1 };
  }

  /** Détail d'une mission. Vérifie l'appartenance si accountId fourni. */
  async findOne(id: string, accountId?: string) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, city: true, logoUrl: true } },
        bookings: true,
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    // Propriétaire : détail complet (avec candidatures).
    if (accountId && mission.accountId === accountId) return mission;
    // Non-propriétaire : uniquement les missions publiées, SANS le pipeline de candidatures.
    if (mission.status === MissionStatus.PUBLISHED) {
      const { bookings, ...publicView } = mission as any;
      return publicView;
    }
    // Brouillon/fermée d'un autre compte : on ne révèle pas son existence.
    throw new NotFoundException('Mission introuvable.');
  }

  private async assertOwned(id: string, accountId: string) {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (mission.accountId !== accountId) {
      throw new ForbiddenException('Mission hors de votre compte.');
    }
    return mission;
  }

  async update(id: string, accountId: string, dto: UpdateMissionDto) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status === MissionStatus.CLOSED || mission.status === MissionStatus.CANCELLED) {
      throw new BadRequestException('Mission clôturée : édition impossible.');
    }
    return this.prisma.reliefMission.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string, accountId: string) {
    await this.assertOwned(id, accountId);
    await this.prisma.reliefMission.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Publie une mission : DRAFT -> PUBLISHED et démarre la cascade au niveau
   * le plus restreint (SALARIES). Utiliser /broaden pour élargir la diffusion.
   */
  async publish(id: string, accountId: string) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status !== MissionStatus.DRAFT) {
      throw new BadRequestException('Seule une mission en brouillon peut être publiée.');
    }
    return this.prisma.reliefMission.update({
      where: { id },
      data: {
        status: MissionStatus.PUBLISHED,
        visibility: MissionVisibility.SALARIES,
        publishedAt: new Date(),
      },
    });
  }

  /** Élargit la diffusion d'un cran : SALARIES -> RESERVED -> PUBLIC. */
  async broaden(id: string, accountId: string) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status !== MissionStatus.PUBLISHED) {
      throw new BadRequestException('La mission doit être publiée pour élargir sa diffusion.');
    }
    const idx = CASCADE.indexOf(mission.visibility);
    if (idx >= CASCADE.length - 1) {
      throw new BadRequestException('Diffusion déjà au niveau maximal (PUBLIC).');
    }
    return this.prisma.reliefMission.update({
      where: { id },
      data: { visibility: CASCADE[idx + 1] },
    });
  }

  /**
   * Candidature d'un FREELANCE : crée un Booking REQUESTED rattaché au compte
   * freelance actif, et notifie l'établissement propriétaire de la mission.
   */
  async candidate(missionId: string, freelanceAccountId: string, accountType?: string) {
    if (accountType === 'ESTABLISHMENT') {
      throw new BadRequestException('Seuls les freelances peuvent candidater à une mission.');
    }
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      include: { account: { select: { ownerId: true, name: true } } },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (mission.status !== MissionStatus.PUBLISHED) {
      throw new BadRequestException('Cette mission n’accepte pas de candidatures.');
    }
    if (mission.accountId === freelanceAccountId) {
      throw new BadRequestException('Vous ne pouvez pas candidater à votre propre mission.');
    }

    const existing = await this.prisma.booking.findFirst({
      where: { missionId, accountId: freelanceAccountId },
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà candidaté à cette mission.');
    }

    const booking = await this.prisma.booking.create({
      data: {
        accountId: freelanceAccountId,
        missionId,
        status: BookingStatus.REQUESTED,
        scheduledAt: mission.startDate,
        totalAmount: mission.hourlyRate ?? undefined,
      },
    });

    await this.notifications.create(mission.account.ownerId, {
      type: 'MISSION_CANDIDATE',
      title: 'Nouvelle candidature',
      body: `Une candidature a été reçue pour « ${mission.title} ».`,
      link: `/dashboard/missions/${missionId}`,
    });

    return booking;
  }
}
