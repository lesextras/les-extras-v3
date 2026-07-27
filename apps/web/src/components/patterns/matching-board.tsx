"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterBar, type FilterOption } from "@/components/ui/filter-bar";
import { FreelanceCard } from "@/components/ui/freelance-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, ArrowRight, XCircle } from "lucide-react";

/* ─── D.2 — Matching Board ────────────────────────────────────────
   Establishment views candidatures on a mission.
   Layout: sidebar filter (desktop) / drawer (mobile) + grid of
   augmented Freelance Cards with matching score.
   ─────────────────────────────────────────────────────────────── */

export interface Candidature {
  id: string;
  name: string;
  title: string;
  city: string;
  rating?: number;
  avatarUrl?: string;
  isVerified?: boolean;
  badges?: string[];
  socialProof?: string;
  /** Match score 0-100 */
  matchScore: number;
  /** Whether availability is confirmed */
  availabilityConfirmed?: boolean;
  /** Already worked with this establishment */
  alreadyWorkedWith?: boolean;
}

export interface MatchingBoardMission {
  title: string;
  badges?: string[];
  candidateCount: number;
}

export interface MatchingBoardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Mission context */
  mission: MatchingBoardMission;
  /** Candidatures list */
  candidatures: Candidature[];
  /** Filter options for sidebar */
  filters?: FilterOption[];
  /** Search value */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterToggle?: (id: string) => void;
  onFilterRemove?: (id: string) => void;
  onReset?: () => void;
  /** Called when "Proposer" on a candidature */
  onPropose?: (id: string) => void;
  /** Called when "Refuser" on a candidature */
  onRefuse?: (id: string) => void;
}

function getScoreBadgeVariant(score: number) {
  if (score > 80) return "emerald" as const;
  if (score >= 60) return "teal" as const;
  return "amber" as const;
}

export function MatchingBoard({
  className,
  mission,
  candidatures,
  filters,
  searchValue,
  onSearchChange,
  onFilterToggle,
  onFilterRemove,
  onReset,
  onPropose,
  onRefuse,
  ...props
}: MatchingBoardProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Mission context bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[hsl(var(--color-teal-50))] border border-[hsl(var(--teal)/0.16)] p-4">
        <h2 className="text-heading-sm text-[hsl(var(--text-primary))]">
          {mission.title}
        </h2>
        {mission.badges?.map((b) => (
          <Badge key={b} variant="default" size="sm">
            {b}
          </Badge>
        ))}
        <Badge variant="teal" size="sm">
          {mission.candidateCount} candidat{mission.candidateCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Main layout: filters + grid */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar filters (desktop) */}
        {filters && filters.length > 0 && (
          <aside className="hidden lg:block w-64 shrink-0 space-y-4">
            <h3 className="text-overline text-[hsl(var(--text-tertiary))] uppercase tracking-widest">
              Filtres
            </h3>
            <div className="space-y-2">
              {filters.map((filter) => (
                <label
                  key={filter.id}
                  className="flex items-center gap-2 text-body-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filter.active}
                    onChange={() =>
                      filter.active
                        ? onFilterRemove?.(filter.id)
                        : onFilterToggle?.(filter.id)
                    }
                    className="h-4 w-4 rounded border-border text-[hsl(var(--teal))] focus:ring-[hsl(var(--teal)/0.3)]"
                  />
                  {filter.label}
                </label>
              ))}
            </div>
            {onReset && (
              <Button variant="ghost" size="xs" onClick={onReset}>
                Réinitialiser
              </Button>
            )}
          </aside>
        )}

        {/* Candidatures grid */}
        <div className="flex-1 space-y-4">
          {/* Mobile filter bar */}
          <div className="lg:hidden">
            <FilterBar
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              filters={filters}
              onFilterToggle={onFilterToggle}
              onFilterRemove={onFilterRemove}
              onReset={onReset}
              resultCount={candidatures.length}
            />
          </div>

          {candidatures.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun freelance n'a encore postulé"
              description="Partagez votre mission pour attirer des candidatures."
              primaryAction={{
                label: "Partager la mission",
                variant: "coral",
              }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {candidatures.map((c) => (
                <div key={c.id} className="relative">
                  {/* Score + indicators overlay */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    {c.alreadyWorkedWith && (
                      <Badge variant="sand" size="sm">
                        ★ Déjà collaboré
                      </Badge>
                    )}
                    <Badge
                      variant={getScoreBadgeVariant(c.matchScore)}
                      size="sm"
                    >
                      {c.matchScore}%
                    </Badge>
                  </div>

                  <FreelanceCard
                    variant={c.isVerified ? "verified" : "available"}
                    name={c.name}
                    title={c.title}
                    city={c.city}
                    rating={c.rating}
                    avatarUrl={c.avatarUrl}
                    isVerified={c.isVerified}
                    isAvailable={c.availabilityConfirmed}
                    badges={c.badges}
                    socialProof={c.socialProof}
                    onViewProfile={() => onPropose?.(c.id)}
                    onPropose={() => onPropose?.(c.id)}
                  />

                  {/* Quick actions below card */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="coral"
                      size="sm"
                      className="flex-1"
                      onClick={() => onPropose?.(c.id)}
                    >
                      Proposer
                      <ArrowRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRefuse?.(c.id)}
                    >
                      Passer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
