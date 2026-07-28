// Générateur d'activités éducatives & thérapeutiques.
import type { Metadata } from "next";
import { estAdherent, requireSession } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { ActivityGenerator } from "../../../_shared/ActivityGenerator";
import { AdherentGate } from "../../../_shared/AdherentGate";

export const metadata: Metadata = { title: "LEX · Générateur d'activités" };

export default async function ActivitesPage() {
  const session = await requireSession();
  const adherent = await estAdherent(session);

  if (!adherent) {
    return (
      <AdherentGate
        titre="LEX — le générateur d'activités éducatives"
        description="Décrivez votre public et les besoins à travailler : LEX conçoit des activités structurées — déroulé, matériel, variantes, points de vigilance — à valider en équipe."
        benefices={[
          "Deux propositions structurées par demande",
          "Points de vigilance et indicateurs d'observation inclus",
          "Noms masqués avant tout traitement",
          "Inclus aussi : assistant d'écriture et bot d'aide LEX",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="LEX · Générateur d'activités"
        subtitle="Décrivez votre public et les besoins à travailler : l'assistant conçoit des activités éducatives structurées — déroulé, matériel, variantes et points de vigilance. Chaque proposition doit être validée en équipe pluridisciplinaire avant mise en œuvre."
      />
      <ActivityGenerator />
    </div>
  );
}
