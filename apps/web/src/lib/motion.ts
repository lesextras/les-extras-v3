/**
 * ═══════════════════════════════════════════════════════════════════
 * LES EXTRAS — Centralized Motion Constants
 * ─────────────────────────────────────────────────────────────────
 * Spring physics, easing curves, and reusable framer-motion variants.
 * Import from "@/lib/motion" everywhere — no more inline magic numbers.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { Transition, Variants } from "framer-motion";

/* ─── Easing Curves ─── */
export const EASE_PREMIUM: [number, number, number, number] = [0.22, 1, 0.36, 1];     // smooth decel
export const EASE_SNAPPY: [number, number, number, number]  = [0.16, 1, 0.3, 1];      // snappy entrance
export const EASE_BOUNCE: [number, number, number, number]  = [0.34, 1.56, 0.64, 1];  // overshoot

/* ─── Spring Presets ─── */
export const SPRING_BOUNCY: Transition = { type: "spring", stiffness: 500, damping: 15 };
export const SPRING_STIFF:  Transition = { type: "spring", stiffness: 500, damping: 35 };
export const SPRING_SOFT:   Transition = { type: "spring", stiffness: 300, damping: 22 };
export const SPRING_GENTLE: Transition = { type: "spring", stiffness: 200, damping: 24 };
export const SPRING_ICON:   Transition = { type: "spring", stiffness: 500, damping: 12 };

/* ─── Duration Presets ─── */
export const DURATION_FAST    = 0.2;
export const DURATION_NORMAL  = 0.3;
export const DURATION_SLOW    = 0.5;
export const STAGGER_FAST     = 0.04;
export const STAGGER_DEFAULT  = 0.05;
export const STAGGER_SLOW     = 0.1;

/* ─── Reusable Transitions ─── */
export const TRANSITION_ENTER: Transition = {
    duration: DURATION_NORMAL,
    ease: EASE_PREMIUM,
};

export const TRANSITION_FADE_UP: Transition = {
    duration: 0.4,
    ease: EASE_PREMIUM,
};

/* ─── Container / Item Variants (stagger children) ─── */
export const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: STAGGER_DEFAULT,
            delayChildren: 0.05,
        },
    },
};

export const itemFadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: DURATION_NORMAL,
            ease: EASE_PREMIUM,
        },
    },
};

export const itemScaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: DURATION_NORMAL,
            ease: EASE_PREMIUM,
        },
    },
};

export const itemSlideLeft: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.25,
            ease: EASE_SNAPPY,
        },
    },
};

/* ─── Hover / Tap Presets (use with whileHover / whileTap) ─── */
export const hoverLift   = { y: -3, transition: { duration: DURATION_FAST } };
export const hoverScale  = { scale: 1.02 };
export const tapScale    = { scale: 0.97 };
export const hoverBounce = { scale: 1.05, transition: SPRING_BOUNCY };

/* ─── Icon Hover ─── */
export const iconHover   = { scale: 1.15, rotate: 8 };
export const iconSpring  = SPRING_ICON;

/* ─── Reduced Motion ─── */
export const REDUCED_MOTION_TRANSITION: Transition = { duration: 0.01, ease: "linear" };

/* ─── Page Transitions ─── */
export const pageTransition: Variants = {
    initial: { opacity: 0, y: 8 },
    enter: {
        opacity: 1,
        y: 0,
        transition: { duration: DURATION_NORMAL, ease: EASE_PREMIUM },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: { duration: DURATION_FAST, ease: EASE_PREMIUM },
    },
};
