// Catalogue PUBLIC des formations (vraies formations, pas des ateliers).
import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock, MapPin, Search, ArrowRight, ShieldCheck, CalendarClock, GraduationCap, Building2, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../_shared/server";
import { VisuelCarte } from "../../_shared/VisuelCarte";
import { premierVisuel } from "@/lib/media";
import { PageHeader, EmptyState } from "../../_shared/ui";
import { formatMoney, formatDate } from "../../_shared/format";

import { metaPublique } from "@/lib/meta";
export const metadata: Metadata = metaPublique({
  title: "Formations Qualiopi pour le médico-social",
  description:
    "Formations pour les professionnels du médico-social : analyse des pratiques, prévention, spécialisations métier. Certifiées Qualiopi, finançables OPCO.",
  path: "/formations",
});

export interface FormationCard {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  objectives?: string | null;
  durationHours?: number | null;
  /** Durée en minutes, pour ce qui dure moins d'une heure (mini-formations). */
  durationMinutes?: number | null;
  publicTargets?: string[] | null;
  type?: "CERTIFIANTE" | "INTERNE";
  certifying?: boolean;
  cpfEligible?: boolean;
  images?: string[] | null;
  city?: string | null;
  categoryRef?: { id: string; title: string } | null;
  account?: { id: string; name: string; logoUrl?: string | null } | null;
  priceFrom?: string | number | null;
  nextSessionAt?: string | null;
  /** Mini-formation en ligne et gratuite : ni devis, ni session, ni prix. */
  freeOnline?: boolean;
  /** Adresse où la formation se suit réellement (plateforme pédagogique). */
  enrollUrl?: string | null;
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

type Filtres = {
  search?: string;
  category?: string;
  public?: string;
  organisme?: string;
  city?: string;
  cpf?: string;
  certifying?: string;
  priceMax?: string;
  sort?: string;
};

/**
 * LES FORMATIONS DE LA MAISON, D'ABORD.
 *
 * Le catalogue accueillera des formations conçues par des organismes du
 * réseau. Celles que l'association écrit et tient elle-même n'ont pas à se
 * perdre au milieu : ce sont les seules dont on répond de la ligne à la ligne,
 * et ce sont les seules gratuites. Elles portent donc une marque visible et
 * remontent en tête — sans jamais masquer les autres, qui restent dans la même
 * grille et les mêmes filtres.
 *
 * Le test porte sur le nom du compte propriétaire, seule donnée disponible ici.
 * Le jour où un second organisme s'appellerait « ADéPA quelque chose », il
 * faudra un drapeau en base ; d'ici là, une constante suffit et se lit.
 */
const ORGANISME_MAISON = "ADéPA";
const estMaison = (f: FormationCard) => Boolean(f.account?.name?.startsWith(ORGANISME_MAISON));

/** « 45 min » ou « 7 h » — on affiche celui des deux champs qui est rempli. */
function dureeLisible(f: FormationCard): string | null {
  if (f.durationHours) return `${f.durationHours} h`;
  if (f.durationMinutes) return `${f.durationMinutes} min`;
  return null;
}

export default async function FormationsCatalogPage({
  searchParams: searchParamsPromesse,
}: {
  searchParams?: Promise<Filtres>;
}) {
  const searchParams = await searchParamsPromesse;
  const qs = new URLSearchParams();
  for (const cle of ["search", "category", "public", "organisme", "city", "priceMax", "sort"] as const) {
    const v = searchParams?.[cle];
    if (v) qs.set(cle, v);
  }
  if (searchParams?.cpf === "true") qs.set("cpf", "true");
  if (searchParams?.certifying === "true") qs.set("certifying", "true");
  qs.set("take", "60");

  const { data, error } = await fetchPublic<{
    items: FormationCard[];
    total: number;
    categories: string[];
    cities: string[];
    publics: string[];
    organismes: string[];
  }>(`/public/formations?${qs.toString()}`);

  const categories = data?.categories ?? [];
  const cities = data?.cities ?? [];
  const publics = data?.publics ?? [];
  const organismes = data?.organismes ?? [];
  const filtree = Boolean(
    searchParams?.search ||
      searchParams?.category ||
      searchParams?.public ||
      searchParams?.organisme ||
      searchParams?.city ||
      searchParams?.priceMax ||
      searchParams?.cpf ||
      searchParams?.certifying,
  );

  // Les formations de la maison remontent, sans changer l'ordre à l'intérieur
  // de chaque groupe : le tri demandé par le visiteur reste celui de l'API.
  const items = [...(data?.items ?? [])].sort(
    (a, b) => Number(estMaison(b)) - Number(estMaison(a)),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nos formations"
        subtitle="Montez en compétences avec des formations pensées pour le médico-social : analyse des pratiques, prévention, spécialisations métier. Certification Qualiopi portée par ADéPA — finançables OPCO."
      />

      <form method="GET" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="search"
              defaultValue={searchParams?.search ?? ""}
              placeholder="Rechercher une formation…"
              className={`${inputClass} pl-9`}
              aria-label="Rechercher une formation"
            />
          </div>
          <Button type="submit" className="sm:w-auto">
            Filtrer
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length > 0 ? (
            <select
              name="category"
              defaultValue={searchParams?.category ?? ""}
              className={inputClass}
              aria-label="Filtrer par thématique"
            >
              <option value="">Toutes les thématiques</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : null}

          {/* « Pour qui » avant « quoi » : sur le catalogue des ateliers, c'est
              l'entrée la plus utilisée. Elle manquait ici. */}
          {publics.length > 0 ? (
            <select
              name="public"
              defaultValue={searchParams?.public ?? ""}
              className={inputClass}
              aria-label="Filtrer par public visé"
            >
              <option value="">Tous les publics</option>
              {publics.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : null}

          {/* Un seul organisme aujourd'hui : le filtre n'apparaît qu'à partir
              du deuxième, sinon c'est une liste à un seul choix. */}
          {organismes.length > 1 ? (
            <select
              name="organisme"
              defaultValue={searchParams?.organisme ?? ""}
              className={inputClass}
              aria-label="Filtrer par organisme concepteur"
            >
              <option value="">Tous les organismes</option>
              {organismes.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : null}

          {cities.length > 0 ? (
            <select
              name="city"
              defaultValue={searchParams?.city ?? ""}
              className={inputClass}
              aria-label="Filtrer par ville"
            >
              <option value="">Toutes les villes</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : null}

          <input
            type="number"
            name="priceMax"
            min={0}
            step={50}
            defaultValue={searchParams?.priceMax ?? ""}
            placeholder="Budget max (€)"
            className={inputClass}
            aria-label="Budget maximum par participant"
          />

          <select
            name="sort"
            defaultValue={searchParams?.sort ?? ""}
            className={inputClass}
            aria-label="Trier les formations"
          >
            <option value="">Tri : les plus récentes</option>
            <option value="soonest">Prochaine session</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="duration-asc">Durée la plus courte</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <label className="inline-flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              name="cpf"
              value="true"
              defaultChecked={searchParams?.cpf === "true"}
              className="size-4 rounded border-input accent-primary"
            />
            Éligible CPF
          </label>
          <label className="inline-flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              name="certifying"
              value="true"
              defaultChecked={searchParams?.certifying === "true"}
              className="size-4 rounded border-input accent-primary"
            />
            Certifiante Qualiopi
          </label>
          {filtree ? (
            <Link href="/formations" className="text-primary underline-offset-4 hover:underline">
              Réinitialiser les filtres
            </Link>
          ) : null}
          <span className="ml-auto text-muted-foreground">
            {data?.total ?? 0} formation{(data?.total ?? 0) > 1 ? "s" : ""}
          </span>
        </div>
      </form>

      {/* Le catalogue n'est pas vide : dire « en préparation » parce que l'API
          n'a pas répondu ferait fuir un visiteur venu de la publicité. */}
      {error ? (
        <EmptyState
          title="Catalogue momentanément indisponible"
          description="Réessayez dans quelques instants."
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={filtree ? "Aucune formation ne correspond" : "Catalogue de formations en préparation"}
          description={
            filtree
              ? "Élargissez vos critères, ou dites-nous ce que vous cherchez : nous montons des sessions sur mesure."
              : "Nos formations arrivent très prochainement. Contactez-nous pour être informé de l’ouverture des prochaines sessions."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => {
            const organisme = f.account?.name;
            const duree = dureeLisible(f);
            const maison = estMaison(f);
            const lien = `/formations/${f.slug}`;
            return (
              <Card
                key={f.id}
                className={`group card-interactive relative flex h-full flex-col overflow-hidden ${
                  maison ? "border-primary/40" : ""
                }`}
              >
                {/* Le visuel d'abord : une fiche sans image ne se clique pas. */}
                <Link href={lien} className="relative block aspect-[16/10] bg-muted">
                  <VisuelCarte
                    src={premierVisuel(f.images)}
                    alt={f.title}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  >
                    <span className="grid h-full place-items-center bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/20">
                      <span className="flex flex-col items-center gap-1.5 text-center">
                        <GraduationCap className="size-6 text-primary/70" aria-hidden />
                        <span className="px-4 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                          {f.categoryRef?.title ?? "Formation"}
                        </span>
                      </span>
                    </span>
                  </VisuelCarte>
                  {f.categoryRef?.title ? (
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {f.categoryRef.title}
                    </span>
                  ) : null}
                </Link>

                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* La marque de la maison passe avant les autres : c'est
                        elle qui répond de la ligne à la ligne. */}
                    {maison ? (
                      <Badge className="gap-1">
                        <Sparkles className="size-3" /> Conçue par ADéPA
                      </Badge>
                    ) : null}
                    {f.certifying ? (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" /> Qualiopi
                      </Badge>
                    ) : null}
                    {f.cpfEligible ? <Badge variant="outline">CPF</Badge> : null}
                    {duree ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {duree}
                      </span>
                    ) : null}
                  </div>

                  <Link href={lien}>
                    <h2 className="text-lg font-semibold leading-snug text-foreground">
                      {f.title}
                    </h2>
                  </Link>
                  {f.summary ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{f.summary}</p>
                  ) : null}

                  <div className="mt-auto space-y-3 pt-2">
                    {/* Les trois lignes que porte déjà une carte atelier :
                        qui l'a conçue, où ça se passe, pour qui c'est fait.
                        Sans elles, une fiche formation avait l'air inachevée à
                        côté d'une fiche atelier de la même grille. */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {organisme ? (
                        <p className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 shrink-0" />
                          <span className="truncate">{organisme}</span>
                        </p>
                      ) : null}
                      {f.city ? (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{f.city}</span>
                        </p>
                      ) : f.freeOnline ? (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">En ligne, à votre rythme</span>
                        </p>
                      ) : null}
                      {(f.publicTargets?.length ?? 0) > 0 ? (
                        <p className="line-clamp-2">
                          <span className="font-medium">Public :</span>{" "}
                          {f.publicTargets!.join(", ")}
                        </p>
                      ) : null}
                      {f.nextSessionAt ? (
                        <p className="flex items-center gap-1.5">
                          <CalendarClock className="size-3.5 shrink-0" />
                          <span className="truncate">dès le {formatDate(f.nextSessionAt)}</span>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      {/* « Tarif sur devis » sur une formation gratuite ferait
                          fuir exactement les gens qu'elle vise. Le mode gratuit
                          se lit donc dès la carte. */}
                      {f.freeOnline ? (
                        <span className="text-base font-semibold text-primary">Gratuit · en ligne</span>
                      ) : f.priceFrom ? (
                        <span className="text-base font-semibold text-foreground">
                          dès {formatMoney(f.priceFrom)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Tarif sur devis</span>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link href={lien}>
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
