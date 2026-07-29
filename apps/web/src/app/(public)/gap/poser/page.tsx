import type { Metadata } from "next";
import { requireSession, fetchApi } from "@/app/_shared/server";
import { PageHeader } from "@/app/_shared/ui";
import { PoserQuestion } from "@/app/_shared/PoserQuestion";

export const metadata: Metadata = { title: "Déposer une situation" };

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
        title="Déposer une situation dans le GAP"
        subtitle="Mettez sur la table ce qui vous occupe. D'autres professionnels vous renverront leur lecture et ce qu'ils ont tenté. Vous publiez anonymement, et les prénoms cités sont masqués automatiquement."
      />
      <PoserQuestion accountId={session.account.id} metierParDefaut={data?.profile?.job ?? undefined} />
    </div>
  );
}
