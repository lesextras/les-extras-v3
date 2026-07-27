"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet } from "lucide-react";

interface RevenueOverviewProps {
    invoices: any[];
}

export function RevenueOverviewWidget({ invoices }: RevenueOverviewProps) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthInvoices = invoices.filter(inv => {
        const d = new Date(inv.booking?.scheduledAt ?? inv.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalRevenue = currentMonthInvoices
        .filter(inv => inv.status === "PAID")
        .reduce((acc, inv) => acc + inv.amount, 0);

    const pendingRevenue = invoices
        .filter(inv => inv.status === "UNPAID")
        .reduce((acc, inv) => acc + inv.amount, 0);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Chiffre d'affaires (Ce mois)
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} €</div>
                    <p className="text-xs text-muted-foreground">
                        Encaissé sur {currentMonthInvoices.filter(i => i.status === "PAID").length} facture{currentMonthInvoices.filter(i => i.status === "PAID").length > 1 ? "s" : ""}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        En attente d'encaissement
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{pendingRevenue.toFixed(2)} €</div>
                    <p className="text-xs text-muted-foreground">
                        {invoices.filter(inv => inv.status === "UNPAID").length} facture{invoices.filter(inv => inv.status === "UNPAID").length > 1 ? "s" : ""} en attente
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
