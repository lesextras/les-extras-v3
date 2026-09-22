"use client";

// « Réserver » — et d’abord : comment on paie.
//
// Le bouton menait droit à la fiche connectée sans jamais dire comment
// l’intervention se règle. Or c’est la question que se pose un chef de service
// avant de cliquer : est-ce que je sors ma carte, ou est-ce que ça passe en
// facture pour la compta ? On répond avant, pas après.
//
// ⚠ AUCUN HOOK DE CONTEXTE ICI. La première version appelait `useVisiteur()`,
// dont le contexte n’est pas monté sur cette route : le hook jetait au montage
// et React abandonnait l’hydratation de TOUTE la page, sans erreur en console.
// Ce composant ne dépend de rien d’autre que de ses props.
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ReserverModal({
  serviceId,
  paiementEnLigne = false,
}: {
  serviceId: string;
  paiementEnLigne?: boolean;
}) {
  const destination = `/marketplace/services/${serviceId}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Réserver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réserver</DialogTitle>
          <DialogDescription>
            Deux façons de régler cette intervention.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {paiementEnLigne ? (
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">
                Par carte, tout de suite
              </p>
              <p className="text-sm text-muted-foreground">
                La date est retenue immédiatement et l’intervenant est payé
                directement.
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">
              Par virement, sur facture
            </p>
            <p className="text-sm text-muted-foreground">
              Vous recevez un devis, puis une facture après accord. Le virement
              se fait à réception — c’est le chemin habituel d’un établissement,
              qui ne paie pas par carte.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Réserver engage une date et produit une facture : il faut savoir au nom
          de qui. Si vous n’avez pas encore de compte, sa création prend une
          minute — ou demandez un devis, qui lui ne demande rien.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button asChild variant="outline">
            <Link href="/register">Créer un compte</Link>
          </Button>
          <Button asChild>
            <Link href={destination}>Continuer</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
