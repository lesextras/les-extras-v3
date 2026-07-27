import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const { QuoteCard } = await import("@/components/orders/QuoteCard");

describe("QuoteCard", () => {
  it("affiche un montant simple sans mention HT, TVA ni TTC", () => {
    render(
      <QuoteCard
        quote={{
          id: "quote-1",
          status: "SENT",
          subtotalHT: 120,
          vatRate: 0,
          vatAmount: 0,
          totalTTC: 120,
          createdAt: "2026-04-10T09:00:00.000Z",
          issuer: { id: "free-1", name: "Nora Provider" },
          lines: [
            {
              id: "line-1",
              description: "Séance",
              quantity: 1,
              unitPrice: 120,
              unit: "séance",
              totalHT: 120,
            },
          ],
        }}
        canAct={false}
        onAccept={() => undefined}
        onReject={() => undefined}
        isPending={false}
      />,
    );

    expect(screen.queryByText("Sous-total")).not.toBeInTheDocument();
    expect(screen.getByText("Montant")).toBeInTheDocument();
    expect(screen.queryByText(/^TVA$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TTC/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bHT\b/)).not.toBeInTheDocument();
  });
});
