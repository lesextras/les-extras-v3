"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Oups, une erreur est survenue</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Le tableau de bord a rencontré un problème. Vous pouvez réessayer ou revenir à l&apos;accueil.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Retour au dashboard</a>
        </Button>
      </div>
    </div>
  );
}
