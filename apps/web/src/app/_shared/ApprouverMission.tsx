"use client";

// Validation hiérarchique : bouton d'approbation d'une mission en attente,
// visible des OWNER/ADMIN sur le board SOS Renfort.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function ApprouverMission({ missionId, accountId }: { missionId: string; accountId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function approuver() {
    setBusy(true);
    try {
      await apiRequest(`/missions/${missionId}/approve`, { method: "POST", accountId });
      toast({ title: "Mission approuvée", description: "La diffusion vient de démarrer." });
      router.refresh();
    } catch (err) {
      toast({
        title: "Approbation impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" onClick={approuver} disabled={busy}>
      {busy ? "Approbation…" : "Approuver la diffusion"}
    </Button>
  );
}
