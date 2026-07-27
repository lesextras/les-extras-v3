"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Info, CheckCircle2, AlertTriangle, XCircle, Siren, X } from "lucide-react";

/* ─── C.22 — Alert Block ─────────────────────────────────────────
   Contextual message integrated in content (persistent, not toast).
   Variants: info, success, warning, error, renfort.
   Options: dismissible, with-action, compact.
   ─────────────────────────────────────────────────────────────── */

const alertBlockVariants = cva(
  "relative w-full rounded-xl border text-body-sm",
  {
    variants: {
      variant: {
        info: "bg-[hsl(var(--color-teal-50))] border-[hsl(var(--teal)/0.2)] [&_.alert-icon]:text-[hsl(var(--color-teal-500))]",
        success:
          "bg-[hsl(var(--color-emerald-50))] border-[hsl(var(--emerald)/0.2)] [&_.alert-icon]:text-[hsl(var(--color-emerald-500))]",
        warning:
          "bg-[hsl(var(--color-amber-50))] border-[hsl(var(--amber)/0.2)] [&_.alert-icon]:text-[hsl(var(--color-amber-500))]",
        error:
          "bg-[hsl(var(--color-red-50))] border-[hsl(var(--color-red-500)/0.2)] [&_.alert-icon]:text-[hsl(var(--color-red-500))]",
        renfort:
          "bg-[hsl(var(--color-coral-50))] border-[hsl(var(--coral)/0.2)] [&_.alert-icon]:text-[hsl(var(--color-coral-500))]",
      },
      size: {
        default: "px-4 py-3",
        compact: "px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "info",
      size: "default",
    },
  }
);

const VARIANT_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  renfort: Siren,
} as const;

export interface AlertBlockAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface AlertBlockProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertBlockVariants> {
  /** Main message */
  title: React.ReactNode;
  /** Optional description below the title */
  description?: React.ReactNode;
  /** Dismissible (shows × button) */
  dismissible?: boolean;
  /** Called when dismissed */
  onDismiss?: () => void;
  /** Optional action button */
  action?: AlertBlockAction;
  /** Override default icon */
  icon?: React.ElementType;
}

const AlertBlock = React.forwardRef<HTMLDivElement, AlertBlockProps>(
  (
    {
      className,
      variant = "info",
      size,
      title,
      description,
      dismissible,
      onDismiss,
      action,
      icon,
      ...props
    },
    ref
  ) => {
    const [dismissed, setDismissed] = React.useState(false);
    const Icon = icon ?? VARIANT_ICONS[variant ?? "info"];

    if (dismissed) return null;

    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertBlockVariants({ variant, size }), className)}
        {...props}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <Icon
            className="alert-icon mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />

          {/* Content */}
          <div className="flex-1 space-y-1.5">
            <p className="font-medium text-[hsl(var(--text-primary))]">
              {title}
            </p>
            {description && (
              <p className="text-[hsl(var(--text-secondary))]">
                {description}
              </p>
            )}
            {action && (
              <div className="pt-1">
                {action.href ? (
                  <a
                    href={action.href}
                    className="inline-flex items-center gap-1 text-body-sm font-medium text-[hsl(var(--text-link))] hover:underline"
                  >
                    {action.label} →
                  </a>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={action.onClick}
                  >
                    {action.label} →
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Dismiss */}
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 rounded-md p-1 text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))] transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
AlertBlock.displayName = "AlertBlock";

export { AlertBlock, alertBlockVariants };
