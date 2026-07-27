import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background font-medium hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "font-medium hover:bg-accent hover:text-accent-foreground active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        /* Coral — Action forte (RENFORT, CTA urgent) — glow on hover only */
        coral:
          "bg-[hsl(var(--coral))] text-white hover:bg-[hsl(var(--coral)/0.88)] hover:shadow-glow-coral active:scale-[0.97]",
        /* Action — alias for coral per C.1 spec */
        action:
          "bg-[hsl(var(--coral))] text-white hover:bg-[hsl(var(--coral)/0.88)] hover:shadow-glow-coral active:scale-[0.97]",
        /* Teal — primary action variant — glow on hover only */
        teal:
          "bg-[hsl(var(--teal))] text-white hover:bg-[hsl(var(--teal)/0.88)] hover:shadow-glow-teal active:scale-[0.97]",
        /* Teal soft — action secondaire */
        "teal-soft":
          "bg-[hsl(var(--teal-light))] text-[hsl(var(--teal))] border border-[hsl(var(--teal)/0.2)] hover:bg-[hsl(var(--teal)/0.12)] active:scale-[0.97]",
        /* Coral soft — alerte douce */
        "coral-soft":
          "bg-[hsl(var(--coral-light))] text-[hsl(var(--coral))] border border-[hsl(var(--coral)/0.2)] hover:bg-[hsl(var(--coral)/0.12)] active:scale-[0.97]",
        /* Warm — Ateliers secondary (sand tint) per C.1 */
        warm:
          "bg-[hsl(var(--sand-light))] text-[hsl(var(--sand-dim))] border border-[hsl(var(--sand)/0.2)] hover:bg-[hsl(var(--sand)/0.15)] active:scale-[0.97]",
        /* Glass — light surface button */
        glass:
          "bg-card border border-border text-foreground font-medium hover:bg-accent/40 hover:shadow-card active:scale-[0.97]",
        "danger-soft":
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 active:scale-[0.97]",
        quiet:
          "text-muted-foreground font-medium hover:text-foreground hover:bg-muted active:scale-[0.97]",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-7 rounded-md px-2 text-xs",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-8 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
