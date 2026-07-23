// Vue catalogue PUBLIQUE réutilisable (ateliers / formations).
// Server Component : rendu sans JS client, filtres via <form method="GET">.
import Link from "next/link";
import { MapPin, Clock, Building2, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../_shared/server";
import { PageHeader, EmptyState } from "../_shared/ui";
import { SERVICE_CATEGORY_LABEL, formatMoney } from "../_shared/format";
import type { ServiceCategory } from "../_shared/types";

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  price?: string | number | null;
  duration?: string | null;
  city?: string | null;
  categoryRef?: { id: string; title: string } | null;
  account?: { id: string; name: string; city?: string | null; logoUrl?: string | null } | null;
}

interface CatalogResponse {
  items: CatalogItem[];
  total: number;
  take: number;
  skip: number;
  categories: string[];
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export async function CatalogView({
  type,
  basePath,
  title,
  subtitle,
  searchPlaceholder,
  emptyTitle,
  searchParams,
}: {
  /** "atelier" | "formation" (filtre côté API). */
  type: "atelier" | "formation";
  /** Base d'URL de la page (ex. "/ateliers"). */
  basePath: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyTitle: string;
  searchParams?: { search?: string; category?: string };
}) {
  const search = searchParams?.search?.trim() ?? "";
  const category = searchParams?.category ?? "";

  const qs = new URLSearchParams({ type });
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);

  const { data, error } = await fetchPublic<CatalogResponse>(`/public/catalog?${qs.toString()}`);
  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const hasFilters = Boolean(search || category);

  return (
    <div className="space-y-8">
      <PageHeader title={title} subtitle={subtitle} />

      {/* Barre de recherche + filtre catégorie (navigation GET, sans JS) */}
      <form
        method="GET"
        action={basePath}
        className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder={searchPlaceholder}
            aria-label="Rechercher"
            className={`${inputClass} pl-10`}
          />
        </div>
        {categories.length > 0 ? (
          <select
            name="category"
            defaultValue={category}
            aria-label="Filtrer par catégorie"
            className={`${inputClass} sm:w-56`}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit">Rechercher</Button>
          {hasFilters ? (
            <Button asChild variant="ghost">
              <Link href={basePath}>Réinitialiser</Link>
            </Button>
          ) : null}
        </div>
      </form>

      {error ? (
        <EmptyState
          title="Catalogue momentanément indisponible"
          description="Réessayez dans quelques instants."
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={
            hasFilters
              ? "Aucun résultat pour ces critères. Essayez une autre recherche."
              : "De nouvelles propositions arriveront ici prochainement."
          }
          action={
            hasFilters ? (
              <Button asChild variant="outline" size="sm">
                <Link href={basePath}>Voir tout le catalogue</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const organisme = item.account?.name;
            const ville = item.city ?? item.account?.city;
            return (
              <Card key={item.id} className="group card-interactive flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="soft">
                      {item.categoryRef?.title ?? SERVICE_CATEGORY_LABEL[item.category]}
                    </Badge>
                    {item.duration ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {item.duration}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-lg font-semibold leading-snug text-foreground">
                    {item.title}
                  </h3>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.description}</p>

                  <div className="mt-auto space-y-3 pt-2">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {organisme ? (
                        <p className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 shrink-0" />
                          <span className="truncate">{organisme}</span>
                        </p>
                      ) : null}
                      {ville ? (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{ville}</span>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-base font-semibold text-foreground">
                        {formatMoney(item.price)}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/ateliers/${item.id}`}>
                          Voir
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
