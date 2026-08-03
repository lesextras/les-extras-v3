// Détail d'une session : inscrits + feuille d'émargement.
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmargementSheet } from "../../../../_shared/EmargementSheet";
import { InscribeButton } from "../../../../_shared/InscribeButton";
import { InscriptionDeliverables } from "../../../../_shared/InscriptionDeliverables";
import { EvaluationForm } from "../../../../_shared/EvaluationForm";

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
  satisfaction?: number | null;
  coldRating?: number | null;
}
interface SessionDetail {
  id: string;
  title?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  status: string;
  maxSeats?: number | null;
  formation?: { title?: string | null; type?: string; certifying?: boolean } | null;
  trainer?: { firstName?: string | null; lastName?: string | null } | null;
  inscriptions?: Inscription[];
}

/** Bilan qualité agrégé — ce qu'un auditeur demande en premier. */
interface Bilan {
  inscrits: number;
  chaud: { reponses: number; tauxReponse: number; moyenne: number | null; commentaires: string[] };
  froid: {
    reponses: number;
    tauxReponse: number;
    moyenne: number | null;
    miseEnOeuvre: { oui: number; partiellement: number; non: number };
    commentaires: string[];
  };
  acquis: string[];
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
  const [res, resBilan] = await Promise.all([
    fetchApi<SessionDetail>(session, `/formations/sessions/${params.sessionId}`),
    fetchApi<Bilan>(session, `/formations/sessions/${params.sessionId}/bilan`),
  ]);
  const s = res.data;
  const bilan = resBilan.data;

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
  // Deux jalons commandent l'ouverture des évaluations : l'évaluation de fin
  // dès que la session a commencé, l'évaluation à froid une fois qu'elle est
  // close. Avant, il n'y a rien à évaluer.
  const maintenant = Date.now();
  const commencee = new Date(s.startDate).getTime() <= maintenant;
  const terminee = new Date(s.endDate ?? s.startDate).getTime() < maintenant;

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
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
                      <InscriptionDeliverables
                        inscriptionId={i.id}
                        accountId={session.account.id}
                        certifying={Boolean(s.formation?.certifying)}
                        invoiced={Boolean(i.invoiceId)}
                      />
                      {/* Les deux évaluations exigées par le référentiel
                          national qualité. Elles s'ouvrent une fois la session
                          commencée : recueillir un avis sur une formation qui
                          n'a pas eu lieu produit une preuve fausse. */}
                      <EvaluationForm
                        inscriptionId={i.id}
                        accountId={session.account.id}
                        moment="chaud"
                        apprenant={learnerLabel(i)}
                        dejaRempli={i.satisfaction != null}
                        ouvert={commencee}
                      />
                      <EvaluationForm
                        inscriptionId={i.id}
                        accountId={session.account.id}
                        moment="froid"
                        apprenant={learnerLabel(i)}
                        dejaRempli={i.coldRating != null}
                        ouvert={terminee}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">Feuille d’émargement</h3>
                <p className="text-xs text-muted-foreground">
                  Enregistrez les présences par apprenant et par demi-journée.
                </p>
              </div>
              {/* La feuille papier reste indispensable : c'est la signature
                  manuscrite du stagiaire en salle qui fait preuve, pas la case
                  cochée après coup. Le PDF porte les deux — les cases à signer
                  et le récapitulatif de ce qui a été saisi. */}
              <Button asChild size="sm" variant="outline">
                <a
                  href={`/api/proxy/documents/emargement/${s.id}.pdf`}
                  target="_blank"
                  rel="noopener"
                >
                  Feuille PDF à signer
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <EmargementSheet accountId={session.account.id} rows={rows} defaultDate={defaultDate} />
          </CardContent>
        </Card>
      </div>

      {/* LE BILAN QUALITÉ.
          Un taux de réponse dit autant qu'une moyenne : cinq réponses sur cinq
          à 4,8 ne vaut pas la même chose qu'une réponse sur vingt à 5. Les deux
          sont donc affichés côte à côte, et les commentaires en clair — c'est
          eux que l'auditeur lit, pas la note. */}
      {bilan && bilan.inscrits > 0 ? (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-foreground">Bilan qualité de la session</h3>
            <p className="text-xs text-muted-foreground">
              Indicateurs 11 et 30 du référentiel national qualité : atteinte des objectifs et
              appréciation des bénéficiaires.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  À chaud — fin de session
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {bilan.chaud.moyenne != null ? `${bilan.chaud.moyenne} / 5` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bilan.chaud.reponses} réponse{bilan.chaud.reponses > 1 ? "s" : ""} sur{" "}
                  {bilan.inscrits} · {bilan.chaud.tauxReponse} % de participation
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  À froid — quelques mois après
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {bilan.froid.moyenne != null ? `${bilan.froid.moyenne} / 5` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bilan.froid.reponses} réponse{bilan.froid.reponses > 1 ? "s" : ""} sur{" "}
                  {bilan.inscrits} · {bilan.froid.tauxReponse} % de participation
                </p>
                {bilan.froid.reponses > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Acquis mis en œuvre : {bilan.froid.miseEnOeuvre.oui} oui ·{" "}
                    {bilan.froid.miseEnOeuvre.partiellement} en partie ·{" "}
                    {bilan.froid.miseEnOeuvre.non} pas encore
                  </p>
                ) : null}
              </div>
            </div>

            {bilan.acquis.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-foreground">Atteinte des objectifs</p>
                <ul className="mt-1.5 space-y-1">
                  {bilan.acquis.map((a, n) => (
                    <li key={n} className="text-sm text-muted-foreground">
                      · {a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bilan.chaud.commentaires.length > 0 || bilan.froid.commentaires.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Ce que les stagiaires écrivent</p>
                {[...bilan.chaud.commentaires, ...bilan.froid.commentaires].map((c, n) => (
                  <p
                    key={n}
                    className="whitespace-pre-line rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                  >
                    {c}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune évaluation recueillie pour l'instant. Les boutons « Éval. à chaud » et
                « Éval. à froid » se trouvent sous chaque apprenant.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
