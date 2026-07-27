import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockGetBookingLineDetails = vi.fn();
const mockGetBookingsPageData = vi.fn();
const mockConfirmBookingLine = vi.fn();
const mockCreateUserDeskRequest = vi.fn();
const mockRefresh = vi.fn();
let mockUserRole: "ESTABLISHMENT" | "FREELANCE" = "ESTABLISHMENT";
let mockSearchParams = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mockSearchParams),
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (state: { userRole: "ESTABLISHMENT" | "FREELANCE" }) => unknown) =>
    selector({ userRole: mockUserRole }),
}));

vi.mock("@/app/actions/bookings", () => ({
  getBookingsPageDataSafe: (...args: unknown[]) => mockGetBookingsPageData(...args),
  getBookingLineDetailsSafe: (...args: unknown[]) => mockGetBookingLineDetails(...args),
  cancelBookingLine: vi.fn(),
  completeBookingLine: vi.fn(),
  confirmBookingLine: (...args: unknown[]) => mockConfirmBookingLine(...args),
}));

vi.mock("@/actions/payments", () => ({
  authorizePayment: vi.fn(),
}));

vi.mock("@/app/actions/desk", () => ({
  createUserDeskRequest: (...args: unknown[]) => mockCreateUserDeskRequest(...args),
}));

vi.mock("@/components/bookings/BookingLineLot6Panel", () => ({
  BookingLineLot6Panel: () => null,
}));

const { BookingsPageClient } = await import("@/components/bookings/BookingsPageClient");

describe("BookingsPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRole = "ESTABLISHMENT";
    mockSearchParams = "";
    mockGetBookingsPageData.mockResolvedValue({ ok: true, data: { nextStep: null, lines: [] } });
    mockGetBookingLineDetails.mockResolvedValue({
      ok: true,
      data: {
        address: "10 rue de test",
        contactEmail: "contact@test.com",
      },
    });
    mockConfirmBookingLine.mockResolvedValue({ ok: true });
    mockCreateUserDeskRequest.mockResolvedValue({ ok: true });
  });

  it("ouvre automatiquement les détails depuis searchParams une seule fois", async () => {
    mockSearchParams = "lineType=MISSION&lineId=line-1";

    render(
      <BookingsPageClient
        initialData={{
          nextStep: null,
          lines: [
            {
              lineId: "line-1",
              lineType: "MISSION",
              date: "2026-03-20T09:00:00.000Z",
              typeLabel: "Mission SOS",
              interlocutor: "Clinique A",
              status: "CONFIRMED",
              address: "10 rue de test",
              contactEmail: "contact@test.com",
              relatedBookingId: "booking-1",
            },
          ],
        }}
      />,
    );

    await waitFor(() => {
      expect(mockGetBookingLineDetails).toHaveBeenCalledTimes(1);
    });
    expect(mockGetBookingLineDetails).toHaveBeenCalledWith({
      lineType: "MISSION",
      lineId: "line-1",
    });
  });

  it("affiche correctement le libellé Formation pour une réservation de service", async () => {
    render(
      <BookingsPageClient
        initialData={{
          nextStep: null,
          lines: [
            {
              lineId: "line-2",
              lineType: "SERVICE_BOOKING",
              date: "2026-03-21T09:00:00.000Z",
              typeLabel: "Formation",
              interlocutor: "Prestataire B",
              status: "PENDING",
              address: "10 rue de test",
              contactEmail: "contact@test.com",
              relatedBookingId: "booking-2",
            },
          ],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Formation")).toBeInTheDocument();
    });
  });

  it("affiche le libellé centralisé des statuts booking", async () => {
    render(
      <BookingsPageClient
        initialData={{
          nextStep: null,
          lines: [
            {
              lineId: "line-quote",
              lineType: "SERVICE_BOOKING",
              date: "2026-03-21T09:00:00.000Z",
              typeLabel: "Atelier",
              interlocutor: "Prestataire B",
              status: "QUOTE_SENT",
              address: "10 rue de test",
              contactEmail: "contact@test.com",
              relatedBookingId: "booking-quote",
            },
          ],
        }}
      />,
    );

    expect(await screen.findByText("Devis envoyé")).toBeInTheDocument();
  });

  it("affiche une erreur non bloquante quand le chargement initial échoue", () => {
    render(
      <BookingsPageClient
        initialData={{
          nextStep: null,
          lines: [],
        }}
        initialError="Impossible de charger votre agenda pour le moment."
      />,
    );

    expect(screen.getByText("Mes Réservations")).toBeInTheDocument();
    expect(
      screen.getByText("Impossible de charger votre agenda pour le moment."),
    ).toBeInTheDocument();
    expect(screen.getByText("Aucune réservation")).toBeInTheDocument();
  });

  it("permet au prestataire freelance de valider une réservation de service", async () => {
    mockUserRole = "FREELANCE";
    mockGetBookingsPageData.mockResolvedValue({
      ok: true,
      data: {
        nextStep: null,
        lines: [
          {
            lineId: "line-3",
            lineType: "SERVICE_BOOKING",
            date: "2026-03-21T09:00:00.000Z",
            typeLabel: "Atelier",
            interlocutor: "Client C",
            status: "QUOTE_ACCEPTED",
            address: "10 rue de test",
            contactEmail: "contact@test.com",
            relatedBookingId: "booking-3",
            viewerSide: "PROVIDER",
          },
        ],
      },
    });

    render(
      <BookingsPageClient
        initialData={{
          nextStep: null,
          lines: [
            {
              lineId: "line-3",
              lineType: "SERVICE_BOOKING",
              date: "2026-03-21T09:00:00.000Z",
              typeLabel: "Atelier",
              interlocutor: "Client C",
              status: "QUOTE_ACCEPTED",
              address: "10 rue de test",
              contactEmail: "contact@test.com",
              relatedBookingId: "booking-3",
              viewerSide: "PROVIDER",
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /valider la réservation/i }));

    await waitFor(() => {
      expect(mockConfirmBookingLine).toHaveBeenCalledWith({ bookingId: "booking-3" });
    });
  });

  it("permet de créer une demande Desk contextualisée depuis une ligne de réservation", async () => {
    render(
      <BookingsPageClient
        initialData={{
          nextStep: null,
          lines: [
            {
              lineId: "line-1",
              lineType: "MISSION",
              date: "2026-03-20T09:00:00.000Z",
              typeLabel: "Mission SOS",
              interlocutor: "Clinique A",
              status: "CONFIRMED",
              address: "10 rue de test",
              contactEmail: "contact@test.com",
              relatedBookingId: "booking-1",
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /signaler un problème au desk/i }));
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Le détail de réservation ne correspond pas à la mission." },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer au desk/i }));

    await waitFor(() => {
      expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
        "LITIGE",
        "Le détail de réservation ne correspond pas à la mission.",
        { bookingId: "booking-1" },
      );
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("utilise missionId pour une ligne mission sans booking lié", async () => {
    render(
      <BookingsPageClient
        initialData={{
          nextStep: null,
          lines: [
            {
              lineId: "mission-open",
              lineType: "MISSION",
              date: "2026-03-20T09:00:00.000Z",
              typeLabel: "Mission SOS",
              interlocutor: "Clinique A",
              status: "ASSIGNED",
              address: "10 rue de test",
              contactEmail: "contact@test.com",
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /signaler un problème au desk/i }));
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Je souhaite signaler un souci sur cette mission." },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer au desk/i }));

    await waitFor(() => {
      expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
        "LITIGE",
        "Je souhaite signaler un souci sur cette mission.",
        { missionId: "mission-open" },
      );
    });
  });
});
