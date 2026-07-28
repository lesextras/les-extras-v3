// Boîte à idées — la communauté propose, vote, et l'équipe arbitre.
// Volontairement ouverte à tous les comptes (pas de garde adhérent) : c'est
// un canal d'écoute, pas une fonctionnalité vendue.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { IdeaBox, type IdeaItem } from "../../../_shared/IdeaBox";

export const metadata: Metadata = { title: "Boîte à idées" };

export default async function IdeesPage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<IdeaItem[]>(session, "/community/idees");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Boîte à idées"
        subtitle="Ce que vous demandez ici oriente vraiment les prochaines versions. Proposez, votez — les idées les plus soutenues passent en priorité, et une idée retenue rapporte 40 points."
      />
      {error ? (
        <ErrorState description={error} />
      ) : (
        <IdeaBox
          idees={data ?? []}
          accountId={session.account.id}
          estAdmin={session.user.role === "ADMIN"}
        />
      )}
    </div>
  );
}
