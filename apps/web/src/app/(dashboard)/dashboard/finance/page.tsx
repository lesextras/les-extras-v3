// Finance : synthèse revenus/dépenses + liste des factures (PDF).
import type { Metadata } from "next";
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
import { requireSession, fetchApi } from "../../../_shared/server";
import { CheckoutButton } from "../../../_shared/BillingActions";
import { PageHeader, StatCard, EmptyState, ErrorState } from "../../../_shared/ui";
import {
  INVOICE_STATUS_LABEL,
  invoiceBadgeVariant,
  formatMoney,
  formatDate,
} from "../../../_shared/format";
import type { Invoice } from "../../../_shared/types";

export const metadata: Metadata = { title: "Finance" };

interface FinanceSummary {
  total?: number;
  paid?: number;
  pending?: number;
  invoiceCount?: number;
}

export default async function FinancePage() {
  const session = await requireSession();
  const isEstablishment = session.account.type === "ESTABLISHMENT";

  const [summary, invoices] = await Promise.all([
    fetchApi<FinanceSummary>(session, "/invoices/summary"),
    fetchApi<Invoice[]>(session, "/invoices?scope=account"),
  ]);

  const s = summary.data ?? {};

  return (
    <div className="space-y-8">
      <PageHeader
        title="Finance"
        subtitle={
          isEstablishment
            ? "Suivez vos dépenses de renforts et vos factures."
            : "Suivez vos revenus et téléchargez vos factures."
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={isEstablishment ? "Total dépensé" : "Total facturé"}
          value={formatMoney(s.total ?? 0)}
          accent="teal"
        />
        <StatCard label="Réglé" value={formatMoney(s.paid ?? 0)} accent="terracotta" />
        <StatCard label="En attente" value={formatMoney(s.pending ?? 0)} />
        <StatCard label="Factures" value={s.invoiceCount ?? invoices.data?.length ?? 0} />
      </div>


      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Factures</h2>
        {invoices.error ? (
          <ErrorState retryHref="/dashboard/finance" />
        ) : !invoices.data || invoices.data.length === 0 ? (
          <EmptyState
            title="Aucune facture"
            description="Vos factures seront générées automatiquement après chaque mission ou réservation confirmée."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Facture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.data.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.issuedAt ?? inv.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{formatMoney(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={invoiceBadgeVariant(inv.status)}>
                          {INVOICE_STATUS_LABEL[inv.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEstablishment && inv.status === "ISSUED" ? (
                            <CheckoutButton
                              accountId={session.account.id}
                              kind="invoice"
                              invoiceId={inv.id}
                              label="Payer en ligne"
                            />
                          ) : null}
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={`/documents/facture/${inv.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Télécharger la facture
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
