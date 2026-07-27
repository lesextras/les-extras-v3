"use client";

import { RenfortCard } from "@/components/ui/renfort-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { useApplyToMission } from "@/lib/hooks/useApplyToMission";

/* ─── E.6.3 — Matching Missions Widget ───────────────────────────
   Shows 3 compact Renfort Cards for new missions matching the
   freelance's profile, with a CTA to view all missions.
   ─────────────────────────────────────────────────────────────── */

export interface MatchingMission {
  id: string;
  title: string;
  establishment: string;
  city: string;
  dates?: string;
  hours?: string;
  rate?: string;
  urgent?: boolean;
  matchScore?: number;
  matchReasons?: string[];
}

interface MatchingMissionsWidgetProps {
  missions: MatchingMission[];
  error?: string | null;
}

const DISPLAY_MATCH_REASONS = new Set([
  "Même ville",
  "Compétence proche",
  "Disponible ce jour",
]);

export function MatchingMissionsWidget({ missions, error }: MatchingMissionsWidgetProps) {
  const { apply, pendingMissionId, hasApplied } = useApplyToMission();

  if (error) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Missions indisponibles"
        description={error}
        primaryAction={{ label: "Voir toutes les missions", href: "/marketplace" }}
      />
    );
  }

  if (missions.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Aucune nouvelle mission"
        description="Pas de mission correspondante pour l'instant. Revenez bientôt."
        primaryAction={{ label: "Voir toutes les missions", href: "/marketplace" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {missions.slice(0, 3).map((m) => {
          const applied = hasApplied(m.id);
          const isThisPending = pendingMissionId === m.id;
          return (
            <RenfortCard
              key={m.id}
              variant={m.urgent ? "urgent" : "normal"}
              title={m.title}
              establishment={m.establishment}
              city={m.city}
              dates={m.dates}
              hours={m.hours}
              rate={m.rate}
              badges={m.matchReasons?.filter((reason) => DISPLAY_MATCH_REASONS.has(reason)).slice(0, 2)}
              actionLabel={applied ? "Mission prise" : isThisPending ? "Envoi…" : "Postuler"}
              actionDisabled={applied || isThisPending}
              onAction={() => {
                if (applied || isThisPending) return;
                apply(m.id);
              }}
              href={`/marketplace/missions/${m.id}`}
            />
          );
        })}
      </div>

      <Button variant="glass" size="sm" className="w-full min-h-[44px]" asChild>
        <Link href="/marketplace">
          Voir toutes les missions
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
