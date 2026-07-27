import type {
  AdminAwaitingPaymentBookingRow,
  AdminFinanceBookingType,
  AdminFinanceQuoteRow,
} from "@/app/actions/admin";

export type AdminFinanceDateFilter = "ALL" | "TODAY" | "7D" | "30D" | "90D";
export type FinanceBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "quiet"
  | "coral";

export const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function matchesDateFilter(createdAt: string, dateFilter: AdminFinanceDateFilter) {
  if (dateFilter === "ALL") {
    return true;
  }

  const createdAtDate = new Date(createdAt);
  const now = new Date();

  if (dateFilter === "TODAY") {
    return createdAtDate.toDateString() === now.toDateString();
  }

  const diffMs = now.getTime() - createdAtDate.getTime();
  const maxDays = dateFilter === "7D" ? 7 : dateFilter === "30D" ? 30 : 90;
  return diffMs <= maxDays * 24 * 60 * 60 * 1000;
}

export function getFinanceDateFilterOptions() {
  return [
    { label: "Aujourd’hui", value: "TODAY" },
    { label: "7 derniers jours", value: "7D" },
    { label: "30 derniers jours", value: "30D" },
    { label: "90 derniers jours", value: "90D" },
  ];
}

export function getBookingTypeLabel(type: AdminFinanceBookingType) {
  return type === "MISSION" ? "Mission" : "Atelier";
}

export function getInvoiceStatusMeta(status: string): {
  label: string;
  variant: FinanceBadgeVariant;
} {
  if (status === "PAID") {
    return { label: "Payée", variant: "success" };
  }

  if (status === "UNPAID") {
    return { label: "Impayée", variant: "warning" };
  }

  if (status === "PENDING_PAYMENT") {
    return { label: "Impayée", variant: "warning" };
  }

  return { label: status, variant: "outline" };
}

export function getQuoteStatusMeta(status: AdminFinanceQuoteRow["status"]): {
  label: string;
  variant: FinanceBadgeVariant;
} {
  if (status === "SENT") {
    return { label: "Envoyé", variant: "default" };
  }

  if (status === "ACCEPTED") {
    return { label: "Accepté", variant: "success" };
  }

  if (status === "REJECTED") {
    return { label: "Refusé", variant: "coral" };
  }

  if (status === "REVISED") {
    return { label: "Révisé", variant: "secondary" };
  }

  return { label: "Brouillon", variant: "quiet" };
}

export function getAwaitingPaymentStatusMeta(row: AdminAwaitingPaymentBookingRow): {
  label: string;
  variant: FinanceBadgeVariant;
} {
  if (row.paymentStatus === "PAID") {
    return { label: "Réglé", variant: "success" };
  }

  if (row.paymentStatus === "CANCELLED") {
    return { label: "Annulé", variant: "coral" };
  }

  if (row.status === "AWAITING_PAYMENT") {
    return { label: "À encaisser", variant: "warning" };
  }

  return { label: row.paymentStatus, variant: "outline" };
}
