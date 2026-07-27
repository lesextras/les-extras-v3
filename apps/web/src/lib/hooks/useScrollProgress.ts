"use client";

/**
 * useScrollProgress — returns a MotionValue [0 → 1] tracking scroll
 * of the nearest overflow container (or the provided ref).
 *
 * Used to power dynamic glass header opacity and other scroll-linked FX.
 */

import { useRef, useEffect, useCallback } from "react";
import { useMotionValue, useTransform, type MotionValue } from "framer-motion";

interface ScrollProgress {
    /** Callback ref to attach to the scroll container */
    scrollRef: (node: HTMLElement | null) => void;
    /** 0 → 1 normalised scroll Y (capped at threshold) */
    progress: MotionValue<number>;
    /** Derived header opacity: 0.5 (top) → 0.92 (scrolled) */
    headerOpacity: MotionValue<number>;
    /** Derived border opacity: 0 (top) → 1 (scrolled) */
    borderOpacity: MotionValue<number>;
}

export function useScrollProgress(threshold = 200): ScrollProgress {
    const elRef = useRef<HTMLElement | null>(null);
    const scrollY = useMotionValue(0);

    const scrollRef = useCallback(
        (node: HTMLElement | null) => {
            // Cleanup previous listener
            if (elRef.current) {
                elRef.current.removeEventListener("scroll", handleScroll);
            }
            elRef.current = node;
            if (node) {
                node.addEventListener("scroll", handleScroll, { passive: true });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    function handleScroll(this: HTMLElement) {
        scrollY.set(this.scrollTop);
    }

    const progress = useTransform(scrollY, [0, threshold], [0, 1]);
    const headerOpacity = useTransform(progress, [0, 1], [0.5, 0.92]);
    const borderOpacity = useTransform(progress, [0, 1], [0, 1]);

    return { scrollRef, progress, headerOpacity, borderOpacity };
}
