// Devis : demandés (établissement) et reçus à chiffrer (intervenant).
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import { formatDate } from "../../../_shared/format";

export const metadata: Metadata = { title: "Devis" };

interface QuoteRow {
  id: string;
  reference: string;
  title: string;
  status: string;
  amount?: string | number | null;
  scheduledAt?: string | null;
  createdAt: string;
  clientAccountId: string;
  providerAccountId: string;
  clientAccount?: { name?: string | null } | null;
  providerAccount?: { name?: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "À chiffrer",
  SENT: "En attente de décision",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
};

function badgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACCEPTED") return "default";
  if (status === "REFUSED" || status === "EXPIRED") return "destructive";
  if (status === "SENT") return "secondary";
  return "outline";
}

const euros = (v: string | number | null | undefined) =>
  v == null ? "—" : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default async function DevisPage() {
  const session = await requireSession();
  const accountId = session.account.id;
  const res = await fetchApi<QuoteRow[]>(session, `/quotes?accountId=${accountId}`);

  if (res.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Devis" subtitle="Vos demandes et vos chiffrages." />
        <ErrorState message={res.error} />
      </div>
    );
  }

  const quotes = res.data ?? [];
  const aChiffrer = quotes.filter(
    (q) => q.providerAccountId === accountId && q.status === "REQUESTED",
  );
  const aDecider = quotes.filter(
    (q) => q.clientAccountId === accountId && q.status === "SENT",
  );
  const autres = quotes.filter((q) => !aChiffrer.includes(q) && !aDecider.includes(q));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Devis"
        subtitle="Un besoin spécifique se chiffre ici : demande, devis, acceptation — la réservation se crée toute seule."
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="Aucun devis pour l'instant"
          description="Depuis une fiche atelier ou formation, demandez un devis en un clic."
          action={
            <Button asChild>
              <Link href="/marketplace?type=services">Parcourir les ateliers</Link>
            </Button>
          }
        />
      ) : null}

      {aChiffrer.length > 0 ? (
        <QuoteList
          title="À chiffrer"
          hint="Ces établissements attendent votre proposition."
          quotes={aChiffrer}
          accountId={accountId}
        />
      ) : null}
      {aDecider.length > 0 ? (
        <QuoteList
          title="En attente de votre décision"
          hint="Devis reçus : à accepter ou à refuser."
          quotes={aDecider}
          accountId={accountId}
        />
      ) : null}
      {autres.length > 0 ? (
        <QuoteList title="Historique" quotes={autres} accountId={accountId} />
      ) : null}
    </div>
  );
}

function QuoteList({
  title,
  hint,
  quotes,
  accountId,
}: {
  title: string;
  hint?: string;
  quotes: QuoteRow[];
  accountId: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="space-y-3">
        {quotes.map((q) => {
          const isClient = q.clientAccountId === accountId;
          const contrepartie = isClient
            ? q.providerAccount?.name ?? "Intervenant"
            : q.clientAccount?.name ?? "Établissement";
          return (
            <Card key={q.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{q.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {q.reference} · {isClient ? "Pour" : "De"} {contrepartie}
                    {q.scheduledAt ? ` · ${formatDate(q.scheduledAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{euros(q.amount)}</span>
                  <Badge variant={badgeVariant(q.status)}>
                    {STATUS_LABEL[q.status] ?? q.status}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/devis/${q.id}`}>Ouvrir</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
