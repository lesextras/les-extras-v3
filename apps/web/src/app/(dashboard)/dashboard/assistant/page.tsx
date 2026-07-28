// Assistant d'écriture professionnelle — page du tableau de bord.
// Server Component minimal : l'en-tête explicatif est rendu côté serveur,
// le studio (interactif) est un composant client.
import type { Metadata } from "next";
import { requireSession } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { AssistantStudio } from "../../../_shared/AssistantStudio";

export const metadata: Metadata = { title: "Assistant d'écriture" };

export default async function AssistantPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistant d'écriture"
        subtitle="Vos notes brutes deviennent des écrits professionnels — notes d'observation, rapports, transmissions, comptes rendus. Vous dictez ou tapez, l'assistant met en forme, vous relisez et validez. Comptez trois minutes au lieu de trente."
      />
      <AssistantStudio />
    </div>
  );
}
