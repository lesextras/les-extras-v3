"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Shield, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingSplitLayout } from "@/components/onboarding/OnboardingSplitLayout";

export default function WelcomePage() {
    return (
        <OnboardingSplitLayout
            leftPanel={
                <div className="space-y-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--teal)/0.12)] border border-[hsl(var(--teal)/0.2)]">
                        <CheckCircle2 className="h-7 w-7 text-[hsl(var(--teal))]" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--text-primary))] leading-tight">
                            Bienvenue dans\nvotre espace
                        </h2>
                        <p className="text-base text-[hsl(var(--text-secondary))] leading-relaxed max-w-md">
                            Finalisez votre profil en quelques étapes pour accéder à toutes les fonctionnalités de la plateforme.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5 pt-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] px-3.5 py-2 text-xs font-medium text-[hsl(var(--text-secondary))]">
                            <Shield className="h-3.5 w-3.5" /> Données sécurisées
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] px-3.5 py-2 text-xs font-medium text-[hsl(var(--text-secondary))]">
                            <Clock className="h-3.5 w-3.5" /> 2 minutes
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] px-3.5 py-2 text-xs font-medium text-[hsl(var(--text-secondary))]">
                            <Users className="h-3.5 w-3.5" /> 2 000+ utilisateurs
                        </span>
                    </div>
                </div>
            }
            rightPanel={
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-lg glass-panel rounded-2xl shimmer-border highlight-top overflow-hidden p-10 text-center"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--teal)/0.12)] border border-[hsl(var(--teal)/0.2)]"
                    >
                        <CheckCircle2 className="h-10 w-10 text-[hsl(var(--teal))]" />
                    </motion.div>

                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="mb-6 space-y-2"
                    >
                        <p className="text-xs font-semibold text-[hsl(var(--teal))] uppercase tracking-widest">
                            Compte créé avec succès
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
                            Bienvenue !
                        </h1>
                        <p className="text-[hsl(var(--text-secondary))]">
                            Votre compte a été créé avec succès.
                        </p>
                    </motion.div>

                    {/* Body */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45, duration: 0.4 }}
                        className="mb-8 space-y-3 text-sm text-[hsl(var(--text-secondary))] rounded-xl bg-[hsl(var(--surface-2))] p-4"
                    >
                        <p>
                            Pour accéder à toutes les fonctionnalités de{" "}
                            <strong className="text-[hsl(var(--text-primary))]">Les Extras</strong>,
                            nous avons besoin de finaliser votre profil.
                        </p>
                        <p className="flex items-center justify-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-[hsl(var(--coral))]" />
                            Cela ne prendra que <strong className="text-[hsl(var(--text-primary))]">2 minutes</strong>.
                        </p>
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.3 }}
                    >
                        <Button asChild size="lg" variant="coral" className="w-full text-base">
                            <Link href="/wizard">
                                Commencer <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </motion.div>
                </motion.div>
            }
        />
    );
}

