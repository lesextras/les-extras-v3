// Facture imprimable (authentifié, hors AppShell).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { InvoiceDocument, type DocInvoice } from "../../../_shared/InvoiceDocument";

export const metadata: Metadata = { title: "Facture" };

export default async function FacturePage({ params }: { params: { invoiceId: string } }) {
  const session = await requireSession();

  // Route standard : facture du compte actif.
  let res = await fetchApi<DocInvoice>(session, `/invoices/${params.invoiceId}`);

  // L'admin plateforme consulte les factures de tous les comptes depuis
  // /admin/factures : l'endpoint scopé au compte actif renvoie alors 403.
  // On retente via la route d'administration, qui n'est pas limitée au compte.
  if (res.error && session.user.role === "ADMIN") {
    res = await fetchApi<DocInvoice>(session, `/admin/invoices/${params.invoiceId}`);
  }

  if (res.error || !res.data) notFound();
  return <InvoiceDocument invoice={res.data} />;
}
