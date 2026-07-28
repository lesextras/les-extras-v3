// Générateur d'activités éducatives & thérapeutiques.
import type { Metadata } from "next";
import { requireSession } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { ActivityGenerator } from "../../../_shared/ActivityGenerator";

export const metadata: Metadata = { title: "Générateur d'activités" };

export default async function ActivitesPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Générateur d'activités"
        subtitle="Décrivez votre public et les besoins à travailler : l'assistant conçoit des activités éducatives structurées — déroulé, matériel, variantes et points de vigilance. Chaque proposition doit être validée en équipe pluridisciplinaire avant mise en œuvre."
      />
      <ActivityGenerator />
    </div>
  );
}
