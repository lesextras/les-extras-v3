"use client";

// Frontière d'erreur du groupe (admin).
//
// Sans ce fichier, une erreur dans une page d'administration remontait jusqu'à
// `global-error.tsx`, qui remplace TOUTE la page — barre latérale comprise —
// par un écran nu. On perdait la navigation au moment précis où l'on en avait
// besoin pour aller voir ailleurs. Ici, l'erreur reste dans la zone de contenu.
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Cette page d’administration n’a pas pu s’afficher</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Le reste de l’administration reste accessible. Réessayez&nbsp;; si l’erreur revient,
          notez ce qui était en cours au moment où elle est apparue.
        </p>
        {error.digest ? (
          <p className="pt-1 text-xs text-muted-foreground">Référence technique : {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" asChild>
          <Link href="/admin">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
