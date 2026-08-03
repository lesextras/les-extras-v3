// La fiche d'une personne : sa place, son dossier, ses contrats.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { FichePersonne, type ContratResume } from "../../../../_shared/FichePersonne";
import type { MembreListe, PageMembres, Repartition } from "../../../../_shared/EquipeTable";

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

  // On récupère la personne par la même liste que l'écran d'équipe, filtrée
  // sur elle : une seule forme de données, donc un seul enrichissement à
  // maintenir (service, interne/externe, complétude du dossier).
  const [liste, repartition, contrats] = await Promise.all([
    fetchApi<PageMembres>(session, `/memberships?perPage=100`),
    fetchApi<Repartition>(session, "/memberships/repartition"),
    fetchApi<ContratListe[]>(session, "/contrats"),
  ]);

  if (liste.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fiche personne" />
        <ErrorState retryHref={`/dashboard/equipe/${userId}`} />
      </div>
    );
  }

  const membre: MembreListe | undefined = liste.data?.items.find((m) => m.user.id === userId);
  if (!membre) notFound();

  const siens: ContratResume[] = (contrats.data ?? [])
    .filter((c) => c.user?.id === userId)
    .map((c) => ({
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
        subtitle="Sa place dans la structure, l'état de son dossier et les contrats que vous avez conclus avec elle."
      />
      <FichePersonne
        membre={membre}
        accountId={session.account.id}
        services={repartition.data?.services ?? []}
        contrats={siens}
        canManage={canManage}
        estMoiMeme={membre.user.id === session.user.id}
      />
    </div>
  );
}
