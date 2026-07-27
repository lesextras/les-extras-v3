"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, SlidersHorizontal } from "lucide-react";

/* ─── C.16 — FilterBar ───────────────────────────────────────────
   Horizontal filter bar for lists (missions, freelances, ateliers).
   Search input + filter pills + result counter + reset.
   Mobile: horizontal scroll + "Filtres (N)" drawer trigger.
   ─────────────────────────────────────────────────────────────── */

export interface FilterOption {
  /** Unique key */
  id: string;
  /** Display label */
  label: string;
  /** Whether currently active */
  active?: boolean;
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Search input value */
  searchValue?: string;
  /** Search input change handler */
  onSearchChange?: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Filter pills */
  filters?: FilterOption[];
  /** Called when a filter pill is clicked */
  onFilterToggle?: (id: string) => void;
  /** Called when a filter is removed (× click on active) */
  onFilterRemove?: (id: string) => void;
  /** Result count display */
  resultCount?: number;
  /** Reset all filters */
  onReset?: () => void;
  /** Mobile drawer trigger (called when "Filtres" button clicked on mobile) */
  onMobileOpen?: () => void;
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      className,
      searchValue,
      onSearchChange,
      searchPlaceholder = "Rechercher…",
      filters,
      onFilterToggle,
      onFilterRemove,
      resultCount,
      onReset,
      onMobileOpen,
      ...props
    },
    ref
  ) => {
    const activeCount = filters?.filter((f) => f.active).length ?? 0;
    const hasActiveFilters = activeCount > 0 || (searchValue && searchValue.length > 0);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2",
          className
        )}
        {...props}
      >
        {/* Search input */}
        <div className="relative flex-shrink-0">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--text-tertiary))]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-body-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:border-[hsl(var(--teal))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--teal)/0.2)] sm:w-56"
          />
        </div>

        {/* Mobile: "Filtres (N)" trigger */}
        {onMobileOpen && (
          <Button
            variant="outline"
            size="sm"
            className="flex sm:hidden items-center gap-1.5"
            onClick={onMobileOpen}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtres
            {activeCount > 0 && (
              <Badge variant="teal" size="sm">
                {activeCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Desktop: filter pills (horizontal scroll on mobile) */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {filters?.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() =>
                filter.active
                  ? onFilterRemove?.(filter.id)
                  : onFilterToggle?.(filter.id)
              }
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-body-sm font-medium transition-colors duration-150",
                filter.active
                  ? "bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] border border-[hsl(var(--teal)/0.3)]"
                  : "bg-card text-[hsl(var(--text-secondary))] border border-border hover:bg-[hsl(var(--color-navy-50))]"
              )}
              aria-pressed={filter.active}
            >
              {filter.label}
              {filter.active && (
                <X className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="hidden sm:block flex-1" />

        {/* Reset */}
        {hasActiveFilters && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="shrink-0"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Réinitialiser
          </Button>
        )}

        {/* Result counter */}
        {resultCount !== undefined && (
          <span className="text-body-sm text-[hsl(var(--text-secondary))] shrink-0">
            {resultCount} résultat{resultCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  }
);
FilterBar.displayName = "FilterBar";

export { FilterBar };
