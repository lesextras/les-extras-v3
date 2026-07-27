"use client";

import { useState, useMemo } from "react";
import { SerializedMission } from "@/app/actions/marketplace";
import { MissionCard } from "@/components/cards/MissionCard";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Briefcase, Sun, Moon, X } from "lucide-react";
import { METIERS, normalizeMetierId } from "@/lib/sos-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FreelanceJobBoardProps {
  missions: SerializedMission[];
  hideHeader?: boolean;
}

type ShiftFilter = "ALL" | "JOUR" | "NUIT";

export function FreelanceJobBoard({ missions, hideHeader }: FreelanceJobBoardProps) {
  const [search, setSearch] = useState("");
  const [selectedMetier, setSelectedMetier] = useState<string | null>(null);
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");

  // Sort by newest first
  const sortedMissions = useMemo(
    () => [...missions].sort((a, b) => 0), // API already orders; keep stable
    [missions],
  );

  const filteredMissions = useMemo(() => {
    return sortedMissions.filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        const matchText =
          m.title.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.establishment?.profile?.city?.toLowerCase().includes(q) ||
          m.establishment?.profile?.companyName?.toLowerCase().includes(q) ||
          false;
        if (!matchText) return false;
      }
      if (selectedMetier && normalizeMetierId(m.metier) !== selectedMetier) return false;
      if (shiftFilter !== "ALL" && m.shift && m.shift !== shiftFilter) return false;
      return true;
    });
  }, [sortedMissions, search, selectedMetier, shiftFilter]);

  const hasFilters = !!search || !!selectedMetier || shiftFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setSelectedMetier(null);
    setShiftFilter("ALL");
  };

  // Unique metiers present in the mission list
  const presentMetiers = useMemo(() => {
    const ids = new Set(missions.map((m) => normalizeMetierId(m.metier)).filter(Boolean));
    return METIERS.filter((m) => ids.has(m.id));
  }, [missions]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      {!hideHeader && (
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Marketplace
          </p>
          <h1 className="font-display text-heading-xl tracking-tight">Missions de renfort</h1>
          <p className="text-sm text-muted-foreground">
            {missions.length} mission{missions.length !== 1 ? "s" : ""} disponible
            {missions.length !== 1 ? "s" : ""}.
          </p>
        </header>
      )}

      {/* Sticky filter bar */}
      <div className="sticky top-[57px] z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 glass-surface-dense border-y border-border/40 space-y-3">
        {/* Search */}
        <div className="max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ville, métier, établissement…"
            className="pl-9 h-11 bg-background/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Shift filter */}
          {(["ALL", "JOUR", "NUIT"] as ShiftFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setShiftFilter(s)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                shiftFilter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {s === "JOUR" && <Sun className="h-3 w-3" />}
              {s === "NUIT" && <Moon className="h-3 w-3" />}
              {s === "ALL" ? "Tous" : s === "JOUR" ? "Jour" : "Nuit"}
            </button>
          ))}

          {/* Metier filter chips */}
          {presentMetiers.map((m) => {
            const Icon = m.icon;
            const active = selectedMetier === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMetier(active ? null : m.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className="h-3 w-3" />
                {m.label}
              </button>
            );
          })}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" /> Effacer
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredMissions.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aucune mission trouvée"
          description={
            hasFilters
              ? "Aucun résultat pour ces filtres. Essayez d'autres critères."
              : "Il n'y a pas encore de missions disponibles."
          }
          primaryAction={
            hasFilters ? { label: "Effacer les filtres", onClick: clearFilters } : undefined
          }
          tips="Les nouvelles missions sont publiées en temps réel."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMissions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}
