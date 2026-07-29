// Facture officielle imprimable (A4) — présentationnelle.
// Rendu serveur, bouton d'impression client (PrintButton → window.print).
import { PrintButton } from "./PrintButton";
import { INVOICE_STATUS_LABEL } from "./format";

export interface DocInvoice {
  id: string;
  number: string;
  amount: string | number;
  status: string;
  issuedAt?: string | null;
  createdAt: string;
  account?: {
    name?: string | null;
    legalName?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    siret?: string | null;
  } | null;
  booking?: {
    service?: { title?: string | null } | null;
    mission?: { title?: string | null } | null;
  } | null;
}

const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function money(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return EUR.format(n);
}

function fmt(d?: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function InvoiceDocument({ invoice }: { invoice: DocInvoice }) {
  const acc = invoice.account;
  const clientName = acc?.legalName || acc?.name || "Client";
  const lineLabel =
    invoice.booking?.service?.title ||
    invoice.booking?.mission?.title ||
    "Prestation Les Extras";
  const dateLabel = fmt(invoice.issuedAt ?? invoice.createdAt);
  // Association ADéPA : non assujettie à la TVA (art. 293 B du CGI).
  const totalLabel = money(invoice.amount);

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <a href="/dashboard/facturation?vue=factures" className="text-sm text-neutral-600 hover:underline">
          ← Retour à la finance
        </a>
        <PrintButton label="Imprimer / Enregistrer en PDF" />
      </div>

      {/* Feuille A4 */}
      <div className="mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white px-16 py-14 shadow-lg print:min-h-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-neutral-200 pb-6">
          <div>
            <p className="text-lg font-bold tracking-tight text-neutral-900">ADéPA — Les Extras</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Association ADéPA<br />
              Plateforme Les Extras<br />
              contact@adepa77.fr
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-neutral-400">Facture</p>
            <p className="mt-1 text-base font-semibold text-neutral-900">{invoice.number}</p>
            <p className="text-xs text-neutral-500">Émise le {dateLabel}</p>
            <p className="mt-1 text-[11px] font-medium text-neutral-500">
              {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
            </p>
          </div>
        </header>

        {/* Destinataire */}
        <section className="mt-8 flex justify-end">
          <div className="w-1/2 rounded-lg bg-neutral-50 p-4 text-sm">
            <p className="text-[11px] uppercase tracking-widest text-neutral-400">Facturé à</p>
            <p className="mt-1 font-semibold text-neutral-900">{clientName}</p>
            {acc?.address ? <p className="text-neutral-600">{acc.address}</p> : null}
            {acc?.postalCode || acc?.city ? (
              <p className="text-neutral-600">
                {[acc?.postalCode, acc?.city].filter(Boolean).join(" ")}
              </p>
            ) : null}
            {acc?.siret ? <p className="mt-1 text-xs text-neutral-500">SIRET : {acc.siret}</p> : null}
          </div>
        </section>

        {/* Lignes */}
        <section className="mt-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-widest text-neutral-400">
                <th className="pb-2 font-medium">Désignation</th>
                <th className="pb-2 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100">
                <td className="py-3 text-neutral-800">{lineLabel}</td>
                <td className="py-3 text-right font-medium text-neutral-900">{totalLabel}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-1/2 space-y-1 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Total net</span>
                <span>{totalLabel}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
                <span>Total à régler</span>
                <span>{totalLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto border-t border-neutral-200 pt-6 text-[11px] leading-relaxed text-neutral-500">
          <p>TVA non applicable, art. 293 B du CGI — Association ADéPA.</p>
          <p>
            Règlement à réception de facture. En cas de retard de paiement, des pénalités sont
            exigibles conformément à la réglementation en vigueur.
          </p>
          <p className="mt-2 text-neutral-400">
            Document généré par la plateforme Les Extras — {invoice.number}.
          </p>
        </footer>
      </div>
    </div>
  );
}
