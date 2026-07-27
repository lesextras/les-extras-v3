import {
  BadRequestException,
  ConflictException,
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
import { MatchingService } from '../matching/matching.service';
import { MailService } from '../common/mail/mail.service';
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
    private readonly matching: MatchingService,
    private readonly mail: MailService,
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
        categoryId: dto.categoryId ?? undefined,
        job: dto.job,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        city: dto.city,
        postalCode: dto.postalCode,
        hourlyRate: dto.hourlyRate,
        headcount: dto.headcount ?? 1,
        emergency: dto.emergency ?? false,
        attachmentUrl: dto.attachmentUrl,
        orgUnitId: dto.orgUnitId,
      },
    });
  }

  /** Missions appartenant au compte actif (back-office établissement). */
  async findAllByAccount(accountId: string) {
    return this.prisma.reliefMission.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { bookings: true } },
        categoryRef: { select: { id: true, title: true } },
      },
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
          categoryRef: { select: { id: true, title: true } },
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
        categoryRef: { select: { id: true, title: true } },
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
    const published = await this.prisma.reliefMission.update({
      where: { id },
      data: {
        status: MissionStatus.PUBLISHED,
        visibility: MissionVisibility.PUBLIC,
        publishedAt: new Date(),
      },
    });
    // Diffusion : e-mail à tous les freelances dont le profil correspond
    // (métier + zone + disponibilité). N'échoue jamais la publication.
    this.broadcastToMatched(id, accountId).catch(() => undefined);
    return published;
  }

  /**
   * Envoie l'offre par e-mail aux freelances dont le score de correspondance
   * est suffisant et qui sont disponibles (premier arrivé, premier servi).
   * `options.excludeAccountIds` permet d'écarter certains comptes lors d'une
   * relance automatique (ex. : les intervenants ayant déjà candidaté).
   * Retourne le nombre d'intervenants effectivement ciblés.
   */
  private async broadcastToMatched(
    missionId: string,
    accountId: string,
    options?: { excludeAccountIds?: string[] },
  ): Promise<number> {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id: missionId } });
    if (!mission) return 0;
    const { candidates } = await this.matching.candidatesForMission(missionId, accountId);
    const exclus = new Set(options?.excludeAccountIds ?? []);
    const targets = candidates
      .filter(
        (c: any) =>
          c.available && !c.hasConflict && c.total >= 45 && c.email && !exclus.has(c.accountId),
      )
      .slice(0, 100);
    await Promise.allSettled(
      targets.map((c: any) =>
        this.mail.sendMissionMatch(c.email, {
          title: mission.title,
          city: mission.city,
          date: mission.startDate,
          job: mission.job,
          rate: mission.hourlyRate ? String(mission.hourlyRate) : null,
          emergency: mission.emergency,
          missionId,
        }),
      ),
    );
    return targets.length;
  }

  /**
   * SOS Renfort — un FREELANCE accepte la mission (premier arrivé, premier servi).
   * Verrou atomique : la mission ne peut être remportée que par un seul intervenant.
   */
  async accept(missionId: string, freelanceAccountId: string, accountType?: string) {
    if (accountType === 'ESTABLISHMENT') {
      throw new BadRequestException('Seuls les freelances peuvent accepter une mission de renfort.');
    }
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      include: { account: { select: { id: true, name: true, ownerId: true, city: true } } },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (mission.accountId === freelanceAccountId) {
      throw new BadRequestException('Vous ne pouvez pas accepter votre propre mission.');
    }

    // Verrou : passe PUBLISHED -> FILLED uniquement si personne ne l'a déjà prise.
    const claim = await this.prisma.reliefMission.updateMany({
      where: { id: missionId, status: MissionStatus.PUBLISHED },
      data: { status: MissionStatus.FILLED },
    });
    if (claim.count === 0) {
      throw new ConflictException('Cette mission vient d’être pourvue par un autre intervenant.');
    }

    // Booking confirmé pour le freelance + fermeture des autres candidatures.
    const booking = await this.prisma.booking.create({
      data: {
        accountId: freelanceAccountId,
        missionId,
        status: BookingStatus.CONFIRMED,
        scheduledAt: mission.startDate,
        totalAmount: mission.hourlyRate ?? undefined,
      },
    });
    await this.prisma.booking.updateMany({
      where: { missionId, status: BookingStatus.REQUESTED, id: { not: booking.id } },
      data: { status: BookingStatus.CANCELLED, cancelReason: 'Mission pourvue par un autre intervenant.' },
    });

    // Profil du freelance (pour l'établissement).
    const freelance = await this.prisma.account.findUnique({
      where: { id: freelanceAccountId },
      select: { name: true, owner: { select: { id: true, email: true, firstName: true, lastName: true, profile: { select: { job: true } } } } },
    });
    const flName = [freelance?.owner?.firstName, freelance?.owner?.lastName].filter(Boolean).join(' ') || freelance?.name || 'Un intervenant';
    const contractUrl = `/documents/contrat/${booking.id}`;

    // Notifications établissement.
    if (mission.account?.ownerId) {
      await this.notifications.create(mission.account.ownerId, {
        type: 'MISSION_FILLED',
        title: 'Mission pourvue',
        body: `« ${mission.title} » a été acceptée par ${flName}. Contrat à signer.`,
        link: contractUrl,
      });
      const estOwner = await this.prisma.user.findUnique({ where: { id: mission.account.ownerId }, select: { email: true } });
      if (estOwner?.email) {
        await this.mail.sendMissionFilledEstablishment(estOwner.email, {
          title: mission.title,
          freelanceName: flName,
          freelanceJob: freelance?.owner?.profile?.job ?? null,
          city: mission.city,
          date: mission.startDate,
          contractUrl,
        }).catch(() => undefined);
      }
    }

    // Notifications freelance.
    if (freelance?.owner?.id) {
      await this.notifications.create(freelance.owner.id, {
        type: 'MISSION_ACCEPTED',
        title: 'Mission confirmée',
        body: `Vous avez décroché « ${mission.title} ». Signez le contrat de mission.`,
        link: contractUrl,
      });
      if (freelance.owner.email) {
        await this.mail.sendMissionAcceptedFreelance(freelance.owner.email, {
          title: mission.title,
          city: mission.city,
          address: null,
          date: mission.startDate,
          time: mission.startTime && mission.endTime ? `${mission.startTime} – ${mission.endTime}` : mission.startTime ?? null,
          contractUrl,
        }).catch(() => undefined);
      }
    }

    return { booking, contractUrl };
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

  // ───────────────────────────────────────────────────────────────────────────
  // Relance automatique des missions non pourvues
  // (consommé par MissionsScheduler — aucune de ces méthodes ne modifie le
  //  comportement des endpoints existants)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Palier de diffusion suivant dans la cascade SALARIES -> RESERVED -> PUBLIC,
   * ou `null` si la mission est déjà diffusée au niveau maximal.
   * Méthode statique : permet au scheduler de savoir s'il est utile d'appeler
   * `broaden()` sans avoir à dupliquer l'ordre de la cascade.
   */
  static visibiliteSuivante(visibilite: MissionVisibility): MissionVisibility | null {
    const idx = CASCADE.indexOf(visibilite);
    if (idx < 0 || idx >= CASCADE.length - 1) return null;
    return CASCADE[idx + 1];
  }

  /**
   * Missions encore « ouvertes » au sens de la relance automatique :
   * publiées (donc ni brouillon, ni pourvues, ni clôturées, ni annulées) et
   * dont la date de début n'est pas dépassée. Le résultat est borné par
   * `limite` pour ne jamais saturer un passage du scheduler.
   */
  async listerMissionsOuvertes(params: { limite?: number; maintenant?: Date } = {}) {
    const maintenant = params.maintenant ?? new Date();
    const limite = Math.max(1, Math.min(params.limite ?? 50, 500));
    return this.prisma.reliefMission.findMany({
      where: {
        status: MissionStatus.PUBLISHED,
        startDate: { gt: maintenant },
      },
      // Les missions les plus imminentes d'abord : ce sont les plus critiques.
      orderBy: { startDate: 'asc' },
      take: limite,
      select: {
        id: true,
        accountId: true,
        title: true,
        job: true,
        city: true,
        startDate: true,
        startTime: true,
        visibility: true,
        emergency: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        account: { select: { id: true, name: true, ownerId: true } },
      },
    });
  }

  /**
   * Relance : renvoie l'offre par e-mail aux intervenants correspondants.
   * Les comptes ayant déjà candidaté (ou déjà réservés) sur cette mission sont
   * exclus pour ne pas les re-solliciter inutilement — en pratique, seuls les
   * intervenants « nouvellement concernés » reçoivent l'e-mail.
   * Retourne le nombre d'intervenants notifiés.
   */
  async rediffuserAuxIntervenants(missionId: string, accountId: string): Promise<number> {
    const dejaEnLice = await this.prisma.booking.findMany({
      where: { missionId },
      select: { accountId: true },
    });
    return this.broadcastToMatched(missionId, accountId, {
      excludeAccountIds: dejaEnLice.map((b) => b.accountId),
    });
  }
}
