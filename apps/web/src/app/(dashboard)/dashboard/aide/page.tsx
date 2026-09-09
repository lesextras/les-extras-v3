// Écrire à l'équipe Les Extras.
//
// ⚠ CE QUE CETTE PAGE RÉPARE. Le seul moyen de nous joindre était le
// formulaire de contact public : on y re-saisissait son nom et son adresse, le
// message arrivait sans qu'on sache de quel compte il venait, et la réponse
// partait par courriel — sans trace, introuvable ensuite. Ici, l'échange
// appartient au compte, il reste, et il se retrouve.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { Assistance, type FilAssistance } from "../../../_shared/Assistance";

export const metadata: Metadata = { title: "Aide" };

export default async function AidePage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<FilAssistance[]>(session, "/assistance");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Une question, un problème ?"
        subtitle="Écrivez-nous ici. Nous répondons dans cette page, et vous recevez un e-mail dès que c'est fait."
      />

      {error ? (
        <ErrorState
          title="Lecture impossible"
          description="Vos échanges n'ont pas pu être chargés. Vous pouvez tout de même écrire : rechargez la page dans un instant."
        />
      ) : (
        <Assistance fils={data ?? []} accountId={session.account.id} />
      )}
    </div>
  );
}
