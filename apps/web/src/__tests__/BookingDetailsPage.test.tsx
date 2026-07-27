import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
  redirect: (path: string) => mockRedirect(path),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
  deleteSession: () => mockDeleteSession(),
}));

vi.mock("@/app/actions/bookings", () => ({
  getBookingsPageDataSafe: (...args: unknown[]) => mockGetBookingsPageData(...args),
  getBookingLineDetailsSafe: (...args: unknown[]) => mockGetBookingLineDetails(...args),
}));

vi.mock("@/app/actions/desk", () => ({
  createUserDeskRequest: vi.fn(),
}));

const mockGetSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockGetBookingsPageData = vi.fn();
const mockGetBookingLineDetails = vi.fn();

const { default: BookingDetailsPage } = await import(
  "@/app/(dashboard)/bookings/[lineType]/[lineId]/page"
);

const mockLine = {
  lineId: "line-1",
  lineType: "MISSION" as const,
  date: "2026-03-20T09:00:00.000Z",
  typeLabel: "Mission SOS" as const,
  interlocutor: "EHPAD Les Pins",
  status: "CONFIRMED" as const,
  address: "5 av. de la paix",
  contactEmail: "contact@ehpad.fr",
};

describe("BookingDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "tok", user: { id: "u1" } });
    mockGetBookingsPageData.mockResolvedValue({
      ok: true,
      data: {
        lines: [mockLine],
        nextStep: null,
      },
    });
    mockGetBookingLineDetails.mockResolvedValue({
      ok: true,
      data: {
        address: "5 av. de la paix",
        contactEmail: "contact@ehpad.fr",
      },
    });
  });

  it("affiche les informations de la réservation", async () => {
    render(await BookingDetailsPage({ params: { lineType: "MISSION", lineId: "line-1" } }));

    expect(screen.getByText("EHPAD Les Pins")).toBeInTheDocument();
    expect(screen.getByText("5 av. de la paix")).toBeInTheDocument();
    expect(screen.getByText("contact@ehpad.fr")).toBeInTheDocument();
  });

  it("affiche le libellé centralisé du statut", async () => {
    mockGetBookingsPageData.mockResolvedValue({
      ok: true,
      data: {
        lines: [{ ...mockLine, status: "QUOTE_ACCEPTED" }],
        nextStep: null,
      },
    });

    render(await BookingDetailsPage({ params: { lineType: "MISSION", lineId: "line-1" } }));

    expect(screen.getByText("Devis accepté")).toBeInTheDocument();
  });

  it("appelle getBookingLineDetails avec les bons paramètres", async () => {
    await BookingDetailsPage({ params: { lineType: "MISSION", lineId: "line-1" } });

    expect(mockGetBookingLineDetails).toHaveBeenCalledWith({
      lineType: "MISSION",
      lineId: "line-1",
    }, "tok");
  });

  it("contient un lien retour vers /bookings", async () => {
    render(await BookingDetailsPage({ params: { lineType: "MISSION", lineId: "line-1" } }));

    const backLink = screen
      .getAllByRole("link")
      .find((l) => l.getAttribute("href") === "/bookings");
    expect(backLink).toBeDefined();
  });

  it("affiche une entrée Desk contextualisée", async () => {
    render(await BookingDetailsPage({ params: { lineType: "MISSION", lineId: "line-1" } }));

    expect(
      screen.getByRole("button", { name: /signaler un problème au desk/i }),
    ).toBeInTheDocument();
  });

  it("appelle notFound pour un lineType invalide", async () => {
    await expect(
      BookingDetailsPage({ params: { lineType: "INVALID", lineId: "x" } }),
    ).rejects.toThrow();
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("appelle notFound si la ligne n'appartient pas à l'utilisateur", async () => {
    mockGetBookingsPageData.mockResolvedValue({
      ok: true,
      data: { lines: [], nextStep: null },
    });

    await expect(
      BookingDetailsPage({ params: { lineType: "MISSION", lineId: "ghost" } }),
    ).rejects.toThrow();
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("redirige vers /login si la session est absente", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(
      BookingDetailsPage({ params: { lineType: "MISSION", lineId: "line-1" } }),
    ).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirige vers /login si l'API renvoie une session expirée", async () => {
    mockGetBookingsPageData.mockResolvedValue({
      ok: false,
      error: "Session expirée — reconnectez-vous.",
      unauthorized: true,
    });

    await expect(
      BookingDetailsPage({ params: { lineType: "MISSION", lineId: "line-1" } }),
    ).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
