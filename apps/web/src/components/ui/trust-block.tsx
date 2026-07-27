"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

/* ─── C.15 — Trust Block ─────────────────────────────────────────
   Reassurance block showing verifications and credibility.
   Variants: inline (horizontal badges), block (tinted-teal card
   with vertical checklist), compact (single line).
   ─────────────────────────────────────────────────────────────── */

const trustBlockVariants = cva("", {
  variants: {
    variant: {
      inline: "flex flex-wrap items-center gap-2",
      block:
        "rounded-xl bg-[hsl(var(--color-teal-50))] border border-[hsl(var(--teal)/0.16)] p-5 space-y-2",
      compact: "flex items-center gap-2 text-body-sm",
    },
  },
  defaultVariants: {
    variant: "block",
  },
});

export type TrustItemStatus = "verified" | "pending" | "missing";

export interface TrustItem {
  label: string;
  status: TrustItemStatus;
}

export interface TrustBlockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof trustBlockVariants> {
  items: TrustItem[];
}

const STATUS_ICON = {
  verified: CheckCircle2,
  pending: Clock,
  missing: XCircle,
} as const;

const STATUS_STYLE = {
  verified: "text-[hsl(var(--color-emerald-500))]",
  pending: "text-[hsl(var(--color-amber-500))]",
  missing: "text-[hsl(var(--color-red-500))]",
} as const;

const STATUS_TEXT = {
  verified: "text-[hsl(var(--text-primary))]",
  pending: "text-[hsl(var(--text-secondary))]",
  missing: "text-[hsl(var(--text-secondary))]",
} as const;

const TrustBlock = React.forwardRef<HTMLDivElement, TrustBlockProps>(
  ({ className, variant, items, ...props }, ref) => {
    if (variant === "inline") {
      return (
        <div
          ref={ref}
          className={cn(trustBlockVariants({ variant }), className)}
          {...props}
        >
          {items.map((item) => {
            const badgeVariant =
              item.status === "verified"
                ? "teal"
                : item.status === "pending"
                  ? "amber"
                  : "red";
            return (
              <Badge key={item.label} variant={badgeVariant} size="sm">
                {item.label}
              </Badge>
            );
          })}
        </div>
      );
    }

    if (variant === "compact") {
      const verified = items.filter((i) => i.status === "verified");
      const total = items.length;
      return (
        <div
          ref={ref}
          className={cn(trustBlockVariants({ variant }), className)}
          {...props}
        >
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--color-emerald-500))]" aria-hidden="true" />
          <span className="text-[hsl(var(--text-primary))]">
            Profil vérifié
          </span>
          <span className="text-[hsl(var(--text-tertiary))]">·</span>
          <span className="text-[hsl(var(--text-secondary))]">
            {verified.length}/{total} vérifications
          </span>
        </div>
      );
    }

    /* ─── Block (default) ─── */
    return (
      <div
        ref={ref}
        className={cn(trustBlockVariants({ variant }), className)}
        {...props}
      >
        {items.map((item) => {
          const Icon = STATUS_ICON[item.status];
          return (
            <div
              key={item.label}
              className="flex items-center gap-2.5"
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", STATUS_STYLE[item.status])}
                aria-hidden="true"
              />
              <span
                className={cn("text-body-sm", STATUS_TEXT[item.status])}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
);
TrustBlock.displayName = "TrustBlock";

export { TrustBlock, trustBlockVariants };
