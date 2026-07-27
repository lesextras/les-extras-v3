"use client";

import { useMemo, useState } from "react";
import type { AdminAwaitingPaymentBookingRow } from "@/app/actions/admin";
import {
  dateTimeFormatter,
  getAwaitingPaymentStatusMeta,
  getBookingTypeLabel,
  getFinanceDateFilterOptions,
  matchesDateFilter,
  moneyFormatter,
  type AdminFinanceDateFilter,
} from "@/components/admin/admin-finance-utils";
import { DataTableShell } from "@/components/data/DataTableShell";
import { FilterBar, type FilterDefinition } from "@/components/data/FilterBar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

type AdminAwaitingPaymentTableProps = {
  bookings: AdminAwaitingPaymentBookingRow[];
};

export function AdminAwaitingPaymentTable({ bookings }: AdminAwaitingPaymentTableProps) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<AdminFinanceDateFilter>("ALL");

  const filters = useMemo<FilterDefinition[]>(() => {
    const statuses = [...new Set(bookings.map((booking) => booking.status))];

    return [
      {
        key: "status",
        label: "Tous les statuts",
        options: statuses.map((status) => ({
          label: status === "AWAITING_PAYMENT" ? "À encaisser" : status,
          value: status,
        })),
      },
      {
        key: "date",
        label: "Toutes dates",
        options: getFinanceDateFilterOptions(),
      },
    ];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (statusFilter !== "ALL" && booking.status !== statusFilter) {
        return false;
      }

      return matchesDateFilter(booking.createdAt, dateFilter);
    });
  }, [bookings, dateFilter, statusFilter]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") {
      setStatusFilter(value);
    }

    if (key === "date") {
      setDateFilter(value as AdminFinanceDateFilter);
    }
  };

  const handleReset = () => {
    setStatusFilter("ALL");
    setDateFilter("ALL");
  };

  return (
    <DataTableShell
      title="Réservations à encaisser"
      description="Bookings passés en attente de règlement côté plateforme."
      columns={["Réservation", "Établissement", "Prestataire", "Paiement", "Montant", "Facture", "Dates"]}
      emptyTitle="Aucune réservation à encaisser"
      emptyDescription="Les bookings AWAITING_PAYMENT apparaîtront ici."
      filterSlot={
        <FilterBar
          filters={filters}
          activeFilters={{ status: statusFilter, date: dateFilter }}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />
      }
    >
      {filteredBookings.map((booking) => {
        const payment = getAwaitingPaymentStatusMeta(booking);

        return (
          <TableRow key={booking.id}>
            <TableCell className="max-w-[260px]">
              <p className="font-medium text-foreground">{booking.bookingTitle}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="quiet">{getBookingTypeLabel(booking.bookingType)}</Badge>
                <span className="font-mono">{booking.id.slice(0, 8)}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-foreground">{booking.establishmentName}</TableCell>
            <TableCell className="text-sm text-foreground">{booking.providerName}</TableCell>
            <TableCell>
              <Badge variant={payment.variant}>{payment.label}</Badge>
            </TableCell>
            <TableCell className="text-sm font-medium text-foreground">
              {booking.amount != null ? moneyFormatter.format(booking.amount) : "—"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {booking.invoiceNumber ?? booking.invoiceId ?? "—"}
            </TableCell>
            <TableCell className="min-w-[220px] text-xs text-muted-foreground">
              <p>Créé: {dateTimeFormatter.format(new Date(booking.createdAt))}</p>
              <p>Prévu: {dateTimeFormatter.format(new Date(booking.scheduledAt))}</p>
            </TableCell>
          </TableRow>
        );
      })}
    </DataTableShell>
  );
}
