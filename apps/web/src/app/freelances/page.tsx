"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Briefcase,
    GraduationCap,
    DollarSign,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/components/ui/review-card";
import { RenfortCard } from "@/components/ui/renfort-card";

/* ─── E.3 — Page Freelances ──────────────────────────────────────
   Landing: "Rejoignez le réseau des extras"
   Benefits + feed preview + testimonial + CTA
   ─────────────────────────────────────────────────────────────── */

const rise = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const BENEFITS = [
    {
        icon: Briefcase,
        title: "Missions adaptées",
        desc: "Recevez des offres correspondant à votre expertise, votre zone et vos disponibilités.",
        color: "teal" as const,
    },
    {
        icon: GraduationCap,
        title: "Valorisez vos ateliers",
        desc: "Proposez vos ateliers spécialisés aux établissements et développez votre activité.",
        color: "violet" as const,
    },
    {
        icon: DollarSign,
        title: "Suivi simplifié",
        desc: "Retrouvez vos missions, services et échanges dans un espace unique.",
        color: "emerald" as const,
    },
];

const PREVIEW_MISSIONS = [
    {
        title: "Aide-soignant(e) de nuit",
        establishment: "EHPAD Les Jardins",
        city: "Lyon 3e",
        dates: "20-22 mars",
        hours: "20h–8h",
        rate: "18€/h",
        urgent: true,
    },
    {
        title: "Éducateur(trice) spécialisé(e)",
        establishment: "IME Arc-en-Ciel",
        city: "Villeurbanne",
        dates: "25 mars",
        hours: "8h–17h",
        rate: "22€/h",
        urgent: false,
    },
];

export default function FreelancesPage() {
    const heroRef = useRef(null);
    const heroInView = useInView(heroRef, { once: true, margin: "-40px" });

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section
                ref={heroRef}
                className="relative overflow-hidden bg-[hsl(var(--color-coral-50))] py-20 md:py-28"
            >
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <motion.div variants={stagger} initial="hidden" animate={heroInView ? "show" : "hidden"}>
                        <motion.p variants={rise} className="text-overline uppercase tracking-widest text-[hsl(var(--color-coral-600))] mb-4">
                            Pour les freelances
                        </motion.p>
                        <motion.h1 variants={rise} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            Rejoignez le réseau<br className="hidden md:block" /> des extras
                        </motion.h1>
                        <motion.p variants={rise} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                            Trouvez des missions adaptées à votre expertise dans le secteur
                            médico-social et psycho-éducatif.
                        </motion.p>
                        <motion.div variants={rise}>
                            <Button variant="default" size="lg" className="min-h-[52px] text-base gap-2" asChild>
                                <Link href="/register?role=FREELANCE">
                                    M&apos;inscrire comme freelance
                                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 md:py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-60px" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {BENEFITS.map((f) => {
                            const colorMap: Record<string, string> = {
                                teal: "bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-600))]",
                                violet: "bg-[hsl(var(--color-violet-50))] text-[hsl(var(--color-violet-600))]",
                                emerald: "bg-[hsl(var(--color-emerald-50))] text-[hsl(var(--color-emerald-600))]",
                            };
                            return (
                                <motion.div
                                    key={f.title}
                                    variants={rise}
                                    className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                                >
                                    <div className={`h-12 w-12 rounded-xl ${colorMap[f.color]} flex items-center justify-center mb-4`}>
                                        <f.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-heading-sm font-display mb-2">{f.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* Feed preview */}
            <section className="py-16 bg-[hsl(var(--color-cream))]">
                <div className="mx-auto max-w-3xl px-6">
                    <h2 className="font-display text-heading-lg text-center mb-8">Des missions comme celles-ci vous attendent</h2>
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        {PREVIEW_MISSIONS.map((m) => (
                            <motion.div key={m.title} variants={rise}>
                                <RenfortCard
                                    variant={m.urgent ? "urgent" : "normal"}
                                    title={m.title}
                                    establishment={m.establishment}
                                    city={m.city}
                                    dates={m.dates}
                                    hours={m.hours}
                                    rate={m.rate}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="py-16">
                <div className="mx-auto max-w-3xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <ReviewCard
                            variant="highlight"
                            authorName="Thomas L."
                            authorRole="Éducateur spécialisé"
                            rating={5}
                            text="Grâce à Les-Extras, j'ai pu diversifier mes missions et proposer mes ateliers Montessori. L'application est intuitive et le paiement toujours à l'heure."
                            context="Freelance depuis 4 mois"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-16 bg-[hsl(var(--color-coral-50))]">
                <div className="mx-auto max-w-3xl px-6 text-center">
                    <h2 className="font-display text-heading-lg mb-4">Prêt à rejoindre le réseau ?</h2>
                    <p className="text-muted-foreground mb-8">Inscription gratuite, vos premières missions vous attendent.</p>
                    <Button variant="default" size="lg" className="min-h-[52px] text-base gap-2" asChild>
                        <Link href="/register?role=FREELANCE">
                            S&apos;inscrire maintenant
                            <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
