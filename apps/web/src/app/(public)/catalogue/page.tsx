// « Demander le catalogue » — l'aimant à leads du site historique.
// Beaucoup de directions veulent un PDF à faire circuler en réunion avant de
// réserver quoi que ce soit : cette page transforme cette habitude en contact
// qualifié plutôt qu'en visite perdue.
import type { Metadata } from "next";
import { FileText, Mail, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "../../_shared/ui";
import { CatalogueRequestForm } from "../../_shared/CatalogueRequestForm";

export const metadata: Metadata = {
  title: "Demander le catalogue 2026",
  description:
    "Recevez le catalogue 2026 des ateliers et formations Les Extras : contenus, durées, publics visés et tarifs, dans un document à partager en réunion.",
  alternates: { canonical: "/catalogue" },
};

const arguments_ = [
  { icone: <FileText className="size-5" />, titre: "Toutes les fiches", texte: "Ateliers et formations, objectifs, durées, publics visés et tarifs." },
  { icone: <ShieldCheck className="size-5" />, titre: "Qualiopi", texte: "Le détail de ce qui est finançable par votre OPCO, et comment monter le dossier." },
  { icone: <Clock className="size-5" />, titre: "Sous 48 h", texte: "Envoi par e-mail, avec un contact direct si vous voulez creuser un sujet." },
];

export default function CataloguePage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Demander le catalogue 2026"
        subtitle="Un document unique à faire circuler en réunion d’équipe : nos ateliers, nos formations certifiées Qualiopi, les publics visés et les tarifs."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          {arguments_.map((a) => (
            <Card key={a.titre}>
              <CardContent className="flex gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  {a.icone}
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">{a.titre}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{a.texte}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
            <Mail className="mt-0.5 size-3.5 shrink-0" />
            Vos coordonnées servent uniquement à vous envoyer le catalogue et à vous répondre.
            Aucune revente, désinscription à tout moment.
          </p>
        </div>

        <CatalogueRequestForm />
      </div>
    </div>
  );
}
