import { BadgeCheck, Clock3, FileText, Receipt, Wallet } from "lucide-react";
import type { AdminFinanceSummary } from "@/app/actions/admin";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { moneyFormatter } from "@/components/admin/admin-finance-utils";

type AdminFinanceSummaryCardsProps = {
  summary: AdminFinanceSummary;
};

export function AdminFinanceSummaryCards({ summary }: AdminFinanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiTile
        label="Factures émises"
        value={summary.invoicesCount}
        icon={Receipt}
        iconColor="teal"
        trend={summary.unpaidInvoicesCount > 0 ? "flat" : undefined}
        trendLabel={
          summary.unpaidInvoicesCount > 0 ? `${summary.unpaidInvoicesCount} impayée(s)` : undefined
        }
      />
      <KpiTile
        label="Montant facturé (TTC)"
        value={moneyFormatter.format(summary.totalInvoicedAmount)}
        icon={Wallet}
        iconColor="amber"
        trendLabel="Commission 3 % incluse"
        trend="flat"
      />
      <KpiTile
        label="Montant encaissé (TTC)"
        value={moneyFormatter.format(summary.totalPaidAmount)}
        icon={BadgeCheck}
        iconColor="emerald"
        trend={summary.paidInvoicesCount > 0 ? "up" : undefined}
        trendLabel={
          summary.paidInvoicesCount > 0 ? `${summary.paidInvoicesCount} payée(s)` : undefined
        }
      />
      <KpiTile
        label="Solde en attente (TTC)"
        value={moneyFormatter.format(summary.totalOutstandingAmount)}
        icon={Clock3}
        iconColor="coral"
      />
      <KpiTile
        label="Devis envoyés"
        value={summary.quotesSentCount}
        icon={FileText}
        iconColor="violet"
        trend={summary.quotesAcceptedCount > 0 ? "up" : undefined}
        trendLabel={
          summary.quotesAcceptedCount > 0 ? `${summary.quotesAcceptedCount} acceptés` : undefined
        }
      />
      <KpiTile
        label="Réservations à encaisser"
        value={summary.bookingsAwaitingPaymentCount}
        icon={Receipt}
        iconColor="gray"
      />
    </div>
  );
}
