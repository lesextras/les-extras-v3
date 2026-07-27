"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/actions/login";

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
                {pending ? "Connexion…" : "Se connecter"}
            </Button>
        </motion.div>
    );
}

export default function LoginPage() {
    const [state, action] = useFormState(login, undefined);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left — brand panel (teal gradient) */}
            <motion.div
                className="relative hidden lg:flex lg:w-[45%] flex-col bg-[hsl(var(--teal))] p-12 text-white overflow-hidden"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Radial glow blobs */}
                <div
                    className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"
                    aria-hidden="true"
                />
                <div
                    className="absolute bottom-10 -left-10 w-56 h-56 rounded-full bg-[hsl(var(--coral)/0.25)] blur-3xl pointer-events-none"
                    aria-hidden="true"
                />

                {/* Logo mark */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="grid grid-cols-2 gap-0.5 w-9 h-9">
                        <div className="rounded-sm bg-white" />
                        <div className="rounded-sm bg-[hsl(var(--coral))]" />
                        <div className="rounded-sm bg-[hsl(var(--coral))]" />
                        <div className="rounded-sm bg-white/40" />
                    </div>
                    <span className="text-lg font-bold font-display">Les Extras</span>
                </div>

                {/* Testimonial / tagline */}
                <div className="relative z-10 mt-auto space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <p className="text-3xl font-bold leading-tight font-display">
                            La plateforme des pros du médico-social.
                        </p>
                        <p className="mt-3 text-white/70 text-sm leading-relaxed">
                            Connectez établissements et freelances. Simple, rapide, humain.
                        </p>
                    </motion.div>

                    <motion.div
                        className="border-t border-white/20 pt-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <blockquote className="space-y-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                                ))}
                            </div>
                            <p className="text-sm text-white/85 italic leading-relaxed">
                                "Simple, efficace et transparent. Exactement ce qu'il nous fallait."
                            </p>
                            <footer className="text-xs text-white/50 font-medium">Jean Dupont · Directeur d'Établissement</footer>
                        </blockquote>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right — form */}
            <div className="flex flex-1 items-center justify-center p-6 sm:p-10 bg-background">
                <motion.div
                    className="w-full max-w-sm space-y-8"
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
                        <h1 className="text-2xl font-bold tracking-tight font-display">Bon retour ! 👋</h1>
                        <p className="text-sm text-muted-foreground">Entrez vos identifiants pour accéder à votre espace.</p>
                    </div>

                    <form action={action} className="space-y-4" noValidate>
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
                                    aria-describedby={state?.errors?.email ? "email-error" : undefined}
                                />
                            </div>
                            {state?.errors?.email && (
                                <p id="email-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                                    {state.errors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Link href="/auth/forgot-password" className="text-xs text-[hsl(var(--teal))] hover:underline underline-offset-4">
                                    Oublié ?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="pl-9"
                                    aria-invalid={!!state?.errors?.password}
                                    aria-describedby={state?.errors?.password ? "password-error" : undefined}
                                />
                            </div>
                            {state?.errors?.password && (
                                <p id="password-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                                    {state.errors.password}
                                </p>
                            )}
                        </div>

                        {state?.message && (
                            <motion.div
                                className="rounded-xl bg-destructive/8 border border-destructive/20 px-3.5 py-3"
                                role="alert"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <p className="text-sm text-destructive">{state.message}</p>
                            </motion.div>
                        )}

                        <SubmitButton />
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Pas encore de compte ?{" "}
                        <Link href="/register" className="text-[hsl(var(--teal))] hover:underline underline-offset-4 font-semibold">
                            S'inscrire gratuitement
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}


