import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockGetBookingsPageData = vi.fn();
const mockGetAvailableMissions = vi.fn();
const mockGetReviewsByTarget = vi.fn();
const mockGetCurrentUser = vi.fn();
const mockGetMyAteliers = vi.fn();
const mockGetMyDeskRequestsSafe = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
  deleteSession: () => mockDeleteSession(),
}));

vi.mock("@/app/actions/bookings", () => ({
  getBookingsPageData: (...args: unknown[]) => mockGetBookingsPageData(...args),
}));

vi.mock("@/app/actions/missions", () => ({
  getAvailableMissions: (...args: unknown[]) => mockGetAvailableMissions(...args),
  getEstablishmentMissions: vi.fn(),
}));

vi.mock("@/app/actions/reviews", () => ({
  getReviewsByTarget: (...args: unknown[]) => mockGetReviewsByTarget(...args),
}));

vi.mock("@/app/actions/user", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("@/app/actions/marketplace", () => ({
  getMyAteliers: (...args: unknown[]) => mockGetMyAteliers(...args),
}));

vi.mock("@/app/actions/desk", () => ({
  getMyDeskRequestsSafe: (...args: unknown[]) => mockGetMyDeskRequestsSafe(...args),
}));

vi.mock("@/actions/finance", () => ({
  getInvoices: vi.fn(),
}));

vi.mock("@/actions/credits", () => ({
  getCredits: vi.fn(),
}));

vi.mock("@/app/(dashboard)/dashboard/_components/EstablishmentDashboard", () => ({
  EstablishmentDashboard: () => null,
}));

vi.mock("@/app/(dashboard)/dashboard/_components/FreelanceDashboard", () => ({
  FreelanceDashboard: () => null,
}));

const { default: DashboardPage } = await import("@/app/(dashboard)/dashboard/page");

describe("DashboardPage freelance KPI data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      token: "freelance-token",
      user: { id: "free-1", role: "FREELANCE" },
    });
    mockGetAvailableMissions.mockResolvedValue([]);
    mockGetCurrentUser.mockResolvedValue({ isAvailable: true });
    mockGetMyAteliers.mockResolvedValue([]);
    mockGetMyDeskRequestsSafe.mockResolvedValue({ ok: true, data: [] });
    mockGetReviewsByTarget.mockResolvedValue([
      { id: "r1", rating: 5, comment: "Très bien", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "r2", rating: 3, comment: "Correct", createdAt: "2026-01-02T00:00:00.000Z" },
      { id: "r3", rating: 4, comment: "Bien", createdAt: "2026-01-03T00:00:00.000Z" },
      { id: "r4", rating: 4, comment: "Bien", createdAt: "2026-01-04T00:00:00.000Z" },
      { id: "r5", rating: 2, comment: "Moyen", createdAt: "2026-01-05T00:00:00.000Z" },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calcule les KPI actionnables sans mélanger requester et provider", async () => {
    mockGetBookingsPageData.mockResolvedValue({
      nextStep: null,
      lines: [
        {
          lineId: "mission-future",
          lineType: "MISSION",
          date: "2099-04-12T10:00:00.000Z",
          typeLabel: "Mission SOS",
          interlocutor: "EHPAD A",
          status: "CONFIRMED",
          address: "Paris",
          contactEmail: "contact@example.com",
        },
        {
          lineId: "mission-past",
          lineType: "MISSION",
          date: "2020-04-12T10:00:00.000Z",
          typeLabel: "Mission SOS",
          interlocutor: "EHPAD B",
          status: "ASSIGNED",
          address: "Paris",
          contactEmail: "contact@example.com",
        },
        {
          lineId: "mission-pending",
          lineType: "MISSION",
          date: "2099-04-13T10:00:00.000Z",
          typeLabel: "Mission SOS",
          interlocutor: "EHPAD C",
          status: "PENDING",
          address: "Paris",
          contactEmail: "contact@example.com",
        },
        {
          lineId: "service-provider",
          lineType: "SERVICE_BOOKING",
          date: "2099-04-14T10:00:00.000Z",
          typeLabel: "Atelier",
          interlocutor: "EHPAD D",
          status: "PENDING",
          address: "Paris",
          contactEmail: "contact@example.com",
          viewerSide: "PROVIDER",
        },
        {
          lineId: "service-requester",
          lineType: "SERVICE_BOOKING",
          date: "2099-04-15T10:00:00.000Z",
          typeLabel: "Atelier",
          interlocutor: "Prestataire E",
          status: "PENDING",
          address: "Paris",
          contactEmail: "contact@example.com",
          viewerSide: "REQUESTER",
        },
      ],
    });

    const element = await DashboardPage() as { props?: Record<string, unknown> };

    expect(element.props).toEqual(
      expect.objectContaining({
        upcomingMissions: 1,
        pendingApplications: 1,
        pendingServiceRequests: 1,
        averageRating: 3.6,
        nextMission: expect.objectContaining({
          lineId: "mission-future",
        }),
      }),
    );
  });

  it("compte une mission confirmée prévue exactement maintenant comme à venir", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-04-12T10:00:00.000Z"));

    mockGetBookingsPageData.mockResolvedValue({
      nextStep: null,
      lines: [
        {
          lineId: "mission-now",
          lineType: "MISSION",
          date: "2099-04-12T10:00:00.000Z",
          typeLabel: "Mission SOS",
          interlocutor: "EHPAD A",
          status: "CONFIRMED",
          address: "Paris",
          contactEmail: "contact@example.com",
        },
      ],
    });

    const element = await DashboardPage() as { props?: Record<string, unknown> };

    expect(element.props).toEqual(
      expect.objectContaining({
        upcomingMissions: 1,
        nextMission: expect.objectContaining({
          lineId: "mission-now",
        }),
      }),
    );
  });
});
