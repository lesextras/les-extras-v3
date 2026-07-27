"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Banknote,
  ArrowRight,
} from "lucide-react";

/* ─── C.8 — Renfort Card ─────────────────────────────────────────
   Displays a renfort/remplacement mission in the freelance feed.
   3 variants: urgent (coral border), normal (teal border), closed.
   ─────────────────────────────────────────────────────────────── */

const renfortCardVariants = cva(
  "relative rounded-xl bg-card text-card-foreground border transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        urgent:
          "border-l-[3px] border-l-[hsl(var(--coral))] border-t border-r border-b shadow-sm hover:shadow-md hover:-translate-y-0.5",
        normal:
          "border-l-[3px] border-l-[hsl(var(--teal))] border-t border-r border-b shadow-sm hover:shadow-md hover:-translate-y-0.5",
        closed:
          "border opacity-70 shadow-none cursor-default",
      },
    },
    defaultVariants: {
      variant: "normal",
    },
  }
);

export interface RenfortCardProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof renfortCardVariants> {
  /** Mission title, e.g. "Aide-soignant(e) de nuit" */
  title: string;
  /** Establishment name */
  establishment: string;
  /** City */
  city: string;
  /** Date range display, e.g. "17-19 mars" */
  dates?: string;
  /** Time range display, e.g. "21h–7h" */
  hours?: string;
  /** Hourly rate display, e.g. "28€/h" */
  rate?: string;
  /** Relative timestamp, e.g. "il y a 2h" */
  timestamp?: string;
  /** Skill/requirement badges */
  badges?: string[];
  /** CTA click handler */
  onAction?: () => void;
  /** CTA label override */
  actionLabel?: string;
  /** Disable the CTA (e.g. already applied / pending) */
  actionDisabled?: boolean;
  /** Optional link to the detail page (makes the title a link) */
  href?: string;
}

const RenfortCard = React.forwardRef<HTMLElement, RenfortCardProps>(
  (
    {
      className,
      variant,
      title,
      establishment,
      city,
      dates,
      hours,
      rate,
      timestamp,
      badges,
      onAction,
      actionLabel,
      actionDisabled,
      href,
      ...props
    },
    ref
  ) => {
    const isClosed = variant === "closed";
    const isUrgent = variant === "urgent";

    return (
      <article
        ref={ref}
        className={cn(renfortCardVariants({ variant }), className)}
        aria-label={`Mission : ${title} — ${establishment}, ${city}`}
        {...props}
      >
        <div className="p-5 space-y-3 sm:p-4">
          {/* Top row: urgency badge + timestamp */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isUrgent && (
                <Badge variant="coral" size="sm" aria-label="Mission urgente">
                  URGENT
                </Badge>
              )}
              {isClosed && (
                <Badge variant="emerald" size="sm">
                  Pourvu
                </Badge>
              )}
            </div>
            {timestamp && (
              <span className="text-caption text-[hsl(var(--text-secondary))]">
                {timestamp}
              </span>
            )}
          </div>

          {/* Title */}
          {href ? (
            <Link href={href} className="hover:underline focus-visible:outline-none focus-visible:underline">
              <h3 className="text-heading-md text-[hsl(var(--text-primary))]">
                {title}
              </h3>
            </Link>
          ) : (
            <h3 className="text-heading-md text-[hsl(var(--text-primary))]">
              {title}
            </h3>
          )}

          {/* Establishment · City */}
          <p className="text-body-sm text-[hsl(var(--text-secondary))]">
            {establishment} · {city}
          </p>

          {/* Meta row */}
          {(dates || hours || rate) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-[hsl(var(--text-secondary))]">
              {dates && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {dates}
                </span>
              )}
              {hours && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {hours}
                </span>
              )}
              {rate && (
                <span className="inline-flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
                  {rate}
                </span>
              )}
            </div>
          )}

          {/* Skill badges */}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge key={badge} variant="default" size="sm">
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {/* CTA */}
          {!isClosed && (
            <div className="pt-1">
              <Button
                variant="coral"
                size="sm"
                className="w-full sm:w-auto"
                onClick={onAction}
                disabled={actionDisabled}
              >
                {actionLabel ?? "Voir & Postuler"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </article>
    );
  }
);
RenfortCard.displayName = "RenfortCard";

export { RenfortCard, renfortCardVariants };
