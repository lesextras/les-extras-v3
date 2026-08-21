// Ma progression — programme de paliers de l'intervenant.
// Trois paliers calculés uniquement sur des faits vérifiables :
// missions terminées, note moyenne reçue, taux d'annulation.
// Avantage du palier Super Extra : accès prioritaire aux missions
// dès le palier « réservé » de la cascade de diffusion.
import type { Metadata } from "next";
import { Award, CheckCircle2, Circle, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, StatCard, ErrorState } from "../../../_shared/ui";
import { formatDate } from "../../../_shared/format";

export const metadata: Metadata = { title: "Ma progression" };

type Palier = "NOUVEAU" | "CONFIRME" | "SUPER_EXTRA";

interface Critere {
  libelle: string;
  atteint: boolean;
  valeur: string;
  cible: string;
}

interface Progression {
  palier: Palier;
  stats: {
    missionsTerminees: number;
    missionsAnnulees: number;
    tauxAnnulation: number;
    noteMoyenne: number | null;
    nbAvis: number;
    membreDepuis: string;
  };
  prochainPalier: Palier | null;
  /** Missions restantes vers le prochain palier (null au palier le plus haut). */
  resteMissions: number | null;
  criteresProchainPalier: Critere[];
  avantages: Record<Palier, string>;
}

const LIBELLES: Record<Palier, string> = {
  NOUVEAU: "Nouveau",
  CONFIRME: "Confirmé",
  SUPER_EXTRA: "Super Extra",
};

const ORDRE: Palier[] = ["NOUVEAU", "CONFIRME", "SUPER_EXTRA"];

export default async function ProgressionPage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<Progression>(session, "/users/me/progression");

  if (error || !data) {
    return (
      <div className="space-y-8">
        <PageHeader title="Ma progression" />
        <ErrorState description={error} />
      </div>
    );
  }

  const idx = ORDRE.indexOf(data.palier);
  const note =
    data.stats.noteMoyenne != null ? data.stats.noteMoyenne.toFixed(1).replace(".", ",") : "—";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ma progression"
        subtitle="Trois paliers, calculés uniquement sur vos missions réelles. Le palier Super Extra ouvre l'accès prioritaire aux missions, avant le reste du réseau."
      />

      {/* Frise des paliers */}
      <Card>
        <CardContent className="p-6">
          <ol className="grid gap-4 sm:grid-cols-3">
            {ORDRE.map((p, i) => {
              const actif = i === idx;
              const atteint = i < idx;
              return (
                <li
                  key={p}
                  className={`rounded-xl border p-4 ${
                    actif
                      ? "border-[#156d6b] bg-[#156d6b]/10"
                      : atteint
                        ? "border-border bg-muted/50"
                        : "border-dashed border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {atteint || actif ? (
                      <CheckCircle2 className="h-4 w-4 text-[#156d6b]" aria-hidden />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />
                    )}
                    <span className="font-semibold text-foreground">{LIBELLES[p]}</span>
                    {actif ? <Badge>Votre palier</Badge> : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{data.avantages[p]}</p>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Chiffres réels */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Missions terminées"
          value={String(data.stats.missionsTerminees)}
          hint={`Membre depuis le ${formatDate(data.stats.membreDepuis)}`}
          icon={<TrendingUp className="h-5 w-5" aria-hidden />}
          accent="teal"
        />
        <StatCard
          label="Note moyenne"
          value={note}
          hint={data.stats.nbAvis > 0 ? `Sur ${data.stats.nbAvis} avis reçus` : "Aucun avis reçu pour le moment"}
          icon={<Star className="h-5 w-5" aria-hidden />}
          accent="terracotta"
        />
        <StatCard
          label="Taux d'annulation"
          value={`${Math.round(data.stats.tauxAnnulation * 100)} %`}
          hint={
            data.stats.missionsAnnulees > 0
              ? `${data.stats.missionsAnnulees} mission(s) annulée(s)`
              : "Aucune annulation — continuez comme ça"
          }
          icon={<Award className="h-5 w-5" aria-hidden />}
        />
      </div>

      {/* Critères vers le palier suivant.
          Le titre nomme la DISTANCE, pas l'acquis : « plus que 2 missions
          avant Confirmé » donne un compte à rebours là où « vous êtes
          Nouveau » constate un état. Quand les missions y sont mais qu'un
          autre critère retient le palier, on le dit tel quel. */}
      {data.prochainPalier ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-foreground">
              {data.resteMissions != null && data.resteMissions > 0 ? (
                <>
                  Plus que{" "}
                  <span className="text-[#156d6b]">
                    {data.resteMissions} mission{data.resteMissions > 1 ? "s" : ""}
                  </span>{" "}
                  avant {LIBELLES[data.prochainPalier]}
                </>
              ) : (
                <>Vers le palier {LIBELLES[data.prochainPalier]}</>
              )}
            </h2>
            <ul className="mt-4 space-y-3">
              {data.criteresProchainPalier.map((c) => (
                <li key={c.libelle} className="flex items-start gap-3">
                  {c.atteint ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#156d6b]" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{c.libelle}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {c.valeur} <span className="text-xs">(objectif : {c.cible})</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-foreground">
            Vous êtes au palier le plus élevé : vous êtes sollicité en priorité sur les missions,
            avant leur ouverture au réseau complet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
