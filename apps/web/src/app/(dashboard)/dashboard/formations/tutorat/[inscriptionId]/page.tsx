// Tutorat / accompagnement d'un apprenant.
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../../../_shared/server";
import { PageHeader } from "../../../../../_shared/ui";
import { TutoratPanel } from "../../../../../_shared/TutoratPanel";

export const metadata: Metadata = { title: "Tutorat" };

interface TutoratData {
  id: string;
  projetAvenir?: string | null;
  entretiens?: { id: string; date: string; notes?: string | null }[];
  jalons?: { id: string; label: string; dueDate?: string | null; status: "PENDING" | "DONE" }[];
}
interface InscriptionLite {
  learnerName?: string | null;
  learner?: { firstName?: string | null; lastName?: string | null } | null;
}

export default async function TutoratPage({ params }: { params: { inscriptionId: string } }) {
  const session = await requireSession();
  const [tutoratRes, insRes] = await Promise.all([
    fetchApi<TutoratData | null>(session, `/tutorat/inscription/${params.inscriptionId}`),
    fetchApi<InscriptionLite>(session, `/formations/inscriptions/${params.inscriptionId}`),
  ]);

  const ins = insRes.data;
  const learner = ins?.learner
    ? [ins.learner.firstName, ins.learner.lastName].filter(Boolean).join(" ")
    : ins?.learnerName ?? "Apprenant";

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/dashboard/formations" className="text-muted-foreground hover:text-foreground">
          ← Retour aux formations
        </Link>
      </div>
      <PageHeader title={`Tutorat — ${learner}`} subtitle="Accompagnement individualisé : projet d'avenir, jalons et entretiens de suivi." />
      <TutoratPanel
        inscriptionId={params.inscriptionId}
        accountId={session.account.id}
        tutorat={tutoratRes.data ?? null}
      />
    </div>
  );
}
