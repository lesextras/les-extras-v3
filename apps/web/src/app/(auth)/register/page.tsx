"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Building2, Loader2, ArrowRight, Mail, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { register, RegisterState } from "@/app/actions/auth";

const initialState: RegisterState = { message: "", errors: {} };

const ROLES = [
    {
        value: "FREELANCE" as const,
        label: "Je cherche des missions",
        sub: "Infirmier, Aide-soignant, Éducateur…",
        icon: Briefcase,
        color: "teal" as const,
    },
    {
        value: "ESTABLISHMENT" as const,
        label: "Je recrute des renforts",
        sub: "Établissement, Hôpital, EHPAD…",
        icon: Building2,
        color: "coral" as const,
    },
];

const PERKS = [
    "Inscription gratuite, sans engagement",
    "Profil visible dès la validation",
    "Missions adaptées à votre secteur",
    "Suivi clair des missions et des demandes",
];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <motion.div whileTap={{ scale: 0.97 }}>
            <Button
                variant="coral"
                className="w-full min-h-[46px] text-base font-semibold rounded-xl"
                type="submit"
                disabled={pending}
            >
                {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
                {pending ? "Création du compte…" : "Créer mon compte"}
            </Button>
        </motion.div>
    );
}

function RegisterContent() {
    const searchParams = useSearchParams();
    const roleParam = searchParams.get("role")?.toUpperCase();
    const defaultRole = roleParam === "ESTABLISHMENT" ? "ESTABLISHMENT" : "FREELANCE";
    const [role, setRole] = useState<"ESTABLISHMENT" | "FREELANCE">(defaultRole);
    const [state, formAction] = useFormState(register, initialState);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left — brand panel (coral gradient) */}
            <motion.div
                className="relative hidden lg:flex lg:w-[45%] flex-col bg-[hsl(var(--coral))] p-12 text-white overflow-hidden"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Radial blobs */}
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true" />
                <div className="absolute bottom-10 -left-10 w-56 h-56 rounded-full bg-[hsl(var(--teal)/0.3)] blur-3xl pointer-events-none" aria-hidden="true" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="grid grid-cols-2 gap-0.5 w-9 h-9">
                        <div className="rounded-sm bg-white" />
                        <div className="rounded-sm bg-[hsl(var(--teal))]" />
                        <div className="rounded-sm bg-[hsl(var(--teal))]" />
                        <div className="rounded-sm bg-white/40" />
                    </div>
                    <span className="text-lg font-bold font-display">Les Extras</span>
                </div>

                {/* Content */}
                <div className="relative z-10 mt-auto space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <p className="text-3xl font-bold leading-tight font-display">
                            Rejoignez la plateforme de référence du secteur social.
                        </p>
                        <p className="mt-3 text-white/70 text-sm leading-relaxed">
                            Déjà plus de 500 professionnels et 120 établissements font confiance à Les Extras.
                        </p>
                    </motion.div>

                    {/* Perk list */}
                    <motion.ul
                        className="space-y-2.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                    >
                        {PERKS.map((perk, i) => (
                            <motion.li
                                key={perk}
                                className="flex items-center gap-2.5 text-sm text-white/85"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.07 }}
                            >
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-white/70" />
                                {perk}
                            </motion.li>
                        ))}
                    </motion.ul>

                    <motion.div
                        className="border-t border-white/20 pt-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        <blockquote className="space-y-2">
                            <p className="text-sm text-white/85 italic leading-relaxed">
                                "Grâce à Les Extras, j'ai trouvé des missions en quelques clics."
                            </p>
                            <footer className="text-xs text-white/50 font-medium">Sofia Davis · Infirmière</footer>
                        </blockquote>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right — form */}
            <div className="flex flex-1 items-center justify-center p-6 sm:p-10 bg-background">
                <motion.div
                    className="w-full max-w-sm space-y-7"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="grid grid-cols-2 gap-0.5 w-7 h-7">
                            <div className="rounded-sm bg-[hsl(var(--teal))]" />
                            <div className="rounded-sm bg-[hsl(var(--coral))]" />
                            <div className="rounded-sm bg-[hsl(var(--coral))]" />
                            <div className="rounded-sm bg-[hsl(var(--teal)/0.4)]" />
                        </div>
                        <span className="font-bold font-display">Les Extras</span>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--coral))]">Étape 1 sur 2</p>
                        <h1 className="text-2xl font-bold tracking-tight font-display">Créer un compte</h1>
                        <p className="text-sm text-muted-foreground">Choisissez votre profil, puis entrez vos informations.</p>
                    </div>

                    {/* Role selector */}
                    <div className="grid gap-3" role="radiogroup" aria-label="Type de compte">
                        {ROLES.map((r, i) => {
                            const Icon = r.icon;
                            const isSelected = role === r.value;
                            const isTeal = r.color === "teal";
                            return (
                                <motion.button
                                    key={r.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected ? "true" : "false"}
                                    onClick={() => setRole(r.value)}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 + i * 0.08 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 w-full",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        isSelected
                                            ? isTeal
                                                ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal-light))]"
                                                : "border-[hsl(var(--coral))] bg-[hsl(var(--coral-light))]"
                                            : "border-border hover:border-border/80 hover:bg-[hsl(var(--surface-2))]"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors shrink-0",
                                            isSelected
                                                ? isTeal ? "icon-teal" : "icon-coral"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{r.label}</p>
                                        <p className="text-xs text-muted-foreground">{r.sub}</p>
                                    </div>
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                className={cn(
                                                    "h-5 w-5 rounded-full flex items-center justify-center",
                                                    isTeal ? "bg-[hsl(var(--teal))]" : "bg-[hsl(var(--coral))]"
                                                )}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {state?.message && (
                            <motion.div
                                className="rounded-xl bg-destructive/8 border border-destructive/20 px-3.5 py-3"
                                role="alert"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <p className="text-sm text-destructive">{state.message}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form action={formAction} className="space-y-4" noValidate>
                        <input type="hidden" name="role" value={role} />

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    required
                                    className="pl-9"
                                    aria-invalid={!!state?.errors?.email}
                                    aria-describedby={state?.errors?.email ? "reg-email-error" : undefined}
                                />
                            </div>
                            {state?.errors?.email && (
                                <p id="reg-email-error" className="text-xs text-destructive" role="alert">
                                    {state.errors.email.join(", ")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">Mot de passe</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="8 caractères minimum"
                                    required
                                    className="pl-9"
                                    aria-invalid={!!state?.errors?.password}
                                    aria-describedby={state?.errors?.password ? "reg-password-error" : undefined}
                                />
                            </div>
                            {state?.errors?.password && (
                                <p id="reg-password-error" className="text-xs text-destructive" role="alert">
                                    {state.errors.password.join(", ")}
                                </p>
                            )}
                        </div>

                        <SubmitButton />
                    </form>

                    <div className="space-y-3">
                        <p className="text-center text-sm text-muted-foreground">
                            Déjà un compte ?{" "}
                            <Link href="/login" className="text-[hsl(var(--teal))] hover:underline underline-offset-4 font-semibold">
                                Se connecter
                            </Link>
                        </p>
                        <p className="text-center text-xs text-muted-foreground">
                            En créant un compte, vous acceptez nos{" "}
                            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">CGU</Link>
                            {" "}et notre{" "}
                            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">politique de confidentialité</Link>.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterContent />
        </Suspense>
    );
}



