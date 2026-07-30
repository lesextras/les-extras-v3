// GTA — Congés & compteurs de l'établissement.
// Un membre pose sa demande ; un responsable (OWNER/ADMIN/MANAGER) décide,
// suit les compteurs et exporte les éléments de paie.
import type { Metadata } from "next";
import { requireSession } from "../../../_shared/server";
import { PageHeader, EmptyState } from "../../../_shared/ui";
import { GestionConges } from "../../../_shared/GestionConges";

export const metadata: Metadata = { title: "Congés & compteurs" };

export default async function CongesPage() {
  const session = await requireSession();

  if (session.account.type !== "ESTABLISHMENT") {
    return (
      <div className="space-y-6">
        <PageHeader title="Congés & compteurs" />
        <EmptyState
          title="Réservé aux établissements"
          description="La gestion des congés et des compteurs concerne les équipes salariées des établissements."
        />
      </div>
    );
  }

  const canDecide = ["OWNER", "ADMIN", "MANAGER"].includes(session.account.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Congés & compteurs"
        subtitle={
          canDecide
            ? "Décidez des demandes d'absence, suivez les heures planifiées et les soldes de congés, exportez les éléments de paie."
            : "Posez vos demandes d'absence : vos responsables sont prévenus et décident depuis cette même page."
        }
      />
      <GestionConges accountId={session.account.id} canDecide={canDecide} />
    </div>
  );
}
