"use client";

import Link from "next/link";
import { CheckCircle2, FileText, MapPin, Phone, ShieldCheck, Sparkles, User, CalendarDays, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { FreelanceTrustProfile, FreelanceTrustStep } from "@/lib/freelance-trust";
import { cn } from "@/lib/utils";
import { SPRING_BOUNCY, EASE_PREMIUM, STAGGER_DEFAULT } from "@/lib/motion";

const STEP_ICONS: Record<FreelanceTrustStep["id"], React.ReactNode> = {
    identity: <User className="h-4 w-4" />,
    bio: <FileText className="h-4 w-4" />,
    skills: <Sparkles className="h-4 w-4" />,
    phone: <Phone className="h-4 w-4" />,
    siret: <Briefcase className="h-4 w-4" />,
    location: <MapPin className="h-4 w-4" />,
    availableDays: <CalendarDays className="h-4 w-4" />,
    availability: <ShieldCheck className="h-4 w-4" />,
};

export function TrustChecklistWidget({
    trustProfile,
}: {
    trustProfile: FreelanceTrustProfile;
}) {
    const { progress, completedCount, totalCount, steps } = trustProfile;
    const helperText =
        completedCount === 0
            ? "Commencez par renseigner votre profil pour améliorer votre visibilité."
            : progress === 100
              ? "Votre profil est prêt pour les nouvelles missions."
              : `${completedCount} étape${completedCount > 1 ? "s" : ""} sur ${totalCount} complétée${completedCount > 1 ? "s" : ""}.`;

    return (
        <div className="h-full flex flex-col justify-between space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Profil de confiance</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--teal))] to-[hsl(var(--teal)/0.7)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={SPRING_BOUNCY}
                    />
                </div>
            </div>

            <motion.div
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: STAGGER_DEFAULT } },
                }}
            >
                {steps.map((step) => (
                    <motion.div
                        key={step.id}
                        className="flex items-center justify-between group"
                        variants={{
                            hidden: { opacity: 0, x: -8 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE_PREMIUM } },
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border",
                                    step.status === "COMPLETED"
                                        ? "border-[hsl(var(--emerald))] bg-[hsl(var(--color-emerald-50))] text-[hsl(var(--emerald))]"
                                        : step.status === "PENDING"
                                          ? "border-[hsl(var(--coral)/0.25)] bg-[hsl(var(--color-coral-50))] text-[hsl(var(--coral))]"
                                          : "border-muted bg-background text-muted-foreground",
                                )}
                            >
                                {step.status === "COMPLETED" ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    STEP_ICONS[step.id]
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    step.status === "COMPLETED" ? "text-foreground" : "text-muted-foreground",
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                        {step.status !== "COMPLETED" && step.href && step.actionLabel && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                asChild
                            >
                                <Link href={step.href}>{step.actionLabel}</Link>
                            </Button>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            <div className="space-y-3 rounded-md bg-[hsl(var(--color-teal-50))] p-3 text-xs text-[hsl(var(--color-teal-700))]">
                <p>{helperText}</p>
                <Button variant="glass" size="sm" className="w-full min-h-[40px]" asChild>
                    <Link href="/account">Compléter mon profil</Link>
                </Button>
            </div>
        </div>
    );
}
