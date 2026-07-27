"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_PREMIUM, DURATION_NORMAL } from "@/lib/motion";

const glassCardVariants = cva(
    "rounded-2xl text-card-foreground transition-all duration-200",
    {
        variants: {
            variant: {
                /* White card — default clean surface */
                solid:
                    "bg-card card-shadow border border-border",
                /* Subtle blur — light translucency, no heavy glassmorphism */
                glass:
                    "bg-card/95 backdrop-blur-sm card-shadow border border-border",
                /* Hover-lift interactive card — clean, no spotlight */
                interactive:
                    "bg-card card-shadow border border-border hover:card-shadow-md hover:-translate-y-0.5 hover:border-[hsl(var(--teal)/0.25)] cursor-pointer",
                /* Teal tint — KPI primary / trust widget */
                teal:
                    "bg-[hsl(var(--teal-light))] border border-[hsl(var(--teal)/0.15)]",
                /* Coral tint — action / urgent widget */
                coral:
                    "bg-[hsl(var(--coral-light))] border border-[hsl(var(--coral)/0.15)]",
                /* Muted surface — secondary sections */
                muted:
                    "bg-[hsl(var(--surface-2))] border border-border",
            },
        },
        defaultVariants: {
            variant: "solid",
        },
    }
);

type AnimateProps = {
    animate?: true;
    delay?: number;
};

export type GlassCardProps =
    | (React.HTMLAttributes<HTMLDivElement> &
          VariantProps<typeof glassCardVariants> &
          AnimateProps & { animate?: undefined })
    | (HTMLMotionProps<"div"> &
          VariantProps<typeof glassCardVariants> &
          AnimateProps & { animate: true });

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant, animate, delay = 0, ...props }, ref) => {
        const classes = cn(glassCardVariants({ variant }), className);

        if (animate) {
            return (
                <motion.div
                    ref={ref as React.Ref<HTMLDivElement>}
                    className={classes}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DURATION_NORMAL, delay, ease: EASE_PREMIUM }}
                    {...(props as HTMLMotionProps<"div">)}
                />
            );
        }
        return (
            <div
                ref={ref}
                className={classes}
                {...(props as React.HTMLAttributes<HTMLDivElement>)}
            />
        );
    }
);
GlassCard.displayName = "GlassCard";

const GlassCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
GlassCardFooter.displayName = "GlassCardFooter";

export {
    GlassCard,
    GlassCardHeader,
    GlassCardContent,
    GlassCardFooter,
    glassCardVariants,
};
