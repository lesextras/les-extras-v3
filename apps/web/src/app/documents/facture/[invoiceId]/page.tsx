// Facture imprimable (authentifié, hors AppShell).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { InvoiceDocument, type DocInvoice } from "../../../_shared/InvoiceDocument";

export const metadata: Metadata = { title: "Facture" };

export default async function FacturePage({ params }: { params: { invoiceId: string } }) {
  const session = await requireSession();
  const res = await fetchApi<DocInvoice>(session, `/invoices/${params.invoiceId}`);
  if (res.error || !res.data) notFound();
  return <InvoiceDocument invoice={res.data} />;
}
