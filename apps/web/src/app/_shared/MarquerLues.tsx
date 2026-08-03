"use client";

/**
 * Marque toutes les notifications comme lues, une fois, à l'ouverture de la
 * page. Sans ce geste, la route `read-all` n'était appelée nulle part et le
 * compteur de la pastille ne redescendait jamais.
 */
import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/api";

export function MarquerLues({ accountId }: { accountId: string }) {
  const fait = useRef(false);
  useEffect(() => {
    if (fait.current) return;
    fait.current = true;
    apiRequest("/notifications/read-all", { method: "PATCH", accountId }).catch(() => {
      // Non bloquant : la liste s'affiche quand même, le compteur retombera
      // à la prochaine visite.
    });
  }, [accountId]);
  return null;
}
