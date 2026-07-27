"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/glass-card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[admin-error-boundary]", {
    message: error.message,
    digest: error.digest,
  });

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-xl">
        <GlassCardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--coral)/0.3)] bg-[hsl(var(--coral)/0.1)] text-[hsl(var(--coral))]">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Le Desk
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Le Desk n’a pas pu charger cette vue
            </h1>
            <p className="text-sm text-muted-foreground">
              La session ou un service admin peut être indisponible. Vous pouvez réessayer ou revenir à la connexion Desk.
            </p>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" variant="teal" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Réessayer
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/login">Retour connexion Desk</Link>
          </Button>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
