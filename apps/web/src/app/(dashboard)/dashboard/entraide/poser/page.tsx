import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader } from "../../../../_shared/ui";
import { PoserQuestion } from "../../../../_shared/PoserQuestion";

export const metadata: Metadata = { title: "Poser une question" };

export default async function PoserPage() {
  const session = await requireSession();
  // Pré-remplit le métier depuis le profil quand il est renseigné.
  const { data } = await fetchApi<{ profile?: { job?: string | null } | null }>(
    session,
    "/users/me",
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Poser une question à la communauté"
        subtitle="Une situation de terrain, décrite concrètement, trouve presque toujours quelqu'un qui l'a déjà vécue. C'est plus rapide qu'une recherche, et plus juste qu'un manuel."
      />
      <PoserQuestion accountId={session.account.id} metierParDefaut={data?.profile?.job ?? undefined} />
    </div>
  );
}
