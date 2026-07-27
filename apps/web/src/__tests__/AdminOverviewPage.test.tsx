import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const getAdminOverviewMock = vi.hoisted(() => vi.fn());
const getAdminUsersMock = vi.hoisted(() => vi.fn());
const getDeskRequestsMock = vi.hoisted(() => vi.fn());
const getAdminMissionsMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/actions/admin", () => ({
  getAdminMissions: getAdminMissionsMock,
  getAdminOverview: getAdminOverviewMock,
  getAdminUsers: getAdminUsersMock,
  getDeskRequests: getDeskRequestsMock,
}));

vi.mock("@/components/admin/AdminStats", () => ({
  AdminStats: ({ data }: { data: { pendingUsersCount: number; openDeskRequestsCount: number } }) => (
    <div>
      <span>Utilisateurs à valider: {data.pendingUsersCount}</span>
      <span>Demandes Desk ouvertes: {data.openDeskRequestsCount}</span>
    </div>
  ),
}));

vi.mock("@/components/admin/RequiredActions", () => ({
  RequiredActions: ({
    pendingUsers,
    openDeskRequests,
    financeIncidents,
    urgentMissions,
  }: {
    pendingUsers: unknown[];
    openDeskRequests: unknown[];
    financeIncidents?: unknown[];
    urgentMissions?: unknown[];
  }) => (
    <div>
      <span>Pending users: {pendingUsers.length}</span>
      <span>Open desk requests: {openDeskRequests.length}</span>
      <span>Finance incidents: {financeIncidents?.length ?? 0}</span>
      <span>Urgent missions: {urgentMissions?.length ?? 0}</span>
    </div>
  ),
}));

vi.mock("@/components/layout/BentoSection", () => ({
  BentoSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const { default: AdminOverviewPage } = await import("@/app/(admin)/admin/page");

const overview = {
  pendingUsersCount: 1,
  openDeskRequestsCount: 1,
  urgentOpenMissionsCount: 0,
  featuredServicesCount: 0,
  hiddenServicesCount: 0,
  awaitingPaymentCount: 0,
};

describe("AdminOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    getAdminOverviewMock.mockResolvedValue(overview);
    getAdminUsersMock.mockResolvedValue([
      {
        id: "user-1",
        name: "Compte à valider",
        email: "pending@test.fr",
        role: "FREELANCE",
        status: "PENDING",
        createdAt: "2026-04-20T10:00:00.000Z",
      },
    ]);
    getDeskRequestsMock.mockResolvedValue([
      {
        id: "desk-1",
        status: "OPEN",
        type: "TECHNICAL_ISSUE",
        priority: "NORMAL",
        createdAt: "2026-04-20T10:00:00.000Z",
        requester: { id: "user-2", email: "user@test.fr", profile: null },
      },
    ]);
    getAdminMissionsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rend le dashboard admin avec les données disponibles", async () => {
    render(await AdminOverviewPage());

    expect(screen.getByText("Utilisateurs à valider: 1")).toBeInTheDocument();
    expect(screen.getByText("Demandes Desk ouvertes: 1")).toBeInTheDocument();
    expect(screen.getByText("Pending users: 1")).toBeInTheDocument();
    expect(screen.getByText("Open desk requests: 1")).toBeInTheDocument();
  });

  it("rend les fallbacks sans crasher si des endpoints échouent", async () => {
    getAdminOverviewMock.mockRejectedValueOnce(new Error("API request failed (503)"));
    getAdminUsersMock.mockRejectedValueOnce(new Error("API request failed (503)"));
    getDeskRequestsMock.mockRejectedValueOnce(new Error("API request failed (503)"));
    getAdminMissionsMock.mockRejectedValueOnce(new Error("API request failed (503)"));

    render(await AdminOverviewPage());

    expect(screen.getByText("Données Desk partiellement indisponibles")).toBeInTheDocument();
    expect(screen.getByText("Utilisateurs à valider: 0")).toBeInTheDocument();
    expect(screen.getByText("Demandes Desk ouvertes: 0")).toBeInTheDocument();
    expect(screen.getByText("Pending users: 0")).toBeInTheDocument();
    expect(screen.getByText("Open desk requests: 0")).toBeInTheDocument();
  });
});
