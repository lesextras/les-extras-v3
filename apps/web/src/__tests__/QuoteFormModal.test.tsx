import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateQuote = vi.fn();
const mockGetQuotePrefill = vi.fn();

vi.mock("@/app/actions/orders", () => ({
  createQuote: (...args: unknown[]) => mockCreateQuote(...args),
  getQuotePrefill: (...args: unknown[]) => mockGetQuotePrefill(...args),
}));

const { QuoteFormModal } = await import("@/components/orders/QuoteFormModal");

describe("QuoteFormModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetQuotePrefill.mockResolvedValue({ lines: [] });
    mockCreateQuote.mockResolvedValue({ success: true });
  });

  it("n'affiche plus de champ TVA et envoie un devis sans vatRate", async () => {
    render(
      <QuoteFormModal bookingId="booking-1" onClose={() => undefined} onSuccess={() => undefined} />,
    );

    expect(screen.queryByText(/TVA \(%\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^TVA$/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Prestation…"), {
      target: { value: "Séance mémoire" },
    });
    const spinbuttons = screen.getAllByRole("spinbutton");
    expect(spinbuttons).toHaveLength(2);
    const quantityInput = spinbuttons[0]!;
    const unitPriceInput = spinbuttons[1]!;
    fireEvent.change(quantityInput, {
      target: { value: "2" },
    });
    fireEvent.change(unitPriceInput, {
      target: { value: "80" },
    });

    fireEvent.click(screen.getByRole("button", { name: /envoyer le devis/i }));

    await waitFor(() => {
      expect(mockCreateQuote).toHaveBeenCalledWith(
        "booking-1",
        [
          {
            description: "Séance mémoire",
            quantity: 2,
            unitPrice: 80,
            unit: "heure",
          },
        ],
        {
          conditions: undefined,
          notes: undefined,
        },
      );
    });
  });
});
