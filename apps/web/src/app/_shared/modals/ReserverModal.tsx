"use client";

// « Réserver directement » sur une fiche publique.
//
// C’était un lien sec vers la fiche connectée : quelqu’un sans compte cliquait,
// tombait sur une page de connexion, et ne comprenait ni ce qu’on lui demandait
// ni pourquoi. Le devis, lui, se demande sans compte — autant le dire là.
//
// ⚠ PREMIÈRE VERSION RETIRÉE LE 22/09 : elle appelait `useVisiteur()`, dont le
// contexte n’est pas monté sur cette route. Le hook jetait au montage et React
// abandonnait l’hydratation de TOUTE la page — plus un bouton ne répondait,
// sans la moindre erreur en console. On interroge donc `/api/visiteur`
// directement, et un échec se résout en lien simple plutôt qu’en page morte.
import { useEffect, useState } from "react";
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

export function ReserverModal({ serviceId }: { serviceId: string }) {
  const destination = `/marketplace/services/${serviceId}`;
  // null = on ne sait pas encore. On ne dresse pas un mur devant quelqu’un qui
  // est peut-être déjà connecté : tant qu’on ignore, le lien direct.
  const [connecte, setConnecte] = useState<boolean | null>(null);

  useEffect(() => {
    let vivant = true;
    fetch("/api/visiteur")
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (vivant) setConnecte(v?.connecte === true);
      })
      .catch(() => {
        if (vivant) setConnecte(null);
      });
    return () => {
      vivant = false;
    };
  }, []);

  const libelle = "Réserver directement, j’ai un compte";

  if (connecte === null || connecte) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={destination}>{libelle}</Link>
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {libelle}
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
          Vous préférez ne rien créer pour l’instant ? Fermez cette fenêtre et
          demandez un devis : c’est sans compte et sans engagement.
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button asChild variant="outline">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Créer un compte</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
