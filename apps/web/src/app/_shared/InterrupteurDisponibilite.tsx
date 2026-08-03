"use client";

/**
 * « JE SUIS DISPONIBLE » / « JE FAIS UNE PAUSE ».
 *
 * Le champ `Profile.available` existait depuis toujours et pesait pour 15 %
 * dans le score de matching — mais aucun écran ne permettait de le changer.
 * Résultat : un intervenant en arrêt, en congés ou déjà complet continuait de
 * recevoir des sollicitations, et un établissement perdait une journée à
 * attendre une réponse qui n'allait pas venir. La donnée était lue partout et
 * modifiable nulle part.
 *
 * Se mettre en pause n'efface rien : le profil reste visible, les fiches
 * restent en ligne, les réservations en cours suivent leur cours. Seule la
 * remontée dans les suggestions faiblit. C'est dit à l'écran, parce que la
 * peur de « disparaître » est ce qui empêche les gens d'utiliser ce bouton.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function InterrupteurDisponibilite({
  accountId,
  disponible,
}: {
  accountId: string;
  disponible: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [etat, setEtat] = useState(disponible);
  const [busy, setBusy] = useState(false);

  async function basculer() {
    const cible = !etat;
    setBusy(true);
    try {
      await apiRequest("/users/me", {
        method: "PATCH",
        accountId,
        body: { available: cible },
      });
      setEtat(cible);
      toast({
        title: cible ? "Vous êtes de nouveau disponible" : "Vous êtes en pause",
        description: cible
          ? "Vous réapparaissez dans les suggestions envoyées aux établissements."
          : "Vous ne serez plus suggéré tant que vous n'aurez pas rebasculé. Votre profil et vos fiches restent en ligne.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Changement impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">
            {etat ? "Disponible pour des interventions" : "En pause"}
          </p>
          <Badge variant={etat ? "success" : "muted"}>{etat ? "Actif" : "En pause"}</Badge>
        </div>
        <p className="mt-0.5 max-w-prose text-xs text-muted-foreground">
          {etat
            ? "Vous apparaissez dans les suggestions envoyées aux établissements qui cherchent un renfort."
            : "Vous n'apparaissez plus dans les suggestions. Votre profil, vos fiches et vos interventions en cours ne bougent pas — rebasculez quand vous voulez."}
        </p>
      </div>
      <Button
        size="sm"
        variant={etat ? "outline" : "primary"}
        onClick={basculer}
        disabled={busy}
      >
        {busy ? "…" : etat ? "Me mettre en pause" : "Redevenir disponible"}
      </Button>
    </div>
  );
}
