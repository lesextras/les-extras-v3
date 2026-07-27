"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, ResetPasswordState } from "@/app/actions/auth";

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
                {pending ? "Mise à jour..." : "Définir le mot de passe"}
            </Button>
        </motion.div>
    );
}

const initialState: ResetPasswordState = undefined;

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const [state, action] = useFormState(resetPasswordAction, initialState);

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="text-center space-y-3">
                    <p className="text-destructive font-medium">Lien invalide ou expiré.</p>
                    <Link
                        href="/auth/forgot-password"
                        className="text-sm text-[hsl(var(--teal))] underline underline-offset-4"
                    >
                        Demander un nouveau lien
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left — brand panel */}
            <motion.div
                className="relative hidden lg:flex lg:w-[45%] flex-col bg-[hsl(var(--teal))] p-12 text-white overflow-hidden"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <div
                    className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"
                    aria-hidden="true"
                />
                <div className="relative z-10 flex items-center gap-3">
                    <div className="grid grid-cols-2 gap-0.5 w-9 h-9">
                        <div className="rounded-sm bg-white" />
                        <div className="rounded-sm bg-[hsl(var(--coral))]" />
                        <div className="rounded-sm bg-[hsl(var(--coral))]" />
                        <div className="rounded-sm bg-white/40" />
                    </div>
                    <span className="text-lg font-bold font-display">Les Extras</span>
                </div>
                <div className="relative z-10 mt-auto space-y-4">
                    <p className="text-3xl font-bold leading-tight font-display">Nouveau départ.</p>
                    <p className="text-white/70 text-sm leading-relaxed">
                        Choisissez un mot de passe fort pour sécuriser votre compte.
                    </p>
                </div>
            </motion.div>

            {/* Right — form */}
            <div className="flex flex-1 items-center justify-center p-6 sm:p-10 bg-white">
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
                        <h1 className="text-2xl font-bold tracking-tight font-display">
                            Nouveau mot de passe
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Choisissez un mot de passe d'au moins 8 caractères.
                        </p>
                    </div>

                    <form action={action} className="space-y-4" noValidate>
                        <input type="hidden" name="token" value={token} />
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="8 caractères minimum"
                                    required
                                    className="pl-9"
                                />
                            </div>
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
                        <Link
                            href="/login"
                            className="text-[hsl(var(--teal))] hover:underline underline-offset-4 font-semibold"
                        >
                            Retour à la connexion
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordContent />
        </Suspense>
    );
}
