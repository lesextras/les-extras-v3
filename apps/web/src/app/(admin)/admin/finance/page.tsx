import {
  getAdminFinanceBookingsAwaitingPayment,
  getAdminFinanceInvoices,
  getAdminFinanceQuotes,
  getAdminFinanceSummary,
} from "@/app/actions/admin";
import { AdminAwaitingPaymentTable } from "@/components/admin/AdminAwaitingPaymentTable";
import { AdminFinanceSummaryCards } from "@/components/admin/AdminFinanceSummaryCards";
import { AdminInvoicesTable } from "@/components/admin/AdminInvoicesTable";
import { AdminQuotesTable } from "@/components/admin/AdminQuotesTable";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const [summary, invoices, quotes, bookingsAwaitingPayment] = await Promise.all([
    getAdminFinanceSummary(),
    getAdminFinanceInvoices(),
    getAdminFinanceQuotes(),
    getAdminFinanceBookingsAwaitingPayment(),
  ]);

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-heading-xl tracking-tight">Finance</h2>
        <p className="text-sm text-muted-foreground">
          Vue read-only des factures, devis et réservations en attente de paiement.
        </p>
      </header>

      <AdminFinanceSummaryCards summary={summary} />
      <AdminInvoicesTable invoices={invoices} />
      <AdminQuotesTable quotes={quotes} />
      <AdminAwaitingPaymentTable bookings={bookingsAwaitingPayment} />
    </section>
  );
}
