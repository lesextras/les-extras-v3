"use client";

// Panneau « Candidats suggérés » (ESTABLISHMENT) pour une mission.
// Charge /matching/missions/:id/candidates et affiche les freelances classés
// par score, avec jauge globale + décomposition par critère.
import { useEffect, useState } from "react";
import { Star, AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/api";
import { EmptyState, ErrorState, SkeletonList } from "./ui";
import { ScoreMeter, ScoreBreakdown, type MatchCandidate } from "./matching";

interface CandidatesResponse {
  mission: { id: string; title: string };
  candidates: MatchCandidate[];
}

function initialsOf(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function MatchingPanel({
  missionId,
  accountId,
}: {
  missionId: string;
  accountId: string;
}) {
  const [state, setState] = useState<"loading" | "error" | "done">("loading");
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);

  useEffect(() => {
    let alive = true;
    setState("loading");
    apiRequest<CandidatesResponse>(`/matching/missions/${missionId}/candidates`, { accountId })
      .then((res) => {
        if (!alive) return;
        setCandidates(res?.candidates ?? []);
        setState("done");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [missionId, accountId]);

  if (state === "loading") return <SkeletonList rows={3} />;
  if (state === "error")
    return (
      <ErrorState
        title="Suggestions indisponibles"
        description="Impossible de calculer les correspondances pour le moment."
      />
    );
  if (candidates.length === 0)
    return (
      <EmptyState
        icon={<Sparkles />}
        title="Aucun candidat suggéré"
        description="Le moteur de matching n'a trouvé aucun profil correspondant à ce besoin."
      />
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {candidates.map((c) => (
        <Card key={c.freelanceId} className="overflow-hidden transition-shadow hover:shadow-card">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={c.avatarUrl ?? undefined} alt={c.name} />
                <AvatarFallback>{initialsOf(c.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[c.job, c.city].filter(Boolean).join(" · ") || "Freelance"}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {c.reviewCount && c.reviewCount > 0 ? (
                    <>
                      <Star className="size-3.5 fill-warning text-warning" />
                      <span className="font-medium text-foreground">
                        {Number(c.rating ?? 0).toFixed(1)}
                      </span>
                      <span>({c.reviewCount})</span>
                    </>
                  ) : (
                    <span>Nouveau profil</span>
                  )}
                </div>
              </div>
            </div>

            <ScoreMeter total={c.total} label={c.label} />

            <div className="flex flex-wrap gap-1.5">
              {c.available ? (
                <Badge variant="success">Disponible</Badge>
              ) : (
                <Badge variant="muted">Indisponible</Badge>
              )}
              {c.hasConflict ? (
                <Badge variant="warning" className="gap-1">
                  <AlertTriangle />
                  Conflit planning
                </Badge>
              ) : null}
            </div>

            <details className="group">
              <summary className="cursor-pointer list-none text-xs font-medium text-primary hover:underline">
                Voir la décomposition du score
              </summary>
              <div className="mt-3">
                <ScoreBreakdown items={c.breakdown} />
              </div>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
