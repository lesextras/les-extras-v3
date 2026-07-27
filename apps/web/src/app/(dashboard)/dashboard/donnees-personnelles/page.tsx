// Mes données personnelles (RGPD) : rappel des droits de la personne, export
// de ses données et demande de suppression du compte.
import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireSession } from "../../../_shared/server";
import { PageHeader, SectionTitle } from "../../../_shared/ui";
import { PrivacyPanel } from "../../../_shared/PrivacyPanel";

export const metadata: Metadata = {
  title: "Mes données personnelles · Les Extras",
};

/** Les trois droits que cette page rend concrets, expliqués sans jargon. */
const DROITS = [
  {
    titre: "Savoir ce qu'on garde sur vous",
    texte:
      "Vous pouvez demander à tout moment la liste complète des informations que nous détenons à votre sujet, et à quoi elles servent. C'est le point de départ : on ne peut pas contrôler ce qu'on ne voit pas.",
  },
  {
    titre: "Emporter vos données ailleurs",
    texte:
      "Le fichier que vous téléchargez est dans un format standard, lisible par un humain comme par un autre logiciel. Vous restez libre de partir avec votre CV, vos disponibilités et votre historique.",
  },
  {
    titre: "Faire effacer vos données",
    texte:
      "Vous pouvez demander la suppression de votre compte. Nous effaçons alors tout ce qui vous identifie. Quelques écritures comptables et dossiers de formation restent conservés parce que la loi nous y oblige : c'est expliqué en clair plus bas.",
  },
];

export default async function DonneesPersonnellesPage() {
  await requireSession();

  // Date calculée côté serveur : le nom du fichier téléchargé est ainsi stable
  // entre le rendu serveur et le rendu client (pas d'écart d'hydratation).
  const exportDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes données personnelles"
        subtitle="Consulter, emporter ou faire effacer les informations que Les Extras conserve à votre sujet."
      />

      <Card>
        <CardHeader>
          <SectionTitle title="Vos droits, en clair" />
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="max-w-3xl text-sm text-muted-foreground">
            Les Extras manipule des informations sensibles : votre identité, vos
            pièces justificatives, vos coordonnées bancaires, vos heures
            travaillées. Vous gardez la main dessus. Trois droits s&apos;appliquent,
            et cette page permet de les exercer directement, sans passer par un
            formulaire de contact.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {DROITS.map((droit) => (
              <div key={droit.titre} className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">
                  {droit.titre}
                </h3>
                <p className="text-sm text-muted-foreground">{droit.texte}</p>
              </div>
            ))}
          </div>
          <p className="max-w-3xl text-xs text-muted-foreground">
            Une question, une information inexacte à corriger, ou une demande que
            cette page ne couvre pas ? Écrivez-nous : nous répondons dans le délai
            légal d&apos;un mois.
          </p>
        </CardContent>
      </Card>

      <PrivacyPanel exportDate={exportDate} />
    </div>
  );
}
