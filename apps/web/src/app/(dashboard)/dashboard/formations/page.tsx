// Espace Formation (dashboard) — role-aware.
// ESTABLISHMENT : deux parcours mis en avant (catalogue certifiant ADéPA vs
//   formation interne via un salarié référent) + liste des formations internes.
// FREELANCE : programmes dont il est propriétaire / sessions qu'il anime.
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState, SectionTitle } from "../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormationInterneModal } from "../../../_shared/FormationInterneModal";
import { ProposerFormationModal } from "../../../_shared/ProposerFormationModal";

export const metadata: Metadata = { title: "Formations" };

interface FormationRow {
  id: string;
  title: string;
  type: "CERTIFIANTE" | "INTERNE";
  status: string;
  durationHours?: number | null;
  categoryRef?: { title?: string | null } | null;
  _count?: { sessions?: number };
}

interface SessionRow {
  id: string;
  title?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  maxSeats?: number | null;
  status: string;
  formation?: { id: string; title: string; certifying: boolean } | null;
  _count?: { inscriptions?: number };
}

const SESSION_ETAT: Record<string, { label: string; variant: "success" | "outline" | "muted" | "soft" }> = {
  SCHEDULED: { label: "Programmée", variant: "outline" },
  OPEN: { label: "Inscriptions ouvertes", variant: "success" },
  FULL: { label: "Complète", variant: "soft" },
  RUNNING: { label: "En cours", variant: "success" },
  DONE: { label: "Terminée", variant: "muted" },
  CANCELLED: { label: "Annulée", variant: "muted" },
};

const jour = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return { label: "Publiée", variant: "success" as const };
    case "ARCHIVED":
    case "CLOSED":
      return { label: "Archivée", variant: "muted" as const };
    default:
      return { label: "Brouillon", variant: "outline" as const };
  }
}

