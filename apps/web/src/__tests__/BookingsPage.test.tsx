import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockGetBookingsPageDataSafe = vi.fn();
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

vi.mock("@/components/bookings/BookingsPageClient", () => ({
  BookingsPageClient: ({ initialData, initialError }: {
    initialData: { lines: unknown[] };
    initialError: string | null;
  }) => (
    <div>
      <p>BookingsPageClient</p>
      <p>lines:{initialData.lines.length}</p>
      {initialError && <p>{initialError}</p>}
    </div>
  ),
}));

const { default: BookingsPage } = await import("@/app/(dashboard)/bookings/page");

describe("BookingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      token: "token-1",
      user: { id: "u-1" },
    });
    mockGetBookingsPageDataSafe.mockResolvedValue({
      ok: true,
      data: { lines: [{ lineId: "line-1" }], nextStep: null },
    });
  });

  it("rend l'agenda en mode dégradé si les réservations échouent", async () => {
    mockGetBookingsPageDataSafe.mockResolvedValue({
      ok: false,
      error: "Impossible de charger votre agenda pour le moment.",
    });

    render(await BookingsPage());

    expect(screen.getByText("BookingsPageClient")).toBeInTheDocument();
    expect(screen.getByText("lines:0")).toBeInTheDocument();
    expect(screen.getByText(/impossible de charger votre agenda/i)).toBeInTheDocument();
  });

  it("redirige vers /login si la session API est expirée", async () => {
    mockGetBookingsPageDataSafe.mockResolvedValue({
      ok: false,
      error: "Session expirée — reconnectez-vous.",
      unauthorized: true,
    });

    await expect(BookingsPage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
  });
});
