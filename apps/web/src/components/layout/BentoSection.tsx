"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { containerVariants, itemFadeUp } from "@/lib/motion";

export interface BentoSectionProps extends React.HTMLAttributes<HTMLElement> {
    cols?: 2 | 3 | 4;
    gap?: "sm" | "md" | "lg";
    heading?: string;
    description?: string;
    action?: React.ReactNode;
}

export interface BentoItemProps {
    span?: 1 | 2 | 3;
    className?: string;
    children: React.ReactNode;
}

const gapMap = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
} as const;

const colsMap = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 xl:grid-cols-4",
} as const;

const spanMap = {
    1: "",
    2: "md:col-span-2",
    3: "md:col-span-2 lg:col-span-3",
} as const;

export function BentoItem({ children }: BentoItemProps) {
    return <>{children}</>;
}

BentoItem.displayName = "BentoItem";

function resolveBentoChild(child: React.ReactNode) {
    if (React.isValidElement<BentoItemProps>(child) && child.type === BentoItem) {
        return {
            className: cn(spanMap[child.props.span ?? 1], child.props.className),
            content: child.props.children,
        };
    }

    return {
        className: undefined,
        content: child,
    };
}

export function BentoSection({
    cols = 3,
    gap = "md",
    heading,
    description,
    action,
    className,
    children,
    ...props
}: BentoSectionProps) {
    const childArray = React.Children.toArray(children);

    return (
        <section className={cn("space-y-4", className)} {...props}>
            {(heading || action) && (
                <div className="flex items-end justify-between gap-4">
                    <div className="space-y-1">
                        {heading && (
                            <h3 className="text-xl font-semibold text-foreground">
                                {heading}
                            </h3>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            )}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className={cn(
                    "grid grid-cols-1",
                    colsMap[cols],
                    gapMap[gap]
                )}
            >
                {childArray.map((child, i) => {
                    const { className: itemClassName, content } = resolveBentoChild(child);

                    return (
                        <motion.div key={i} className={itemClassName} variants={itemFadeUp}>
                            {content}
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
}
