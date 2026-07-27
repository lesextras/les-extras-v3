"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText } from "lucide-react";
import type { SerializedInvoice } from "@/actions/finance";
import { formatFinanceDate } from "@/lib/establishment-finance";

interface EstablishmentInvoicesWidgetProps {
    invoices: SerializedInvoice[];
    error?: string | null;
}

export function EstablishmentInvoicesWidget({ invoices, error }: EstablishmentInvoicesWidgetProps) {
    const handleExportCsv = () => {
        // Simple client-side CSV export
        const headers = ["Numero", "Date", "Freelance", "Montant", "Statut"];
        const rows = invoices.map(inv => [
            inv.invoiceNumber ?? inv.id,
            formatFinanceDate(inv.createdAt),
            getFreelanceName(inv),
            inv.amount + " €",
            inv.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "mes_factures.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground gap-3">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <div className="space-y-1">
                    <p className="font-medium text-foreground">Aucune facture disponible.</p>
                    <p className="text-sm">Les factures apparaîtront après les paiements autorisés.</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/finance">Voir l'espace finance</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-end mb-2">
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter CSV
                </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">N°</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Freelance</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.slice(0, 5).map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium text-xs">{invoice.invoiceNumber ?? invoice.id}</TableCell>
                                <TableCell className="text-xs">
                                    {formatFinanceDate(invoice.createdAt)}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {getFreelanceName(invoice)}
                                </TableCell>
                                <TableCell className="text-right text-xs font-medium">
                                    {invoice.amount.toFixed(2)} €
                                </TableCell>
                                <TableCell>
                                    {invoice.pdfUrl ? (
                                        <Button variant="ghost" size="icon" asChild title="Télécharger la facture">
                                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" title="Télécharger la facture">
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">Télécharger la facture</span>
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="icon" disabled title="Facture indisponible">
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">Facture indisponible</span>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
}

function getFreelanceName(invoice: SerializedInvoice) {
    const profile = invoice.booking?.freelance?.profile;
    const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();

    return fullName || profile?.companyName || "Freelance";
}
