// La fiche d'une personne : sa place, son dossier, ses contrats.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { FichePersonne, type ContratResume } from "../../../../_shared/FichePersonne";
import type { MembreListe } from "../../../../_shared/EquipeTable";

export const metadata: Metadata = { title: "Fiche personne" };

interface ContratListe {
  id: string;
  statut: string;
  poste: string | null;
  dateDebut: string;
  dateFin: string | null;
  user?: { id: string } | null;
}

export default async function FichePersonnePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await requireSession();
  if (session.account.type !== "ESTABLISHMENT") redirect("/dashboard");

  const canManage = session.account.role === "OWNER" || session.account.role === "ADMIN";

  // La personne par la même liste que l’écran d’équipe, filtrée sur elle.
  const [liste, contrats] = await Promise.all([
    fetchApi<MembreListe>(session, `/memberships/personne/${userId}`),
    fetchApi<{ items: ContratListe[] }>(session, `/contrats?userId=${userId}&perPage=50`),
  ]);

  if (liste.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fiche personne" />
        <ErrorState retryHref={`/dashboard/equipe/${userId}`} />
      </div>
    );
  }

  const membre = liste.data;
  if (!membre) notFound();

  const siens: ContratResume[] = (contrats.data?.items ?? []).map((c) => ({
    id: c.id,
    statut: c.statut,
    poste: c.poste,
    dateDebut: c.dateDebut,
    dateFin: c.dateFin,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiche personne"
        subtitle="Son dossier de conformité et les contrats que vous avez conclus avec elle."
      />
      <FichePersonne
        membre={membre}
        accountId={session.account.id}
        contrats={siens}
        canManage={canManage}
        estMoiMeme={membre.user.id === session.user.id}
      />
    </div>
  );
}
