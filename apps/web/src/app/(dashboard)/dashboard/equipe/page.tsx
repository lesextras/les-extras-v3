// L'ÉQUIPE — liste paginée des personnes rattachées à l'établissement.
//
// Cet écran remplace l'onglet « Équipe » de la fiche compte, qui renvoyait
// tout le monde d'un coup. Il devient une entrée de menu à part entière :
// c'est le point d'entrée vers les personnes, et donc vers leurs pièces,
// leurs contrats et leur service.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { InviteMemberModal } from "../../../_shared/modals/InviteMemberModal";
import { ImportEquipeCsv } from "../../../_shared/ImportEquipeCsv";
import { MembersManager } from "../../../_shared/MembersManager";
import {
  EquipeTable,
  type PageMembres,
  type Repartition,
} from "../../../_shared/EquipeTable";
import type { Invitation } from "../../../_shared/types";

export const metadata: Metadata = { title: "Équipe" };

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const session = await requireSession();
  if (session.account.type !== "ESTABLISHMENT") redirect("/dashboard");

  const canManage = session.account.role === "OWNER" || session.account.role === "ADMIN";

  // On rejoue côté serveur exactement la requête que l'adresse décrit : une
  // recherche partagée par lien doit s'ouvrir sur le même résultat.
  const p = new URLSearchParams({ perPage: "25" });
  for (const clef of ["q", "orgUnitId", "role", "page"] as const) {
    const v = sp[clef];
    if (typeof v === "string" && v) p.set(clef, v);
  }

  const [liste, repartition, invitations] = await Promise.all([
    fetchApi<PageMembres>(session, `/memberships?${p.toString()}`),
    fetchApi<Repartition>(session, "/memberships/repartition"),
    fetchApi<Invitation[]>(session, "/invitations?status=PENDING"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        subtitle="Les personnes rattachées à votre établissement : leur service, leur rôle, et l'état de leur dossier. Cliquez sur quelqu'un pour ouvrir sa fiche."
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              <ImportEquipeCsv accountId={session.account.id} />
              <InviteMemberModal
                accountId={session.account.id}
                services={repartition.data?.services ?? []}
              />
            </div>
          ) : undefined
        }
      />
      {liste.error ? (
        <ErrorState retryHref="/dashboard/equipe" />
      ) : (
        <>
          <EquipeTable
            initial={liste.data ?? { items: [], total: 0, page: 1, perPage: 25, pages: 1 }}
            repartition={repartition.data ?? { total: 0, sansService: 0, services: [] }}
          />
          {canManage ? (
            <MembersManager
              afficher="invitations"
              accountId={session.account.id}
              currentUserId={session.user.id}
              canManage={canManage}
              members={[]}
              invitations={invitations.data ?? []}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
