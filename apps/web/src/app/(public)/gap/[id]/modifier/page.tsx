// Correction d'une situation, par son auteur uniquement. L'API refuse de
// toute façon toute autre main : cette page ne fait que présenter le
// formulaire déjà rempli.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader } from "../../../../_shared/ui";
import { PoserQuestion } from "../../../../_shared/PoserQuestion";
import type { QuestionDetail } from "../../../../_shared/gap";

export const metadata: Metadata = { title: "Corriger ma situation" };

export default async function ModifierSituationPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  const { data } = await fetchApi<QuestionDetail>(session, `/gap/${params.id}`);
  if (!data) notFound();
  // On ne montre pas un formulaire qui échouera : si ce n'est pas la vôtre,
  // retour à la situation.
  if (!data.estMienne) redirect(`/gap/${params.id}`);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Corriger votre situation"
        subtitle="Vous pouvez préciser, reformuler, ajouter ce que vous avez tenté depuis. Les prénoms restent masqués automatiquement à l’enregistrement."
      />
      <PoserQuestion
        accountId={session.account.id}
        aModifier={{
          id: data.id,
          title: data.title,
          situation: data.situation,
          tente: data.tente,
          metier: data.metier,
          publicVise: data.publicVise,
        }}
      />
    </div>
  );
}
