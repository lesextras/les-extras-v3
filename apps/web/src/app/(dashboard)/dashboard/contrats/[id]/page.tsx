// Fiche d'un CDD : formulaire + synthèse calculée par l'API.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { ContratDetail } from "../../../../_shared/ContratDetail";
import { SignatureBloc, type SignatureLigne } from "../../../../_shared/SignatureBloc";
import type {
  Contrat,
  MotifRecoursOption,
  SyntheseContrat,
} from "../../../../_shared/contrats-types";

export const metadata: Metadata = { title: "Contrat CDD" };

/**
 * Le salarié à faire signer, quand on connaît son adresse. Sans adresse, on
 * ne propose rien : envoyer un code de signature dans le vide ferait croire
 * à une demande partie alors qu'elle n'existe pas.
 */
function signataires(c: Contrat): { nom: string; email: string; userId?: string }[] {
  const u = c.user;
  if (!u?.email) return [];
  const nom = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
  return [{ nom, email: u.email, userId: u.id }];
}

export default async function ContratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  if (session.account.type !== "ESTABLISHMENT") redirect("/dashboard");

  const [fiche, motifs, signatures] = await Promise.all([
    fetchApi<{ contrat: Contrat; synthese: SyntheseContrat }>(session, `/contrats/${id}`),
    fetchApi<MotifRecoursOption[]>(session, "/contrats/motifs"),
    fetchApi<{ items: SignatureLigne[]; prestataireActif: string | null }>(
      session,
      `/signatures/document?type=CONTRAT_CDD&id=${id}`,
    ),
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
        <>
          <ContratDetail
            contrat={fiche.data.contrat}
            synthese={fiche.data.synthese}
            motifs={motifs.data ?? []}
          />
          {/* La signature vient après la synthèse, et c'est l'ordre du
              geste : on complète les mentions obligatoires, on vérifie ce que
              l'outil a calculé, puis on met à la signature. Proposer de
              signer un contrat auquel il manque une mention serait proposer
              de signer une requalification en CDI. */}
          <SignatureBloc
            documentType="CONTRAT_CDD"
            documentId={id}
            accountId={session.account.id}
            signatures={signatures.data?.items ?? []}
            prestataireActif={signatures.data?.prestataireActif ?? null}
            signatairesProposes={signataires(fiche.data.contrat)}
            peutDemander={["OWNER", "ADMIN", "MANAGER"].includes(session.account.role)}
          />
        </>
      )}
    </div>
  );
}
