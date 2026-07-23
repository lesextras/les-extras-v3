// Back-office ADMIN — factures : supervision globale (GET /admin/invoices).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState, EmptyState } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INVOICE_STATUS_LABEL, invoiceBadgeVariant, formatMoney, formatDate } from "../../../_shared/format";
import { InvoiceStatusActions } from "../../../_shared/AdminActions";

export const metadata: Metadata = { title: "Factures · Administration" };

interface AdminInvoice {
  id: string;
  number: string;
  amount: string | number;
  status: string;
  pdfUrl?: string | null;
  issuedAt?: string | null;
  createdAt: string;
  account?: { name?: string; type?: string } | null;
}

export default async function AdminFacturesPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AdminInvoice[]>(session, "/admin/invoices");
  const invoices = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures"
        subtitle="Toutes les factures émises sur la plateforme."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/factures" />
      ) : invoices.length === 0 ? (
        <EmptyState title="Aucune facture" description="Aucune facture n’a encore été émise." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm font-medium text-foreground">{inv.number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.account?.name ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatMoney(inv.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoiceBadgeVariant(inv.status)}>
                          {INVOICE_STATUS_LABEL[inv.status] ?? inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(inv.issuedAt ?? inv.createdAt)}
                      </TableCell>
                      <TableCell>
                        {inv.pdfUrl ? (
                          <a href={inv.pdfUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline">Télécharger</Button>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusActions invoiceId={inv.id} status={inv.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
