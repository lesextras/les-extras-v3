// Fiche d'un programme (certifiant ou interne) + sessions ouvertes + inscription.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InscribeButton } from "../../../_shared/InscribeButton";

export const metadata: Metadata = { title: "Formation" };

interface SessionItem {
  id: string;
  title?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  maxSeats?: number | null;
  status: string;
  trainer?: { id?: string; firstName?: string | null; lastName?: string | null } | null;
  _count?: { inscriptions?: number };
}
interface FormationDetail {
  id: string;
  title: string;
  type?: "CERTIFIANTE" | "INTERNE";
  summary?: string | null;
  objectives?: string | null;
  program?: string | null;
  prerequisites?: string | null;
  targetAudience?: string | null;
  durationHours?: number | null;
  certifying?: boolean;
  cpfEligible?: boolean;
  ownerAccount?: { id?: string; name?: string | null } | null;
  categoryRef?: { title?: string | null } | null;
  sessions?: SessionItem[];
  /** Moyenne des appréciations stagiaires (Qualiopi, indicateur 30). */
  rating?: number | null;
  ratingCount?: number;
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function trainerName(t?: SessionItem["trainer"]) {
  if (!t) return null;
  return [t.firstName, t.lastName].filter(Boolean).join(" ") || null;
}

// Rappel visuel du cycle de vie d'une formation.
function Pipeline({ certifying }: { certifying: boolean }) {
  const steps = ["Catalogue", "Session", "Inscription", "Émargement", certifying ? "Certificat" : "Attestation"];
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
            {step}
          </span>
          {i < steps.length - 1 ? <span className="text-muted-foreground/50" aria-hidden>→</span> : null}
        </div>
      ))}
    </div>
  );
}

export default async function FormationDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const res = await fetchApi<FormationDetail>(session, `/formations/${params.id}`);
  const f = res.data;

  if (res.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Formation" />
        <ErrorState
          retryHref={`/marketplace/formations/${params.id}`}
          description="Impossible de charger cette formation pour le moment."
        />
      </div>
    );
  }
  if (!f) notFound();

  const isCertifying = f.type !== "INTERNE";
  const sessions = f.sessions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={f.title} subtitle={f.ownerAccount?.name ?? "ADéPA"} />

      <div className="flex flex-wrap gap-2">
        <Badge variant={isCertifying ? "soft" : "outline"}>{isCertifying ? "Certifiante" : "Interne"}</Badge>
        {f.cpfEligible ? <Badge>CPF</Badge> : null}
        {isCertifying ? <Badge variant="success">Qualiopi</Badge> : null}
        {f.categoryRef?.title ? <Badge variant="outline">{f.categoryRef.title}</Badge> : null}
        {f.durationHours ? <Badge variant="muted">{f.durationHours} h</Badge> : null}
      </div>

      {/* Satisfaction stagiaires : preuve sociale déjà collectée à l'inscription. */}
      {f.rating ? (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span className="text-amber-400" aria-hidden>
            ★
          </span>
          {f.rating.toFixed(1)}/5
          <span className="font-normal text-muted-foreground">
            — satisfaction de {f.ratingCount} stagiaire{(f.ratingCount ?? 0) > 1 ? "s" : ""}
          </span>
        </p>
      ) : null}

      <Pipeline certifying={isCertifying} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {f.summary ? <p className="text-muted-foreground">{f.summary}</p> : null}
          {f.objectives ? (
            <section>
              <h3 className="mb-1.5 font-semibold text-foreground">Objectifs pédagogiques</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{f.objectives}</p>
            </section>
          ) : null}
          {f.program ? (
            <section>
              <h3 className="mb-1.5 font-semibold text-foreground">Programme</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{f.program}</p>
            </section>
          ) : null}
          {f.prerequisites ? (
            <section>
              <h3 className="mb-1.5 font-semibold text-foreground">Prérequis</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{f.prerequisites}</p>
            </section>
          ) : null}
          {f.targetAudience ? (
            <section>
              <h3 className="mb-1.5 font-semibold text-foreground">Public visé</h3>
              <p className="text-sm text-muted-foreground">{f.targetAudience}</p>
            </section>
          ) : null}
        </div>

        <div>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <h3 className="font-semibold text-foreground">Sessions ouvertes</h3>
              <p className="text-xs text-muted-foreground">
                Choisissez une date et inscrivez vos apprenants.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length > 0 ? (
                sessions.map((s) => {
                  const seatsTaken = s._count?.inscriptions ?? 0;
                  const isFull = s.maxSeats ? seatsTaken >= s.maxSeats : false;
                  const tName = trainerName(s.trainer);
                  return (
                    <div key={s.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{fmtDate(s.startDate)}</p>
                        {isFull ? (
                          <Badge variant="warning">Complète</Badge>
                        ) : s.maxSeats ? (
                          <Badge variant="success">
                            {Math.max(s.maxSeats - seatsTaken, 0)} place{s.maxSeats - seatsTaken > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <Badge variant="muted">Places libres</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.location ?? "Lieu à définir"}
                        {s.maxSeats ? ` · ${seatsTaken}/${s.maxSeats} inscrits` : ` · ${seatsTaken} inscrit(s)`}
                      </p>
                      {tName ? (
                        <p className="text-xs text-muted-foreground">Formateur : {tName}</p>
                      ) : null}
                      <div className="mt-2.5 flex items-center gap-3">
                        <InscribeButton sessionId={s.id} accountId={session.account.id} />
                        {/* Lien de gestion : uniquement pour l'organisateur de la
                            formation ou le formateur de la session — pour les
                            autres, la page de gestion refuserait l'accès. */}
                        {f.ownerAccount?.id === session.account.id ||
                        s.trainer?.id === session.user.id ? (
                          <a
                            href={`/dashboard/formations/${s.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Gérer / émargement
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aucune session ouverte pour le moment.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Contactez ADéPA pour planifier une date adaptée à votre équipe.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
