"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";

interface InvoiceListProps {
    invoices: any[];
}

export function InvoiceListWidget({ invoices }: InvoiceListProps) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const getStatusLabel = (status: string) => {
        if (status === "PAID") return "Payé";
        if (status === "UNPAID" || status === "PENDING_PAYMENT") return "Impayée";
        return status;
    };

    const getClientLabel = (invoice: any) => {
        const profile = invoice.booking?.establishment?.profile;
        if (profile?.companyName) return profile.companyName;

        const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
        if (fullName) return fullName;

        return invoice.booking?.establishment?.email ?? "Client";
    };

    const handleDownload = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        window.open(`${API_URL}/invoices/${id}/download`, '_blank');
    };

    if (invoices.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Aucune facture disponible.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                                {invoice.invoiceNumber || "En cours..."}
                            </TableCell>
                            <TableCell>
                                {new Date(invoice.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                {getClientLabel(invoice)}
                            </TableCell>
                            <TableCell>{invoice.amount.toFixed(2)} €</TableCell>
                            <TableCell>
                                <Badge variant={invoice.status === "PAID" ? "default" : "outline"} className={invoice.status === "PAID" ? "bg-green-600 hover:bg-green-700" : "text-amber-600 border-amber-600"}>
                                    {getStatusLabel(invoice.status)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={(e) => handleDownload(invoice.id, e)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    PDF
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
