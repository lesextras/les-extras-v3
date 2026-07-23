"use client";

// Frontière d'erreur du groupe (dashboard).
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
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

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
