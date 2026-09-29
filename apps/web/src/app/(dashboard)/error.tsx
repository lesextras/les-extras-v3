"use client";

// Frontière d'erreur du groupe (dashboard).
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRepriseAutomatique } from "@/lib/reprise-deploiement";
import { Button } from "@/components/ui/button";

export default function DashboardError({
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
  const router = useRouter();
  // Pendant une mise en ligne, l'écran se répare seul (voir lib/reprise-deploiement).
  const etat = useRepriseAutomatique(error, () => {
    router.refresh();
    reset();
  });
  if (etat !== "abandon") {
    return (
      <div role="status" aria-live="polite" className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-lg font-semibold text-foreground">Le site se met à jour</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {etat === "version"
            ? "Une nouvelle version vient d’être mise en ligne. La page se recharge."
            : "Cet écran revient de lui-même dans quelques secondes, inutile de recharger."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Une erreur est survenue</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Impossible d'afficher cette page pour le moment. Vous pouvez réessayer.
        </p>
      </div>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
