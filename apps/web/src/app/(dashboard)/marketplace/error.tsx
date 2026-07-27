"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MarketplaceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MarketplaceError({ error, reset }: MarketplaceErrorProps) {
  useEffect(() => {
    console.error("[marketplace] segment error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Marketplace indisponible</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Une erreur est survenue pendant le chargement. Réessayez maintenant.
          </p>
          <Button onClick={reset}>Réessayer</Button>
        </CardContent>
      </Card>
    </div>
  );
}
