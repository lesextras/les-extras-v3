// SIGNER — la page du signataire.
//
// La personne qui doit signer son CDD n'a pas accès à la fiche contrat, qui
// appartient au compte de l'établissement. Cette page est SA porte d'entrée :
// c'est elle que le courriel du code met en lien. Le serveur ne lui montre que
// les demandes adressées à sa propre adresse.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { SignerClient, type DemandeSignature } from "../../../../_shared/SignerClient";

export const metadata: Metadata = { title: "Signer un document" };

export default async function SignerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const res = await fetchApi<DemandeSignature>(session, `/signatures/${id}`);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Signature d'un document"
        subtitle="Saisissez le code à six chiffres reçu par courriel. Il est valable quinze minutes et ne sert qu'une fois."
      />
      {res.error || !res.data ? (
        <ErrorState
          retryHref={`/dashboard/signer/${id}`}
          description={
            res.error ??
            "Demande introuvable. Vérifiez que vous êtes connecté avec le compte auquel la demande est adressée."
          }
        />
      ) : (
        <SignerClient demande={res.data} accountId={session.account.id} />
      )}
    </div>
  );
}
