import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getInvoices } from "@/actions/finance";
import { RevenueOverviewWidget } from "@/components/finance/RevenueOverviewWidget";
import { InvoiceListWidget } from "@/components/finance/InvoiceListWidget";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
    const session = await getSession();

    if (!session || session.user.role !== "FREELANCE") {
        redirect("/dashboard");
    }

    let invoices: Awaited<ReturnType<typeof getInvoices>> = [];
    let loadError: string | null = null;

    try {
        invoices = await getInvoices();
    } catch {
        loadError = "Impossible de charger vos factures pour le moment.";
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <p className="text-overline uppercase tracking-widest text-muted-foreground">Espace Freelance</p>
                    <h1 className="font-display text-heading-xl tracking-tight">Mes Finances</h1>
                    <p className="text-body-md text-muted-foreground">Suivez vos revenus et factures.</p>
                </div>
            </div>

            {loadError && (
                <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                    {loadError}
                </div>
            )}

            <RevenueOverviewWidget invoices={invoices} />

            <div className="space-y-3">
                <h2 className="text-heading-md font-display">Historique des factures</h2>
                <InvoiceListWidget invoices={invoices} />
            </div>
        </div>
    );
}
