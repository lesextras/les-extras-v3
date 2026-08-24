// Appui scolaire : le troisième outil de LEX, pour l'enfant qui décroche.
import type { Metadata } from "next";
import { estAdherent, requireSession } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { AppuiScolaireGenerator } from "../../../_shared/AppuiScolaireGenerator";
import { AdherentGate } from "../../../_shared/AdherentGate";

export const metadata: Metadata = { title: "LEX · Appui scolaire" };

export default async function AppuiScolairePage() {
  const session = await requireSession();
  const adherent = await estAdherent(session);

  if (!adherent) {
    return (
      <AdherentGate
        titre="LEX — l’appui scolaire"
        description="Dites l’âge de l’enfant, la matière et ce que vous observez : LEX prépare le support à poser sur la table — fiche mémo, script de déblocage, jeu de révision."
        benefices={[
          "Un support prêt à l’emploi, sans matériel rare",
          "Comment l’amener, quoi faire si ça bloque",
          "Aucun diagnostic, jamais : on part de ce qui est observé",
          "Inclus aussi : assistant d’écriture et générateur d’activités",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="LEX · Appui scolaire"
        subtitle="Pour l’enfant qui décroche : décrivez ce que vous observez, LEX prépare un support utilisable dès la prochaine séance. Il ne pose aucun diagnostic et ne remplace pas l’enseignant — le support est à ajuster avec lui."
      />
      <AppuiScolaireGenerator />
    </div>
  );
}
