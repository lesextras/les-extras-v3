"use client";

// Bascule clair / sombre.
//
// Le choix est mémorisé dans le navigateur et appliqué par un attribut sur
// <html> : la feuille de style fait le reste. Au tout premier passage, on suit
// la préférence du système d'exploitation — quelqu'un qui travaille en mode
// clair toute la journée n'a pas à subir un fond charbon.
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export const CLE_THEME = "lesextras-theme";

export function BasculeTheme({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"clair" | "sombre">("sombre");
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    const actuel = document.documentElement.dataset.theme;
    setTheme(actuel === "clair" ? "clair" : "sombre");
    setMonte(true);
  }, []);

  function basculer() {
    const suivant = theme === "clair" ? "sombre" : "clair";
    setTheme(suivant);
    document.documentElement.dataset.theme = suivant;
    try {
      window.localStorage.setItem(CLE_THEME, suivant);
    } catch {
      /* navigation privée : le choix vaut pour la session */
    }
  }

  // Tant que le composant n'est pas monté, on rend le même balisage que le
  // serveur (icône lune) pour ne pas déclencher d'erreur d'hydratation.
  const clair = monte && theme === "clair";

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={clair ? "Passer en thème sombre" : "Passer en thème clair"}
      title={clair ? "Passer en thème sombre" : "Passer en thème clair"}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      {clair ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
    </button>
  );
}
