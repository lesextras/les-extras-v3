// LES CONTRIBUTIONS DU MOIS.
//
// Pas de podium, pas de numéros de place : dans ce secteur, un classement
// frontal démobilise plus qu'il ne motive. On montre ce que la communauté a
// produit et qui l'a fait vivre — de la reconnaissance, pas un tableau de chasse.
import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles, Newspaper, Megaphone, Star, Lightbulb, MessagesSquare, CheckCircle2, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, EmptyState, ErrorState } from "../../../_shared/ui";
import { initials } from "../../../_shared/format";

export const metadata: Metadata = { title: "La communauté" };

interface Contributeur {
  id: string;
  nom: string;
  type: string;
  logoUrl?: string | null;
  ville?: string | null;
  points: number;
  actions: Record<string, number>;
}

interface Reponse {
  mois: string;
  contributeurs: Contributeur[];
  totaux: Record<string, number>;
  nbContributeurs: number;
}

const ACTIONS: Record<string, { label: string; pluriel: string; icon: typeof Star }> = {
  MISSION: { label: "mission acceptée", pluriel: "missions acceptées", icon: Megaphone },
  REPONSE_RETENUE: { label: "réponse retenue", pluriel: "réponses retenues", icon: CheckCircle2 },
  REPONSE: { label: "réponse", pluriel: "réponses", icon: MessagesSquare },
  ARTICLE: { label: "article", pluriel: "articles", icon: Newspaper },
  AVIS: { label: "avis", pluriel: "avis", icon: Star },
  PUBLICATION: { label: "fiche publiée", pluriel: "fiches publiées", icon: Sparkles },
  IDEE: { label: "idée retenue", pluriel: "idées retenues", icon: Lightbulb },
};

function libelle(cle: string, nb: number) {
  const a = ACTIONS[cle];
  if (!a) return `${nb} contribution${nb > 1 ? "s" : ""}`;
  return `${nb} ${nb > 1 ? a.pluriel : a.label}`;
}

export default async function CommunautePage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<Reponse>(session, "/community/contributeurs");

  if (error || !data) {
    return (
      <div className="space-y-8">
        <PageHeader title="La communauté" />
        <ErrorState description={error} />
      </div>
    );
  }

  const mois = new Date(data.mois).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const totaux = Object.entries(data.totaux).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="La communauté"
        subtitle={`Ce que le réseau a produit en ${mois}. Pas de classement : chacun contribue à sa mesure, et tout compte.`}
      />

      {/* Ce que la communauté a produit ensemble */}
      {totaux.length > 0 ? (
        <section className="space-y-4">
          <SectionTitle title={`Ensemble, en ${mois}`} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {totaux.slice(0, 4).map(([cle, nb]) => {
              const Icone = ACTIONS[cle]?.icon ?? Sparkles;
              return (
                <li key={cle}>
                  <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-accent-foreground">
                        <Icone className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xl font-semibold tabular-nums">{nb}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {ACTIONS[cle]?.pluriel ?? "contributions"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Celles et ceux qui ont fait vivre le réseau */}
      <section className="space-y-4">
        <SectionTitle
          title="Celles et ceux qui ont fait vivre le réseau"
          action={
            data.nbContributeurs > 0 ? (
              <Badge variant="secondary">
                <Users aria-hidden /> {data.nbContributeurs} contributeur
                {data.nbContributeurs > 1 ? "s" : ""}
              </Badge>
            ) : null
          }
        />
        {data.contributeurs.length === 0 ? (
          <EmptyState
            title="Le mois commence"
            description="Publier un atelier, répondre à un collègue, laisser un avis : toute contribution apparaîtra ici."
            action={
              <Button asChild>
                <Link href="/dashboard/gap">Voir les questions sans réponse</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.contributeurs.map((c) => {
              const details = Object.entries(c.actions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
              return (
                <li key={c.id}>
                  <Card className="h-full">
                    <CardContent className="flex items-start gap-4 pt-6">
                      <Avatar className="size-11 shrink-0">
                        <AvatarImage src={c.logoUrl ?? undefined} alt="" />
                        <AvatarFallback>{initials(c.nom)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.type === "ESTABLISHMENT" ? "Établissement" : "Intervenant"}
                          {c.ville ? ` · ${c.ville}` : ""}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {details.map(([cle, nb]) => libelle(cle, nb)).join(" · ")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <p className="max-w-xl text-sm text-muted-foreground">
            Cette page n&apos;est pas un classement. Elle existe parce qu&apos;un réseau qui ne
            montre jamais ce que ses membres apportent finit par ne plus rien recevoir.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/points">Voir mes points</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