export default async function DashboardFormationsPage() {
  const session = await requireSession();
  const isEstablishment = session.account.type === "ESTABLISHMENT";
  const [res, resSessions] = await Promise.all([
    fetchApi<{ items: FormationRow[]; total: number }>(session, "/formations?perPage=100"),
    // Les sessions dont on a la charge — y compris celles d'un programme qui
    // ne nous appartient pas. C'est le cas normal du formateur intervenant
    // désigné par un établissement.
    fetchApi<SessionRow[]>(session, "/formations/mes-sessions"),
  ]);
  const formations = res.data?.items ?? [];
  const sessions = resSessions.data ?? [];
  const aujourdhui = Date.now();
  const aVenir = sessions.filter(
    (s) => new Date(s.endDate ?? s.startDate).getTime() >= aujourdhui && s.status !== "CANCELLED",
  );
  const passees = sessions.filter(
    (s) => new Date(s.endDate ?? s.startDate).getTime() < aujourdhui || s.status === "CANCELLED",
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={isEstablishment ? "Formation" : "Mes formations"}
        subtitle={
          isEstablishment
            ? "Deux façons de faire monter vos équipes en compétences."
            : "Programmes que vous gérez et sessions que vous animez."
        }
        actions={
          !isEstablishment ? (
            <div className="flex flex-wrap items-center gap-2">
              {/* Un intervenant peut proposer son propre programme : ADéPA le
                  relit et le publie sous sa certification Qualiopi. Jusqu'ici
                  seuls les établissements pouvaient créer une formation. */}
              <ProposerFormationModal accountId={session.account.id} />
              <Button asChild variant="outline">
                <Link href="/marketplace/formations">Voir le catalogue</Link>
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* ESTABLISHMENT : les deux parcours, côte à côte. */}
      {isEstablishment ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="flex flex-col border-primary/25 bg-primary/5">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <Badge variant="soft">Certifiante</Badge>
                <Badge variant="success">Qualiopi · CPF</Badge>
              </div>
              <h3 className="font-semibold text-foreground">S’inscrire au catalogue ADéPA</h3>
              <p className="flex-1 text-sm text-muted-foreground">
                Faites former vos salariés par un formateur expert. Formations certifiantes,
                finançables (CPF, OPCO), certificat à la clé.
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/marketplace/formations">Parcourir le catalogue</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col border-secondary/25 bg-secondary/5">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Interne</Badge>
                <Badge variant="muted">Sans Qualiopi</Badge>
              </div>
              <h3 className="font-semibold text-foreground">Former en interne</h3>
              <p className="flex-1 text-sm text-muted-foreground">
                Un salarié référent forme ses collègues. Parcours simplifié, attestation de fin
                de formation délivrée par votre établissement.
              </p>
              <FormationInterneModal
                accountId={session.account.id}
                trigger={<Button variant="secondary" className="w-full sm:w-auto">Créer une formation interne</Button>}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* LES SESSIONS DONT J'AI LA CHARGE.
          Placées avant la liste des programmes, parce que c'est là que se
          trouve le travail du jour : émarger, suivre les apprenants, délivrer
          les attestations. Un programme se consulte ; une session se tient. */}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          <SectionTitle
            title={`Sessions à animer — ${aVenir.length}`}
            action={
              passees.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {passees.length} session{passees.length > 1 ? "s" : ""} passée
                  {passees.length > 1 ? "s" : ""}
                </span>
              ) : undefined
            }
          />
          <div className="space-y-3">
            {[...aVenir, ...passees].slice(0, 20).map((s) => {
              const etat = SESSION_ETAT[s.status] ?? { label: s.status, variant: "outline" as const };
              const inscrits = s._count?.inscriptions ?? 0;
              const complet = s.maxSeats != null && inscrits >= s.maxSeats;
              return (
                <Card key={s.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold text-foreground">
                        {s.formation?.title ?? s.title ?? "Session"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {jour(s.startDate)}
                        {s.endDate && s.endDate.slice(0, 10) !== s.startDate.slice(0, 10)
                          ? ` → ${jour(s.endDate)}`
                          : ""}
                        {s.location ? ` · ${s.location}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {inscrits} inscrit{inscrits > 1 ? "s" : ""}
                        {s.maxSeats != null
                          ? complet
                            ? ` · complet (${s.maxSeats} places)`
                            : ` · ${s.maxSeats - inscrits} place${s.maxSeats - inscrits > 1 ? "s" : ""} restante${s.maxSeats - inscrits > 1 ? "s" : ""}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant={etat.variant}>{etat.label}</Badge>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/formations/${s.id}`}>Ouvrir la session</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Liste des formations. */}
      <div className="space-y-4">
        <SectionTitle
          title={isEstablishment ? "Mes formations internes" : "Mes programmes & sessions"}
          action={
            isEstablishment && formations.length > 0 ? (
              <FormationInterneModal
                accountId={session.account.id}
                trigger={<Button size="sm" variant="outline">Nouvelle formation interne</Button>}
              />
            ) : undefined
          }
        />

        {res.error ? (
          <ErrorState retryHref="/dashboard/formations" />
        ) : formations.length === 0 ? (
          <EmptyState
            title={isEstablishment ? "Aucune formation interne" : "Aucune formation"}
            description={
              isEstablishment
                ? "Créez votre première formation interne et désignez un salarié formateur, ou inscrivez vos équipes au catalogue certifiant."
                : "Vous n’animez encore aucune session. Proposez votre propre programme : ADéPA le relit, puis le publie au catalogue sous sa certification Qualiopi."
            }
            action={
              isEstablishment ? (
                <FormationInterneModal accountId={session.account.id} />
              ) : (
                <ProposerFormationModal accountId={session.account.id} />
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formations.map((f) => {
              const st = statusBadge(f.status);
              const sessions = f._count?.sessions ?? 0;
              return (
                <Card key={f.id} className="flex h-full flex-col">
                  <CardHeader className="space-y-2 pb-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={f.type === "INTERNE" ? "outline" : "soft"}>
                        {f.type === "INTERNE" ? "Interne" : "Certifiante"}
                      </Badge>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-3">
                    <p className="text-xs text-muted-foreground">
                      {f.durationHours ? `${f.durationHours} h · ` : ""}
                      {sessions} session{sessions > 1 ? "s" : ""}
                      {f.categoryRef?.title ? ` · ${f.categoryRef.title}` : ""}
                    </p>
                    <Button asChild variant="link" size="sm" className="justify-start px-0">
                      <Link href={`/marketplace/formations/${f.id}`}>Ouvrir la fiche →</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
