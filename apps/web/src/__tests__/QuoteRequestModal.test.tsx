import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuoteRequestModal } from "@/components/modals/QuoteRequestModal";

const mockCloseQuoteRequestModal = vi.fn();
const mockRefresh = vi.fn();
const mockBookService = vi.fn();

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (s: {
    isQuoteRequestModalOpen: boolean;
    quoteRequestServiceId: string | null;
    closeQuoteRequestModal: () => void;
  }) => unknown) =>
    selector({
      isQuoteRequestModalOpen: true,
      quoteRequestServiceId: "service-quote-1",
      closeQuoteRequestModal: mockCloseQuoteRequestModal,
    }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/app/actions/marketplace", () => ({
  bookService: (...args: unknown[]) => mockBookService(...args),
}));

describe("QuoteRequestModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T12:30:00"));
    mockBookService.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("normalise une date du jour en créneau futur avant l'envoi", async () => {
    render(<QuoteRequestModal />);

    fireEvent.change(screen.getByLabelText(/date souhaitée/i), {
      target: { value: "2026-04-17" },
    });
    fireEvent.change(screen.getByLabelText(/nombre de participants estimé/i), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer la demande/i }));
    await vi.runAllTimersAsync();

    expect(mockBookService).toHaveBeenCalled();

    const firstCall = mockBookService.mock.calls[0];
    expect(firstCall).toBeDefined();
    const requestedDate = firstCall![1];
    const participants = firstCall![3];
    expect(requestedDate).toBeInstanceOf(Date);
    expect((requestedDate as Date).getTime()).toBeGreaterThan(new Date("2026-04-17T12:30:00").getTime());
    expect(participants).toBe(3);
  });

  it("n'affiche pas FAIL si la demande de devis échoue techniquement", async () => {
    vi.useRealTimers();
    mockBookService.mockResolvedValue({ error: "FAIL" });

    render(<QuoteRequestModal />);

    fireEvent.change(screen.getByLabelText(/date souhaitée/i), {
      target: { value: "2099-04-18" },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer la demande/i }));

    expect(
      await screen.findByText("Impossible d'envoyer votre demande de réservation pour le moment."),
    ).toBeInTheDocument();
    expect(screen.queryByText("FAIL")).not.toBeInTheDocument();
  });
});
