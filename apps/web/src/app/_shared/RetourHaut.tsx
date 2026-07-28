"use client";

// Flèche de retour en haut : apparaît une fois la première hauteur d'écran
// passée. Le défilement est doux, sauf si la personne a demandé à réduire les
// animations (prefers-reduced-motion), auquel cas le saut est immédiat.
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function RetourHaut() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const surDefilement = () => setVisible(window.scrollY > 600);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  function remonter() {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={remonter}
      aria-label="Revenir en haut de la page"
      title="Revenir en haut"
      className={`fixed bottom-24 right-5 z-40 grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-card transition-all duration-300 hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-8 md:right-8 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
