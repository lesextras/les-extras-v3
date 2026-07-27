import { Injectable } from "@nestjs/common";
import {
  BookingStatus,
  DeskRequestStatus,
  ReliefMissionStatus,
  UserStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AdminOverview } from "./types/admin-overview.types";

const URGENT_MISSION_WINDOW_MS = 48 * 60 * 60 * 1000;
const OPEN_DESK_REQUEST_STATUSES = [
  DeskRequestStatus.OPEN,
  DeskRequestStatus.IN_PROGRESS,
] as const;

@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(now = new Date()): Promise<AdminOverview> {
    const urgentUntil = new Date(now.getTime() + URGENT_MISSION_WINDOW_MS);

    const [
      pendingUsersCount,
      openDeskRequestsCount,
      urgentOpenMissionsCount,
      featuredServicesCount,
      hiddenServicesCount,
      awaitingPaymentCount,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: { status: UserStatus.PENDING },
      }),
      this.prisma.deskRequest.count({
        where: {
          status: {
            in: [...OPEN_DESK_REQUEST_STATUSES],
          },
        },
      }),
      this.prisma.reliefMission.count({
        where: {
          status: ReliefMissionStatus.OPEN,
          dateEnd: { gte: now },
          dateStart: {
            gte: now,
            lte: urgentUntil,
          },
        },
      }),
      this.prisma.service.count({
        where: { isFeatured: true },
      }),
      this.prisma.service.count({
        where: { isHidden: true },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.AWAITING_PAYMENT },
      }),
    ]);

    return {
      pendingUsersCount,
      openDeskRequestsCount,
      urgentOpenMissionsCount,
      featuredServicesCount,
      hiddenServicesCount,
      awaitingPaymentCount,
    };
  }
}
