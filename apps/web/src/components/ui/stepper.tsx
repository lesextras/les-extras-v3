"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/* ─── C.20 — Stepper ─────────────────────────────────────────────
   Multi-step progress indicator.
   Horizontal on desktop, vertical on mobile.
   States: completed (teal + check), current (teal + number, bold),
   upcoming (gray border + number).
   ─────────────────────────────────────────────────────────────── */

export interface StepperStep {
  /** Step label */
  label: string;
  /** Optional description (shown below label) */
  description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ordered list of steps */
  steps: StepperStep[];
  /** 0-indexed current step */
  currentStep: number;
  /** Force vertical layout (default: auto based on breakpoint) */
  vertical?: boolean;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, steps, currentStep, vertical, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          vertical
            ? "flex flex-col gap-0"
            : "flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0",
          className
        )}
        role="list"
        aria-label="Étapes"
        {...props}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.label}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                /* Vertical or mobile */
                vertical
                  ? "flex items-start gap-3"
                  : "flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:flex-1",
              )}
            >
              {/* Circle + connector */}
              <div
                className={cn(
                  "flex flex-col items-center",
                  vertical ? "gap-0" : "gap-0 sm:flex-row sm:w-full sm:items-center"
                )}
              >
                {/* Connector before (horizontal only — desktop) */}
                {!vertical && index > 0 && (
                  <div
                    className={cn(
                      "hidden sm:block h-0.5 flex-1",
                      isCompleted
                        ? "bg-[hsl(var(--color-teal-500))]"
                        : "bg-[hsl(var(--border))]"
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Circle */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200",
                    isCompleted &&
                      "bg-[hsl(var(--color-teal-500))] text-white",
                    isCurrent &&
                      "bg-[hsl(var(--color-teal-500))] text-white ring-4 ring-[hsl(var(--color-teal-50))]",
                    !isCompleted &&
                      !isCurrent &&
                      "border-2 border-[hsl(var(--border))] text-[hsl(var(--text-tertiary))] bg-card"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Connector after (horizontal only — desktop) */}
                {!vertical && index < steps.length - 1 && (
                  <div
                    className={cn(
                      "hidden sm:block h-0.5 flex-1",
                      index < currentStep
                        ? "bg-[hsl(var(--color-teal-500))]"
                        : "bg-[hsl(var(--border))]"
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Label + description */}
              <div
                className={cn(
                  vertical
                    ? "pb-6"
                    : "pb-4 sm:pb-0 sm:text-center sm:mt-2",
                )}
              >
                <span
                  className={cn(
                    "text-body-sm block",
                    isCurrent
                      ? "font-semibold text-[hsl(var(--text-primary))]"
                      : isCompleted
                        ? "text-[hsl(var(--color-teal-700))]"
                        : "text-[hsl(var(--text-tertiary))]"
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-caption text-[hsl(var(--text-tertiary))] block mt-0.5">
                    {step.description}
                  </span>
                )}
              </div>

              {/* Vertical connector */}
              {vertical && index < steps.length - 1 && (
                <div className="sr-only" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    );
  }
);
Stepper.displayName = "Stepper";

export { Stepper };
