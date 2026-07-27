import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApiRequest = vi.fn();
const mockGetAdminSessionToken = vi.fn().mockResolvedValue("admin-tok");
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

vi.mock("@/app/actions/_shared/admin-session", () => ({
  getAdminSessionToken: () => mockGetAdminSessionToken(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/components/data/FilterBar", () => ({
  FilterBar: ({
    onFilterChange,
    onReset,
  }: {
    onFilterChange?: (key: string, value: string) => void;
    onReset?: () => void;
  }) => (
    <div>
      <button onClick={() => onFilterChange?.("status", "PAID")}>Status Paid</button>
      <button onClick={() => onFilterChange?.("date", "7D")}>Date 7D</button>
      <button onClick={() => onReset?.()}>Reset</button>
    </div>
  ),
}));

const {
  getAdminFinanceBookingsAwaitingPayment,
  getAdminFinanceInvoices,
  getAdminFinanceQuotes,
  getAdminFinanceSummary,
} = await import("@/app/actions/admin");
const { AdminInvoicesTable } = await import("@/components/admin/AdminInvoicesTable");

describe("admin finance actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSessionToken.mockResolvedValue("admin-tok");
  });

  it("charge la synthèse via GET /admin/finance/summary", async () => {
    mockApiRequest.mockResolvedValue({
      invoicesCount: 1,
      paidInvoicesCount: 0,
      unpaidInvoicesCount: 1,
      totalInvoicedAmount: 120,
      totalPaidAmount: 0,
      totalOutstandingAmount: 120,
      quotesSentCount: 2,
      quotesAcceptedCount: 1,
      bookingsAwaitingPaymentCount: 1,
    });

    await getAdminFinanceSummary();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/finance/summary",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
  });

  it("charge les factures, devis et bookings awaiting payment via les endpoints admin dédiés", async () => {
    mockApiRequest.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await getAdminFinanceInvoices();
    await getAdminFinanceQuotes();
    await getAdminFinanceBookingsAwaitingPayment();

    expect(mockApiRequest).toHaveBeenNthCalledWith(
      1,
      "/admin/finance/invoices",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
    expect(mockApiRequest).toHaveBeenNthCalledWith(
      2,
      "/admin/finance/quotes",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
    expect(mockApiRequest).toHaveBeenNthCalledWith(
      3,
      "/admin/finance/bookings-awaiting-payment",
      expect.objectContaining({ method: "GET", token: "admin-tok" }),
    );
  });
});

describe("AdminInvoicesTable", () => {
  it("filtre les factures par statut et date", () => {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    render(
      <AdminInvoicesTable
        invoices={[
          {
            id: "invoice-1",
            invoiceNumber: "FAC-001",
            status: "PAID",
            amount: 180,
            createdAt: now.toISOString(),
            bookingId: "booking-1",
            bookingType: "MISSION",
            bookingTitle: "Mission de nuit",
            scheduledAt: now.toISOString(),
            establishmentName: "Luc Martin",
            providerName: "Nora Diallo",
          },
          {
            id: "invoice-2",
            invoiceNumber: "FAC-002",
            status: "UNPAID",
            amount: 220,
            createdAt: fifteenDaysAgo.toISOString(),
            bookingId: "booking-2",
            bookingType: "SERVICE",
            bookingTitle: "Atelier mémoire",
            scheduledAt: fifteenDaysAgo.toISOString(),
            establishmentName: "Aya Benali",
            providerName: "Karim Bensaid",
          },
        ]}
      />,
    );

    expect(screen.getByText("Mission de nuit")).toBeInTheDocument();
    expect(screen.getByText("Atelier mémoire")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Status Paid"));
    expect(screen.getByText("Mission de nuit")).toBeInTheDocument();
    expect(screen.queryByText("Atelier mémoire")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Reset"));
    fireEvent.click(screen.getByText("Date 7D"));
    expect(screen.getByText("Mission de nuit")).toBeInTheDocument();
    expect(screen.queryByText("Atelier mémoire")).not.toBeInTheDocument();
  });
});
