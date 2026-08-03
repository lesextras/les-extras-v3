// Fiche d'un CDD : formulaire + synthèse calculée par l'API.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { ContratDetail } from "../../../../_shared/ContratDetail";
import type {
  Contrat,
  MotifRecoursOption,
  SyntheseContrat,
} from "../../../../_shared/contrats-types";

export const metadata: Metadata = { title: "Contrat CDD" };

export default async function ContratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (session.account.type !== "ESTABLISHMENT") redirect("/dashboard");

  const [fiche, motifs] = await Promise.all([
    fetchApi<{ contrat: Contrat; synthese: SyntheseContrat }>(session, `/contrats/${id}`),
    fetchApi<MotifRecoursOption[]>(session, "/contrats/motifs"),
  ]);

  if (fiche.error?.includes("introuvable")) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contrat à durée déterminée"
        subtitle="Votre établissement est l’employeur. Complétez les mentions obligatoires : la synthèse se met à jour à chaque enregistrement."
      />
      {fiche.error || !fiche.data ? (
        <ErrorState retryHref={`/dashboard/contrats/${id}`} />
      ) : (
        <ContratDetail
          contrat={fiche.data.contrat}
          synthese={fiche.data.synthese}
          motifs={motifs.data ?? []}
        />
      )}
    </div>
  );
}
