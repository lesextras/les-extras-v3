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
      {/* CENTRÉS ET PLUS GRANDS. Ce sont les trois portes du catalogue : elles
          se lisaient comme des filtres secondaires, calées à gauche en petit
          corps. Au centre et en taille d'action, elles redeviennent le geste
          qu'elles sont. */}
      <div
        role="tablist"
        aria-label="Rayons du catalogue"
        className="flex flex-wrap justify-center gap-3"
      >
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
                  ? "rounded-full border border-foreground bg-foreground px-7 py-3.5 text-base font-bold text-background shadow-soft transition-colors"
                  : "rounded-full border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft hover:text-primary"
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
        {/* Plus de phrase de rayon ici : le titre de la section dit déjà à quoi
            sert le catalogue, et chaque carte porte son public, sa durée et son
            tarif. Une ligne de plus entre l'onglet et les fiches ne faisait que
            retarder la lecture. */}
        <OfferCarousel items={courant.items} basePath={courant.basePath} />
        {/* À DROITE, ET EN COULEUR. En bas à gauche et en contour, il se
            confondait avec le fond charbon : le seul lien qui mène au reste du
            catalogue était le moins visible de la section. */}
        <p className="mt-8 flex justify-end">
          <Button asChild variant="primary" size="lg">
            <Link href={courant.lien.href}>
              {courant.lien.libelle} <ArrowRight />
            </Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
