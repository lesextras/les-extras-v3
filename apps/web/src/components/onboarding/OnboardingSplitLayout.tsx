"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type OnboardingSplitLayoutProps = {
    leftPanel: React.ReactNode;
    rightPanel: React.ReactNode;
    className?: string;
};

export function OnboardingSplitLayout({
    leftPanel,
    rightPanel,
    className,
}: OnboardingSplitLayoutProps) {
    return (
        <div className={cn("relative min-h-screen bg-background overflow-hidden", className)}>
            {/* Background layers */}
            <div className="pointer-events-none fixed inset-0 onboarding-dots" />
            <div className="pointer-events-none fixed inset-0 onboarding-shaft" />
            <div className="pointer-events-none fixed inset-0 bg-grain opacity-25" />

            {/* Split grid */}
            <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
                {/* Left contextual panel */}
                <div className="hidden lg:flex flex-col justify-center px-12 xl:px-16">
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {leftPanel}
                    </motion.div>
                </div>

                {/* Right form panel */}
                <div className="flex flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
                    {rightPanel}
                </div>
            </div>
        </div>
    );
}
