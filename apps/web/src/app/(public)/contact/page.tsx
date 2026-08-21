// Page de contact publique.
import type { Metadata } from "next";
import { ContactForm } from "../../_shared/ContactForm";
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: "Contact — écrire à l’équipe ADéPA",
  description:
    "Contactez l'équipe ADéPA — Les Extras, la marketplace du renfort médico-social. Établissements, intervenants, formations : écrivez-nous.",
  path: "/contact",
});

export default function ContactPage() {
  return (
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
        <span>ADéPA — Melun (77)</span>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ContactForm />
      </div>
    </div>
  );
}
