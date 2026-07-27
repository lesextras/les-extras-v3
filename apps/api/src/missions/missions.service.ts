import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  ReliefMissionStatus,
} from "@prisma/client";
import { BookingsService } from "../bookings/bookings.service";
import { PrismaService } from "../prisma/prisma.service";
import { ApplyMissionDto } from "./dto/apply-mission.dto";
import { CreateMissionDto } from "./dto/create-mission.dto";
import { FindMissionsQueryDto } from "./dto/find-missions-query.dto";
import {
  coerceMissionPlanning,
  deriveMissionEnvelopeFromPlanning,
  missionPlanningOverlapsDate,
  normalizeMissionPlanning,
  sortMissionPlanning,
  validateMissionPlanning,
  type MissionPlanningLineInput,
  type RenfortPublicationMode,
} from "./mission-slots";

const MARKETPLACE_ESTABLISHMENT_SELECT = {
  profile: {
    select: {
      companyName: true,
      city: true,
      avatar: true,
    },
  },
};

function getMarketplaceMissionLocation(mission: {
  city?: string | null;
  address: string;
  establishment?: {
    profile?: {
      city?: string | null;
    } | null;
  } | null;
}) {
  const derivedCity = mission.address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);

  return (
    mission.city ??
    mission.establishment?.profile?.city ??
    derivedCity ??
    "Localisation communiquée après validation"
  );
}

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
  ) { }

  async createMission(dto: CreateMissionDto, establishmentId: string) {
    const planning = this.resolveMissionPlanning(dto);
    const publicationMode = this.resolvePublicationMode(dto, planning);

    if (planning.length > 0) {
      if (publicationMode === "MULTI_MISSION_BATCH") {
        const createdMissions = await this.prisma.$transaction(
          planning.map((line) =>
            this.prisma.reliefMission.create({
              data: this.buildMissionCreateData({
                dto,
                establishmentId,
                planning: [line],
                dateStart: new Date(`${line.dateStart}T${line.heureDebut}`),
                dateEnd: new Date(`${line.dateEnd}T${line.heureFin}`),
              }),
            }),
          ),
        );

        return {
          createdMissionIds: createdMissions.map((mission) => mission.id),
          createdCount: createdMissions.length,
          publicationMode,
        };
      }

      const envelope = deriveMissionEnvelopeFromPlanning(planning);
      if (!envelope) {
        throw new BadRequestException("Invalid planning");
      }

      const createdMission = await this.prisma.reliefMission.create({
        data: this.buildMissionCreateData({
          dto,
          establishmentId,
          planning,
          dateStart: new Date(envelope.dateStart),
          dateEnd: new Date(envelope.dateEnd),
        }),
      });

      return {
        createdMissionIds: [createdMission.id],
        createdCount: 1,
        publicationMode,
      };
    }

    const dateStart = new Date(dto.dateStart ?? "");
    const dateEnd = new Date(dto.dateEnd ?? "");

    if (
      Number.isNaN(dateStart.getTime()) ||
      Number.isNaN(dateEnd.getTime()) ||
      dateEnd <= dateStart
    ) {
      throw new BadRequestException("dateEnd must be after dateStart");
    }

    const createdMission = await this.prisma.reliefMission.create({
      data: this.buildMissionCreateData({
        dto,
        establishmentId,
        planning: [],
        dateStart,
        dateEnd,
      }),
    });

    return {
      createdMissionIds: [createdMission.id],
      createdCount: 1,
      publicationMode: "MULTI_DAY_SINGLE_BOOKING" as RenfortPublicationMode,
    };
  }

  async findAll(filter: FindMissionsQueryDto) {
    const where: Prisma.ReliefMissionWhereInput = {
      status: ReliefMissionStatus.OPEN,
    };

    if (filter.city) {
      where.city = {
        contains: filter.city,
        mode: "insensitive",
      };
    }

    const missions = await this.prisma.reliefMission.findMany({
      where,
      orderBy: {
        dateStart: "asc",
      },
      include: {
        establishment: {
          select: MARKETPLACE_ESTABLISHMENT_SELECT,
        },
      },
    });

    const filteredMissions = filter.date
      ? (() => {
          const dayStart = new Date(`${filter.date}T00:00:00.000Z`);
          const dayEnd = new Date(`${filter.date}T23:59:59.999Z`);

          if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
            throw new BadRequestException("Invalid date");
          }

          return missions.filter((mission) => {
            if (missionPlanningOverlapsDate(mission.slots, filter.date!)) {
              return true;
            }

            if (coerceMissionPlanning(mission.slots).length > 0) {
              return false;
            }

            return mission.dateStart <= dayEnd && mission.dateEnd >= dayStart;
          });
        })()
      : missions;

    return filteredMissions
      .sort(
        (left, right) =>
          this.getMissionSortDate(left).getTime() - this.getMissionSortDate(right).getTime(),
      )
      .map((mission: any) => this.serializeMarketplaceMission(mission));
  }

  async apply(missionId: string, freelanceId: string, dto: ApplyMissionDto = {}) {
    return this.bookingsService.claimOpenMissionForFreelance(missionId, freelanceId, dto);
  }

  async requestInfo(missionId: string, freelanceId: string, message: string) {
    const mission = await this.prisma.reliefMission.findFirst({
      where: {
        id: missionId,
        OR: [
          { status: ReliefMissionStatus.OPEN },
          { bookings: { some: { freelanceId } } },
        ],
      },
      select: { id: true, title: true },
    });

    if (!mission) {
      throw new NotFoundException("Mission introuvable");
    }

    await this.prisma.deskRequest.create({
      data: {
        type: "MISSION_INFO_REQUEST",
        missionId: mission.id,
        requesterId: freelanceId,
        message,
      },
    });

    return { ok: true };
  }

  async getManagedMissions(establishmentId: string) {
    const missions = await this.prisma.reliefMission.findMany({
      where: {
        establishmentId,
        // No status filter: returns full history (OPEN, ASSIGNED, COMPLETED, CANCELLED)
      },
      orderBy: { dateStart: 'asc' },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          include: {
            freelance: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    });
    return missions
      .sort(
        (left, right) =>
          this.getMissionSortDate(left).getTime() - this.getMissionSortDate(right).getTime(),
      )
      .map((mission: any) => this.serializeMission(mission));
  }

  async getMission(id: string) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id },
      include: {
        establishment: {
          select: MARKETPLACE_ESTABLISHMENT_SELECT,
        },
      },
    });
    if (!mission) {
      throw new NotFoundException("Mission not found");
    }
    return this.serializeMarketplaceMission(mission);
  }

  private resolveMissionPlanning(dto: CreateMissionDto): MissionPlanningLineInput[] {
    const rawPlanning = dto.planning ?? coerceMissionPlanning(dto.slots);
    if (!rawPlanning || rawPlanning.length === 0) {
      return [];
    }

    const planning = sortMissionPlanning(rawPlanning);
    const issues = validateMissionPlanning(planning);
    if (issues.length > 0) {
      throw new BadRequestException(issues[0]?.message ?? "Invalid planning");
    }

    if (normalizeMissionPlanning(planning).length === 0) {
      throw new BadRequestException("Invalid planning");
    }

    return planning;
  }

  private resolvePublicationMode(
    dto: CreateMissionDto,
    planning: MissionPlanningLineInput[],
  ): RenfortPublicationMode {
    if (dto.publicationMode) {
      return dto.publicationMode;
    }

    if (dto.planning && planning.length > 0) {
      return "MULTI_MISSION_BATCH";
    }

    return "MULTI_DAY_SINGLE_BOOKING";
  }

  private buildMissionCreateData(params: {
    dto: CreateMissionDto;
    establishmentId: string;
    planning: MissionPlanningLineInput[];
    dateStart: Date;
    dateEnd: Date;
  }): Prisma.ReliefMissionUncheckedCreateInput {
    const { dto, establishmentId, planning, dateStart, dateEnd } = params;

    return {
      title: dto.title,
      dateStart,
      dateEnd,
      hourlyRate: dto.hourlyRate,
      address: dto.address,
      establishmentId,
      status: ReliefMissionStatus.OPEN,
      metier: dto.metier,
      shift: dto.shift,
      city: dto.city,
      zipCode: dto.zipCode,
      description: dto.description,
      requiredSkills: dto.requiredSkills ?? [],
      exactAddress: dto.exactAddress,
      accessInstructions: dto.accessInstructions,
      establishmentType: dto.establishmentType,
      targetPublic: dto.targetPublic ?? [],
      unitSize: dto.unitSize,
      slots: planning.length > 0 ? (planning as any) : null,
      diplomaRequired: dto.diplomaRequired ?? false,
      hasTransmissions: dto.hasTransmissions ?? false,
      transmissionTime: dto.transmissionTime,
      perks: dto.perks ?? [],
    };
  }

  private getMissionSortDate(
    mission: { dateStart: Date; slots: unknown },
    now = new Date(),
  ) {
    const normalizedPlanning = normalizeMissionPlanning(coerceMissionPlanning(mission.slots));
    const nextLine = normalizedPlanning.find((line) => line.start.getTime() >= now.getTime());
    const firstLine = normalizedPlanning[0];

    return nextLine?.start ?? firstLine?.start ?? mission.dateStart;
  }

  private serializeMission<T extends { slots: unknown }>(mission: T) {
    const planning = coerceMissionPlanning(mission.slots);

    return {
      ...mission,
      planning,
      slots: planning,
      isRenfort: true as const,
    };
  }

  private serializeMarketplaceMission<
    T extends {
      slots: unknown;
      address: string;
      city?: string | null;
      exactAddress?: string | null;
      accessInstructions?: string | null;
      establishment?: {
        profile?: {
          city?: string | null;
        } | null;
      } | null;
    },
  >(mission: T) {
    const planning = coerceMissionPlanning(mission.slots);
    const location = getMarketplaceMissionLocation(mission);

    return {
      ...mission,
      address: location,
      city: mission.city ?? location,
      exactAddress: null,
      accessInstructions: null,
      planning,
      slots: planning,
      isRenfort: true as const,
    };
  }
}
