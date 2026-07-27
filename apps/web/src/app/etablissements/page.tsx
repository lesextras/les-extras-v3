"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Zap,
    ShieldCheck,
    BarChart3,
    ArrowRight,
    Building2,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/components/ui/review-card";

/* ─── E.2 — Page Établissements ──────────────────────────────────
   Landing: "Trouvez vos renforts en quelques clics"
   Features + testimonial + FAQ + CTA
   ─────────────────────────────────────────────────────────────── */

const rise = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const FEATURES = [
    {
        icon: Zap,
        title: "Réactivité",
        desc: "Trouvez un renfort en moins de 24h grâce à notre réseau de freelances vérifiés, disponibles immédiatement.",
        color: "coral" as const,
    },
    {
        icon: ShieldCheck,
        title: "Profils vérifiés",
        desc: "Chaque freelance est contrôlé : diplômes, expérience, casier. Vous recrutez en toute sérénité.",
        color: "teal" as const,
    },
    {
        icon: BarChart3,
        title: "Suivi complet",
        desc: "Dashboard en temps réel, historique des missions et suivi des demandes. Tout est centralisé.",
        color: "violet" as const,
    },
];

const FAQ = [
    {
        q: "Comment fonctionne le système de crédits ?",
        a: "Vous achetez des packs de crédits ajoutés à votre solde établissement. Le dashboard vous permet de suivre votre solde et vos achats.",
    },
    {
        q: "Les freelances sont-ils vraiment vérifiés ?",
        a: "Oui. Diplômes, pièce d'identité et extrait de casier judiciaire sont vérifiés avant toute activation du profil.",
    },
    {
        q: "Puis-je publier une mission urgente ?",
        a: "Absolument. Le mode SOS Renfort alerte immédiatement les freelances disponibles dans votre zone.",
    },
    {
        q: "Y a-t-il un engagement ?",
        a: "Non. Vous payez uniquement les missions réalisées. Aucun abonnement, aucun frais caché.",
    },
];

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="border-b border-border last:border-b-0">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between py-4 text-left text-sm font-medium hover:text-[hsl(var(--teal))] transition-colors"
            >
                {q}
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open && (
                <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
            )}
        </div>
    );
}

import * as React from "react";

export default function EtablissementsPage() {
    const heroRef = useRef(null);
    const heroInView = useInView(heroRef, { once: true, margin: "-40px" });

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section
                ref={heroRef}
                className="relative overflow-hidden bg-[hsl(var(--color-teal-50))] py-20 md:py-28"
            >
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <motion.div variants={stagger} initial="hidden" animate={heroInView ? "show" : "hidden"}>
                        <motion.p variants={rise} className="text-overline uppercase tracking-widest text-[hsl(var(--color-teal-600))] mb-4">
                            Pour les établissements
                        </motion.p>
                        <motion.h1 variants={rise} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            Trouvez vos renforts<br className="hidden md:block" /> en quelques clics
                        </motion.h1>
                        <motion.p variants={rise} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                            Publiez vos besoins, recevez des candidatures qualifiées et gérez
                            vos missions depuis un tableau de bord unique.
                        </motion.p>
                        <motion.div variants={rise}>
                            <Button variant="coral" size="lg" className="min-h-[52px] text-base gap-2" asChild>
                                <Link href="/register?role=ESTABLISHMENT">
                                    Créer mon compte établissement
                                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 md:py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-60px" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {FEATURES.map((f) => {
                            const colorMap = {
                                teal: "bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-600))]",
                                coral: "bg-[hsl(var(--color-coral-50))] text-[hsl(var(--color-coral-600))]",
                                violet: "bg-[hsl(var(--color-violet-50))] text-[hsl(var(--color-violet-600))]",
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

            {/* Testimonial */}
            <section className="py-16 bg-[hsl(var(--color-cream))]">
                <div className="mx-auto max-w-3xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <ReviewCard
                            variant="highlight"
                            authorName="Marie Dupont"
                            authorRole="Directrice"
                            authorOrg="EHPAD Les Jardins"
                            rating={5}
                            text="Les-Extras nous a permis de combler 3 postes en 48h lors d'une situation de crise. Le tableau de bord est un vrai plus pour le suivi."
                            context="Utilisatrice depuis 6 mois"
                        />
                    </motion.div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24">
                <div className="mx-auto max-w-2xl px-6">
                    <h2 className="font-display text-heading-lg text-center mb-10">Questions fréquentes</h2>
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        {FAQ.map((faq) => (
                            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-16 bg-[hsl(var(--color-teal-50))]">
                <div className="mx-auto max-w-3xl px-6 text-center">
                    <h2 className="font-display text-heading-lg mb-4">Prêt à simplifier vos recrutements ?</h2>
                    <p className="text-muted-foreground mb-8">Inscription gratuite, sans engagement.</p>
                    <Button variant="coral" size="lg" className="min-h-[52px] text-base gap-2" asChild>
                        <Link href="/register?role=ESTABLISHMENT">
                            Commencer maintenant
                            <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
