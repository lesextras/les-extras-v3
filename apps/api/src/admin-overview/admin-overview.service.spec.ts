import {
  BookingStatus,
  DeskRequestStatus,
  ReliefMissionStatus,
  UserStatus,
} from "@prisma/client";
import { AdminOverviewService } from "./admin-overview.service";

describe("AdminOverviewService", () => {
  const prisma = {
    user: { count: jest.fn() },
    deskRequest: { count: jest.fn() },
    reliefMission: { count: jest.fn() },
    service: { count: jest.fn() },
    booking: { count: jest.fn() },
    $transaction: jest.fn((queries: Array<Promise<unknown>>) => Promise.all(queries)),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retourne les compteurs opérationnels réels", async () => {
    const service = new AdminOverviewService(prisma);
    const now = new Date("2026-04-21T10:00:00.000Z");
    const urgentUntil = new Date("2026-04-23T10:00:00.000Z");

    prisma.user.count.mockResolvedValueOnce(2);
    prisma.deskRequest.count.mockResolvedValueOnce(3);
    prisma.reliefMission.count.mockResolvedValueOnce(4);
    prisma.service.count.mockResolvedValueOnce(5).mockResolvedValueOnce(6);
    prisma.booking.count.mockResolvedValueOnce(7);

    await expect(service.getOverview(now)).resolves.toEqual({
      pendingUsersCount: 2,
      openDeskRequestsCount: 3,
      urgentOpenMissionsCount: 4,
      featuredServicesCount: 5,
      hiddenServicesCount: 6,
      awaitingPaymentCount: 7,
    });

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { status: UserStatus.PENDING },
    });
    expect(prisma.deskRequest.count).toHaveBeenCalledWith({
      where: {
        status: {
          in: [DeskRequestStatus.OPEN, DeskRequestStatus.IN_PROGRESS],
        },
      },
    });
    expect(prisma.reliefMission.count).toHaveBeenCalledWith({
      where: {
        status: ReliefMissionStatus.OPEN,
        dateEnd: { gte: now },
        dateStart: { gte: now, lte: urgentUntil },
      },
    });
    expect(prisma.service.count).toHaveBeenNthCalledWith(1, {
      where: { isFeatured: true },
    });
    expect(prisma.service.count).toHaveBeenNthCalledWith(2, {
      where: { isHidden: true },
    });
    expect(prisma.booking.count).toHaveBeenCalledWith({
      where: { status: BookingStatus.AWAITING_PAYMENT },
    });
  });
});
