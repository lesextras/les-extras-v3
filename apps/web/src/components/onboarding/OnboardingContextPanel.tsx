"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Clock, Users, Building2, MapPin, UserCheck, Briefcase, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type ContextStep = {
    headline: string;
    body: string;
    icon: React.ReactNode;
    pills: { icon: React.ReactNode; text: string }[];
};

type OnboardingContextPanelProps = {
    currentStep: number;
    steps: ContextStep[];
    className?: string;
};

const pillVariants = {
    initial: { opacity: 0, y: 8 },
    animate: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.3 + i * 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
};

export function OnboardingContextPanel({
    currentStep,
    steps,
    className,
}: OnboardingContextPanelProps) {
    const ctx = steps[currentStep - 1];
    if (!ctx) return null;

    return (
        <div className={cn("space-y-8", className)}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-6"
                >
                    {/* Icon */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--teal)/0.12)] border border-[hsl(var(--teal)/0.2)]">
                        {ctx.icon}
                    </div>

                    {/* Text */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--text-primary))] leading-tight">
                            {ctx.headline}
                        </h2>
                        <p className="text-base text-[hsl(var(--text-secondary))] leading-relaxed max-w-md">
                            {ctx.body}
                        </p>
                    </div>

                    {/* Trust pills */}
                    <div className="flex flex-wrap gap-2.5 pt-2">
                        {ctx.pills.map((pill, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={pillVariants}
                                initial="initial"
                                animate="animate"
                                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] px-3.5 py-2 text-xs font-medium text-[hsl(var(--text-secondary))]"
                            >
                                {pill.icon}
                                {pill.text}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ── Pre-built step configs ── */

export const ESTABLISHMENT_CONTEXT_STEPS: ContextStep[] = [
    {
        headline: "Identifiez votre\nétablissement",
        body: "Ces informations nous permettent d'adapter l'expérience à votre type de structure et de vous proposer des intervenants qualifiés.",
        icon: <Building2 className="h-7 w-7 text-[hsl(var(--teal))]" />,
        pills: [
            { icon: <Shield className="h-3.5 w-3.5" />, text: "Données sécurisées" },
            { icon: <Clock className="h-3.5 w-3.5" />, text: "2 min" },
            { icon: <Users className="h-3.5 w-3.5" />, text: "1 200+ structures" },
        ],
    },
    {
        headline: "Localisation &\ncontact",
        body: "Votre adresse permet de proposer des missions aux intervenants proches. Le contact facilite la coordination.",
        icon: <MapPin className="h-7 w-7 text-[hsl(var(--teal))]" />,
        pills: [
            { icon: <Shield className="h-3.5 w-3.5" />, text: "RGPD conforme" },
            { icon: <MapPin className="h-3.5 w-3.5" />, text: "Géolocalisation" },
            { icon: <UserCheck className="h-3.5 w-3.5" />, text: "Mise en relation" },
        ],
    },
];

export const FREELANCE_CONTEXT_STEPS: ContextStep[] = [
    {
        headline: "Présentez-vous\naux établissements",
        body: "Votre profil est votre vitrine. Un profil complet attire 3× plus de missions et rassure les recruteurs.",
        icon: <Briefcase className="h-7 w-7 text-[hsl(var(--teal))]" />,
        pills: [
            { icon: <Shield className="h-3.5 w-3.5" />, text: "Profil vérifié" },
            { icon: <Clock className="h-3.5 w-3.5" />, text: "2 min" },
            { icon: <Users className="h-3.5 w-3.5" />, text: "800+ intervenants" },
        ],
    },
    {
        headline: "Votre zone\nd'intervention",
        body: "Indiquez où vous souhaitez intervenir pour recevoir des missions adaptées à votre localisation.",
        icon: <MapPin className="h-7 w-7 text-[hsl(var(--teal))]" />,
        pills: [
            { icon: <MapPin className="h-3.5 w-3.5" />, text: "Missions proches" },
            { icon: <FileText className="h-3.5 w-3.5" />, text: "Frais km calculés" },
            { icon: <UserCheck className="h-3.5 w-3.5" />, text: "Matching intelligent" },
        ],
    },
];
