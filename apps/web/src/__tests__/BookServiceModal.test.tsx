import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookServiceModal } from "@/components/modals/BookServiceModal";

const mockCloseBookServiceModal = vi.fn();
const mockRefresh = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockGetService = vi.fn();
const mockBookService = vi.fn();

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (s: {
    isBookServiceModalOpen: boolean;
    bookServiceModalId: string | null;
    closeBookServiceModal: () => void;
  }) => unknown) =>
    selector({
      isBookServiceModalOpen: true,
      bookServiceModalId: "service-1",
      closeBookServiceModal: mockCloseBookServiceModal,
    }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("@/app/actions/marketplace", () => ({
  getService: (...args: unknown[]) => mockGetService(...args),
  bookService: (...args: unknown[]) => mockBookService(...args),
}));

describe("BookServiceModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    mockGetService.mockResolvedValue({
      id: "service-1",
      title: "Atelier test",
      type: "WORKSHOP",
      pricingType: "SESSION",
      price: 200,
      pricePerParticipant: null,
      durationMinutes: 120,
      capacity: 10,
      slots: [{ date: futureDate, heureDebut: "09:00", heureFin: "11:00" }],
    });
    mockBookService.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("réservation réussie : envoie la demande et refresh l'UI", async () => {
    render(<BookServiceModal />);

    await waitFor(() => {
      expect(mockGetService).toHaveBeenCalledWith("service-1");
    });

    const slotButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("09:00"));
    expect(slotButton).toBeTruthy();
    fireEvent.click(slotButton!);

    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /envoyer la demande/i }));

    await waitFor(() => {
      expect(mockBookService).toHaveBeenCalledWith(
        "service-1",
        expect.any(Date),
        undefined,
        1,
      );
      expect(mockToastSuccess).toHaveBeenCalledWith("Demande envoyée au prestataire !");
      expect(mockRefresh).toHaveBeenCalled();
    });
  }, 15000);

  it("réservation refusée (doublon) : affiche un message lisible sans fermer la modale", async () => {
    mockBookService.mockResolvedValue({
      error: "Vous avez déjà une demande active pour ce service.",
    });

    render(<BookServiceModal />);

    await waitFor(() => {
      expect(mockGetService).toHaveBeenCalled();
    });

    const slotButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("09:00"));
    fireEvent.click(slotButton!);

    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /envoyer la demande/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Vous avez déjà une demande active pour ce service."),
      ).toBeInTheDocument();
    });
    expect(mockCloseBookServiceModal).not.toHaveBeenCalled();
  });

  it("réservation refusée (erreur métier) : affiche le message dans la modale", async () => {
    mockBookService.mockResolvedValue({
      error: "Ce service n'est plus disponible à la réservation.",
    });

    render(<BookServiceModal />);

    await waitFor(() => {
      expect(mockGetService).toHaveBeenCalled();
    });

    const slotButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("09:00"));
    fireEvent.click(slotButton!);

    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /envoyer la demande/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Ce service n'est plus disponible à la réservation."),
      ).toBeInTheDocument();
    });
  });

  it("n'affiche jamais FAIL quand l'action renvoie une erreur technique", async () => {
    mockBookService.mockResolvedValue({
      error: "FAIL",
    });

    render(<BookServiceModal />);

    await waitFor(() => {
      expect(mockGetService).toHaveBeenCalled();
    });

    const slotButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("09:00"));
    fireEvent.click(slotButton!);

    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
    fireEvent.click(screen.getByRole("button", { name: /envoyer la demande/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Impossible d'envoyer votre demande de réservation pour le moment."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("FAIL")).not.toBeInTheDocument();
  });

  it("applique la même validation de capacité pour une formation", async () => {
    mockGetService.mockResolvedValue({
      id: "service-2",
      title: "Formation test",
      type: "TRAINING",
      pricingType: "SESSION",
      price: 250,
      pricePerParticipant: null,
      durationMinutes: 120,
      capacity: 2,
      slots: [{ date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10), heureDebut: "09:00", heureFin: "11:00" }],
    });

    render(<BookServiceModal />);

    await waitFor(() => {
      expect(mockGetService).toHaveBeenCalled();
    });

    const slotButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("09:00"));
    fireEvent.click(slotButton!);

    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

    fireEvent.change(screen.getByLabelText(/nombre de participants/i), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

    await waitFor(() => {
      expect(
        screen.getByText("La capacité maximale de ce service est de 2 participants."),
      ).toBeInTheDocument();
    });
  });

  it("affiche une erreur visible si le chargement du service échoue", async () => {
    mockGetService.mockRejectedValue(new Error("Service temporairement indisponible"));

    render(<BookServiceModal />);

    await waitFor(() => {
      expect(screen.getByText("Service temporairement indisponible")).toBeInTheDocument();
      expect(mockToastError).toHaveBeenCalledWith("Service temporairement indisponible");
    });
    expect(screen.getByRole("button", { name: /fermer/i })).toBeInTheDocument();
  });
});
