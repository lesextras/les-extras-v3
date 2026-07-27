"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, CheckCircle2, CreditCard, FileText, MapPin, Siren } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SPRING_BOUNCY, EASE_PREMIUM, STAGGER_DEFAULT } from "@/lib/motion";
import type {
    EstablishmentTrustProfile,
    EstablishmentTrustStep,
} from "@/lib/establishment-trust";

interface EstablishmentChecklistWidgetProps {
    trustProfile: EstablishmentTrustProfile;
}

const STEP_ICON: Record<EstablishmentTrustStep["id"], ReactNode> = {
    companyName: <Building2 className="h-4 w-4" />,
    bio: <FileText className="h-4 w-4" />,
    contact: <MapPin className="h-4 w-4" />,
    siret: <FileText className="h-4 w-4" />,
    firstRenfort: <Siren className="h-4 w-4" />,
    credits: <CreditCard className="h-4 w-4" />,
};

export function EstablishmentChecklistWidget({
    trustProfile,
}: EstablishmentChecklistWidgetProps) {
    const { progress, completedCount, totalCount, steps } = trustProfile;
    const isLowProgress = progress < 50;

    return (
        <div className="h-full flex flex-col justify-between space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-muted-foreground">
                        {completedCount}/{totalCount} éléments complétés
                    </span>
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
                        className="flex items-center justify-between gap-3 group"
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
                                          ? "border-[hsl(var(--amber))] bg-[hsl(var(--color-amber-50))] text-[hsl(var(--amber))]"
                                          : "border-muted bg-background text-muted-foreground",
                                )}
                            >
                                {step.status === "COMPLETED" ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    STEP_ICON[step.id]
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
                        {step.status !== "COMPLETED" && step.href && (
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7 shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                            >
                                <Link href={step.href}>{step.actionLabel ?? "Compléter"}</Link>
                            </Button>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            <div className="space-y-3 rounded-md bg-[hsl(var(--color-teal-50))] p-3 text-xs text-[hsl(var(--color-teal-700))]">
                <p>
                    {isLowProgress
                        ? "Complétez votre fiche pour donner plus de contexte aux freelances avant une mission."
                        : "Une fiche établissement complète inspire confiance aux freelances et accélère vos demandes de renfort."}
                </p>
                <Button variant="teal-soft" size="sm" asChild className="w-full">
                    <Link href="/account/establishment">Compléter ma fiche</Link>
                </Button>
            </div>
        </div>
    );
}
