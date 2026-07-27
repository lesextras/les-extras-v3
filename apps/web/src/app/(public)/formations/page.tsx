// Catalogue PUBLIC des formations (vraies formations, pas des ateliers).
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Search, ArrowRight, ShieldCheck, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../_shared/server";
import { PageHeader, EmptyState } from "../../_shared/ui";
import { formatMoney, formatDate } from "../../_shared/format";

export const metadata: Metadata = {
  title: "Formations",
  description:
    "Formations pour les professionnels du médico-social : analyse des pratiques, prévention, spécialisations métier. Certifiées Qualiopi, finançables OPCO.",
  alternates: { canonical: "/formations" },
};

export interface FormationCard {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  objectives?: string | null;
  durationHours?: number | null;
  type?: "CERTIFIANTE" | "INTERNE";
  certifying?: boolean;
  cpfEligible?: boolean;
  images?: string[] | null;
  city?: string | null;
  categoryRef?: { id: string; title: string } | null;
  account?: { id: string; name: string; logoUrl?: string | null } | null;
  priceFrom?: string | number | null;
  nextSessionAt?: string | null;
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

type Filtres = {
  search?: string;
  category?: string;
  city?: string;
  cpf?: string;
  certifying?: string;
  priceMax?: string;
  sort?: string;
};

export default async function FormationsCatalogPage({
  searchParams,
}: {
  searchParams?: Filtres;
}) {
  const qs = new URLSearchParams();
  for (const cle of ["search", "category", "city", "priceMax", "sort"] as const) {
    const v = searchParams?.[cle];
    if (v) qs.set(cle, v);
  }
  if (searchParams?.cpf === "true") qs.set("cpf", "true");
  if (searchParams?.certifying === "true") qs.set("certifying", "true");
  qs.set("take", "60");

  const { data } = await fetchPublic<{
    items: FormationCard[];
    total: number;
    categories: string[];
    cities: string[];
  }>(`/public/formations?${qs.toString()}`);

  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const cities = data?.cities ?? [];
  const filtree = Boolean(
    searchParams?.search ||
      searchParams?.category ||
      searchParams?.city ||
      searchParams?.priceMax ||
      searchParams?.cpf ||
      searchParams?.certifying,
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {items.length === 0 ? (
        <EmptyState
          title={filtree ? "Aucune formation ne correspond" : "Catalogue de formations en préparation"}
          description={
            filtree
              ? "Élargissez vos critères, ou dites-nous ce que vous cherchez : nous montons des sessions sur mesure."
              : "Nos formations arrivent très prochainement. Contactez-nous pour être informé de l’ouverture des prochaines sessions."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <Link key={f.id} href={`/formations/${f.slug}`} className="group">
              <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                {f.images?.[0] ? (
                  <div className="relative aspect-[16/10] bg-muted">
                    <Image
                      src={f.images[0]}
                      alt={f.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <CardContent className="space-y-2.5 p-5">
                  <div className="flex flex-wrap gap-1.5">
                    {f.categoryRef?.title ? (
                      <Badge variant="outline">{f.categoryRef.title}</Badge>
                    ) : null}
                    {f.certifying ? (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" /> Qualiopi
                      </Badge>
                    ) : null}
                    {f.cpfEligible ? <Badge>CPF</Badge> : null}
                  </div>
                  <h2 className="line-clamp-2 font-semibold text-foreground">{f.title}</h2>
                  {f.summary ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{f.summary}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {f.durationHours ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> {f.durationHours} h
                      </span>
                    ) : null}
                    {f.city ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" /> {f.city}
                      </span>
                    ) : null}
                    {f.nextSessionAt ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="size-3.5" /> dès le {formatDate(f.nextSessionAt)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {f.priceFrom ? (
                      <p className="font-semibold text-primary">
                        à partir de {formatMoney(f.priceFrom)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Tarif sur devis</p>
                    )}
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
