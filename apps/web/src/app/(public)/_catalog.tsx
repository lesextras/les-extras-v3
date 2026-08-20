// Vue catalogue PUBLIQUE réutilisable (ateliers / formations).
// Server Component : rendu sans JS client, filtres via <form method="GET">.
import Link from "next/link";
import { MapPin, Clock, Building2, Search, ArrowRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../_shared/server";
import { VisuelCarte } from "../_shared/VisuelCarte";
import { premierVisuel } from "@/lib/media";
import { FavoriteButton } from "../_shared/FavoriteButton";
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
  images?: string[] | null;
  publicTargets?: string[] | null;
  publicTarget?: string | null;
  qualiopi?: boolean;
  verified?: boolean;
  rating?: number | null;
  reviewsCount?: number;
  categoryRef?: { id: string; title: string } | null;
  account?: { id: string; name: string; city?: string | null; logoUrl?: string | null } | null;
}

interface CatalogResponse {
  items: CatalogItem[];
  total: number;
  take: number;
  skip: number;
  categories: string[];
  publics: string[];
  cities: string[];
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
  searchParams?: {
    search?: string;
    category?: string;
    public?: string;
    city?: string;
    priceMax?: string;
    sort?: string;
  };
}) {
  const search = searchParams?.search?.trim() ?? "";
  const category = searchParams?.category ?? "";
  const publicVise = searchParams?.public ?? "";
  const ville = searchParams?.city ?? "";
  const budget = searchParams?.priceMax ?? "";
  const tri = searchParams?.sort ?? "";

  // LES FAVORIS NE SONT PLUS LUS ICI. Ils l'étaient depuis la session, et
  // cette seule lecture de cookie rendait tout le catalogue non cachable — la
  // page la plus lourde du site (188 Ko, 0,9 s de temps de réponse) recalculée
  // à chaque visite pour allumer trois cœurs. `FavoriteButton` lit désormais
  // son propre état depuis `/api/visiteur`, après l'affichage.

  const qs = new URLSearchParams({ type, take: "60" });
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  if (publicVise) qs.set("public", publicVise);
  if (ville) qs.set("city", ville);
  if (budget) qs.set("priceMax", budget);
  if (tri) qs.set("sort", tri);

  const { data, error } = await fetchPublic<CatalogResponse>(`/public/catalog?${qs.toString()}`);
  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const publics = data?.publics ?? [];
  /** Aucun critère actif : on peut proposer les entrées par expertise. */
  const filtree = Boolean(search || category || publicVise || ville || budget);
  const cities = data?.cities ?? [];
  const hasFilters = Boolean(search || category || publicVise || ville || budget || tri);

  return (
    <div className="space-y-8">
      <PageHeader title={title} subtitle={subtitle} />

      {/* Barre de recherche + filtre catégorie (navigation GET, sans JS) */}
      <form
        method="GET"
        action={basePath}
        className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 sm:flex-row sm:flex-wrap sm:items-center"
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
        <select
          name="public"
          defaultValue={publicVise}
          aria-label="Filtrer par public visé"
          className={`${inputClass} sm:w-44`}
        >
          <option value="">Tous les publics</option>
          {publics.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          name="city"
          defaultValue={ville}
          aria-label="Filtrer par lieu"
          className={`${inputClass} sm:w-40`}
        >
          <option value="">Partout</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="priceMax"
          min={0}
          step={50}
          defaultValue={budget}
          placeholder="Budget max €"
          aria-label="Budget maximum"
          className={`${inputClass} sm:w-36`}
        />
        <select
          name="sort"
          defaultValue={tri}
          aria-label="Trier"
          className={`${inputClass} sm:w-44`}
        >
          <option value="">Plus récents</option>
          <option value="rating">Mieux notés</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
        </select>
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
        <>
        {/* Entrées rapides par expertise — repris du site historique, où l'on
            cherchait d'abord « pour qui » puis « comment ». */}
        {!filtree && (publics.length > 0 || categories.length > 0) ? (
          <div className="grid gap-5 md:grid-cols-2">
            {publics.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Expert d’un public
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {publics.map((pu) => (
                    <Link
                      key={pu}
                      href={`?public=${encodeURIComponent(pu)}`}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft"
                    >
                      {pu}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {categories.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Expert d’une technique
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Link
                      key={c}
                      href={`?category=${encodeURIComponent(c)}`}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const organisme = item.account?.name;
            const ville = item.city ?? item.account?.city;
            return (
              <Card key={item.id} className="group card-interactive relative flex h-full flex-col overflow-hidden">
                {/* Le visuel d'abord : une fiche sans image ne se clique pas. */}
                <Link href={`/ateliers/${item.id}`} className="relative block aspect-[16/10] bg-muted">
                  <VisuelCarte
                    src={premierVisuel(item.images)}
                    alt={item.title}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  >
                    {/* Sans photo, une vignette qui a l'air « en panne » ne se
                        clique pas : on affiche un visuel intentionnel — dégradé
                        de marque + catégorie de la fiche. */}
                    <span className="grid h-full place-items-center bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/20">
                      <span className="flex flex-col items-center gap-1.5 text-center">
                        <Star className="size-6 text-primary/70" aria-hidden />
                        <span className="px-4 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                          {item.categoryRef?.title ?? SERVICE_CATEGORY_LABEL[item.category] ?? "Les Extras"}
                        </span>
                      </span>
                    </span>
                  </VisuelCarte>
                  {item.categoryRef?.title ? (
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {item.categoryRef.title}
                    </span>
                  ) : null}
                </Link>

                {/* Le cœur est hors du lien : cliquer « mettre de côté » ne doit
                    pas ouvrir la fiche. */}
                <div className="absolute right-3 top-3 z-10">
                  <FavoriteButton serviceId={item.id} retour={`/ateliers/${item.id}`} />
                </div>
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
                      {(item.publicTargets?.length ?? 0) > 0 ? (
                        <p className="line-clamp-1">
                          <span className="font-medium">Public :</span>{" "}
                          {item.publicTargets!.join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-base font-semibold text-foreground">
                          {formatMoney(item.price)}
                        </span>
                        {item.rating ? (
                          <span className="inline-flex items-center gap-0.5 text-sm text-muted-foreground">
                            <Star className="size-3.5 fill-current text-amber-500" />
                            {item.rating.toFixed(1)}
                          </span>
                        ) : null}
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
        </>
      )}
    </div>
  );
}
