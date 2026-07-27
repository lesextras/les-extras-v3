import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const { RevenueOverviewWidget } = await import("@/components/finance/RevenueOverviewWidget");
const { InvoiceListWidget } = await import("@/components/finance/InvoiceListWidget");

describe("finance widgets", () => {
  const invoices = [
    {
      id: "inv-1",
      invoiceNumber: "LE-202604-ABCD1234",
      createdAt: "2026-04-18T10:00:00.000Z",
      amount: 180,
      status: "UNPAID",
      booking: {
        scheduledAt: "2026-04-18T10:00:00.000Z",
        establishment: {
          email: "client@test.com",
          profile: {
            companyName: "Association Demo",
            firstName: "Client",
            lastName: "Demo",
          },
        },
      },
    },
  ];

  it("calcule les montants en attente à partir du statut UNPAID", () => {
    render(<RevenueOverviewWidget invoices={invoices} />);

    expect(screen.getByText("180.00 €")).toBeInTheDocument();
    expect(screen.getByText(/1 facture en attente/i)).toBeInTheDocument();
  });

  it("affiche une colonne client générique dans la liste de factures", () => {
    render(<InvoiceListWidget invoices={invoices} />);

    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Association Demo")).toBeInTheDocument();
  });
});
