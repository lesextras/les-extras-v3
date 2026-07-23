// Attestation d'assiduité imprimable (authentifié, hors AppShell).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { FormationDocument, type DocInscription } from "../../../_shared/FormationDocument";

export const metadata: Metadata = { title: "Attestation d'assiduité" };

export default async function AttestationPage({ params }: { params: { inscriptionId: string } }) {
  const session = await requireSession();
  const res = await fetchApi<DocInscription>(session, `/formations/inscriptions/${params.inscriptionId}`);
  if (res.error || !res.data) notFound();
  return <FormationDocument inscription={res.data} kind="attestation" />;
}
