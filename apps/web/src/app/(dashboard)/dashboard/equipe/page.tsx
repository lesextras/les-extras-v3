// L'ÉQUIPE — liste paginée des personnes rattachées à l'établissement.
//
// Cet écran remplace l'onglet « Équipe » de la fiche compte, qui renvoyait
// tout le monde d'un coup. Il devient une entrée de menu à part entière :
// c'est le point d'entrée vers les personnes, et donc vers leurs pièces,
// leurs contrats.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { EquipeTable, type PageMembres } from "../../../_shared/EquipeTable";

export const metadata: Metadata = { title: "Équipe" };

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const session = await requireSession();
  if (session.account.type !== "ESTABLISHMENT") redirect("/dashboard");


  // On rejoue côté serveur exactement la requête que l'adresse décrit : une
  // recherche partagée par lien doit s'ouvrir sur le même résultat.
  const p = new URLSearchParams({ perPage: "25" });
  for (const clef of ["q", "orgUnitId", "role", "page"] as const) {
    const v = sp[clef];
    if (typeof v === "string" && v) p.set(clef, v);
  }

  const liste = await fetchApi<PageMembres>(session, `/memberships?${p.toString()}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        subtitle="Les personnes de votre établissement et l’état de leur dossier. Chacune a son propre compte : pour rejoindre, un collègue crée le sien avec le même SIRET, et l’organigramme vous réunit."
        /* PLUS D'INVITATION NI D'IMPORT D'ÉQUIPE (23/09/2026) : le compte, c'est
           la personne. On n'invite plus quelqu'un « dans » son compte ; il crée
           le sien. Les composants restent dans le dépôt, réversible en une ligne. */
      />
      {liste.error ? (
        <ErrorState retryHref="/dashboard/equipe" />
      ) : (
        <>
          <EquipeTable
            initial={liste.data ?? { items: [], total: 0, page: 1, perPage: 25, pages: 1 }}
          />
        </>
      )}
    </div>
  );
}
