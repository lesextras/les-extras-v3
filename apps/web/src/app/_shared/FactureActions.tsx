"use client";

/**
 * CYCLE DE VIE D'UNE FACTURE — côté émetteur.
 *
 * Les routes qui émettent, encaissent et annulent une facture existaient
 * depuis le début et n'étaient appelées par aucun écran : une facture naissait
 * en brouillon et y restait indéfiniment. Concrètement, une formation vendue
 * ne pouvait pas être facturée depuis le produit, et le bouton « Payer en
 * ligne » du client — conditionné au statut « émise » — ne s'affichait jamais.
 *
 * Émettre est un acte qui engage : la facture prend sa date, part par e-mail au
 * payeur, et son numéro est consommé pour de bon. On le confirme donc, et on ne
 * propose l'annulation que tant que rien n'a été encaissé.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import type { InvoiceStatus } from "./types";

export function FactureActions({
  invoiceId,
  accountId,
  statut,
  /** Faux quand la facture nous est adressée : on la lit, on ne la pilote pas. */
  estEmetteur,
  compact,
}: {
  invoiceId: string;
  accountId: string;
  statut: InvoiceStatus;
  estEmetteur: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [enCours, setEnCours] = useState(false);

  if (!estEmetteur) return null;

  async function agir(
    action: "issue" | "pay" | "cancel",
    succes: { title: string; description: string },
  ) {
    setEnCours(true);
    try {
      await apiRequest(`/invoices/${invoiceId}/${action}`, { method: "PATCH", accountId });
      toast({ ...succes, variant: "success" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setEnCours(false);
    }
  }

  const taille: "sm" | "md" = compact ? "sm" : "md";

  if (statut === "DRAFT") {
    return (
      <div className="flex items-center gap-2">
        <Button
          size={taille}
          disabled={enCours}
          onClick={() => {
            if (
              !window.confirm(
                "Émettre cette facture ?\n\nElle prend sa date, son numéro est définitivement consommé, et le client en est averti par e-mail.",
              )
            ) {
              return;
            }
            void agir("issue", {
              title: "Facture émise",
              description: "Le client vient d'être averti par e-mail.",
            });
          }}
        >
          {enCours ? "…" : "Émettre la facture"}
        </Button>
      </div>
    );
  }

  if (statut === "ISSUED") {
    return (
      <div className="flex items-center gap-2">
        <Button
          size={taille}
          variant="outline"
          disabled={enCours}
          onClick={() =>
            agir("pay", {
              title: "Règlement enregistré",
              description: "La facture est marquée réglée.",
            })
          }
        >
          Marquer réglée
        </Button>
        <Button
          size={taille}
          variant="ghost"
          disabled={enCours}
          onClick={() => {
            if (!window.confirm("Annuler cette facture ? Son numéro reste consommé.")) return;
            void agir("cancel", {
              title: "Facture annulée",
              description: "Son numéro reste consommé : la séquence légale est continue.",
            });
          }}
        >
          Annuler
        </Button>
      </div>
    );
  }

  return null;
}
