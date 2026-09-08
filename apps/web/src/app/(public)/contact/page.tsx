// Page de contact publique.
import type { Metadata } from "next";
import { ContactForm } from "../../_shared/ContactForm";
// Venues de l'accueil le 08/09/2026 : la demande de catalogue n'existait
// nulle part ailleurs, elle se range ici, avec le formulaire de contact.
import { CartesContact } from "../../_shared/CartesContact";
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: "Contact, écrire à l’équipe ADéPA",
  description:
    "Contactez l'équipe ADéPA, Les Extras, la marketplace du renfort médico-social. Établissements, intervenants, formations : écrivez-nous.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Nous contacter</h1>
      <p className="mt-2 text-muted-foreground">
        Une question sur le renfort, une mission, une formation ou un partenariat&nbsp;? Écrivez-nous, l&apos;équipe
        ADéPA vous répond rapidement.
      </p>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <a href="mailto:contact@adepa77.fr" className="hover:text-foreground">
          contact@adepa77.fr
        </a>
        <span aria-hidden>·</span>
        <span>ADéPA, Melun (77)</span>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <ContactForm />
        </div>
      </div>

      {/* Recevoir le catalogue complet par e-mail, sans créer de compte. */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Recevez aussi le catalogue
        </h2>
        <p className="mt-2 text-muted-foreground">
          Toutes nos interventions détaillées&nbsp;: publics, objectifs, tarifs.
        </p>
        <div className="mt-8">
          <CartesContact />
        </div>
      </div>
    </div>
  );
}
