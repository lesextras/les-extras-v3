import { BookingStatus, InvoiceStatus, PaymentStatus, QuoteStatus } from "@prisma/client";

export type AdminFinanceSummary = {
  invoicesCount: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
  quotesSentCount: number;
  quotesAcceptedCount: number;
  bookingsAwaitingPaymentCount: number;
};

export type AdminFinanceBookingType = "MISSION" | "SERVICE";

export type AdminFinanceInvoiceRow = {
  id: string;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  amount: number;
  createdAt: string;
  bookingId: string;
  bookingType: AdminFinanceBookingType;
  bookingTitle: string;
  scheduledAt: string;
  establishmentName: string;
  providerName: string;
};

export type AdminFinanceQuoteRow = {
  id: string;
  status: QuoteStatus;
  totalTTC: number;
  createdAt: string;
  validUntil: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  bookingId: string;
  bookingType: AdminFinanceBookingType;
  bookingTitle: string;
  issuerName: string;
  requesterName: string;
};

export type AdminAwaitingPaymentBookingRow = {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amount: number | null;
  createdAt: string;
  scheduledAt: string;
  bookingType: AdminFinanceBookingType;
  bookingTitle: string;
  establishmentName: string;
  providerName: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
};
