"use client";

// « Republier » : duplique la mission en brouillon, datée une semaine plus
// tard — l'établissement ajuste puis publie, sans rien ressaisir.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function RepublierMission({ missionId, accountId }: { missionId: string; accountId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function dupliquer() {
    setBusy(true);
    try {
      await apiRequest(`/missions/${missionId}/dupliquer`, { method: "POST", accountId });
      toast({
        title: "Brouillon créé",
        description: "Copie datée une semaine plus tard. Ajustez si besoin, puis publiez.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Duplication impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={dupliquer} disabled={busy}>
      {busy ? "Copie…" : "Republier"}
    </Button>
  );
}
