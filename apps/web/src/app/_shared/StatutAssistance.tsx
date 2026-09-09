"use client";

// Marquer un échange en cours ou réglé, côté association.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function StatutAssistance({ id, statut }: { id: string; statut: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [encours, setEncours] = useState(false);

  async function marquer(nouveau: "EN_COURS" | "RESOLU") {
    setEncours(true);
    try {
      await apiRequest(`/admin/assistance/${id}`, { method: "PATCH", body: { statut: nouveau } });
      toast({ variant: "success", title: nouveau === "RESOLU" ? "Marqué réglé" : "Marqué en cours" });
      router.refresh();
    } catch (err) {
      toast({
        variant: "error",
        title: "Impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
      });
    } finally {
      setEncours(false);
    }
  }

  return (
    <div className="flex gap-2">
      {statut !== "EN_COURS" ? (
        <Button variant="outline" size="sm" disabled={encours} onClick={() => marquer("EN_COURS")}>
          En cours
        </Button>
      ) : null}
      {statut !== "RESOLU" ? (
        <Button variant="outline" size="sm" disabled={encours} onClick={() => marquer("RESOLU")}>
          Marquer réglé
        </Button>
      ) : null}
    </div>
  );
}
