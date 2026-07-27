"use client";

import { useMemo, useState } from "react";
import type { AdminFinanceQuoteRow } from "@/app/actions/admin";
import {
  dateTimeFormatter,
  getBookingTypeLabel,
  getFinanceDateFilterOptions,
  getQuoteStatusMeta,
  matchesDateFilter,
  moneyFormatter,
  type AdminFinanceDateFilter,
} from "@/components/admin/admin-finance-utils";
import { DataTableShell } from "@/components/data/DataTableShell";
import { FilterBar, type FilterDefinition } from "@/components/data/FilterBar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

type AdminQuotesTableProps = {
  quotes: AdminFinanceQuoteRow[];
};

export function AdminQuotesTable({ quotes }: AdminQuotesTableProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminFinanceQuoteRow["status"]>("ALL");
  const [dateFilter, setDateFilter] = useState<AdminFinanceDateFilter>("ALL");

  const filters = useMemo<FilterDefinition[]>(() => {
    const statuses = [...new Set(quotes.map((quote) => quote.status))];

    return [
      {
        key: "status",
        label: "Tous les statuts",
        options: statuses.map((status) => ({
          label: getQuoteStatusMeta(status).label,
          value: status,
        })),
      },
      {
        key: "date",
        label: "Toutes dates",
        options: getFinanceDateFilterOptions(),
      },
    ];
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      if (statusFilter !== "ALL" && quote.status !== statusFilter) {
        return false;
      }

      return matchesDateFilter(quote.createdAt, dateFilter);
    });
  }, [dateFilter, quotes, statusFilter]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") {
      setStatusFilter(value as AdminFinanceQuoteRow["status"] | "ALL");
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
      title="Devis"
      description="Suivi read-only des devis émis et de leur avancement."
      columns={["Réservation", "Demandeur", "Émetteur", "Statut", "Montant", "Dates"]}
      emptyTitle="Aucun devis"
      emptyDescription="Les devis apparaîtront ici dès leur émission."
      filterSlot={
        <FilterBar
          filters={filters}
          activeFilters={{ status: statusFilter, date: dateFilter }}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />
      }
    >
      {filteredQuotes.map((quote) => {
        const status = getQuoteStatusMeta(quote.status);

        return (
          <TableRow key={quote.id}>
            <TableCell className="max-w-[260px]">
              <p className="font-medium text-foreground">{quote.bookingTitle}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="quiet">{getBookingTypeLabel(quote.bookingType)}</Badge>
                <span className="font-mono">{quote.bookingId.slice(0, 8)}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-foreground">{quote.requesterName}</TableCell>
            <TableCell className="text-sm text-foreground">{quote.issuerName}</TableCell>
            <TableCell>
              <Badge variant={status.variant}>{status.label}</Badge>
            </TableCell>
            <TableCell className="text-sm font-medium text-foreground">
              {moneyFormatter.format(quote.totalTTC)}
            </TableCell>
            <TableCell className="min-w-[220px] text-xs text-muted-foreground">
              <p>Émis: {dateTimeFormatter.format(new Date(quote.createdAt))}</p>
              <p>
                Validité:{" "}
                {quote.validUntil ? dateTimeFormatter.format(new Date(quote.validUntil)) : "—"}
              </p>
            </TableCell>
          </TableRow>
        );
      })}
    </DataTableShell>
  );
}
