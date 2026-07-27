"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type OnboardingFormCardProps = {
    stepKey: number;
    eyebrow?: string;
    title: string;
    description: string;
    children: React.ReactNode;
    footer: React.ReactNode;
    className?: string;
};

export function OnboardingFormCard({
    stepKey,
    eyebrow,
    title,
    description,
    children,
    footer,
    className,
}: OnboardingFormCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "relative w-full max-w-lg glass-panel rounded-2xl shimmer-border highlight-top overflow-hidden",
                className
            )}
        >
            <div className="p-8 sm:p-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={stepKey}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Header */}
                        <div className="mb-8 space-y-2">
                            {eyebrow && (
                                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--teal))]">
                                    {eyebrow}
                                </p>
                            )}
                            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
                                {title}
                            </h1>
                            <p className="text-sm text-[hsl(var(--text-secondary))]">
                                {description}
                            </p>
                        </div>

                        {/* Form fields */}
                        <div className="space-y-5">{children}</div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-2)/0.5)] px-8 py-4 sm:px-10">
                {footer}
            </div>
        </motion.div>
    );
}
