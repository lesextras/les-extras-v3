"use client";

/**
 * AnimatedNumber — premium spring-based number counter.
 * Smoothly interpolates from previous value to new value.
 * Uses framer-motion useSpring for organic feel.
 */

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

export interface AnimatedNumberProps {
    /** Target numeric value */
    value: number;
    /** Spring duration hint in seconds (default 0.8) */
    duration?: number;
    /** Format function — e.g. (n) => `${n} €` */
    format?: (value: number) => string;
    /** CSS className for the rendered <span> */
    className?: string;
}

export function AnimatedNumber({
    value,
    duration = 0.8,
    format,
    className,
}: AnimatedNumberProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, {
        stiffness: 100,
        damping: 25,
        duration,
    });
    const display = useTransform(spring, (latest) => {
        const rounded = Math.round(latest);
        return format ? format(rounded) : rounded.toString();
    });

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    return (
        <motion.span ref={ref} className={className}>
            {display}
        </motion.span>
    );
}
