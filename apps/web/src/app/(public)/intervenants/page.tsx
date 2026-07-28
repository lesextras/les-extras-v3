// ANNUAIRE PUBLIC DES INTERVENANTS.
//
// Le catalogue montre des prestations ; cette page montre les personnes qui
// les portent. C'est ce qui manquait le plus au site : un établissement ne
// réserve pas un « atelier slam », il fait entrer quelqu'un dans ses murs.
// Ne sont listés que les intervenants ayant au moins une fiche publiée.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Search, ArrowRight, ShieldCheck, GraduationCap, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPublic } from "../../_shared/server";
import { PageHeader, EmptyState } from "../../_shared/ui";
import { formatMoney, initials } from "../../_shared/format";

export const metadata: Metadata = {
  title: "Les intervenants — éducateurs, thérapeutes et formateurs du réseau",
  description:
    "Découvrez les intervenants de Les Extras : leur métier, leurs ateliers, leurs formations et les avis reçus. Chaque profil est vérifié et rassemble toutes ses interventions.",
  alternates: { canonical: "/intervenants" },
};

interface Apercu {
  id: string;
  title: string;
  price?: string | number | null;
  image?: string | null;
  formation: boolean;
}

interface Intervenant {
  id: string;
  nom: string;
  metier?: string | null;
  bio?: string | null;
  competences: string[];
  ville?: string | null;
  logoUrl?: string | null;
  rating?: number | null;
  reviewsCount: number;
  nbAteliers: number;
  nbFormations: number;
  qualiopi: boolean;
  apercu: Apercu[];
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export default async function IntervenantsPage({
  searchParams,
}: {
  searchParams?: { search?: string; city?: string };
}) {
  const qs = new URLSearchParams({ take: "48" });
  if (searchParams?.search) qs.set("search", searchParams.search);
  if (searchParams?.city) qs.set("city", searchParams.city);

  const { data } = await fetchPublic<{
    items: Intervenant[];
    total: number;
    villes: string[];
  }>(`/public/vendors?${qs.toString()}`);

  const items = data?.items ?? [];
  const villes = data?.villes ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Les intervenants du réseau"
        subtitle="Un établissement ne réserve pas un atelier : il fait entrer quelqu'un dans ses murs. Voici les professionnels qui interviennent, avec tout ce qu'ils proposent."
      />

      <form method="GET" className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="search"
            defaultValue={searchParams?.search ?? ""}
            placeholder="Un métier, un nom, un type d'intervention…"
            className={`${inputClass} pl-9`}
            aria-label="Rechercher un intervenant"
          />
        </div>
        <select
          name="city"
          defaultValue={searchParams?.city ?? ""}
          className={`${inputClass} md:w-56`}
          aria-label="Filtrer par ville"
        >
          <option value="">Partout</option>
          {villes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <Button type="submit">Filtrer</Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun intervenant ne correspond"
          description="Élargissez la recherche, ou parcourez le catalogue des interventions."
          action={
            <Button asChild variant="outline">
              <Link href="/ateliers">Voir le catalogue</Link>
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {items.length} intervenant{items.length > 1 ? "s" : ""} affiché
            {items.length > 1 ? "s" : ""}
            {data && data.total > items.length ? ` sur ${data.total}` : ""}
          </p>

          <ul className="grid gap-5 md:grid-cols-2">
            {items.map((i) => (
              <li key={i.id}>
                <Card className="flex h-full flex-col transition hover:border-primary/40 hover:shadow-card">
                  <CardContent className="flex flex-1 flex-col gap-4 pt-6">
                    {/* Identité */}
                    <div className="flex items-start gap-4">
                      <Avatar className="size-14 shrink-0">
                        <AvatarImage src={i.logoUrl ?? undefined} alt="" />
                        <AvatarFallback>{initials(i.nom)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-semibold text-foreground">{i.nom}</h2>
                        {i.metier ? (
                          <p className="text-sm text-primary">{i.metier}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {i.ville ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3" aria-hidden /> {i.ville}
                            </span>
                          ) : null}
                          {i.rating ? (
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Star className="size-3 fill-current text-amber-500" aria-hidden />
                              {i.rating.toFixed(1)}
                              <span className="font-normal text-muted-foreground">
                                ({i.reviewsCount})
                              </span>
                            </span>
                          ) : (
                            <span>Pas encore d&apos;avis</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {i.bio ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {i.bio}
                      </p>
                    ) : null}

                    {/* Ce qu'il propose */}
                    <div className="flex flex-wrap gap-2">
                      {i.nbAteliers > 0 ? (
                        <Badge variant="soft">
                          <Sparkles aria-hidden /> {i.nbAteliers} atelier
                          {i.nbAteliers > 1 ? "s" : ""}
                        </Badge>
                      ) : null}
                      {i.nbFormations > 0 ? (
                        <Badge variant="soft">
                          <GraduationCap aria-hidden /> {i.nbFormations} formation
                          {i.nbFormations > 1 ? "s" : ""}
                        </Badge>
                      ) : null}
                      {i.qualiopi ? (
                        <Badge variant="success">
                          <ShieldCheck aria-hidden /> Qualiopi
                        </Badge>
                      ) : null}
                      {i.competences.slice(0, 2).map((c) => (
                        <Badge key={c} variant="outline">
                          {c}
                        </Badge>
                      ))}
                    </div>

                    {/* Aperçu de ses fiches */}
                    {i.apercu.length > 0 ? (
                      <ul className="space-y-1.5 border-t border-border pt-3">
                        {i.apercu.map((s) => (
                          <li key={s.id}>
                            <Link
                              href={`/ateliers/${s.id}`}
                              className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition hover:bg-accent"
                            >
                              {s.image ? (
                                <span className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
                                  <Image
                                    src={s.image}
                                    alt=""
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                </span>
                              ) : (
                                <span className="grid size-9 shrink-0 place-items-center rounded bg-muted text-muted-foreground">
                                  {s.formation ? (
                                    <GraduationCap className="size-4" aria-hidden />
                                  ) : (
                                    <Sparkles className="size-4" aria-hidden />
                                  )}
                                </span>
                              )}
                              <span className="min-w-0 flex-1 truncate">{s.title}</span>
                              {s.price ? (
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                  {formatMoney(s.price)}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-auto pt-2">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/intervenants/${i.id}`}>
                          Voir son profil complet
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <Card className="border-primary/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="font-semibold">Vous intervenez auprès de publics accompagnés ?</p>
            <p className="text-sm text-muted-foreground">
              Publier vos ateliers est gratuit, et vous gardez 100 % de votre tarif.
            </p>
          </div>
          <Button asChild>
            <Link href="/register">Créer mon profil</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
