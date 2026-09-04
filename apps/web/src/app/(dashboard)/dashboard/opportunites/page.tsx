// Opportunités (FREELANCE) : missions classées par score de matching.
import type { Metadata } from "next";
import Link from "next/link";
import { Target, MapPin, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import { ScoreMeter, ScoreBreakdown, type MatchOpportunity } from "../../../_shared/matching";
import { MISSION_CATEGORY_LABEL, formatDate } from "../../../_shared/format";

export const metadata: Metadata = { title: "Opportunités" };

/**
 * LE CATALOGUE, DEPUIS LES OPPORTUNITÉS.
 *
 * C'est le même réflexe que chercher une mission : voir ce que le réseau
 * propose. Le catalogue ayant quitté le menu de gauche pour la barre du
 * haut, on le repose ici, là où l'on vient déjà chercher du travail — et
 * non sur le tableau de bord, qui n'est pas l'endroit où l'on cherche.
 */
function BlocCatalogue() {
  return (
    <Card className="border-primary/25 bg-primary-soft/20">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Voir les ateliers et les formations
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Le catalogue complet : les interventions proposées par le réseau,
            et les formations certifiantes de l’association.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href="/ateliers">Voir les ateliers</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/formations">Voir les formations</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function OpportunitesPage() {
  const session = await requireSession();

  if (session.account.type !== "FREELANCE") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Opportunités"
          subtitle="Les missions de renfort et les ateliers ouverts à la candidature."
        />
        {/* Un salarié rattaché à un établissement arrivait ici sur un
            cul-de-sac : « Réservé aux intervenants », et rien d'autre. Il
            peut pourtant se positionner sur ce qui est ouvert, on le lui
            dit, et on lui donne le chemin. */}
        <EmptyState
          icon={<Target />}
          title="Les missions ouvertes sont dans la marketplace"
          description="Le classement par correspondance de profil est calculé pour les comptes intervenant. Vous, vous pouvez voir tout ce qui est ouvert et vous positionner."
          action={
            <Button asChild>
              <Link href="/marketplace?type=missions">Voir les missions ouvertes</Link>
            </Button>
          }
        />
        <BlocCatalogue />
      </div>
    );
  }

  const { data, error } = await fetchApi<MatchOpportunity[]>(session, "/matching/opportunities");
  const opportunities = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunités"
        subtitle="Les missions qui correspondent le mieux à votre profil, classées par score."
      />

      {error ? (
        <ErrorState retryHref="/dashboard/opportunites" />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={<Target />}
          title="Aucune opportunité pour le moment"
          description="Complétez votre profil et vos disponibilités pour recevoir des recommandations pertinentes."
          action={
            <Button asChild variant="outline">
              <Link href="/marketplace">Explorer la marketplace</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {opportunities.map((op) => (
            <Card key={op.mission.id} className="transition-shadow hover:shadow-card">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {op.mission.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {op.mission.category ? (
                        <Badge variant="outline">
                          {MISSION_CATEGORY_LABEL[op.mission.category] ?? op.mission.category}
                        </Badge>
                      ) : null}
                      {op.mission.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {op.mission.city}
                        </span>
                      ) : null}
                      {op.mission.startDate ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" />
                          {formatDate(op.mission.startDate)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <ScoreMeter total={op.total} label={op.label} />

                <details className="group">
                  <summary className="cursor-pointer list-none text-xs font-medium text-primary hover:underline">
                    Pourquoi ce score ?
                  </summary>
                  <div className="mt-3">
                    <ScoreBreakdown items={op.breakdown} />
                  </div>
                </details>

                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/marketplace/missions/${op.mission.id}`}>Voir / Candidater</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <BlocCatalogue />
    </div>
  );
}
