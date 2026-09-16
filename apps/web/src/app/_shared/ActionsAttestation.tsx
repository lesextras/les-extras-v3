"use client";

// Délivrer ou annuler une commande d'attestation.
//
// ⚠ LE BOUTON EST DÉSACTIVÉ TANT QUE LE DÉLAI DE RÉTRACTATION COURT, et son
// info-bulle dit jusqu'à quand. Le serveur refuse de toute façon — c'est lui
// qui fait foi — mais un bouton actif qui renvoie un refus se lit comme une
// panne, et on finit par cliquer trois fois.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

/**
 * L'APERÇU DU DOCUMENT — et il ne délivre rien.
 *
 * ⚠ REGARDER N'EST PAS DÉLIVRER. Sans ce lien, la seule façon de vérifier
 * l'orthographe d'un nom sur la pièce serait de l'envoyer à la personne,
 * c'est-à-dire trop tard : une attestation nominative mal orthographiée se
 * rectifie sans frais, mais elle est déjà partie.
 */
function VoirLeDocument({ id }: { id: string }) {
  return (
    <Button asChild size="sm" variant="ghost">
      <a
        href={`/api/proxy/attestations/admin/${id}/document.pdf`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FileText />
        Voir
      </a>
    </Button>
  );
}

export function ActionsAttestation({
  id,
  statut,
  bloqueeJusquA,
}: {
  id: string;
  statut: "EN_ATTENTE_PAIEMENT" | "PAYEE" | "DELIVREE" | "ANNULEE";
  /** Date ISO de fin du délai de rétractation, ou null si on peut délivrer. */
  bloqueeJusquA: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function agir(action: "delivrer" | "annuler") {
    if (action === "annuler") {
      const motif = window.prompt(
        "Motif de l’annulation (rétractation, remboursement, erreur) :",
      );
      if (motif === null) return;
      setBusy(true);
      try {
        await apiRequest(`/attestations/admin/${id}/annuler`, {
          method: "POST",
          body: { motif },
        });
        toast({ title: "Commande annulée" });
        router.refresh();
      } catch (err) {
        toast({
          title: "Action impossible",
          description: err instanceof Error ? err.message : undefined,
          variant: "error",
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      await apiRequest(`/attestations/admin/${id}/delivrer`, { method: "POST" });
      toast({
        title: "Attestation délivrée",
        description: "Le message est parti à l’adresse indiquée à la commande.",
        variant: "success",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Délivrance impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (statut === "ANNULEE") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (statut === "EN_ATTENTE_PAIEMENT") {
    return <span className="text-xs text-muted-foreground">En attente du paiement</span>;
  }
  // Une commande délivrée garde son document sous la main : c'est ce qui permet
  // de le renvoyer quand un courriel se perd, sans rien re-déclencher.
  if (statut === "DELIVREE") {
    return (
      <div className="flex justify-end">
        <VoirLeDocument id={id} />
      </div>
    );
  }

  const limite = bloqueeJusquA
    ? new Date(bloqueeJusquA).toLocaleDateString("fr-FR")
    : null;

  return (
    <div className="flex justify-end gap-2">
      <VoirLeDocument id={id} />
      <Button
        size="sm"
        disabled={busy || Boolean(bloqueeJusquA)}
        title={
          limite
            ? `L’acheteur n’a pas demandé l’exécution immédiate : son droit de rétractation court jusqu’au ${limite}.`
            : "Envoyer l’attestation à l’adresse indiquée à la commande"
        }
        onClick={() => void agir("delivrer")}
      >
        Délivrer
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={busy}
        onClick={() => void agir("annuler")}
      >
        Annuler
      </Button>
    </div>
  );
}
