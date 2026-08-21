// Détail d'un devis : le besoin, le chiffrage, et l'action attendue selon le rôle.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, SectionTitle, ErrorState } from "../../../../_shared/ui";
import { QuoteEditor, QuoteDecision, type QuoteLine } from "../../../../_shared/QuotePanel";
import { DecompositionPrix } from "../../../../_shared/DecompositionPrix";
import { formatDate } from "../../../../_shared/format";

export const metadata: Metadata = { title: "Devis" };

interface Quote {
  id: string;
  reference: string;
  title: string;
  request?: string | null;
  message?: string | null;
  lines?: QuoteLine[] | null;
  amount?: string | number | null;
  totalHt?: string | number | null;
  totalTva?: string | number | null;
  acceptedByName?: string | null;
  acceptedByRole?: string | null;
  decidedAt?: string | null;
  status: string;
  scheduledAt?: string | null;
  validUntil?: string | null;
  refusalReason?: string | null;
  bookingId?: string | null;
  createdAt: string;
  clientAccount?: { name?: string | null } | null;
  providerAccount?: { name?: string | null } | null;
  service?: { id: string; title: string } | null;
  viewerIsClient: boolean;
  viewerIsProvider: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "À chiffrer",
  SENT: "En attente de décision",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
};

const euros = (v: string | number | null | undefined) =>
  v == null ? "—" : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default async function DevisDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const res = await fetchApi<Quote>(session, `/quotes/${params.id}`);
  if (res.error) {
    if (/introuvable|not found/i.test(res.error)) notFound();
    return (
      <div className="space-y-6">
        <PageHeader title="Devis" />
        <ErrorState description={res.error} />
      </div>
    );
  }
  const q = res.data!;
  const lines = Array.isArray(q.lines) ? q.lines : [];
  const soumisTva = lines.some((l) => Number(l.vatRate ?? 0) > 0);
  // Les devis anterieurs a la structuration n'ont pas de totaux separes en
  // base : la TVA y valait zero pour tout le monde, donc le hors taxes egalait
  // le total. On retombe dessus plutot que d'afficher un vide.
  const totalHt = q.totalHt != null ? Number(q.totalHt) : Number(q.amount ?? 0);
  const totalTva = q.totalTva != null ? Number(q.totalTva) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={q.title}
        subtitle={`${q.reference} · ${
          q.viewerIsClient
            ? `Intervenant : ${q.providerAccount?.name ?? "—"}`
            : `Établissement : ${q.clientAccount?.name ?? "—"}`
        }`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={q.status === "ACCEPTED" ? "default" : "secondary"}>
          {STATUS_LABEL[q.status] ?? q.status}
        </Badge>
        {/* LE DOCUMENT. C'est le devis signe qui contractualise, pas la
            facture : un directeur ne debloque pas une depense sur un ecran,
            il lui faut la piece a porter a son conseil ou a son financeur. */}
        {q.status !== "REQUESTED" ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/api/proxy/documents/devis/${q.id}.pdf`} target="_blank">
              Télécharger le devis (PDF)
            </Link>
          </Button>
        ) : null}
        {q.scheduledAt ? (
          <span className="text-sm text-muted-foreground">
            Intervention : {formatDate(q.scheduledAt)}
          </span>
        ) : null}
        {q.validUntil ? (
          <span className="text-sm text-muted-foreground">
            Valable jusqu&apos;au {formatDate(q.validUntil)}
          </span>
        ) : null}
      </div>

      {q.request ? (
        <section className="space-y-2">
          <SectionTitle>Besoin exprimé</SectionTitle>
          <Card>
            <CardContent className="whitespace-pre-wrap p-4 text-sm text-foreground">
              {q.request}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {lines.length > 0 ? (
        <section className="space-y-2">
          <SectionTitle>Chiffrage</SectionTitle>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Prestation</th>
                    <th className="p-3 font-medium">Qté</th>
                    <th className="p-3 font-medium">Unité</th>
                    <th className="p-3 font-medium">P.U. HT</th>
                    {soumisTva ? <th className="p-3 font-medium">TVA</th> : null}
                    <th className="p-3 text-right font-medium">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className="p-3 text-foreground">{l.label}</td>
                      <td className="p-3 text-muted-foreground">{l.quantity}</td>
                      <td className="p-3 text-muted-foreground">{l.unit ?? "forfait"}</td>
                      <td className="p-3 text-muted-foreground">{euros(l.unitPrice)}</td>
                      {soumisTva ? (
                        <td className="p-3 text-muted-foreground">
                          {String(Number(l.vatRate ?? 0)).replace(".", ",")} %
                        </td>
                      ) : null}
                      <td className="p-3 text-right font-medium text-foreground">
                        {euros(Number(l.quantity) * Number(l.unitPrice))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30">
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={soumisTva ? 5 : 4}>
                      Total hors taxes
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {euros(totalHt)}
                    </td>
                  </tr>
                  {soumisTva ? (
                    <tr>
                      <td className="p-3 text-muted-foreground" colSpan={5}>
                        TVA
                      </td>
                      <td className="p-3 text-right font-medium text-foreground">
                        {euros(totalTva)}
                      </td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-border">
                    <td
                      className="p-3 font-semibold text-foreground"
                      colSpan={soumisTva ? 5 : 4}
                    >
                      Total à régler
                    </td>
                    <td className="p-3 text-right text-lg font-bold text-foreground">
                      {euros(q.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              {!soumisTva ? (
                <p className="border-t border-border p-3 text-xs text-muted-foreground">
                  TVA non applicable, article 293 B du code général des impôts.
                </p>
              ) : null}
            </CardContent>
          </Card>
          <DecompositionPrix
            tarifIntervenant={Number(q.amount ?? 0)}
            vue={q.viewerIsClient ? "etablissement" : "intervenant"}
          />
          {q.message ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{q.message}</p>
          ) : null}
        </section>
      ) : null}

      {/* ── Action attendue ───────────────────────────────────────────────── */}
      {q.viewerIsProvider && ["REQUESTED", "SENT"].includes(q.status) ? (
        <section className="space-y-3">
          <SectionTitle>
            {q.status === "REQUESTED" ? "Chiffrer ce devis" : "Modifier et renvoyer"}
          </SectionTitle>
          <Card>
            <CardContent className="p-5">
              <QuoteEditor
                quoteId={q.id}
                initialLines={lines}
                initialMessage={q.message}
                initialScheduledAt={q.scheduledAt}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {q.viewerIsClient && q.status === "SENT" ? (
        <section className="space-y-3">
          <SectionTitle>Votre décision</SectionTitle>
          <Card>
            <CardContent className="p-5">
              <QuoteDecision quoteId={q.id} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {q.status === "ACCEPTED" ? (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-sm text-foreground">
              <p>Devis accepté — la prestation est confirmée et la réservation créée.</p>
              {q.acceptedByName ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Bon pour accord donné par {q.acceptedByName}
                  {q.acceptedByRole ? `, ${q.acceptedByRole}` : ""}
                  {q.decidedAt ? ` le ${formatDate(q.decidedAt)}` : ""}.
                </p>
              ) : null}
            </div>
            {q.bookingId ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/documents/contrat/${q.bookingId}`} target="_blank">
                  Voir le contrat
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {q.status === "REFUSED" ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Devis non retenu{q.refusalReason ? ` — ${q.refusalReason}` : ""}.
          </CardContent>
        </Card>
      ) : null}

      {q.viewerIsClient && q.status === "REQUESTED" ? (
        <p className="text-sm text-muted-foreground">
          Demande transmise. L&apos;intervenant vous enverra son chiffrage ; vous
          serez prévenu dès réception.
        </p>
      ) : null}
    </div>
  );
}
