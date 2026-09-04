"use client";

/**
 * UNE RANGÉE QUI DÉFILE — la mécanique du carrousel d'accueil, réutilisable.
 *
 * `OfferCarousel` fait défiler ses propres cartes, plus petites : titre, lieu,
 * public, prix. Les catalogues, eux, ont une carte plus riche — résumé,
 * concepteur, durée, bouton « Voir ». On ne voulait ni dupliquer cette carte
 * dans le carrousel, ni appauvrir les catalogues : ce composant ne fournit donc
 * QUE le déplacement, et reçoit les cartes déjà faites en enfants.
 *
 * ⚠ Chaque enfant doit porter sa propre largeur (`w-[…] shrink-0`) : dans un
 * conteneur en `flex`, une carte sans largeur se comprime jusqu'à l'illisible
 * au lieu de sortir du cadre.
 *
 * Les flèches n'apparaissent qu'à partir de `md` : au doigt, on fait défiler
 * directement, et deux boutons posés sur les cartes ne feraient que masquer le
 * contenu sur un écran étroit.
 *
 * La piste reçoit une marge intérieure (`md:px-14`) exactement là où les
 * flèches se posent : sans elle, la flèche gauche recouvrait le titre de la
 * première carte. `scroll-px-14` reporte la même marge sur l'accrochage, sinon
 * la carte s'arrête sous le bouton au lieu de s'arrêter à côté.
 */
import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function RangeeDefilante({
  children,
  etiquette,
}: {
  children: ReactNode;
  /** Ce que lisent les lecteurs d'écran sur les deux flèches. */
  etiquette: string;
}) {
  const piste = useRef<HTMLDivElement>(null);

  const glisser = (sens: -1 | 1) => {
    const p = piste.current;
    if (!p) return;
    p.scrollBy({ left: sens * Math.min(p.clientWidth * 0.85, 900), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => glisser(-1)}
        aria-label={`${etiquette}, précédentes`}
        className="absolute left-0 top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-card transition hover:bg-accent md:grid"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => glisser(1)}
        aria-label={`${etiquette}, suivantes`}
        className="absolute right-0 top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-card transition hover:bg-accent md:grid"
      >
        <ChevronRight className="size-5" />
      </button>

      <div
        ref={piste}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 md:scroll-px-14 md:px-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
