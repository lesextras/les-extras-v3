// Fil PUBLIC des actualités : tout compte peut publier, tout le monde peut lire.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search, Eye, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPublic } from "../../_shared/server";
import { PageHeader, EmptyState } from "../../_shared/ui";
import { formatDate, initials } from "../../_shared/format";

export const metadata: Metadata = {
  title: "Édublog",
  description:
    "Articles et actualités du médico-social : retours d’expérience, projets d’établissements, publications des intervenants. En accès libre.",
  alternates: { canonical: "/edublog" },
};

export interface ArticleCard {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  publishedAt?: string | null;
  views?: number | null;
  category?: { id: string; title: string } | null;
  account?: { id: string; name: string; type?: string; logoUrl?: string | null; city?: string | null } | null;
  author?: { firstName?: string | null; lastName?: string | null; avatarUrl?: string | null } | null;
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export default async function ActualitesPage({
  searchParams,
}: {
  searchParams?: { search?: string; category?: string; section?: string };
}) {
  const qs = new URLSearchParams({ take: "24" });
  if (searchParams?.search) qs.set("search", searchParams.search);
  if (searchParams?.category) qs.set("category", searchParams.category);

  const section = searchParams?.section === "reseau" ? "reseau" : "editorial";
  qs.set("section", section);

  const { data } = await fetchPublic<{
    items: ArticleCard[];
    total: number;
    categories: string[];
    nbEditorial?: number;
    nbReseau?: number;
  }>(`/articles/feed?${qs.toString()}`);

  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const [une, ...suite] = items;

  /** Conserve la recherche et le thème en changeant de rayon. */
  const lien = (s: "editorial" | "reseau") => {
    const p = new URLSearchParams();
    if (searchParams?.search) p.set("search", searchParams.search);
    if (searchParams?.category) p.set("category", searchParams.category);
    if (s === "reseau") p.set("section", "reseau");
    const q = p.toString();
    return `/edublog${q ? `?${q}` : ""}`;
  };

  const RAYONS = [
    {
      cle: "editorial" as const,
      titre: "Articles",
      detail: "Analyses, guides et méthodes — par l'équipe et par le réseau",
      nb: data?.nbEditorial,
    },
    {
      cle: "reseau" as const,
      titre: "Actualités du réseau",
      detail: "Les nouvelles du terrain : projets, temps forts, retours",
      nb: data?.nbReseau,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Édublog"
        subtitle="Deux rayons : articles de fond et actualités du réseau. Écrit par les établissements, les intervenants et l’équipe. Sans compte."
      />

      <nav aria-label="Sections de l’Édublog" className="grid gap-3 sm:grid-cols-2">
        {RAYONS.map((r) => {
          const actif = section === r.cle;
          return (
            <Link
              key={r.cle}
              href={lien(r.cle)}
              aria-current={actif ? "page" : undefined}
              className={`rounded-2xl border p-5 transition ${
                actif
                  ? "border-primary bg-primary-soft shadow-soft"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-soft"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`font-semibold ${actif ? "text-accent-foreground" : "text-foreground"}`}>
                  {r.titre}
                </span>
                {typeof r.nb === "number" ? (
                  <Badge variant={actif ? "default" : "muted"}>{r.nb}</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
            </Link>
          );
        })}
      </nav>

      <form method="GET" className="flex flex-col gap-3 sm:flex-row">
        {section === "reseau" ? <input type="hidden" name="section" value="reseau" /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="search"
            defaultValue={searchParams?.search ?? ""}
            placeholder={section === "editorial" ? "Rechercher un article…" : "Rechercher une actualité…"}
            className={`${inputClass} pl-9`}
            aria-label={section === "editorial" ? "Rechercher un article" : "Rechercher une actualité"}
          />
        </div>
        {categories.length > 0 ? (
          <select
            name="category"
            defaultValue={searchParams?.category ?? ""}
            className={`${inputClass} sm:w-64`}
            aria-label="Filtrer par thème"
          >
            <option value="">Tous les thèmes</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : null}
        <Button type="submit" className="sm:w-auto">Filtrer</Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title={
            section === "editorial"
              ? "Aucun article pour le moment"
              : "Aucune actualité du réseau pour le moment"
          }
          description={
            section === "editorial"
              ? "Les articles de fond publiés par la communauté apparaîtront ici."
              : "Les nouvelles publiées par les établissements et les intervenants apparaîtront ici."
          }
        />
      ) : (
        <>
          {/* À la une */}
          <Link href={`/edublog/${une.slug}`} className="group block">
            <Card className="overflow-hidden transition group-hover:shadow-card">
              <div className="grid gap-0 md:grid-cols-2">
                {une.coverUrl ? (
                  <div className="relative aspect-[16/10] bg-muted md:aspect-auto md:min-h-[280px]">
                    <Image src={une.coverUrl} alt={une.title} fill sizes="50vw" className="object-cover" priority unoptimized />
                  </div>
                ) : null}
                <CardContent className="flex flex-col justify-center gap-3 p-8">
                  <div className="flex flex-wrap gap-2">
                    <Badge>À la une</Badge>
                    {une.category?.title ? <Badge variant="outline">{une.category.title}</Badge> : null}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{une.title}</h2>
                  {une.excerpt ? <p className="text-muted-foreground">{une.excerpt}</p> : null}
                  <Signature a={une} />
                </CardContent>
              </div>
            </Card>
          </Link>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suite.map((a) => (
              <Link key={a.id} href={`/edublog/${a.slug}`} className="group">
                <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                  {a.coverUrl ? (
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image src={a.coverUrl} alt={a.title} fill sizes="33vw" className="object-cover" unoptimized />
                    </div>
                  ) : null}
                  <CardContent className="space-y-2.5 p-5">
                    {a.category?.title ? <Badge variant="outline">{a.category.title}</Badge> : null}
                    <h2 className="line-clamp-2 font-semibold text-foreground">{a.title}</h2>
                    {a.excerpt ? (
                      <p className="line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
                    ) : null}
                    <Signature a={a} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Signature({ a }: { a: ArticleCard }) {
  const nom = a.account?.name ?? "Les Extras";
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Avatar className="size-5">
          <AvatarImage src={a.account?.logoUrl ?? undefined} />
          <AvatarFallback className="text-[9px]">{initials(nom)}</AvatarFallback>
        </Avatar>
        {nom}
      </span>
      {a.account?.type === "ESTABLISHMENT" ? (
        <span className="inline-flex items-center gap-1">
          <Building2 className="size-3" /> Établissement
        </span>
      ) : null}
      {a.publishedAt ? <span>{formatDate(a.publishedAt)}</span> : null}
      {a.views ? (
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3" /> {a.views}
        </span>
      ) : null}
    </div>
  );
}
