// Vue catalogue PUBLIQUE réutilisable (ateliers / formations).
// Server Component : rendu sans JS client, filtres via <form method="GET">.
import Link from "next/link";
import {
  MapPin,
  Clock,
  Building2,
  Search,
  ArrowRight,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../_shared/server";
import { VisuelCarte } from "../_shared/VisuelCarte";
import { VignetteSansPhoto } from "../_shared/VignetteSansPhoto";
import { premierVisuel } from "@/lib/media";
import { FavoriteButton } from "../_shared/FavoriteButton";
import { PageHeader, EmptyState } from "../_shared/ui";
import { SERVICE_CATEGORY_LABEL, formatMoney } from "../_shared/format";
import { resumeTerritoire } from "@/lib/territoires";
import type { ServiceCategory } from "../_shared/types";

export interface CatalogItem {
  id: string;
  /** Adresse lisible de la fiche ; absente sur les fiches d'avant la bascule. */
  slug?: string | null;
  title: string;
  description: string;
  category: ServiceCategory;
  price?: string | number | null;
  duration?: string | null;
  city?: string | null;
  /** Départements couverts, en codes INSEE. Voir `lib/territoires.ts`. */
  departements?: string[] | null;
  images?: string[] | null;
  publicTargets?: string[] | null;
  publicTarget?: string | null;
  qualiopi?: boolean;
  verified?: boolean;
  rating?: number | null;
  reviewsCount?: number;
  categoryRef?: { id: string; title: string } | null;
  account?: {
    id: string;
    name: string;
    city?: string | null;
    logoUrl?: string | null;
  } | null;
}

interface CatalogResponse {
  items: CatalogItem[];
  total: number;
  take: number;
  skip: number;
  categories: string[];
  publics: string[];
  cities: string[];
  /** Territoires où il y a effectivement quelque chose, avec leur compte. */
  departements: { code: string; slug: string; nom: string; total: number }[];
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

/**
 * Une carte du catalogue — visuel, catégorie, durée, concepteur, lieu, public,
 * prix. Extraite de la grille pour pouvoir servir aussi bien étalée (résultats
 * filtrés) qu'en rangée qui défile (catalogue sans filtre).
 */
function CarteCatalogue({ item }: { item: CatalogItem }) {
  const organisme = item.account?.name;
  // ⚠ ON N'AFFICHE PLUS `city` TEL QUEL. Seize fiches sur dix-sept y avaient
  // écrit une RÉGION dans un champ nommé « ville » — la vignette annonçait donc
  // « Île-de-France » comme s'il s'agissait d'un lieu de rendez-vous. Le
  // territoire couvert dit ce qu'un directeur cherche : est-ce que ça vient
  // jusqu'à moi. `city` ne sert plus que de repli pour les fiches d'avant.
  const ville =
    resumeTerritoire(item.departements ?? []) ?? item.city ?? item.account?.city;
  return (
    <Card className="group card-interactive relative flex h-full flex-col overflow-hidden">
      {/* Le visuel d'abord : une fiche sans image ne se clique pas. */}
      <Link
        href={`/ateliers/${item.slug ?? item.id}`}
        className="relative block aspect-[16/10] bg-muted"
      >
        <VisuelCarte
          src={premierVisuel(item.images)}
          alt={item.title}
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        >
          {/* Sans photo, une vignette qui a l'air « en panne » ne se
      clique pas : on affiche une scène dessinée, propre à la fiche. */}
          <VignetteSansPhoto
            graine={item.slug ?? item.id ?? item.title}
            libelle={
              item.categoryRef?.title ?? SERVICE_CATEGORY_LABEL[item.category] ?? null
            }
          />
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
        <FavoriteButton
          serviceId={item.id}
          retour={`/ateliers/${item.slug ?? item.id}`}
        />
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
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {item.description}
        </p>

        <div className="mt-auto space-y-3 pt-2">
          <div className="space-y-1 text-sm text-muted-foreground">
            {organisme ? (
              <p className="flex items-center gap-1.5">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">{organisme}</span>
              </p>
            ) : null}
            {/* « Se déplace » et pas seulement le nom du territoire : sans le
                verbe, un directeur lit une adresse — le lieu où l'atelier se
                tiendrait — alors que c'est l'inverse qu'on lui dit. En
                présentiel, c'est l'intervenant qui vient à lui. */}
            {ville ? (
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <MapPin className="size-3.5 shrink-0 text-primary" />
                <span className="truncate">Se déplace : {ville}</span>
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
              <Link href={`/ateliers/${item.slug ?? item.id}`}>
                Voir
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
    departement?: string;
    priceMax?: string;
    sort?: string;
  };
}) {
  const search = searchParams?.search?.trim() ?? "";
  const category = searchParams?.category ?? "";
  const publicVise = searchParams?.public ?? "";
  const territoire = searchParams?.departement ?? "";
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
  if (territoire) qs.set("departement", territoire);
  if (budget) qs.set("priceMax", budget);
  if (tri) qs.set("sort", tri);

  const { data, error } = await fetchPublic<CatalogResponse>(
    `/public/catalog?${qs.toString()}`,
  );
  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const publics = data?.publics ?? [];
  /** Aucun critère actif : on peut proposer les entrées par expertise. */
  const filtree = Boolean(search || category || publicVise || territoire || budget);
  const territoires = data?.departements ?? [];
  const hasFilters = Boolean(
    search || category || publicVise || territoire || budget || tri,
  );

  // L'ALERTE DE RECHERCHE — le seul geste qui rend une visite sans résultat
  // utile. Sur dix-sept fiches, la plupart des recherches précises ne trouvent
  // rien ; sans ce lien, cette personne est perdue, car personne ne revient
  // vérifier un catalogue chaque semaine. Les critères qu'elle vient de saisir
  // voyagent dans l'adresse : lui redemander son besoin après qu'elle l'a
  // exprimé, c'est perdre la plupart de ceux qui ont cliqué. Le tri n'est pas
  // repris — il ordonne un résultat, il ne décrit pas un besoin.
  const qsAlerte = new URLSearchParams({ type });
  if (search) qsAlerte.set("recherche", search);
  if (category) qsAlerte.set("category", category);
  if (publicVise) qsAlerte.set("public", publicVise);
  if (territoire) qsAlerte.set("departement", territoire);
  const lienAlerte = `/dashboard/alertes?${qsAlerte.toString()}`;

  // PLUS DE RANGÉE « À LA UNE » — décision de Siham, 3 septembre 2026.
  //
  // Le catalogue s'ouvrait sur les cinq dernières fiches publiées dans une
  // rangée qui défile, puis affichait « tout le catalogue » en grille en
  // dessous. Deux raisons de l'avoir retirée, et elles se cumulent :
  //
  //  - le catalogue compte treize fiches. Une rangée de mise en avant n'a de
  //    sens que quand la grille est trop longue pour être parcourue ; sur
  //    treize entrées, elle coupe le catalogue en deux pour rien et fait
  //    passer les cinq premières DEUX fois moins visibles qu'en grille (la
  //    rangée n'en montre que deux à l'écran, derrière une flèche) ;
  //  - « à la une » n'était pas un choix éditorial, c'était l'ordre d'arrivée.
  //    Un libellé qui promet une sélection et livre un tri par date est une
  //    promesse creuse.
  //
  // Tout est désormais dans une seule grille, à la suite, filtre ou pas.

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
        {/* ⚠ CE FILTRE ÉTAIT LE PLUS DÉCEVANT DU SITE.
            Il listait les valeurs distinctes du champ « ville » saisi à la
            main : il proposait donc « Ile de France » ET « Île-de-France »
            comme deux lieux différents, l'un rendant 10 fiches et l'autre 3.
            Et « Créteil » ne pouvait rien rendre, alors que treize fiches
            annonçaient couvrir toute la région.
            Liste fermée, un département par entrée, avec ce qu'on y trouve. */}
        {territoires.length > 0 ? (
          <select
            name="departement"
            defaultValue={territoire}
            aria-label="Filtrer par département"
            className={`${inputClass} sm:w-52`}
          >
            <option value="">Partout en France</option>
            {territoires.map((d) => (
              <option key={d.code} value={d.slug}>
                {d.nom} ({d.total})
              </option>
            ))}
          </select>
        ) : null}
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
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button asChild size="sm">
                  <Link href={lienAlerte}>Me prévenir quand ça arrive</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={basePath}>Voir tout le catalogue</Link>
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Entrées rapides par expertise : repris du site historique, où l'on
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

          {/* UNE SEULE GRILLE, filtre ou pas. Quelqu'un qui vient de filtrer
            veut voir TOUS ses résultats ; quelqu'un qui arrive sans filtre
            veut voir tout le catalogue. Dans les deux cas, la même grille. */}
          <section>
            {!hasFilters ? (
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                  Tout le catalogue
                </h2>
                <span className="text-sm text-muted-foreground">
                  {items.length} proposition{items.length > 1 ? "s" : ""}
                </span>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <CarteCatalogue key={item.id} item={item} />
              ))}
            </div>

            {/* Une ligne, sous la grille, et seulement quand un filtre est
                actif : quelqu'un qui parcourt tout le catalogue n'a rien
                demandé de précis, on n'a donc rien à lui promettre. */}
            {hasFilters ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Ce n&apos;est pas tout à fait ce que vous cherchez ?{" "}
                <Link href={lienAlerte} className="font-medium text-foreground underline">
                  Recevez un message dès qu&apos;une nouvelle proposition correspond
                </Link>
                .
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
