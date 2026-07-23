// Certificat de réalisation imprimable (parcours certifiant uniquement).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { FormationDocument, type DocInscription } from "../../../_shared/FormationDocument";

export const metadata: Metadata = { title: "Certificat de réalisation" };

export default async function CertificatPage({ params }: { params: { inscriptionId: string } }) {
  const session = await requireSession();
  const res = await fetchApi<DocInscription>(session, `/formations/inscriptions/${params.inscriptionId}`);
  if (res.error || !res.data) notFound();
  // Le certificat n'est délivré que pour les formations certifiantes.
  if (!res.data.session?.formation?.certifying) notFound();
  return <FormationDocument inscription={res.data} kind="certificat" />;
}
