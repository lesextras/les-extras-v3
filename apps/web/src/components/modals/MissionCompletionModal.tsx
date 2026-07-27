"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Calendar, Clock, User, DollarSign } from "lucide-react";

/* ─── D.8 — Mission Completion Modals ────────────────────────────
   Two flows:
   1. Confirm mission completion (recap + payment trigger)
   2. Report a problem (dispute form)
   ─────────────────────────────────────────────────────────────── */

interface MissionCompletionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    freelanceName: string;
    dates: string;
    hoursWorked: string;
    amount: string;
    onConfirm: () => void;
    onDispute: () => void;
}

export function MissionCompletionModal({
    open,
    onOpenChange,
    freelanceName,
    dates,
    hoursWorked,
    amount,
    onConfirm,
    onDispute,
}: MissionCompletionModalProps) {
    const [hoursCorrect, setHoursCorrect] = React.useState(false);
    const [mode, setMode] = React.useState<"confirm" | "dispute">("confirm");
    const [disputeType, setDisputeType] = React.useState("");
    const [disputeDescription, setDisputeDescription] = React.useState("");

    const handleConfirm = () => {
        if (!hoursCorrect) return;
        onConfirm();
        onOpenChange(false);
    };

    const handleDispute = () => {
        if (!disputeType || !disputeDescription.trim()) return;
        onDispute();
        onOpenChange(false);
    };

    if (mode === "dispute") {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display text-heading-md flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                            Signaler un problème
                        </DialogTitle>
                        <DialogDescription>
                            Décrivez le problème rencontré lors de cette mission.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <label htmlFor="dispute-type" className="text-sm font-medium mb-1.5 block">
                                Type de problème
                            </label>
                            <select
                                id="dispute-type"
                                value={disputeType}
                                onChange={(e) => setDisputeType(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--teal))]"
                            >
                                <option value="">Sélectionnez…</option>
                                <option value="no_show">Freelance absent(e)</option>
                                <option value="partial_hours">Heures incomplètes</option>
                                <option value="quality">Problème de qualité</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="dispute-desc" className="text-sm font-medium mb-1.5 block">
                                Description
                            </label>
                            <textarea
                                id="dispute-desc"
                                value={disputeDescription}
                                onChange={(e) => setDisputeDescription(e.target.value)}
                                placeholder="Décrivez la situation…"
                                rows={4}
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--teal))] resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setMode("confirm")}>
                            Retour
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleDispute}
                            disabled={!disputeType || !disputeDescription.trim()}
                            className="min-h-[44px]"
                        >
                            Envoyer le signalement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-heading-md flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[hsl(var(--color-emerald-500))]" aria-hidden="true" />
                        Confirmer la mission
                    </DialogTitle>
                    <DialogDescription>
                        Vérifiez le récapitulatif avant de déclencher le paiement.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Recap */}
                    <div className="rounded-xl border border-border bg-[hsl(var(--color-cream))] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <span className="font-medium">{freelanceName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <span>{dates}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <span>{hoursWorked} heures réalisées</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <DollarSign className="h-4 w-4 text-[hsl(var(--color-emerald-500))]" aria-hidden="true" />
                            <span>{amount}</span>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={hoursCorrect}
                            onChange={(e) => setHoursCorrect(e.target.checked)}
                            className="mt-0.5 h-5 w-5 rounded border-border accent-[hsl(var(--teal))]"
                        />
                        <span className="text-sm leading-snug">
                            Les heures sont correctes et je souhaite valider cette mission.
                        </span>
                    </label>
                </div>

                <DialogFooter className="gap-2 flex-col sm:flex-row">
                    <Button
                        variant="ghost"
                        onClick={() => setMode("dispute")}
                        className="text-muted-foreground"
                    >
                        Signaler un problème
                    </Button>
                    <Button
                        variant="coral"
                        onClick={handleConfirm}
                        disabled={!hoursCorrect}
                        className="min-h-[44px]"
                    >
                        Valider et déclencher le paiement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
