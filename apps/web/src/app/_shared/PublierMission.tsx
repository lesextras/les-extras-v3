"use client";

/**
 * Publier une mission restée en brouillon.
 *
 * L'impasse que ce bouton referme : quand la publication échouait au moment de
 * la création, le message disait « Ouvrez la mission dans RenforTeam et
 * cliquez sur Publier » — et aucun bouton « Publier » n'existait sur aucun
 * écran. Une mission en brouillon était définitivement coincée.
 *
 * La publication déclenche la cascade de diffusion : salariés d'abord, puis
 * réseau réservé, puis marketplace publique.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function PublierMission({
  missionId,
  accountId,
}: {
  missionId: string;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function publier() {
    setBusy(true);
    try {
      await apiRequest(`/missions/${missionId}/publish`, {
        method: "POST",
        body: {},
        accountId,
      });
      toast({
        title: "Renfort publié",
        description:
          "La diffusion en cascade démarre : votre équipe d'abord, puis votre réseau, puis la marketplace.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Publication impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" loading={busy} onClick={publier}>
      Publier
    </Button>
  );
}
