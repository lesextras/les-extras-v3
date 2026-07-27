"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── C.19 — Mobile Bottom Navigation ────────────────────────────
   Primary mobile navigation (< 768px), replaces sidebar.
   Height: 64px + safe-area-inset-bottom.
   Central FAB: coral, 48px circle, -12px translateY.
   ─────────────────────────────────────────────────────────────── */

export interface BottomNavItem {
  /** Unique key */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon */
  icon: LucideIcon;
  /** Whether this is the active route */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Href for link navigation */
  href?: string;
}

export interface MobileBottomNavProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Navigation items (max 5, FAB is the 3rd if useFab is true) */
  items: BottomNavItem[];
  /** Show central FAB button */
  useFab?: boolean;
  /** FAB click handler */
  onFabClick?: () => void;
  /** FAB aria-label */
  fabLabel?: string;
}

const MobileBottomNav = React.forwardRef<HTMLElement, MobileBottomNavProps>(
  (
    {
      className,
      items,
      useFab = true,
      onFabClick,
      fabLabel = "Action rapide",
      ...props
    },
    ref
  ) => {
    return (
      <nav
        ref={ref}
        aria-label="Navigation principale"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[200] flex items-end justify-around border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] md:hidden",
          className
        )}
        {...props}
      >
        <div className="flex w-full items-end justify-around h-16">
          {items.map((item, index) => {
            const Icon = item.icon;

            /* FAB — central item (index 2 when useFab) */
            if (useFab && index === Math.floor(items.length / 2)) {
              return (
                <React.Fragment key={item.id}>
                  {/* FAB */}
                  <button
                    type="button"
                    onClick={onFabClick}
                    aria-label={fabLabel}
                    className="relative -mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--coral))] text-white shadow-md transition-all duration-150 hover:shadow-lg active:scale-95"
                  >
                    <Plus className="h-6 w-6" aria-hidden="true" />
                  </button>
                </React.Fragment>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-2 min-w-[48px] transition-colors duration-150",
                  item.active
                    ? "text-[hsl(var(--color-teal-500))]"
                    : "text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))]"
                )}
              >
                <Icon
                  className="h-6 w-6"
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-[11px] leading-tight",
                    item.active && "font-semibold text-[hsl(var(--color-teal-700))]"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
);
MobileBottomNav.displayName = "MobileBottomNav";

export { MobileBottomNav };
