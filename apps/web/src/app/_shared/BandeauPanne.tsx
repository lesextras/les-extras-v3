"use client";

// Une panne réseau se dit. Elle ne se devine pas.
//
// Plusieurs écrans avalaient l'erreur et restaient figés : l'utilisateur ne
// pouvait pas distinguer « il n'y a rien » de « ça n'a pas chargé ». Sur un
// planning ou des compteurs d'heures, la différence n'est pas cosmétique —
// on décide sur ce qu'on voit.
import { AlertTriangle, RotateCw } from "lucide-react";

export function BandeauPanne({
  quoi,
  onReessayer,
}: {
  /** Ce qui n'a pas chargé, en français : « le planning », « les congés ». */
  quoi: string;
  onReessayer?: () => void;
}) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
    >
      <AlertTriangle className="size-4 shrink-0 text-warning-foreground" />
      <p className="flex-1 text-foreground">
        Impossible de charger {quoi}. Ce qui s’affiche peut être incomplet ou dater d’avant.
      </p>
      {onReessayer ? (
        <button
          type="button"
          onClick={onReessayer}
          className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4"
        >
          <RotateCw className="size-3.5" />
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
