"use client";

// LA PASTILLE DE NOTIFICATIONS.
//
// Le point rouge du header était codé en dur : il s'affichait toujours, quoi
// qu'il arrive. Un indicateur qui ne varie jamais n'informe de rien — pire,
// il apprend à ne plus le regarder. L'API comptait pourtant les notifications
// non lues depuis toujours ; personne ne le lui demandait.
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

/** Rafraîchissement discret : une notification n'est pas une urgence. */
const INTERVALLE_MS = 60_000;

export function PastilleNotifications() {
  const [nonLues, setNonLues] = useState(0);

  useEffect(() => {
    let annule = false;
    const lire = async () => {
      try {
        const r = await apiRequest<{ count: number }>("/notifications/unread-count");
        if (!annule) setNonLues(r?.count ?? 0);
      } catch {
        // Une pastille qui n'a pas pu se mettre à jour ne montre rien plutôt
        // que d'inventer un chiffre : c'est le seul cas où le silence est
        // la bonne réponse.
        if (!annule) setNonLues(0);
      }
    };
    void lire();
    const t = setInterval(lire, INTERVALLE_MS);
    return () => {
      annule = true;
      clearInterval(t);
    };
  }, []);

  if (nonLues === 0) return null;

  return (
    <span
      className="absolute -right-0.5 -top-0.5 flex min-w-[1.15rem] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold leading-4 text-secondary-foreground ring-2 ring-card"
      aria-label={`${nonLues} notification${nonLues > 1 ? "s" : ""} non lue${nonLues > 1 ? "s" : ""}`}
    >
      {nonLues > 99 ? "99+" : nonLues}
    </span>
  );
}
