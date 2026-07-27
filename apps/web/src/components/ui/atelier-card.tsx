"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, GraduationCap, Star } from "lucide-react";

/* ─── C.10 — Atelier Card ────────────────────────────────────────
   Displays a workshop proposed by a freelance.
   Tinted violet background. Variants: default, featured, booked.
   ─────────────────────────────────────────────────────────────── */

const atelierCardVariants = cva(
  "rounded-xl text-card-foreground border transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--color-violet-50))] border-l-[3px] border-l-[hsl(var(--violet))] border-t border-r border-b border-t-[hsl(var(--violet)/0.16)] border-r-[hsl(var(--violet)/0.16)] border-b-[hsl(var(--violet)/0.16)] shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        featured:
          "bg-[hsl(var(--color-violet-50))] border-[hsl(var(--violet)/0.16)] shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        booked:
          "bg-[hsl(var(--color-violet-50))] border-[hsl(var(--violet)/0.16)] shadow-sm cursor-default",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AtelierCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof atelierCardVariants> {
  /** Workshop title */
  title: string;
  /** Freelance name, e.g. "Sarah K." */
  freelanceName: string;
  /** Average rating */
  rating?: number;
  /** Short description (2 lines max) */
  description?: string;
  /** Meta: e.g. "Sessions dispo" */
  availability?: string;
  /** Duration, e.g. "2h" */
  duration?: string;
  /** Price, e.g. "450€" */
  price?: string;
  /** Category tags */
  tags?: string[];
  /** Callbacks */
  onLearnMore?: () => void;
  onBook?: () => void;
}

const AtelierCard = React.forwardRef<HTMLDivElement, AtelierCardProps>(
  (
    {
      className,
      variant,
      title,
      freelanceName,
      rating,
      description,
      availability,
      duration,
      price,
      tags,
      onLearnMore,
      onBook,
      ...props
    },
    ref
  ) => {
    const isBooked = variant === "booked";
    const isFeatured = variant === "featured";

    return (
      <div
        ref={ref}
        className={cn(atelierCardVariants({ variant }), className)}
        {...props}
      >
        <div className="p-5 space-y-3">
          {/* Icon + badges row */}
          <div className="flex items-center justify-between gap-2">
            <GraduationCap
              className="h-6 w-6 text-[hsl(var(--violet))]"
              aria-hidden="true"
            />
            <div className="flex items-center gap-1.5">
              {isFeatured && (
                <Badge variant="sand" size="sm">
                  Recommandé
                </Badge>
              )}
              {isBooked && (
                <Badge variant="teal" size="sm">
                  Réservé
                </Badge>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-heading-md text-[hsl(var(--text-primary))]">
            {title}
          </h3>

          {/* Freelance + rating */}
          <p className="text-body-sm text-[hsl(var(--text-secondary))]">
            par {freelanceName}
            {rating !== undefined && (
              <span className="inline-flex items-center gap-1 ml-2 text-[hsl(var(--color-amber-700))]">
                <Star
                  className="h-3 w-3 fill-[hsl(var(--color-amber-500))]"
                  aria-hidden="true"
                />
                {rating.toFixed(1)}
              </span>
            )}
          </p>

          {/* Description */}
          {description && (
            <p className="text-body-sm text-[hsl(var(--text-secondary))] line-clamp-2">
              {description}
            </p>
          )}

          {/* Meta row */}
          {(availability || duration || price) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-[hsl(var(--text-secondary))]">
              {availability && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {availability}
                </span>
              )}
              {duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {duration}
                </span>
              )}
              {price && (
                <span className="font-medium text-[hsl(var(--text-primary))]">
                  {price}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="violet" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          {!isBooked && (
            <div className="flex items-center gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={onLearnMore}>
                En savoir plus
              </Button>
              <Button variant="coral" size="sm" onClick={onBook}>
                Réserver
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
AtelierCard.displayName = "AtelierCard";

export { AtelierCard, atelierCardVariants };
