"use client";

// « Réserver » — et d’abord : comment on paie.
//
// Le bouton menait droit à la fiche connectée sans jamais dire comment
// l’intervention se règle. Or c’est la question que se pose un chef de service
// avant de cliquer : est-ce que je sors ma carte, ou est-ce que ça passe en
// facture pour la compta ? On répond avant, et LE CHOIX EST ENREGISTRÉ : il
// part dans l’URL, la réservation le renvoie au serveur, et il reste sur la
// réservation — personne ne relancera par carte quelqu’un qui a dit « sur
// facture ».
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
  const vers = (mode: "CARTE" | "VIREMENT") =>
    `/marketplace/services/${serviceId}?paiement=${mode}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Réserver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comment souhaitez-vous régler ?</DialogTitle>
          <DialogDescription>
            Votre choix est enregistré sur la réservation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {paiementEnLigne ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">
                Par carte, tout de suite
              </p>
              <p className="text-sm text-muted-foreground">
                La date est retenue immédiatement et l’intervenant est payé
                directement.
              </p>
              <Button asChild className="w-full">
                <Link href={vers("CARTE")}>Réserver et payer par carte</Link>
              </Button>
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">
              Par virement, sur facture
            </p>
            <p className="text-sm text-muted-foreground">
              Vous recevez un devis, puis une facture après accord. Le virement
              se fait à réception : c’est le chemin habituel d’un établissement.
            </p>
            <Button asChild variant={paiementEnLigne ? "outline" : "primary"} className="w-full">
              <Link href={vers("VIREMENT")}>Réserver, facture par virement</Link>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Réserver demande un compte : sa création prend une minute. Sans compte,
          demandez plutôt un devis, qui lui ne demande rien.
        </p>
      </DialogContent>
    </Dialog>
  );
}
