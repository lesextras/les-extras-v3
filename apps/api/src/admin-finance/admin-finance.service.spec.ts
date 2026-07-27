import { BookingStatus, PaymentStatus, QuoteStatus } from "@prisma/client";
import { AdminFinanceService } from "./admin-finance.service";

describe("AdminFinanceService", () => {
  const prisma = {
    invoice: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    quote: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    booking: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((queries: Array<Promise<unknown>>) => Promise.all(queries)),
  } as any;

  let service: AdminFinanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminFinanceService(prisma);
  });

  it("retourne une synthèse finance admin cohérente", async () => {
    prisma.invoice.aggregate
      .mockResolvedValueOnce({ _count: { _all: 8 }, _sum: { amount: 3200 } })
      .mockResolvedValueOnce({ _sum: { amount: 1800 } })
      .mockResolvedValueOnce({ _sum: { amount: 1400 } });
    prisma.invoice.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(5);
    prisma.quote.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    prisma.booking.count.mockResolvedValueOnce(6);

    await expect(service.getSummary()).resolves.toEqual({
      invoicesCount: 8,
      paidInvoicesCount: 3,
      unpaidInvoicesCount: 5,
      totalInvoicedAmount: 3200,
      totalPaidAmount: 1800,
      totalOutstandingAmount: 1400,
      quotesSentCount: 4,
      quotesAcceptedCount: 2,
      bookingsAwaitingPaymentCount: 6,
    });
  });

  it("retourne les factures admin avec contexte réservation", async () => {
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: "inv-1",
        invoiceNumber: "FAC-001",
        status: "UNPAID",
        amount: 420,
        createdAt: new Date("2026-04-20T08:00:00.000Z"),
        booking: {
          id: "booking-1",
          scheduledAt: new Date("2026-04-22T09:00:00.000Z"),
          reliefMission: { title: "Mission de nuit" },
          service: null,
          establishment: {
            email: "est@example.com",
            profile: { firstName: "Luc", lastName: "Martin" },
          },
          freelance: {
            email: "free@example.com",
            profile: { firstName: "Nora", lastName: "Diallo" },
          },
        },
      },
    ]);

    await expect(service.getInvoices()).resolves.toEqual([
      {
        id: "inv-1",
        invoiceNumber: "FAC-001",
        status: "UNPAID",
        amount: 420,
        createdAt: "2026-04-20T08:00:00.000Z",
        bookingId: "booking-1",
        bookingType: "MISSION",
        bookingTitle: "Mission de nuit",
        scheduledAt: "2026-04-22T09:00:00.000Z",
        establishmentName: "Luc Martin",
        providerName: "Nora Diallo",
      },
    ]);
  });

  it("retourne les devis admin read-only", async () => {
    prisma.quote.findMany.mockResolvedValue([
      {
        id: "quote-1",
        status: QuoteStatus.SENT,
        totalTTC: 280,
        createdAt: new Date("2026-04-19T10:00:00.000Z"),
        validUntil: new Date("2026-05-01T10:00:00.000Z"),
        acceptedAt: null,
        rejectedAt: null,
        issuer: {
          email: "free@example.com",
          profile: { firstName: "Nora", lastName: "Diallo" },
        },
        booking: {
          id: "booking-2",
          reliefMission: null,
          service: { title: "Atelier mémoire" },
          establishment: {
            email: "est@example.com",
            profile: { firstName: "Luc", lastName: "Martin" },
          },
        },
      },
    ]);

    await expect(service.getQuotes()).resolves.toEqual([
      {
        id: "quote-1",
        status: QuoteStatus.SENT,
        totalTTC: 280,
        createdAt: "2026-04-19T10:00:00.000Z",
        validUntil: "2026-05-01T10:00:00.000Z",
        acceptedAt: null,
        rejectedAt: null,
        bookingId: "booking-2",
        bookingType: "SERVICE",
        bookingTitle: "Atelier mémoire",
        issuerName: "Nora Diallo",
        requesterName: "Luc Martin",
      },
    ]);
  });

  it("retourne les réservations en attente de paiement", async () => {
    prisma.booking.findMany.mockResolvedValue([
      {
        id: "booking-3",
        status: BookingStatus.AWAITING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date("2026-04-18T08:00:00.000Z"),
        scheduledAt: new Date("2026-04-24T09:00:00.000Z"),
        reliefMission: null,
        service: {
          title: "Atelier mémoire",
          price: 190,
          owner: {
            email: "free@example.com",
            profile: { firstName: "Nora", lastName: "Diallo" },
          },
        },
        establishment: {
          email: "est@example.com",
          profile: { firstName: "Luc", lastName: "Martin" },
        },
        freelance: null,
        invoice: {
          id: "inv-2",
          invoiceNumber: "FAC-002",
          amount: 210,
        },
        quotes: [],
      },
    ]);

    await expect(service.getBookingsAwaitingPayment()).resolves.toEqual([
      {
        id: "booking-3",
        status: BookingStatus.AWAITING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        amount: 210,
        createdAt: "2026-04-18T08:00:00.000Z",
        scheduledAt: "2026-04-24T09:00:00.000Z",
        bookingType: "SERVICE",
        bookingTitle: "Atelier mémoire",
        establishmentName: "Luc Martin",
        providerName: "Nora Diallo",
        invoiceId: "inv-2",
        invoiceNumber: "FAC-002",
      },
    ]);
  });
});
