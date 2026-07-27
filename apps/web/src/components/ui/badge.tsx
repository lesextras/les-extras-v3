import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-px text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--color-navy-50))] text-[hsl(var(--color-navy-500))]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        /* C.14 — Brand badge variants */
        teal:
          "bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] border-[hsl(var(--teal)/0.2)]",
        coral:
          "bg-[hsl(var(--color-coral-50))] text-[hsl(var(--color-coral-700))] border-[hsl(var(--coral)/0.2)]",
        sand:
          "bg-[hsl(var(--color-sand-50))] text-[hsl(var(--color-sand-700))] border-[hsl(var(--sand)/0.2)]",
        violet:
          "bg-[hsl(var(--color-violet-50))] text-[hsl(var(--color-violet-700))] border-[hsl(var(--violet)/0.2)]",
        emerald:
          "bg-[hsl(var(--color-emerald-50))] text-[hsl(var(--color-emerald-700))] border-[hsl(var(--emerald)/0.2)]",
        amber:
          "bg-[hsl(var(--color-amber-50))] text-[hsl(var(--color-amber-700))] border-[hsl(var(--amber)/0.2)]",
        red:
          "bg-[hsl(var(--color-red-50))] text-[hsl(var(--color-red-700))] border-[hsl(var(--color-red-500)/0.2)]",
        /* Semantic aliases */
        success:
          "bg-[hsl(var(--color-emerald-50))] text-[hsl(var(--color-emerald-700))] border-[hsl(var(--emerald)/0.2)]",
        warning:
          "bg-[hsl(var(--color-amber-50))] text-[hsl(var(--color-amber-700))] border-[hsl(var(--amber)/0.2)]",
        error:
          "bg-[hsl(var(--color-red-50))] text-[hsl(var(--color-red-700))] border-[hsl(var(--color-red-500)/0.2)]",
        info:
          "bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] border-[hsl(var(--teal)/0.2)]",
        quiet:
          "bg-muted text-muted-foreground font-medium border-transparent",
        status:
          "uppercase tracking-wide bg-muted text-muted-foreground border-transparent",
      },
      size: {
        default: "px-2 py-px text-xs",
        sm: "h-5 px-1.5 text-[11px]",
        md: "h-6 px-2 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
