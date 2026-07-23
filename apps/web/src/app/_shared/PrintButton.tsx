"use client";

import { Button } from "@/components/ui/button";

/** Déclenche l'impression navigateur (→ enregistrer en PDF). Masqué à l'impression. */
export function PrintButton({ label = "Imprimer / Enregistrer en PDF" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      {label}
    </Button>
  );
}
