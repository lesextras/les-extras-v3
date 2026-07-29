"use client";

// Blocage des entrées LEX pour un compte non adhérent.
//
// La page /dashboard/assistant sait déjà refuser l'accès, mais elle le fait
// APRÈS s'être ouverte : on quitte sa page, on attend un chargement, et on
// tombe sur un mur. Le cadenas du menu annonçait la restriction sans
// l'appliquer. Ici le clic n'ouvre plus rien : il explique, sur place, et
// propose l'adhésion. La page reste protégée pour l'accès par URL directe.
import { Lock, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BENEFICES = [
  "L'assistant d'écriture : notes brutes vers écrit professionnel",
  "Le générateur d'activités éducatives",
  "Le bot d'aide LEX, sur le site et dans votre espace",
];

export function ModaleAdherent({
  open,
  onOpenChange,
  fonctionnalite,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Nom de l'entrée cliquée, pour que le message parle de ce qu'on visait. */
  fonctionnalite?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Lock className="size-5" />
          </span>
          <DialogTitle>
            {fonctionnalite ? `${fonctionnalite} — réservé aux adhérents` : "Réservé aux adhérents"}
          </DialogTitle>
          <DialogDescription>
            Vous n’avez pas accès à cette fonctionnalité avec votre compte actuel. Les outils LEX
            sont inclus dans l’adhésion à l’association.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {BENEFICES.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="sm:flex-1" onClick={() => onOpenChange(false)}>
            <Link href="/dashboard/adhesion">
              Devenir adhérent
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
            <Link href="/contact">Parler à l’équipe</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          L’usage interne de la plateforme — missions à votre équipe, planning, formation interne,
          gestion — reste gratuit et le restera.
        </p>
      </DialogContent>
    </Dialog>
  );
}
