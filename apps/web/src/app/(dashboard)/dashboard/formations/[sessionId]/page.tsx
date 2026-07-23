// Détail d'une session : inscrits + feuille d'émargement.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmargementSheet } from "../../../../_shared/EmargementSheet";
import { InscribeButton } from "../../../../_shared/InscribeButton";

export const metadata: Metadata = { title: "Session · Les Extras" };

interface Inscription {
  id: string;
  learnerName?: string | null;
  learner?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
  status: string;
  financing: string;
}
interface SessionDetail {
  id: string;
  title?: string | null;
  startDate: string;
  location?: string | null;
  status: string;
  formation?: { title?: string | null; type?: string; certifying?: boolean } | null;
  trainer?: { firstName?: string | null; lastName?: string | null } | null;
  inscriptions?: Inscription[];
}

function learnerLabel(i: Inscription) {
  if (i.learner) {
    const n = [i.learner.firstName, i.learner.lastName].filter(Boolean).join(" ");
    return n || i.learner.email || "Apprenant";
  }
  return i.learnerName || "Apprenant";
}

export default async function SessionDetailPage({ params }: { params: { sessionId: string } }) {
  const session = await requireSession();
  const res = await fetchApi<SessionDetail>(session, `/formations/sessions/${params.sessionId}`);
  const s = res.data;

  if (res.error || !s) {
    return (
      <div className="space-y-6">
        <PageHeader title="Session" />
        <ErrorState retryHref="/dashboard/formations" description="Session introuvable ou accès refusé." />
      </div>
    );
  }

  const rows = (s.inscriptions ?? []).map((i) => ({ id: i.id, name: learnerLabel(i) }));
  const defaultDate = new Date(s.startDate).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.formation?.title ?? s.title ?? "Session"}
        subtitle={new Date(s.startDate).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
        actions={<InscribeButton sessionId={s.id} accountId={session.account.id} />}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={s.formation?.type === "INTERNE" ? "outline" : "soft"}>
          {s.formation?.type === "INTERNE" ? "Interne" : "Certifiante"}
        </Badge>
        {s.location ? <Badge variant="outline">{s.location}</Badge> : null}
        {s.trainer ? (
          <Badge variant="outline">
            Formateur : {[s.trainer.firstName, s.trainer.lastName].filter(Boolean).join(" ")}
          </Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Apprenants inscrits ({rows.length})</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {(s.inscriptions ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Aucun inscrit.</p>
            ) : (
              (s.inscriptions ?? []).map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-sm font-medium">{learnerLabel(i)}</span>
                  <span className="text-xs text-muted-foreground">{i.financing}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">Émargement</h3>
          </CardHeader>
          <CardContent>
            <EmargementSheet accountId={session.account.id} rows={rows} defaultDate={defaultDate} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
