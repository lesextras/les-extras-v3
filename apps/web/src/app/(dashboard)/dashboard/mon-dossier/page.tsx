// MON DOSSIER — les pièces obligatoires, vues du côté de la personne.
//
// Le coffre-fort de conformité était unilatéral : l'établissement documentait
// l'intervenant, et l'intervenant n'y avait aucun accès. Il ne pouvait ni voir
// ce qui manquait à son dossier, ni déposer sa carte d'identité — il fallait
// l'envoyer par courriel et attendre que quelqu'un la saisisse à sa place.
//
// La règle appliquée ici : vous fournissez, la structure valide. Une pièce
// déposée repart toujours « en attente de vérification », y compris si la
// requête demande autre chose. C'est ce qui préserve le sens du tableau de
// conformité côté établissement.
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { MonDossier, type MonDossierData } from "../../../_shared/MonDossier";

export const metadata: Metadata = { title: "Mon dossier" };

export default async function MonDossierPage() {
  const session = await requireSession();
  const res = await fetchApi<MonDossierData>(session, "/conformite/mes-documents");

  const intervenant = session.account.type === "FREELANCE";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon dossier"
        subtitle={
          intervenant
            ? "Les pièces que les établissements attendent avant de vous confier une intervention. Vous les déposez ici une fois — elles servent partout."
            : "Les pièces obligatoires de votre dossier professionnel dans cette structure."
        }
        actions={
          intervenant ? (
            <Button asChild variant="outline">
              <Link href="/dashboard/opportunites">Voir mes opportunités</Link>
            </Button>
          ) : undefined
        }
      />

      {res.error || !res.data ? (
        <ErrorState
          retryHref="/dashboard/mon-dossier"
          description={res.error ?? "Dossier indisponible pour le moment."}
        />
      ) : (
        <MonDossier initial={res.data} accountId={session.account.id} />
      )}
    </div>
  );
}
