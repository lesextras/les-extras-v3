// Assistant d'écriture professionnelle — page du tableau de bord.
// Server Component minimal : l'en-tête explicatif est rendu côté serveur,
// le studio (interactif) est un composant client.
import type { Metadata } from "next";
import { requireSession } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { AssistantStudio } from "../../../_shared/AssistantStudio";
import { AdherentGate } from "../../../_shared/AdherentGate";

export const metadata: Metadata = { title: "LEX · Assistant d'écriture" };

export default async function AssistantPage() {
  const session = await requireSession();
  const adherent = Boolean(session.account?.isMember) || session.user.role === "ADMIN";

  if (!adherent) {
    return (
      <AdherentGate
        titre="LEX — l'assistant d'écriture professionnelle"
        description="Vos notes brutes deviennent des écrits professionnels : notes d'observation, rapports de situation, transmissions, comptes rendus. Trois minutes au lieu de trente."
        benefices={[
          "Noms masqués avant tout traitement, notes jamais stockées",
          "5 trames professionnelles avec cadre déontologique",
          "Vous relisez et validez : vous restez l'auteur",
          "Inclus aussi : générateur d'activités et bot d'aide LEX",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="LEX · Assistant d'écriture"
        subtitle="Vos notes brutes deviennent des écrits professionnels — notes d'observation, rapports, transmissions, comptes rendus. Vous dictez ou tapez, l'assistant met en forme, vous relisez et validez. Comptez trois minutes au lieu de trente."
      />
      <AssistantStudio />
    </div>
  );
}
