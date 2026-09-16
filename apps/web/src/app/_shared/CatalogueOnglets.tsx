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
      {/*
        ⚠⚠ DEUX ONGLETS LARGES, PAS TROIS PETITS (16/09/2026, demande de Siham).

        Ils étaient trois — « Ateliers », « Formations Qualiopi », « Parcours
        gratuits » — et deux d'entre eux disaient « formation ». Le visiteur
        devait donc trancher entre deux mots qu'il ne distingue pas encore, sur
        la première page qu'il voit. Les parcours gratuits sont désormais
        DANS l'onglet Formations (voir `page.tsx`), et chaque carte dit
        elle-même ce qu'elle est : « Gratuit · en ligne » ou son prix.

        ⚠ `flex-1` avec `basis-0` : les deux boutons prennent exactement la
        moitié de la largeur chacun, quelle que soit la longueur du libellé.
        Sans `basis-0`, « Formations » serait plus étroit qu'« Ateliers » +
        padding, et deux portes de tailles différentes se lisent comme une
        principale et une secondaire.

        Ce bloc reste une liste d'onglets et non deux liens : le catalogue
        s'affiche en dessous, la page ne change pas.
      */}
      <div
        role="tablist"
        aria-label="Rayons du catalogue"
        className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3 sm:flex-nowrap"
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
              /*
                ⚠ L'ONGLET OUVERT EST EN ROSE DE LA MARQUE, PAS EN NOIR
                (16/09/2026, demande de Siham). Le noir plein était emprunté au
                fond charbon : sur l'accueil, il se lisait comme un bloc éteint
                plutôt que comme l'onglet actif, et rien sur la page n'utilise
                cette couleur pour dire « c'est ici ». Le rose est la couleur
                d'action du site, du bouton du héros jusqu'aux liens de carte.

                ⚠ ET DEUX CRANS PLUS PETIT : `text-lg py-4` en faisait deux
                pavés plus hauts que le bouton principal du héros — un onglet
                n'est pas l'action principale de la page, il choisit un rayon.
              */
              className={
                "w-full basis-0 rounded-full px-5 py-2.5 text-sm tracking-wide transition-colors sm:flex-1 " +
                (ouvert
                  ? "border border-primary bg-primary font-bold text-primary-foreground shadow-soft"
                  : "border border-border bg-card font-semibold text-foreground hover:border-primary/50 hover:bg-primary-soft hover:text-primary")
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
