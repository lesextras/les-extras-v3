"use client";

// Carrousel horizontal des offres, au modèle des fiches les-extras.fr :
// visuel, catégorie en surimpression, lieu, publics, prix.
import { useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, MapPin, Megaphone, Star, ShieldCheck, BadgeCheck, Clock, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisuelCarte } from "./VisuelCarte";
import { premierVisuel } from "@/lib/media";
import { formatMoney } from "./format";
import { EMOJI_PARCOURS, dureeLisible, estMaison } from "@/lib/mini-formations";

export interface OfferCard {
  id: string;
  slug?: string;
  title: string;
  images?: string[] | null;
  city?: string | null;
  publicTargets?: string[] | null;
  publicTarget?: string | null;
  price?: string | number | null;
  priceFrom?: string | number | null;
  durationHours?: number | null;
  /** Durée en minutes, pour ce qui dure moins d'une heure (mini-formations). */
  durationMinutes?: number | null;
  /** Mini-formation en ligne et gratuite : ni devis, ni session, ni prix. */
  freeOnline?: boolean;
  account?: { id: string; name: string } | null;
  categoryRef?: { id: string; title: string } | null;
  rating?: number | null;
  reviewsCount?: number;
  verified?: boolean;
  qualiopi?: boolean;
  certifying?: boolean;
}

export function OfferCarousel({
  items,
  basePath,
  useSlug = false,
}: {
  items: OfferCard[];
  /** "/ateliers" ou "/formations". */
  basePath: string;
  useSlug?: boolean;
}) {
  const piste = useRef<HTMLDivElement>(null);

  const glisser = (sens: -1 | 1) => {
    const p = piste.current;
    if (!p) return;
    p.scrollBy({ left: sens * Math.min(p.clientWidth * 0.85, 900), behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => glisser(-1)}
        aria-label="Voir les offres précédentes"
        className="absolute -left-3 top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-card transition hover:bg-accent md:grid"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => glisser(1)}
        aria-label="Voir les offres suivantes"
        className="absolute -right-3 top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-card transition hover:bg-accent md:grid"
      >
        <ChevronRight className="size-5" />
      </button>

      <div
        ref={piste}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((o, rang) => {
          const publics = o.publicTargets?.length
            ? o.publicTargets
            : o.publicTarget
              ? [o.publicTarget]
              : [];
          const prix = o.price ?? o.priceFrom ?? null;
          const href = `${basePath}/${useSlug ? (o.slug ?? o.id) : o.id}`;
          const emoji = o.slug ? (EMOJI_PARCOURS[o.slug] ?? null) : null;
          const duree = dureeLisible(o);
          const maison = o.freeOnline && estMaison(o.account?.name);
          const visuel = premierVisuel(o.images);
          return (
            <Link
              key={o.id}
              href={href}
              className="group w-[280px] shrink-0 snap-start sm:w-[320px]"
            >
              <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                <div className="relative aspect-[16/11] bg-muted">
                  <VisuelCarte src={visuel} alt={o.title} sizes="320px">
                    <div className="grid h-full place-items-center bg-warm-gradient text-sm text-muted-foreground">
                      Les Extras
                    </div>
                  </VisuelCarte>
                  {/* Le bandeau de thématique n'a de sens que sur les vignettes
                      qui ne l'écrivent pas déjà : la couverture d'une
                      mini-formation la porte en haut à gauche, et le repli de
                      marque n'a pas d'image du tout. */}
                  {o.categoryRef?.title && !emoji && visuel ? (
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {o.categoryRef.title}
                    </span>
                  ) : null}
                  {/* La pastille emoji : la même que sur la couverture et sur
                      la fiche récap. Chaque carte reçoit son propre délai,
                      sinon toute la ligne monte et descend en même temps. */}
                  {emoji ? (
                    <span
                      aria-hidden
                      className="animate-emoji pointer-events-none absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-card/90 text-lg shadow-sm backdrop-blur-sm"
                      style={{ animationDelay: `${(rang % 5) * 0.35}s` }}
                    >
                      {emoji}
                    </span>
                  ) : null}
                </div>
                <CardContent className="space-y-2.5 p-5">
                  {maison || duree ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {maison ? (
                        <Badge className="gap-1">
                          <Sparkles className="size-3" /> Conçue par ADéPA
                        </Badge>
                      ) : null}
                      {duree ? (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          {duree}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex items-start gap-1.5">
                    <h3 className={`line-clamp-2 font-semibold leading-snug text-foreground ${emoji ? "" : "uppercase"}`}>
                      {o.title}
                    </h3>
                    {o.verified ? (
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="Validé" />
                    ) : null}
                    {o.qualiopi || o.certifying ? (
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" aria-label="Qualiopi" />
                    ) : null}
                  </div>

                  {o.city ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4 text-destructive" /> {o.city}
                    </p>
                  ) : o.freeOnline ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4 text-destructive" /> En ligne, à votre rythme
                    </p>
                  ) : null}

                  {publics.length > 0 ? (
                    <div className="flex gap-1.5 text-sm text-muted-foreground">
                      <Megaphone className="mt-0.5 size-4 shrink-0" />
                      <span>
                        <span className="block text-xs font-medium">Public :</span>
                        {publics.join(", ")}
                      </span>
                    </div>
                  ) : o.durationHours ? (
                    <p className="text-sm text-muted-foreground">{o.durationHours} h de formation</p>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    {/* « Sur devis » sur une formation gratuite ferait fuir
                        exactement les gens qu'elle vise — c'est ce qu'affichait
                        ce carrousel sur les dix mini-formations. */}
                    <p className="text-lg font-semibold text-primary">
                      {o.freeOnline
                        ? "Gratuit · en ligne"
                        : prix
                          ? formatMoney(prix)
                          : "Sur devis"}
                    </p>
                    {o.rating ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        <Star className="size-4 fill-current text-amber-400" />
                        {o.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
