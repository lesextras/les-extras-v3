"use client";

// Bouton de l'essai Découverte : gratuit, une fois par compte, 7 jours de
// recharge quotidienne. Pas de Stripe ici — un POST, puis on recharge la
// page pour que le solde et la jauge se mettent à jour côté serveur.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function EssaiLexButton({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reclamer() {
    setLoading(true);
    try {
      await apiRequest("/billing/essai", { method: "POST", accountId });
      toast({
        title: "Essai Découverte activé",
        description: "Vos crédits sont là — bonne écriture ! Recharge chaque matin pendant 7 jours.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Essai indisponible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
      setLoading(false);
    }
  }

  return (
    <Button onClick={reclamer} disabled={loading} loading={loading}>
      Activer l&apos;essai gratuit
    </Button>
  );
}
