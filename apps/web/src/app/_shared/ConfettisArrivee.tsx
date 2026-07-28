"use client";

// Déclenche la volée de confettis à l'arrivée sur la page de bienvenue.
// On célèbre ici, et pas au moment du clic sur « Créer mon compte » : la
// redirection intervient en 200 ms et couperait l'animation net.
import { useEffect } from "react";
import { lancerConfettis } from "@/lib/confetti";

export function ConfettisArrivee({ actif }: { actif: boolean }) {
  useEffect(() => {
    if (!actif) return;
    // Un souffle avant de tirer : la page a fini de peindre, la volée part
    // sur un écran stable plutôt que pendant le rendu.
    const t = window.setTimeout(() => lancerConfettis({ origine: { x: 0.5, y: 0.3 }, nombre: 110 }), 260);
    return () => window.clearTimeout(t);
  }, [actif]);

  return null;
}
