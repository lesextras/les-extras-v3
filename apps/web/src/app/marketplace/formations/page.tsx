// Catalogue des formations certifiantes (ADéPA) — authentifié.
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Formations · Les Extras" };

interface FormationItem {
  id: string;
  title: string;
  summary?: string | null;
  type: "CERTIFIANTE" | "INTERNE";
  durationHours?: number | null;
  cpfEligible?: boolean;
  certifying?: boolean;
  ownerAccount?: { name?: string | null; city?: string | null } | null;
  categoryRef?: { title?: string | null } | null;
  _count?: { sessions?: number };
}

export default async function MarketplaceFormationsPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const session = await requireSession();
  const search = searchParams?.search?.trim();
  const q = new URLSearchParams({ type: "CERTIFIANTE" });
  if (search) q.set("search", search);
  const res = await fetchApi<{ items?: FormationItem[] }>(session, `/formations/catalog?${q.toString()}`);
  const items = res.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formations certifiantes"
        subtitle="Catalogue ADéPA — organisme certifié Qualiopi. Inscrivez vos salariés."
      />

      <form method="GET" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Rechercher une formation…"
          className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </form>

      {res.error ? (
        <ErrorState retryHref="/marketplace/formations" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Catalogue en préparation"
          description="Aucune formation publiée pour le moment. Revenez bientôt."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <Link key={f.id} href={`/marketplace/formations/${f.id}`}>
              <Card className="h-full transition hover:border-primary/40">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap gap-2">
                    {f.certifying ? <Badge variant="soft">Certifiante</Badge> : null}
                    {f.cpfEligible ? <Badge>CPF</Badge> : null}
                    {f.categoryRef?.title ? <Badge variant="outline">{f.categoryRef.title}</Badge> : null}
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  {f.summary ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{f.summary}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {f.ownerAccount?.name ?? "ADéPA"}
                    {f.durationHours ? ` · ${f.durationHours} h` : ""}
                    {f._count?.sessions ? ` · ${f._count.sessions} session(s)` : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
