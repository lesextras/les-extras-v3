"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

/* ─── C.11 — Review Card ─────────────────────────────────────────
   Displays a post-mission review.
   Variants: default, compact (inline), highlight (landing page).
   ─────────────────────────────────────────────────────────────── */

const reviewCardVariants = cva(
  "rounded-xl text-card-foreground border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card border-border shadow-sm p-5",
        compact: "bg-card border-border shadow-sm p-3",
        highlight:
          "bg-[hsl(var(--color-sand-50))] border-[hsl(var(--sand)/0.20)] shadow-sm p-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ReviewCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof reviewCardVariants> {
  /** Author name */
  authorName: string;
  /** Author role, e.g. "Directeur" */
  authorRole?: string;
  /** Author organization, e.g. "EHPAD Bellevue" */
  authorOrg?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Rating 1-5 */
  rating: number;
  /** Review text */
  text: string;
  /** Context line, e.g. "Mission : AS nuit · Mars 2026" */
  context?: string;
  /** Max lines for text before truncation (compact: 1, mobile: 3) */
  maxLines?: number;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} sur ${max} étoiles`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating
              ? "fill-[hsl(var(--color-amber-500))] text-[hsl(var(--color-amber-500))]"
              : "text-[hsl(var(--color-navy-200))]"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

const ReviewCard = React.forwardRef<HTMLDivElement, ReviewCardProps>(
  (
    {
      className,
      variant,
      authorName,
      authorRole,
      authorOrg,
      avatarUrl,
      rating,
      text,
      context,
      maxLines,
      ...props
    },
    ref
  ) => {
    const isCompact = variant === "compact";
    const clampClass = maxLines
      ? `line-clamp-${maxLines}`
      : isCompact
        ? "line-clamp-1"
        : undefined;

    return (
      <div
        ref={ref}
        className={cn(reviewCardVariants({ variant }), className)}
        {...props}
      >
        {isCompact ? (
          /* ─── Compact: single line layout ─── */
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] text-xs font-semibold">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={authorName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  authorName.charAt(0)
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-body-sm font-medium text-[hsl(var(--text-primary))] truncate">
                  {authorName}
                </span>
                <StarRating rating={rating} />
              </div>
              <p className={cn("text-body-sm text-[hsl(var(--text-secondary))] italic", clampClass)}>
                &laquo; {text} &raquo;
              </p>
            </div>
          </div>
        ) : (
          /* ─── Default / Highlight: full layout ─── */
          <div className="space-y-3">
            {/* Header: avatar + identity + stars */}
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] text-sm font-semibold">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={authorName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    authorName.charAt(0)
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-heading-sm text-[hsl(var(--text-primary))]">
                    {authorName}
                  </span>
                  <StarRating rating={rating} />
                </div>
                {(authorRole || authorOrg) && (
                  <p className="text-body-sm text-[hsl(var(--text-secondary))]">
                    {[authorRole, authorOrg].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>

            {/* Review text */}
            <p
              className={cn(
                "text-body-md text-[hsl(var(--text-primary))] italic",
                clampClass
              )}
            >
              &laquo; {text} &raquo;
            </p>

            {/* Context */}
            {context && (
              <p className="text-caption text-[hsl(var(--text-tertiary))]">
                {context}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
ReviewCard.displayName = "ReviewCard";

export { ReviewCard, reviewCardVariants, StarRating };
