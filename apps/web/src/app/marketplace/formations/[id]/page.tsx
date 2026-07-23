// Fiche d'un programme certifiant + sessions ouvertes + inscription.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InscribeButton } from "../../../_shared/InscribeButton";

export const metadata: Metadata = { title: "Formation · Les Extras" };

interface SessionItem {
  id: string;
  title?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  maxSeats?: number | null;
  status: string;
  trainer?: { firstName?: string | null; lastName?: string | null } | null;
  _count?: { inscriptions?: number };
}
interface FormationDetail {
  id: string;
  title: string;
  summary?: string | null;
  objectives?: string | null;
  program?: string | null;
  prerequisites?: string | null;
  targetAudience?: string | null;
  durationHours?: number | null;
  certifying?: boolean;
  cpfEligible?: boolean;
  ownerAccount?: { name?: string | null } | null;
  categoryRef?: { title?: string | null } | null;
  sessions?: SessionItem[];
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function FormationDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const res = await fetchApi<FormationDetail>(session, `/formations/${params.id}`);
  const f = res.data;
  if (!f) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={f.title} subtitle={f.ownerAccount?.name ?? "ADéPA"} />

      <div className="flex flex-wrap gap-2">
        {f.certifying ? <Badge variant="soft">Certifiante</Badge> : null}
        {f.cpfEligible ? <Badge>CPF</Badge> : null}
        {f.categoryRef?.title ? <Badge variant="outline">{f.categoryRef.title}</Badge> : null}
        {f.durationHours ? <Badge variant="outline">{f.durationHours} h</Badge> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {f.summary ? <p className="text-muted-foreground">{f.summary}</p> : null}
          {f.objectives ? (
            <section>
              <h3 className="mb-1 font-semibold">Objectifs</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{f.objectives}</p>
            </section>
          ) : null}
          {f.program ? (
            <section>
              <h3 className="mb-1 font-semibold">Programme</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{f.program}</p>
            </section>
          ) : null}
          {f.prerequisites ? (
            <section>
              <h3 className="mb-1 font-semibold">Prérequis</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{f.prerequisites}</p>
            </section>
          ) : null}
          {f.targetAudience ? (
            <section>
              <h3 className="mb-1 font-semibold">Public visé</h3>
              <p className="text-sm text-muted-foreground">{f.targetAudience}</p>
            </section>
          ) : null}
        </div>

        <div>
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Sessions</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {f.sessions && f.sessions.length > 0 ? (
                f.sessions.map((s) => (
                  <div key={s.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium text-foreground">{fmtDate(s.startDate)}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.location ?? "À définir"}
                      {s.maxSeats ? ` · ${s._count?.inscriptions ?? 0}/${s.maxSeats} places` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <InscribeButton sessionId={s.id} accountId={session.account.id} />
                      <a
                        href={`/dashboard/formations/${s.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Gérer / émargement
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune session ouverte. Contactez ADéPA pour planifier une date.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
