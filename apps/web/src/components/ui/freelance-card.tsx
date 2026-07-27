"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, ShieldCheck, ArrowUpRight } from "lucide-react";

/* ─── C.9 — Freelance Card ────────────────────────────────────────
   Presents a freelance professional in the establishment catalog.
   Variants: available, busy, verified, compact.
   ─────────────────────────────────────────────────────────────── */

const freelanceCardVariants = cva(
  "rounded-xl bg-card text-card-foreground border shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        available:
          "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        busy:
          "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        verified:
          "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        compact:
          "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "available",
    },
  }
);

export interface FreelanceCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof freelanceCardVariants> {
  /** Display name, e.g. "Marie D." */
  name: string;
  /** Professional title, e.g. "Aide-soignante DE" */
  title: string;
  /** City */
  city: string;
  /** Average rating (0-5) */
  rating?: number;
  /** Total reviews count */
  reviewCount?: number;
  /** Avatar URL */
  avatarUrl?: string;
  /** Avatar fallback initials */
  initials?: string;
  /** Verified freelance */
  isVerified?: boolean;
  /** Whether the freelance is currently available */
  isAvailable?: boolean;
  /** Skill/competence badges */
  badges?: string[];
  /** Social proof line, e.g. "12 missions · Membre depuis janv. 2025" */
  socialProof?: string;
  /** View profile callback */
  onViewProfile?: () => void;
  /** Propose mission callback */
  onPropose?: () => void;
}

const FreelanceCard = React.forwardRef<HTMLDivElement, FreelanceCardProps>(
  (
    {
      className,
      variant,
      name,
      title,
      city,
      rating,
      avatarUrl,
      initials,
      isVerified,
      isAvailable = true,
      badges,
      socialProof,
      onViewProfile,
      onPropose,
      ...props
    },
    ref
  ) => {
    const isCompact = variant === "compact";

    return (
      <div
        ref={ref}
        className={cn(freelanceCardVariants({ variant }), className)}
        {...props}
      >
        <div className={cn("p-5 space-y-3", isCompact && "p-4 space-y-2")}>
          {/* Header: avatar + identity + rating */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] font-semibold",
                  isCompact ? "h-10 w-10 text-sm" : "h-12 w-12 text-base"
                )}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials || name.charAt(0)
                )}
              </div>
              {/* Verified checkmark */}
              {(isVerified || variant === "verified") && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--color-teal-500))] text-white"
                  aria-label="Profil vérifié"
                >
                  <ShieldCheck className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3
                  className={cn(
                    "font-semibold text-[hsl(var(--text-primary))] truncate",
                    isCompact ? "text-body-md" : "text-heading-sm"
                  )}
                >
                  {name}
                </h3>
                {rating !== undefined && (
                  <span className="inline-flex items-center gap-1 text-body-sm font-medium text-[hsl(var(--color-amber-700))]">
                    <Star
                      className="h-3.5 w-3.5 fill-[hsl(var(--color-amber-500))]"
                      aria-hidden="true"
                    />
                    {rating.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-body-sm text-[hsl(var(--text-secondary))] truncate">
                {title}
              </p>
              <p className="text-body-sm text-[hsl(var(--text-secondary))] inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {city}
                {" · "}
                {isAvailable && variant !== "busy" ? (
                  <span className="text-[hsl(var(--color-emerald-700))]">
                    Disponible
                  </span>
                ) : (
                  <span className="text-[hsl(var(--text-tertiary))]">
                    En mission
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Skill badges (not shown in compact) */}
          {!isCompact && badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge key={badge} variant="default" size="sm">
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Social proof */}
          {socialProof && (
            <p className="text-caption text-[hsl(var(--text-tertiary))]">
              {socialProof}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="teal-soft"
              size="sm"
              onClick={onViewProfile}
            >
              Voir le profil
            </Button>
            {!isCompact && onPropose && (
              <Button variant="coral" size="sm" onClick={onPropose}>
                Proposer
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
FreelanceCard.displayName = "FreelanceCard";

export { FreelanceCard, freelanceCardVariants };
