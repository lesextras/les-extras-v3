// Types + helpers de présentation du matching multi-critères (partagés).
// Composants purs (sans hooks) → utilisables en Server ET Client Components.
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "./format";

export type MatchLabel = "Excellent" | "Bon" | "Correct" | "Faible";

export interface MatchBreakdownItem {
  key: string;
  label: string;
  /** Score du critère, 0–100. */
  score: number;
  /** Poids du critère (0–1). */
  weight: number;
  /** Points pondérés apportés au score global. */
  points: number;
}

export interface MatchCandidate {
  freelanceId: string;
  accountId: string;
  name: string;
  job?: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  rating?: number | null;
  reviewCount?: number;
  available?: boolean;
  hasConflict?: boolean;
  total: number;
  label: MatchLabel;
  breakdown: MatchBreakdownItem[];
}

export interface MatchOpportunity {
  mission: {
    id: string;
    title: string;
    city?: string | null;
    startDate?: string | null;
    category?: string | null;
  };
  total: number;
  label: MatchLabel;
  breakdown: MatchBreakdownItem[];
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n || 0)));

/** Palette « pro » par palier de score. */
export function scoreTone(label: MatchLabel): {
  badge: BadgeVariant | "soft" | "warning" | "muted";
  bar: string;
} {
  switch (label) {
    case "Excellent":
      return { badge: "default", bar: "bg-primary" };
    case "Bon":
      return { badge: "soft", bar: "bg-primary/60" };
    case "Correct":
      return { badge: "warning", bar: "bg-warning" };
    case "Faible":
    default:
      return { badge: "muted", bar: "bg-muted-foreground/40" };
  }
}

/** Jauge de score global : valeur /100 + barre colorée + badge du palier. */
export function ScoreMeter({
  total,
  label,
  compact,
}: {
  total: number;
  label: MatchLabel;
  compact?: boolean;
}) {
  const tone = scoreTone(label);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {clamp(total)}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">/100</span>
        </span>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Badge variant={tone.badge as any}>{label}</Badge>
      </div>
      <div
        className={cn("w-full overflow-hidden rounded-full bg-muted", compact ? "h-1.5" : "h-2")}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", tone.bar)}
          style={{ width: `${clamp(total)}%` }}
        />
      </div>
    </div>
  );
}

/** Décomposition du score : mini-barre par critère. */
export function ScoreBreakdown({ items }: { items: MatchBreakdownItem[] }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.key} className="space-y-1" title={`${it.points} pts (poids ${Math.round((it.weight || 0) * 100)}%)`}>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{it.label}</span>
            <span className="tabular-nums font-medium text-foreground">{clamp(it.score)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70 transition-all duration-500 ease-out"
              style={{ width: `${clamp(it.score)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
