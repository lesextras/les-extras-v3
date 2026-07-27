// Détail d'une session : inscrits + feuille d'émargement.
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmargementSheet } from "../../../../_shared/EmargementSheet";
import { InscribeButton } from "../../../../_shared/InscribeButton";
import { InscriptionDeliverables } from "../../../../_shared/InscriptionDeliverables";

export const metadata: Metadata = { title: "Session" };

const FINANCING_LABEL: Record<string, string> = {
  ESTABLISHMENT: "Établissement",
  CPF: "CPF",
  OPCO: "OPCO",
  PERSONAL: "Personnel",
  POLE_EMPLOI: "France Travail",
};

const INSCRIPTION_STATUS: Record<string, { label: string; variant: "success" | "warning" | "outline" | "muted" }> = {
  CONFIRMED: { label: "Confirmé", variant: "success" },
  COMPLETED: { label: "Terminé", variant: "success" },
  PENDING: { label: "En attente", variant: "warning" },
  CANCELLED: { label: "Annulé", variant: "muted" },
};

interface Inscription {
  id: string;
  learnerName?: string | null;
  learner?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
  status: string;
  financing: string;
  invoiceId?: string | null;
}
interface SessionDetail {
  id: string;
  title?: string | null;
  startDate: string;
  location?: string | null;
  status: string;
  maxSeats?: number | null;
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

  const inscriptions = s.inscriptions ?? [];
  const rows = inscriptions.map((i) => ({ id: i.id, name: learnerLabel(i) }));
  const defaultDate = new Date(s.startDate).toISOString().slice(0, 10);
  const isInterne = s.formation?.type === "INTERNE";
  const seatsLabel = s.maxSeats ? `${inscriptions.length}/${s.maxSeats}` : `${inscriptions.length}`;
  const trainer = s.trainer ? [s.trainer.firstName, s.trainer.lastName].filter(Boolean).join(" ") : null;

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/dashboard/formations" className="text-muted-foreground hover:text-foreground">
          ← Retour aux formations
        </Link>
      </div>

      <PageHeader
        title={s.formation?.title ?? s.title ?? "Session"}
        subtitle={new Date(s.startDate).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
        actions={<InscribeButton sessionId={s.id} accountId={session.account.id} />}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={isInterne ? "outline" : "soft"}>{isInterne ? "Interne" : "Certifiante"}</Badge>
        <Badge variant="muted">{seatsLabel} inscrits</Badge>
        {s.location ? <Badge variant="outline">{s.location}</Badge> : null}
        {trainer ? <Badge variant="outline">Formateur : {trainer}</Badge> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-foreground">Apprenants inscrits ({inscriptions.length})</h3>
            <p className="text-xs text-muted-foreground">
              {isInterne
                ? "À l’issue, une attestation de fin de formation pourra être délivrée."
                : "À l’issue et après émargement complet, le certificat est délivré."}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {inscriptions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">Aucun apprenant inscrit.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Utilisez « Inscrire un apprenant » pour ajouter des stagiaires.
                </p>
              </div>
            ) : (
              inscriptions.map((i) => {
                const st = INSCRIPTION_STATUS[i.status] ?? { label: i.status, variant: "outline" as const };
                return (
                  <div key={i.id} className="rounded-lg border border-border px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-medium text-foreground">{learnerLabel(i)}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {FINANCING_LABEL[i.financing] ?? i.financing}
                        </span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 border-t border-border pt-2">
                      <InscriptionDeliverables
                        inscriptionId={i.id}
                        accountId={session.account.id}
                        certifying={Boolean(s.formation?.certifying)}
                        invoiced={Boolean(i.invoiceId)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-foreground">Feuille d’émargement</h3>
            <p className="text-xs text-muted-foreground">
              Enregistrez les présences par apprenant et par demi-journée.
            </p>
          </CardHeader>
          <CardContent>
            <EmargementSheet accountId={session.account.id} rows={rows} defaultDate={defaultDate} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
