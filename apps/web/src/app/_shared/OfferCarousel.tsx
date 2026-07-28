"use client";

// Carrousel horizontal des offres, au modèle des fiches les-extras.fr :
// visuel, catégorie en surimpression, lieu, publics, prix.
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Megaphone, Star, ShieldCheck, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "./format";

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
        {items.map((o) => {
          const publics = o.publicTargets?.length
            ? o.publicTargets
            : o.publicTarget
              ? [o.publicTarget]
              : [];
          const prix = o.price ?? o.priceFrom ?? null;
          const href = `${basePath}/${useSlug ? (o.slug ?? o.id) : o.id}`;
          return (
            <Link
              key={o.id}
              href={href}
              className="group w-[280px] shrink-0 snap-start sm:w-[320px]"
            >
              <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                <div className="relative aspect-[16/11] bg-muted">
                  {o.images?.[0] ? (
                    <Image
                      src={o.images[0]}
                      alt={o.title}
                      fill
                      sizes="320px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-warm-gradient text-sm text-muted-foreground">
                      Les Extras
                    </div>
                  )}
                  {o.categoryRef?.title ? (
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {o.categoryRef.title}
                    </span>
                  ) : null}
                </div>
                <CardContent className="space-y-2.5 p-5">
                  <div className="flex items-start gap-1.5">
                    <h3 className="line-clamp-2 font-semibold uppercase leading-snug text-foreground">
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
                    <p className="text-lg font-semibold text-primary">
                      {prix ? formatMoney(prix) : "Sur devis"}
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
