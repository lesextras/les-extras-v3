// Back-office ADMIN — les retours d'expérience (GET /admin/retours).
//
// ⚠ LES PROBLÈMES SONT EN HAUT ET SÉPARÉS DU RESTE. Un ennui vécu se traite
// dans la journée, un avis se lit quand on a le temps. Rangés dans la même
// liste chronologique, les premiers se perdent dans les seconds — c'est
// exactement ce que cet écran existe pour empêcher.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState, EmptyState } from "../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Retours d'expérience · Administration" };

interface Retour {
  id: string;
  createdAt: string;
  source: string;
  noteGlobale: number;
  noteSite?: number | null;
  noteDepot?: number | null;
  probleme?: string | null;
  commentaire?: string | null;
  account?: { id: string; name: string; type?: string } | null;
  user?: { firstName?: string | null; lastName?: string | null; email: string } | null;
}

interface Moyenne {
  note: number;
  reponses: number;
}

interface Suivi {
  total: number;
  moyennes: { globale: Moyenne | null; site: Moyenne | null; depot: Moyenne | null };
  enquete: { invitees: number; repondu: number; taux: number | null };
  problemes: Retour[];
  recents: Retour[];
}

const jour = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function qui(r: Retour) {
  const nom = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ");
  return r.account?.name ?? nom ?? r.user?.email ?? "-";
}

/** Une note sur 5, colorée par ce qu'elle veut dire — pas par sa valeur brute. */
function Note({ valeur }: { valeur?: number | null }) {
  if (!valeur) return <span className="text-muted-foreground">-</span>;
  const ton =
    valeur >= 4
      ? "text-emerald-600 dark:text-emerald-400"
      : valeur === 3
        ? "text-muted-foreground"
        : "text-secondary";
  return (
    <span className={`font-semibold tabular-nums ${ton}`}>
      {valeur}
      <span className="text-xs font-normal text-muted-foreground">/5</span>
    </span>
  );
}

function Carte({ titre, m, aide }: { titre: string; m: Moyenne | null; aide: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {titre}
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
          {m ? (
            <>
              {m.note}
              <span className="text-base font-normal text-muted-foreground">/5</span>
            </>
          ) : (
            <span className="text-base font-normal text-muted-foreground">Pas encore de réponse</span>
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {m ? `${m.reponses} réponse${m.reponses > 1 ? "s" : ""} · ` : ""}
          {aide}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function AdminRetoursPage() {
  const session = await requireAdmin();
  const res = await fetchApi<Suivi>(session, "/admin/retours");
  const d = res.data;

  if (res.error || !d) {
    return (
      <div className="space-y-6">
        <PageHeader title="Retours d'expérience" />
        <ErrorState
          retryHref="/admin/retours"
          title="Lecture impossible"
          description="Les retours n'ont pas pu être chargés."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Retours d'expérience"
        subtitle="Ce que disent les intervenants une semaine après leur première mise en ligne."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Carte titre="Satisfaction" m={d.moyennes.globale} aide="dans l'ensemble" />
        <Carte titre="Le site" m={d.moyennes.site} aide="clarté et navigation" />
        <Carte titre="Le dépôt de fiche" m={d.moyennes.depot} aide="procédure pour proposer ses services" />
        <Card>
          <CardContent className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Taux de réponse
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
              {d.enquete.taux === null ? (
                <span className="text-base font-normal text-muted-foreground">
                  Enquête pas encore partie
                </span>
              ) : (
                <>
                  {d.enquete.taux}
                  <span className="text-base font-normal text-muted-foreground"> %</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {d.enquete.repondu} réponse{d.enquete.repondu > 1 ? "s" : ""} sur{" "}
              {d.enquete.invitees} enquête{d.enquete.invitees > 1 ? "s" : ""} envoyée
              {d.enquete.invitees > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Problèmes signalés{d.problemes.length > 0 ? ` (${d.problemes.length})` : ""}
        </h2>
        {d.problemes.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              Aucun problème signalé pour le moment. C&apos;est une bonne
              nouvelle tant que des avis arrivent : pas s&apos;il n&apos;y en a
              aucun : vérifiez alors que l&apos;enquête part bien.
            </CardContent>
          </Card>
        ) : (
          d.problemes.map((r) => (
            <Card key={r.id} className="border-secondary/40 bg-secondary/5">
              <CardContent className="space-y-2 p-5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">{qui(r)}</span>
                  <span className="text-muted-foreground">· {jour(r.createdAt)}</span>
                  <Note valeur={r.noteGlobale} />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {r.probleme}
                </p>
                {r.user?.email ? (
                  <p className="text-xs text-muted-foreground">
                    Répondre à <span className="text-foreground">{r.user.email}</span>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Derniers avis</h2>
        {d.recents.length === 0 ? (
          <EmptyState
            title="Aucun retour pour l'instant"
            description="L'enquête part automatiquement sept jours après la première fiche mise en ligne d'un compte."
          />
        ) : (
          <Card>
            <CardHeader className="hidden gap-3 text-[11px] sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              <span>Compte</span>
              <span className="text-right">Global</span>
              <span className="text-right">Site</span>
              <span className="text-right">Dépôt</span>
              <span className="text-right">Date</span>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {d.recents.map((r) => (
                <div key={r.id} className="space-y-2 px-6 py-4">
                  <div className="grid grid-cols-2 items-center gap-3 text-sm sm:grid-cols-[1fr_auto_auto_auto_auto]">
                    <span className="min-w-0 truncate font-medium text-foreground">{qui(r)}</span>
                    <span className="text-right"><Note valeur={r.noteGlobale} /></span>
                    <span className="text-right"><Note valeur={r.noteSite} /></span>
                    <span className="text-right"><Note valeur={r.noteDepot} /></span>
                    <span className="whitespace-nowrap text-right text-xs text-muted-foreground">
                      {jour(r.createdAt)}
                    </span>
                  </div>
                  {r.commentaire ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {r.commentaire}
                    </p>
                  ) : null}
                  {r.source === "PREMIER_ATELIER" ? null : (
                    <Badge variant="outline">Avis spontané</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
