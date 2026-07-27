"use client";

import { useMemo, useState } from "react";
import type { AdminFinanceInvoiceRow } from "@/app/actions/admin";
import {
  getBookingTypeLabel,
  getFinanceDateFilterOptions,
  getInvoiceStatusMeta,
  matchesDateFilter,
  moneyFormatter,
  shortDateFormatter,
  type AdminFinanceDateFilter,
} from "@/components/admin/admin-finance-utils";
import { DataTableShell } from "@/components/data/DataTableShell";
import { FilterBar, type FilterDefinition } from "@/components/data/FilterBar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

type AdminInvoicesTableProps = {
  invoices: AdminFinanceInvoiceRow[];
};

export function AdminInvoicesTable({ invoices }: AdminInvoicesTableProps) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<AdminFinanceDateFilter>("ALL");

  const filters = useMemo<FilterDefinition[]>(() => {
    const statuses = [...new Set(invoices.map((invoice) => invoice.status))];

    return [
      {
        key: "status",
        label: "Tous les statuts",
        options: statuses.map((status) => ({
          label: getInvoiceStatusMeta(status).label,
          value: status,
        })),
      },
      {
        key: "date",
        label: "Toutes dates",
        options: getFinanceDateFilterOptions(),
      },
    ];
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (statusFilter !== "ALL" && invoice.status !== statusFilter) {
        return false;
      }

      return matchesDateFilter(invoice.createdAt, dateFilter);
    });
  }, [dateFilter, invoices, statusFilter]);

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
      title="Factures"
      description="Vue read-only des factures générées par la plateforme."
      columns={["Facture", "Réservation", "Établissement", "Prestataire", "Statut", "Montant", "Créée le"]}
      emptyTitle="Aucune facture"
      emptyDescription="Les factures générées apparaîtront ici."
      filterSlot={
        <FilterBar
          filters={filters}
          activeFilters={{ status: statusFilter, date: dateFilter }}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />
      }
    >
      {filteredInvoices.map((invoice) => {
        const status = getInvoiceStatusMeta(invoice.status);

        return (
          <TableRow key={invoice.id}>
            <TableCell className="font-mono text-xs text-foreground">
              {invoice.invoiceNumber ?? invoice.id.slice(0, 8).toUpperCase()}
            </TableCell>
            <TableCell className="max-w-[260px]">
              <p className="font-medium text-foreground">{invoice.bookingTitle}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="quiet">{getBookingTypeLabel(invoice.bookingType)}</Badge>
                <span>{shortDateFormatter.format(new Date(invoice.scheduledAt))}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-foreground">{invoice.establishmentName}</TableCell>
            <TableCell className="text-sm text-foreground">{invoice.providerName}</TableCell>
            <TableCell>
              <Badge variant={status.variant}>{status.label}</Badge>
            </TableCell>
            <TableCell className="text-sm font-medium text-foreground">
              {moneyFormatter.format(invoice.amount)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {shortDateFormatter.format(new Date(invoice.createdAt))}
            </TableCell>
          </TableRow>
        );
      })}
    </DataTableShell>
  );
}
