// Catalogue des formations certifiantes (ADéPA) — authentifié.
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Formations certifiantes" };

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
        subtitle="Catalogue ADéPA — organisme certifié Qualiopi. Inscrivez vos salariés, financement CPF ou OPCO possible."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/formations">Mes formations</Link>
          </Button>
        }
      />

      {/* Bandeau de réassurance / positionnement */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Badge variant="soft">Qualiopi</Badge> Formateurs experts du secteur médico-social
        </span>
        <span className="hidden text-border sm:inline">•</span>
        <span>Éligible CPF · Émargement dématérialisé · Certificat délivré</span>
      </div>

      <form method="GET" className="flex flex-wrap items-center gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Rechercher une formation (thème, mot-clé…)"
          className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" variant="outline" size="sm">
          Rechercher
        </Button>
        {search ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/marketplace/formations">Réinitialiser</Link>
          </Button>
        ) : null}
      </form>

      {res.error ? (
        <ErrorState retryHref="/marketplace/formations" />
      ) : items.length === 0 ? (
        <EmptyState
          title={search ? "Aucun résultat" : "Catalogue en préparation"}
          description={
            search
              ? "Aucune formation ne correspond à votre recherche. Essayez un autre mot-clé."
              : "Aucune formation certifiante publiée pour le moment. Vous pouvez aussi former vos équipes en interne."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/formations">Former mes équipes en interne</Link>
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {items.length} formation{items.length > 1 ? "s" : ""} disponible{items.length > 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((f) => {
              const sessions = f._count?.sessions ?? 0;
              return (
                <Link key={f.id} href={`/marketplace/formations/${f.id}`} className="group block h-full">
                  <Card className="flex h-full flex-col transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card">
                    <CardContent className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="soft">Certifiante</Badge>
                        {f.cpfEligible ? <Badge>CPF</Badge> : null}
                        {f.categoryRef?.title ? <Badge variant="outline">{f.categoryRef.title}</Badge> : null}
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary">{f.title}</h3>
                      {f.summary ? (
                        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{f.summary}</p>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>
                          {f.ownerAccount?.name ?? "ADéPA"}
                          {f.durationHours ? ` · ${f.durationHours} h` : ""}
                        </span>
                        {sessions > 0 ? (
                          <Badge variant="success">
                            {sessions} session{sessions > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <Badge variant="muted">Sur demande</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
