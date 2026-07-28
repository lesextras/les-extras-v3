// Points & récompenses — contrepartie de la participation à la communauté.
// Règles affichées telles qu'elles sont appliquées côté API : 10 points = 1 €,
// réduction plafonnée à 30 % d'une facture, points valables 12 mois.
import type { Metadata } from "next";
import { Award, Sparkles, Newspaper, Star, Lightbulb, Megaphone, MessagesSquare, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, StatCard, EmptyState, ErrorState } from "../../../_shared/ui";
import { formatDate } from "../../../_shared/format";

export const metadata: Metadata = { title: "Points & récompenses" };

interface Ligne {
  id: string;
  amount: number;
  reason: string;
  label: string;
  createdAt: string;
}

interface SoldePoints {
  points: number;
  euros: number;
  pointsParEuro: number;
  plafondReduction: number;
  validiteMois: number;
  bientotPerimes: number;
  bareme: Record<string, number>;
  historique: Ligne[];
}

const ACTIONS: { reason: string; label: string; detail: string; icon: typeof Award }[] = [
  {
    reason: "MISSION",
    label: "Mission de renfort réalisée",
    detail: "Une intervention menée à son terme et validée par l'établissement.",
    icon: Megaphone,
  },
  {
    reason: "REPONSE_RETENUE",
    label: "Votre réponse retenue comme utile",
    detail: "Le professionnel qui avait le problème a désigné votre réponse. C'est le meilleur signal.",
    icon: CheckCircle2,
  },
  {
    reason: "REPONSE",
    label: "Réponse apportée dans le GAP",
    detail: "Un collègue décrit une situation, vous racontez ce que vous avez tenté.",
    icon: MessagesSquare,
  },
  {
    reason: "ARTICLE",
    label: "Article publié sur l'Édublog",
    detail: "Un retour d'expérience ou une ressource utile au secteur.",
    icon: Newspaper,
  },
  {
    reason: "AVIS",
    label: "Avis déposé après une prestation",
    detail: "Les avis alimentent le classement des intervenants proposés.",
    icon: Star,
  },
  {
    reason: "IDEE",
    label: "Idée retenue au programme",
    detail: "Une proposition de la boîte à idées qui passe en développement.",
    icon: Lightbulb,
  },
  {
    reason: "PUBLICATION",
    label: "Atelier ou formation mis en ligne",
    detail: "Une nouvelle fiche publiée et validée dans le catalogue.",
    icon: Sparkles,
  },
];

export default async function PointsPage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<SoldePoints>(session, "/community/points");

  if (error || !data) {
    return (
      <div className="space-y-8">
        <PageHeader title="Points & récompenses" />
        <ErrorState description={error} />
      </div>
    );
  }

  const plafondPct = Math.round(data.plafondReduction * 100);
  const prochainPalier = (Math.floor(data.points / 100) + 1) * 100;
  const versPalier = Math.min(100, Math.round(((data.points % 100) / 100) * 100));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Points & récompenses"
        subtitle={`Votre participation à la communauté se transforme en réduction : ${data.pointsParEuro} points = 1 €, à valoir sur vos factures.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Solde de points"
          value={data.points.toLocaleString("fr-FR")}
          hint={`Encore ${Math.max(0, prochainPalier - data.points)} points pour atteindre ${prochainPalier}`}
          icon={<Award className="h-5 w-5" aria-hidden />}
          accent="teal"
        />
        <StatCard
          label="Équivalent en euros"
          value={`${data.euros} €`}
          hint={`Déductible sur une facture, dans la limite de ${plafondPct} % de son montant`}
          accent="terracotta"
        />
        <StatCard
          label="Validité"
          value={`${data.validiteMois} mois`}
          hint={
            data.bientotPerimes > 0
              ? `${data.bientotPerimes} points arrivent à échéance dans moins de 2 mois`
              : "Aucun point n'expire dans les 2 prochains mois"
          }
          accent={data.bientotPerimes > 0 ? "warning" : "neutral"}
        />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Progression vers {prochainPalier} points</span>
            <span className="tabular-nums text-muted-foreground">
              {data.points % 100} / 100
            </span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={versPalier}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression vers ${prochainPalier} points`}
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${versPalier}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">
            La réduction se déduit au moment de la facturation : indiquez-le à l&apos;équipe lors de
            votre prochaine commande. Elle ne peut jamais dépasser {plafondPct} % du montant d&apos;une
            facture, et les points non utilisés expirent au bout de {data.validiteMois} mois.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <SectionTitle title="Comment en gagner" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {ACTIONS.map((action) => {
            const valeur = data.bareme?.[action.reason];
            if (!valeur) return null;
            const Icone = action.icon;
            return (
              <li key={action.reason}>
                <Card className="h-full">
                  <CardContent className="flex items-start gap-3 pt-6">
                    <span className="mt-0.5 rounded-md bg-primary-soft p-2 text-accent-foreground">
                      <Icone className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{action.label}</p>
                        <Badge variant="soft">+{valeur} pts</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{action.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Historique" />
        {data.historique.length === 0 ? (
          <EmptyState
            title="Aucun point pour l'instant"
            description="Publiez un atelier, réalisez une mission ou déposez un avis : les points arrivent automatiquement."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {data.historique.map((ligne) => (
                  <li key={ligne.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ligne.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(ligne.createdAt)}</p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        ligne.amount >= 0 ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {ligne.amount >= 0 ? "+" : ""}
                      {ligne.amount} pts
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
