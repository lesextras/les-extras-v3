"use client";

// « Réserver directement » sur une fiche publique.
//
// C’était un lien sec vers la fiche connectée : quelqu’un sans compte cliquait,
// tombait sur une page de connexion, et ne comprenait ni ce qu’on lui demandait
// ni pourquoi. Le devis, lui, se demande sans compte — autant le dire à ce
// moment-là plutôt que de le laisser deviner.
//
// Connecté, rien ne change : on va droit à la fiche où l’on réserve.
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
import { useVisiteur } from "@/app/_shared/Visiteur";

export function ReserverModal({ serviceId }: { serviceId: string }) {
  const visiteur = useVisiteur();
  const destination = `/marketplace/services/${serviceId}`;

  // `null` = on ne sait pas encore. On ne dresse pas un mur devant quelqu’un
  // qui est peut-être déjà connecté : tant qu’on ignore, le lien direct.
  if (visiteur === null || visiteur.connecte) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={destination}>Réserver directement, j&apos;ai un compte</Link>
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Réserver directement, j&apos;ai un compte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réserver demande un compte</DialogTitle>
          <DialogDescription>
            La réservation retient une date et produit une facture : il faut
            savoir au nom de qui. La création prend une minute.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Vous préférez ne rien créer pour l&apos;instant ? Fermez cette fenêtre et
          demandez un devis : c&apos;est sans compte et sans engagement.
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button asChild variant="outline">
            <Link href={`/login?next=${encodeURIComponent(destination)}`}>
              Se connecter
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/register?next=${encodeURIComponent(destination)}`}>
              Créer un compte
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
