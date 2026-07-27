"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    GraduationCap,
    Brain,
    Heart,
    Palette,
    Activity,
    Users,
    ArrowRight,
    Search,
    Calendar,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── E.4 — Page Ateliers (Landing) ──────────────────────────────
   "Des ateliers par des professionnels, pour des professionnels"
   Categories + popular ateliers + how-it-works + dual CTA
   ─────────────────────────────────────────────────────────────── */

const rise = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const CATEGORIES = [
    { icon: Brain, label: "Montessori", color: "violet" },
    { icon: Activity, label: "Snoezelen", color: "teal" },
    { icon: Heart, label: "Médiation animale", color: "coral" },
    { icon: Palette, label: "Art-thérapie", color: "violet" },
    { icon: Activity, label: "Psychomotricité", color: "teal" },
    { icon: Users, label: "Communication non-violente", color: "sand" },
];

const STEPS = [
    { icon: Search, title: "Explorez", desc: "Parcourez le catalogue d'ateliers par catégorie, public ou durée." },
    { icon: Calendar, title: "Réservez", desc: "Choisissez un créneau et réservez directement en ligne." },
    { icon: CheckCircle, title: "Réalisez", desc: "L'intervenant vient sur place. Vous évaluez après la session." },
];

export default function AteliersLandingPage() {
    const heroRef = useRef(null);
    const heroInView = useInView(heroRef, { once: true, margin: "-40px" });

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section
                ref={heroRef}
                className="relative overflow-hidden bg-[hsl(var(--color-violet-50))] py-20 md:py-28"
            >
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <motion.div variants={stagger} initial="hidden" animate={heroInView ? "show" : "hidden"}>
                        <motion.p variants={rise} className="text-overline uppercase tracking-widest text-[hsl(var(--color-violet-600))] mb-4">
                            Ateliers & Formations
                        </motion.p>
                        <motion.h1 variants={rise} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            Des ateliers et formations par des professionnels,<br className="hidden md:block" /> pour des professionnels
                        </motion.h1>
                        <motion.p variants={rise} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                            Montessori, Snoezelen, art-thérapie, formations certifiantes et plus encore.
                            Réservez des sessions animées par des experts certifiés.
                        </motion.p>
                        <motion.div variants={rise} className="flex flex-wrap justify-center gap-3">
                            <Button variant="default" size="lg" className="min-h-[52px] text-base gap-2" asChild>
                                <Link href="/marketplace">
                                    Explorer le catalogue
                                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                                </Link>
                            </Button>
                            <Button variant="glass" size="lg" className="min-h-[52px] text-base gap-2" asChild>
                                <Link href="/register?role=FREELANCE">
                                    Proposer un atelier ou une formation
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 md:py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <h2 className="font-display text-heading-lg text-center mb-10">Catégories</h2>
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-60px" }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    >
                        {CATEGORIES.map((cat) => {
                            const colorMap: Record<string, string> = {
                                violet: "bg-[hsl(var(--color-violet-50))] text-[hsl(var(--color-violet-600))] border-[hsl(var(--color-violet-200))]",
                                teal: "bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-600))] border-[hsl(var(--color-teal-200))]",
                                coral: "bg-[hsl(var(--color-coral-50))] text-[hsl(var(--color-coral-600))] border-[hsl(var(--color-coral-200))]",
                                sand: "bg-[hsl(var(--color-sand-50))] text-[hsl(var(--color-sand-700))] border-[hsl(var(--color-sand-200))]",
                            };
                            return (
                                <motion.div
                                    key={cat.label}
                                    variants={rise}
                                    className={`rounded-xl border p-5 flex items-center gap-3 transition-shadow hover:shadow-md cursor-default ${colorMap[cat.color]}`}
                                >
                                    <cat.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                    <span className="text-sm font-semibold">{cat.label}</span>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 bg-[hsl(var(--color-cream))]">
                <div className="mx-auto max-w-4xl px-6">
                    <h2 className="font-display text-heading-lg text-center mb-12">Comment ça marche</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: i * 0.12 }}
                                className="text-center"
                            >
                                <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[hsl(var(--color-violet-100))] flex items-center justify-center">
                                    <step.icon className="h-7 w-7 text-[hsl(var(--color-violet-600))]" aria-hidden="true" />
                                </div>
                                <div className="text-xs font-bold text-[hsl(var(--color-violet-600))] mb-1">Étape {i + 1}</div>
                                <h3 className="text-heading-sm font-display mb-2">{step.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-16 bg-[hsl(var(--color-violet-50))]">
                <div className="mx-auto max-w-3xl px-6 text-center">
                    <h2 className="font-display text-heading-lg mb-4">Prêt à découvrir nos ateliers et formations ?</h2>
                    <p className="text-muted-foreground mb-8">
                        Établissement ou freelance, il y a un atelier ou une formation pour vous.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button variant="default" size="lg" className="min-h-[52px] text-base gap-2" asChild>
                            <Link href="/marketplace">
                                Explorer le catalogue
                                <ArrowRight className="h-5 w-5" aria-hidden="true" />
                            </Link>
                        </Button>
                        <Button variant="glass" size="lg" className="min-h-[52px] text-base gap-2" asChild>
                            <Link href="/register?role=FREELANCE">
                                Proposer un atelier ou une formation
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
