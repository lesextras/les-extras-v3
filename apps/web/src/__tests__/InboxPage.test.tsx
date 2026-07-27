import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockGetBookingsPageDataSafe = vi.fn();
const mockGetNotifications = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
}));

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
  deleteSession: () => mockDeleteSession(),
}));

vi.mock("@/app/actions/bookings", () => ({
  getBookingsPageDataSafe: (...args: unknown[]) => mockGetBookingsPageDataSafe(...args),
}));

vi.mock("@/actions/messaging", () => ({
  getNotifications: () => mockGetNotifications(),
}));

vi.mock("@/app/(dashboard)/dashboard/inbox/InboxClient", () => ({
  InboxClient: ({ initialSeeds, initialLoadError }: {
    initialSeeds: unknown[];
    initialLoadError: string | null;
  }) => (
    <div>
      <p>InboxClient</p>
      <p>seeds:{initialSeeds.length}</p>
      {initialLoadError && <p>{initialLoadError}</p>}
    </div>
  ),
}));

const { default: InboxPage } = await import("@/app/(dashboard)/dashboard/inbox/page");

describe("InboxPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      token: "token-1",
      user: { id: "u-1", role: "FREELANCE" },
    });
    mockGetBookingsPageDataSafe.mockResolvedValue({
      ok: true,
      data: { lines: [], nextStep: null },
    });
    mockGetNotifications.mockResolvedValue([]);
  });

  it("reste accessible si les conversations liées aux bookings échouent", async () => {
    mockGetBookingsPageDataSafe.mockResolvedValue({
      ok: false,
      error: "Impossible de charger les conversations liées à vos missions et ateliers.",
    });

    render(await InboxPage());

    expect(screen.getByText("InboxClient")).toBeInTheDocument();
    expect(screen.getByText("seeds:0")).toBeInTheDocument();
    expect(
      screen.getByText(/impossible de charger les conversations liées à vos missions et ateliers/i),
    ).toBeInTheDocument();
  });

  it("redirige vers /login si la session API est expirée", async () => {
    mockGetBookingsPageDataSafe.mockResolvedValue({
      ok: false,
      error: "Session expirée — reconnectez-vous.",
      unauthorized: true,
    });

    await expect(InboxPage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
  });
});
