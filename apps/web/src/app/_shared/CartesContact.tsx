"use client";

// Deux cartes illustrées qui ouvrent le formulaire en modale. La modale est
// rendue dans un portail, donc hors du conteneur .theme-sombre de la page :
// on lui applique explicitement le thème pour qu'elle prenne la couleur du
// fond au lieu de trancher en blanc.
import * as React from "react";
import Image from "next/image";
import { ArrowRight, Mail, MessageSquare } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CatalogueRequestForm } from "./CatalogueRequestForm";
import { ContactForm } from "./ContactForm";

const CARTES = [
  {
    cle: "catalogue" as const,
    titre: "Recevoir notre catalogue",
    // Le nombre était écrit en dur (« 15 ») et divergeait du compteur réel
    // affiché plus haut sur la même page. Deux chiffres différents pour la
    // même chose, c'est le genre de détail qui fait douter du reste.
    texte: "Toutes nos interventions détaillées — publics, objectifs, tarifs — dans votre boîte mail.",
    action: "Demander le catalogue",
    image: "https://app.les-extras.fr/wp-content/uploads/2025/02/lever-vous.jpeg",
    icone: Mail,
    dialogTitre: "Recevoir le catalogue 2026",
    dialogTexte: "Renseignez vos coordonnées : le catalogue complet arrive par e-mail, sans créer de compte.",
  },
  {
    cle: "contact" as const,
    titre: "Nous écrire",
    texte: "Une question sur un atelier, une formation, un renfort ou un partenariat ? L'équipe ADéPA vous répond.",
    action: "Envoyer un message",
    image: "https://app.les-extras.fr/wp-content/uploads/2026/04/school.jpeg",
    icone: MessageSquare,
    dialogTitre: "Écrire à l'équipe",
    dialogTexte: "Décrivez votre besoin : nous revenons vers vous sous 48 h ouvrées.",
  },
];

export function CartesContact() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {CARTES.map((c) => {
        const Icone = c.icone;
        return (
          <Dialog key={c.cle}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="group overflow-hidden rounded-3xl border border-border/70 bg-card text-left shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                <div className="relative aspect-[16/9] w-full bg-muted">
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-5 grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
                    <Icone className="size-5" />
                  </span>
                </div>
                <div className="p-6 md:p-7">
                  <h3 className="text-xl font-semibold">{c.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.texte}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {c.action}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="theme-sombre max-h-[90vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{c.dialogTitre}</DialogTitle>
                <DialogDescription>{c.dialogTexte}</DialogDescription>
              </DialogHeader>
              {c.cle === "catalogue" ? <CatalogueRequestForm /> : <ContactForm />}
            </DialogContent>
          </Dialog>
        );
      })}
    </div>
  );
}
