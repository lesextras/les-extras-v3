"use client";

// LE CATALOGUE, EN UN SEUL BLOC.
//
// L'accueil déroulait trois sections produit à la suite — ateliers,
// mini-formations gratuites, formations Qualiopi — soit trois titres, trois
// respirations et trois fois le même geste. Les rayons ne disparaissent pas :
// ils deviennent trois onglets d'un même bloc. Le visiteur choisit son rayon
// au lieu de faire défiler les deux autres.
//
// Le premier onglet disponible est ouvert au chargement : la page n'est jamais
// vide au repos. Un rayon sans fiche n'a pas d'onglet du tout, plutôt qu'un
// onglet qui s'ouvre sur du vide.
import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferCarousel, type OfferCard } from "./OfferCarousel";

export type RayonCatalogue = {
  cle: string;
  libelle: string;
  chapeau?: string;
  items: OfferCard[];
  basePath: string;
  lien: { libelle: string; href: string };
};

export function CatalogueOnglets({ rayons }: { rayons: RayonCatalogue[] }) {
  const disponibles = React.useMemo(() => rayons.filter((r) => r.items.length > 0), [rayons]);
  const [actif, setActif] = React.useState<string>(disponibles[0]?.cle ?? "");

  if (disponibles.length === 0) return null;
  const courant = disponibles.find((r) => r.cle === actif) ?? disponibles[0];

  return (
    <div>
      <div role="tablist" aria-label="Rayons du catalogue" className="flex flex-wrap gap-2">
        {disponibles.map((r) => {
          const ouvert = r.cle === courant.cle;
          return (
            <button
              key={r.cle}
              type="button"
              role="tab"
              id={`onglet-${r.cle}`}
              aria-selected={ouvert}
              aria-controls={`rayon-${r.cle}`}
              onClick={() => setActif(r.cle)}
              className={
                ouvert
                  ? "rounded-full border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors"
                  : "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              }
            >
              {r.libelle}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`rayon-${courant.cle}`}
        aria-labelledby={`onglet-${courant.cle}`}
        className="mt-8"
      >
        {courant.chapeau ? (
          <p className="mb-6 max-w-2xl text-muted-foreground">{courant.chapeau}</p>
        ) : null}
        <OfferCarousel items={courant.items} basePath={courant.basePath} />
        <p className="mt-8">
          <Button asChild variant="outline">
            <Link href={courant.lien.href}>
              {courant.lien.libelle} <ArrowRight />
            </Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
