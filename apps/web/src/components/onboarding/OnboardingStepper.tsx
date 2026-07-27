"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type OnboardingStepperProps = {
    currentStep: number;
    totalSteps: number;
    labels: string[];
};

export function OnboardingStepper({
    currentStep,
    totalSteps,
    labels,
}: OnboardingStepperProps) {
    return (
        <div className="flex items-center justify-center gap-0">
            {Array.from({ length: totalSteps }, (_, i) => {
                const stepNum = i + 1;
                const isCompleted = stepNum < currentStep;
                const isActive = stepNum === currentStep;

                return (
                    <div key={i} className="flex items-center">
                        {/* Step circle + label */}
                        <div className="flex flex-col items-center gap-1.5">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                className={cn(
                                    "relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                                    isCompleted && "bg-[hsl(var(--teal))] text-white",
                                    isActive && "bg-[hsl(var(--teal))] text-white step-pulse",
                                    !isCompleted && !isActive && "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-tertiary))] border border-[hsl(var(--border))]"
                                )}
                            >
                                {isCompleted ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <Check className="h-4 w-4" />
                                    </motion.div>
                                ) : (
                                    stepNum
                                )}
                            </motion.div>
                            <span
                                className={cn(
                                    "text-xs font-medium whitespace-nowrap transition-colors duration-200",
                                    isActive
                                        ? "text-[hsl(var(--teal))]"
                                        : isCompleted
                                            ? "text-[hsl(var(--text-secondary))]"
                                            : "text-[hsl(var(--text-tertiary))]"
                                )}
                            >
                                {labels[i]}
                            </span>
                        </div>

                        {/* Connector line */}
                        {i < totalSteps - 1 && (
                            <div className="relative mx-4 h-0.5 w-16 overflow-hidden rounded-full bg-[hsl(var(--border))]">
                                <motion.div
                                    className="absolute inset-y-0 left-0 rounded-full bg-[hsl(var(--teal))]"
                                    initial={{ width: "0%" }}
                                    animate={{
                                        width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                                    }}
                                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
