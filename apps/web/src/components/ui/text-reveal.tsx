"use client";

/**
 * TextReveal — Kinetic typography with staggered word entrance.
 * Words appear with a staggered fade-up on mount or when entering viewport.
 */

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_PREMIUM, STAGGER_FAST } from "@/lib/motion";

export interface TextRevealProps {
    children: string;
    as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
    className?: string;
    /** Delay before animation starts (seconds) */
    delay?: number;
    /** Trigger only when in viewport (default: true) */
    viewport?: boolean;
    /** Stagger delay between words (default 0.04) */
    stagger?: number;
}

const wordVariants = {
    hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.4,
            ease: EASE_PREMIUM,
            delay: i,
        },
    }),
};

export function TextReveal({
    children,
    as: Tag = "h1",
    className,
    delay = 0,
    viewport = true,
    stagger = STAGGER_FAST,
}: TextRevealProps) {
    const ref = React.useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-40px" });
    const shouldAnimate = viewport ? isInView : true;

    const words = children.split(" ");

    return (
        <Tag
            ref={ref as React.Ref<HTMLHeadingElement>}
            className={cn("flex flex-wrap gap-x-[0.25em]", className)}
            aria-label={children}
        >
            {words.map((word, i) => (
                <motion.span
                    key={`${word}-${i}`}
                    custom={delay + i * stagger}
                    variants={wordVariants}
                    initial="hidden"
                    animate={shouldAnimate ? "visible" : "hidden"}
                    className="inline-block"
                    aria-hidden="true"
                >
                    {word}
                </motion.span>
            ))}
        </Tag>
    );
}
