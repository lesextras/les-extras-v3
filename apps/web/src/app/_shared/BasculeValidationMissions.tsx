"use client";

// Réglage du compte : validation hiérarchique des missions.
// Si actif, une mission publiée par un manager attend l'approbation
// d'un propriétaire/admin avant diffusion.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function BasculeValidationMissions({
  accountId,
  canManage,
}: {
  accountId: string;
  canManage: boolean;
}) {
  const { toast } = useToast();
  const [actif, setActif] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<{ validationMissions?: boolean }>(`/accounts/${accountId}`, { accountId })
      .then((a) => setActif(Boolean(a?.validationMissions)))
      .catch(() => setActif(false));
  }, [accountId]);

  async function basculer() {
    if (actif === null) return;
    setBusy(true);
    try {
      await apiRequest(`/accounts/${accountId}`, {
        method: "PATCH",
        accountId,
        body: { validationMissions: !actif },
      });
      setActif(!actif);
      toast({
        title: !actif ? "Validation hiérarchique activée" : "Validation hiérarchique désactivée",
        description: !actif
          ? "Les missions publiées par un manager attendront l'approbation d'un responsable."
          : "Les managers diffusent de nouveau leurs missions directement.",
      });
    } catch (err) {
      toast({
        title: "Modification impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-border pb-4">
      <div>
        <p className="font-medium text-foreground">Validation hiérarchique des missions</p>
        <p>
          Une mission publiée par un manager attend l&apos;approbation d&apos;un propriétaire ou
          admin avant d&apos;être diffusée.
        </p>
      </div>
      {canManage ? (
        <Button size="sm" variant={actif ? "primary" : "outline"} onClick={basculer} disabled={busy || actif === null}>
          {actif === null ? "…" : actif ? "Activée" : "Désactivée"}
        </Button>
      ) : (
        <span className="text-xs">{actif ? "Activée" : "Désactivée"}</span>
      )}
    </div>
  );
}
