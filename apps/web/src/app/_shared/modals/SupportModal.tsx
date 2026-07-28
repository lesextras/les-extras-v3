"use client";

// « Contacter le support » ouvre le même formulaire que celui de l'accueil.
//
// Il pointait auparavant vers /dashboard/inbox, la messagerie interne : or
// celle-ci sert à écrire à un établissement ou à un intervenant, pas à
// joindre l'équipe de la plateforme. Une personne bloquée y écrivait dans le
// vide. Le support, c'est un contact avec ADéPA : c'est donc le formulaire de
// contact, à l'identique, confettis de confirmation compris.
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ContactForm } from "../ContactForm";

/** Sujets propres à une demande d'aide, différents de ceux de l'accueil
 *  (qui servent à qualifier un prospect, pas à router un problème). */
const SUJETS_SUPPORT = [
  "Un problème technique",
  "Une question sur mon compte",
  "Une question sur une facture",
  "Une question sur une mission ou un atelier",
  "Une suggestion d'amélioration",
  "Autre",
];

export function SupportModal({
  trigger,
  utilisateur,
  open: ouvertPilote,
  onOpenChange,
}: {
  /** Absent en mode piloté : l'ouverture vient d'ailleurs (menu déroulant). */
  trigger?: React.ReactNode;
  /** Identité connue : on ne la redemande pas. */
  utilisateur?: { name?: string | null; email?: string | null };
  /** Mode piloté — un élément de menu se referme au clic et ne peut donc pas
   *  porter lui-même le déclencheur de la modale. */
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [ouvertInterne, setOuvertInterne] = useState(false);
  const pilote = ouvertPilote !== undefined;
  const open = pilote ? ouvertPilote : ouvertInterne;
  const setOpen = (v: boolean) => (pilote ? onOpenChange?.(v) : setOuvertInterne(v));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="size-5 text-primary" aria-hidden />
            Contacter l&apos;équipe
          </DialogTitle>
          <DialogDescription>
            Une question, un blocage, une idée ? Écrivez-nous : l&apos;équipe ADéPA vous répond du
            lundi au vendredi.
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          sujets={SUJETS_SUPPORT}
          valeursInitiales={{
            name: utilisateur?.name ?? undefined,
            email: utilisateur?.email ?? undefined,
          }}
          // La modale reste ouverte sur le message de confirmation : la
          // refermer aussitôt donnerait l'impression que rien ne s'est passé.
          onEnvoye={() => window.setTimeout(() => setOpen(false), 4000)}
        />
      </DialogContent>
    </Dialog>
  );
}
