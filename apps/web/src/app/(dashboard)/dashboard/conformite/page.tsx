// CONFORMITÉ — les dossiers en défaut, du plus urgent au moins urgent.
//
// Cet écran ne liste plus tout le monde. Il ne répond qu'à une question :
// qui n'est pas en règle, et pour quoi. Le détail d'une personne vit sur SA
// fiche, dans l'équipe — la conformité est une propriété de quelqu'un, pas
// un annuaire parallèle. C'est ce qui permet à l'écran de rester utile
// quand la structure grandit : il ne montre que le travail restant.
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import { AlertesConformite, type PageAlertes } from "../../../_shared/AlertesConformite";
import type { Repartition } from "../../../_shared/EquipeTable";

export const metadata: Metadata = { title: "Conformité" };

export default async function ConformitePage() {
  const session = await requireSession();

  if (session.account.type !== "ESTABLISHMENT") {
    return (
      <div className="space-y-6">
        <PageHeader title="Conformité" />
        <EmptyState
          title="Réservé aux établissements"
          description="Le suivi des pièces obligatoires des intervenants est accessible depuis un compte établissement."
          action={
            <Button asChild>
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [alertes, repartition] = await Promise.all([
    fetchApi<PageAlertes>(session, "/conformite/alertes?perPage=25"),
    fetchApi<Repartition>(session, "/memberships/repartition"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conformité"
        subtitle="Les pièces obligatoires de vos intervenants — identité, diplôme, casier judiciaire, permis, IBAN, attestation URSSAF. On ne montre ici que ce qui manque ou arrive à échéance."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/equipe">Voir toute l’équipe</Link>
          </Button>
        }
      />
      {alertes.error || !alertes.data ? (
        <ErrorState retryHref="/dashboard/conformite" />
      ) : (
        <AlertesConformite
          initial={alertes.data}
          repartition={repartition.data ?? { total: 0, sansService: 0, services: [] }}
        />
      )}
    </div>
  );
}
