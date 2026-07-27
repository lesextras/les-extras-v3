import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingLineLot6Panel } from "@/components/bookings/BookingLineLot6Panel";
import type { BookingLine } from "@/app/actions/bookings";

const mockGetReviewByBooking = vi.fn();
const mockCreateReview = vi.fn();

vi.mock("@/app/actions/reviews", () => ({
  getReviewByBooking: (...args: unknown[]) => mockGetReviewByBooking(...args),
  createReview: (...args: unknown[]) => mockCreateReview(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/modals/ReviewModal", () => ({
  ReviewModal: ({
    open,
    onSubmit,
  }: {
    open: boolean;
    onSubmit: (payload: { rating: number; text: string; tags: string[] }) => void;
  }) =>
    open ? (
      <button
        type="button"
        onClick={() => onSubmit({ rating: 5, text: "Très bien", tags: ["Ponctuel"] })}
      >
        Envoyer avis test
      </button>
    ) : null,
}));

const baseLine: BookingLine = {
  lineId: "line-1",
  lineType: "SERVICE_BOOKING",
  date: "2026-03-15T10:00:00.000Z",
  typeLabel: "Atelier",
  interlocutor: "etablissement@test.com",
  status: "PAID",
  address: "Adresse",
  contactEmail: "etablissement@test.com",
  relatedBookingId: "booking-1",
};

describe("BookingLineLot6Panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le statut de règlement simple et l'avis existant", async () => {
    mockGetReviewByBooking.mockResolvedValue({
      id: "rev-1",
      bookingId: "booking-1",
      authorId: "u1",
      targetId: "u2",
      rating: 4,
      comment: "Bon déroulé",
      type: "ESTABLISHMENT_TO_FREELANCE",
      createdAt: new Date().toISOString(),
    });

    render(
      <BookingLineLot6Panel
        line={baseLine}
        userRole="ESTABLISHMENT"
      />,
    );

    expect(await screen.findByText(/Règlement: validé par l'association/i)).toBeInTheDocument();
    expect(await screen.findByText(/Avis envoyé \(4\/5\)/i)).toBeInTheDocument();
  });

  it("permet la création d'un avis quand la mission est reviewable", async () => {
    mockGetReviewByBooking.mockResolvedValue(null);
    mockCreateReview.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(
      <BookingLineLot6Panel
        line={{ ...baseLine, status: "COMPLETED_AWAITING_PAYMENT" }}
        userRole="ESTABLISHMENT"
      />,
    );

    const openButton = await screen.findByRole("button", { name: /laisser un avis/i });
    await user.click(openButton);
    await user.click(await screen.findByRole("button", { name: /envoyer avis test/i }));

    await waitFor(() => {
      expect(mockCreateReview).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: "booking-1",
          rating: 5,
          type: "ESTABLISHMENT_TO_FREELANCE",
        }),
      );
    });
  });

  it("affiche un garde-fou quand l'avis n'est pas encore autorisé", async () => {
    mockGetReviewByBooking.mockResolvedValue(null);

    render(
      <BookingLineLot6Panel
        line={{ ...baseLine, status: "CONFIRMED" }}
        userRole="FREELANCE"
      />,
    );

    expect(await screen.findByText(/Avis: disponible après mission terminée/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /laisser un avis/i })).not.toBeInTheDocument();
  });

  it("affiche l'état vide si aucun booking lié", () => {
    render(
      <BookingLineLot6Panel
        line={{ ...baseLine, relatedBookingId: undefined }}
        userRole="FREELANCE"
      />,
    );

    expect(screen.getByText(/Avis: indisponible pour cette ligne/i)).toBeInTheDocument();
  });

  it("affiche l'état erreur de chargement et permet de réessayer", async () => {
    mockGetReviewByBooking
      .mockRejectedValueOnce(new Error("Erreur réseau"))
      .mockResolvedValueOnce(null);
    const user = userEvent.setup();

    render(
      <BookingLineLot6Panel
        line={baseLine}
        userRole="FREELANCE"
      />,
    );

    expect(await screen.findByText(/Avis: Erreur réseau/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Réessayer/i }));
    await waitFor(() => {
      expect(mockGetReviewByBooking).toHaveBeenCalledTimes(2);
    });
  });
});
