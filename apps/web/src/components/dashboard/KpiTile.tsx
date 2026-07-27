"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LucideIcon } from "lucide-react";
import {
    EASE_PREMIUM,
    STAGGER_DEFAULT,
    iconHover,
    SPRING_ICON,
    hoverLift,
} from "@/lib/motion";

export interface KpiTileProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>, 
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragOver' | 'onDrop' | 
    'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onTransitionEnd'
> {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: "up" | "down" | "flat";
    trendLabel?: string;
    /** Icon container color — "teal" | "coral" | "sand" | "violet" | "emerald" | "amber" | "gray" */
    iconColor?: "teal" | "coral" | "sand" | "violet" | "emerald" | "amber" | "gray";
    /** Stagger entrance delay index */
    index?: number;
    href?: string;
}

const iconContainerMap: Record<string, string> = {
    teal: "icon-teal",
    coral: "icon-coral",
    sand: "icon-sand",
    violet: "icon-violet",
    emerald: "icon-emerald",
    amber: "icon-amber",
    gray: "icon-gray",
};

export function KpiTile({
    label,
    value,
    icon: Icon,
    trend,
    trendLabel,
    iconColor = "teal",
    index = 0,
    href,
    className,
    ...props
}: KpiTileProps) {
    const trendVariant =
        trend === "up" ? "success" : trend === "down" ? "error" : "quiet";

    const iconClass = iconContainerMap[iconColor] ?? "icon-teal";
    const staggerDelay = index * STAGGER_DEFAULT;

    const tile = (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay: staggerDelay,
                ease: EASE_PREMIUM,
            }}
            whileHover={hoverLift}
            className={cn(
                "bg-card card-shadow border border-border rounded-2xl",
                "focus-within:ring-2 focus-within:ring-ring",
                "p-6 relative overflow-hidden h-full",
                href ? "cursor-pointer" : "cursor-default",
                className
            )}
            {...props}
        >
            <div className="relative z-10 flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground leading-tight">
                    {label}
                </p>
                <motion.div
                    className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconClass)}
                    whileHover={iconHover}
                    transition={SPRING_ICON}
                >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </motion.div>
            </div>

            <div className="relative z-10">
                {typeof value === "number" ? (
                    <AnimatedNumber
                        value={value}
                        className="text-3xl font-bold tracking-tight text-foreground font-display"
                    />
                ) : (
                    <motion.p
                        className="text-3xl font-bold tracking-tight text-foreground font-display"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: staggerDelay + 0.12, ease: "easeOut" }}
                    >
                        {value}
                    </motion.p>
                )}
            </div>

            {trend && trendLabel && (
                <div className="mt-3 relative z-10">
                    <Badge
                        variant={trendVariant}
                        className={cn(
                            "text-xs gap-1",
                            trend === "up" && "animate-pulse-ring-teal"
                        )}
                    >
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"}
                        {" "}{trendLabel}
                    </Badge>
                </div>
            )}
        </motion.div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`${label} — ouvrir la page associée`}
            >
                {tile}
            </Link>
        );
    }

    return tile;
}
