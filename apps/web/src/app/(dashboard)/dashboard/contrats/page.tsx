// Contrats à durée déterminée conclus par l'établissement.
//
// L'établissement est l'employeur : la plateforme trouve la personne, elle
// ne la met pas à disposition. C'est ce qui distingue ce produit d'une
// agence d'intérim, et c'est pourquoi cet écran n'existe que côté
// ESTABLISHMENT.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { ContratsListe } from "../../../_shared/ContratsListe";
import type {
  Contrat,
  MotifRecoursOption,
  SalariePossible,
} from "../../../_shared/contrats-types";

export const metadata: Metadata = { title: "Contrats CDD" };

export default async function ContratsPage() {
  const session = await requireSession();
  if (session.account.type !== "ESTABLISHMENT") redirect("/dashboard");

  const [liste, motifs, salaries] = await Promise.all([
    fetchApi<Contrat[]>(session, "/contrats"),
    fetchApi<MotifRecoursOption[]>(session, "/contrats/motifs"),
    fetchApi<SalariePossible[]>(session, "/contrats/salaries"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contrats CDD"
        subtitle="Vous embauchez, l’outil calcule : période d’essai, indemnité de fin de contrat, délai de carence et dates limites. Les mentions obligatoires sont vérifiées avant toute transmission."
      />
      {liste.error ? (
        <ErrorState retryHref="/dashboard/contrats" />
      ) : (
        <ContratsListe
          initialContrats={liste.data ?? []}
          motifs={motifs.data ?? []}
          salaries={salaries.data ?? []}
        />
      )}
    </div>
  );
}
