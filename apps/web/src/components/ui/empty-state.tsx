"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { EASE_PREMIUM, SPRING_SOFT } from "@/lib/motion";

// Lottie loaded client-only to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export interface EmptyStateAction {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "default" | "coral" | "teal-soft" | "outline" | "ghost";
}

export interface EmptyStateProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragOver' | 'onDrop' |
    'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onTransitionEnd'
> {
    icon?: LucideIcon;
    /** Lottie animation JSON — when provided, renders instead of the icon */
    lottieAnimation?: object;
    /** Width/height of the Lottie animation in px, default 160 */
    lottieSize?: number;
    title: string;
    description?: string;
    primaryAction?: EmptyStateAction;
    secondaryAction?: EmptyStateAction;
    tips?: string;
}

export function EmptyState({
    icon: Icon,
    lottieAnimation,
    lottieSize = 160,
    title,
    description,
    primaryAction,
    secondaryAction,
    tips,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <motion.div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto",
                className
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_PREMIUM }}
            {...props}
        >
            {/* Illustration — Lottie takes priority over icon */}
            {lottieAnimation ? (
                <div className="mb-4 w-40 h-40">
                    <Lottie
                        animationData={lottieAnimation}
                        loop
                        className="w-full h-full"
                    />
                </div>
            ) : Icon ? (
                <motion.div
                    className="mb-4 rounded-2xl bg-[hsl(var(--surface-2))] p-5"
                    whileHover={{ scale: 1.05, rotate: -3 }}
                    transition={SPRING_SOFT}
                >
                    <Icon className="h-9 w-9 text-muted-foreground/50" aria-hidden="true" />
                </motion.div>
            ) : null}

            <h3 className="text-lg font-bold text-foreground font-display">{title}</h3>

            {description && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {description}
                </p>
            )}

            {(primaryAction || secondaryAction) && (
                <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
                    {primaryAction && (
                        primaryAction.href ? (
                            <Button variant={primaryAction.variant ?? "coral"} asChild>
                                <Link href={primaryAction.href}>{primaryAction.label}</Link>
                            </Button>
                        ) : (
                            <Button variant={primaryAction.variant ?? "coral"} onClick={primaryAction.onClick}>
                                {primaryAction.label}
                            </Button>
                        )
                    )}

                    {secondaryAction && (
                        secondaryAction.href ? (
                            <Button variant={secondaryAction.variant ?? "outline"} asChild>
                                <Link href={secondaryAction.href}>
                                    {secondaryAction.label}
                                </Link>
                            </Button>
                        ) : (
                            <Button variant={secondaryAction.variant ?? "outline"} onClick={secondaryAction.onClick}>
                                {secondaryAction.label}
                            </Button>
                        )
                    )}
                </div>
            )}

            {tips && (
                <p className="mt-4 text-xs text-muted-foreground/70 italic">
                    💡 {tips}
                </p>
            )}
        </motion.div>
    );
}
