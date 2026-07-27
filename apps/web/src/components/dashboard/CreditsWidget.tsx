"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, Check, Coins, Plus } from "lucide-react";
import { buyPack, type PackType } from "@/actions/credits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { CREDIT_PACKS, type CreditPackDefinition } from "@/lib/credit-packs";
import { normalizePackPurchaseErrorMessage } from "@/lib/pack-purchase-errors";
import { cn } from "@/lib/utils";

interface CreditsWidgetProps {
    credits: number | null;
    error?: string | null;
}

function getCreditState(credits: number | null) {
    if (credits === null) return "unknown";
    if (credits === 0) return "empty";
    if (credits <= 2) return "low";
    return "normal";
}

export function CreditsWidget({ credits, error = null }: CreditsWidgetProps) {
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedPack, setSelectedPack] = useState<CreditPackDefinition | null>(null);
    const [isPending, startTransition] = useTransition();
    const [displayCredits, setDisplayCredits] = useState<number | null>(credits);
    const creditState = getCreditState(displayCredits);

    useEffect(() => {
        setDisplayCredits(credits);
    }, [credits]);

    const requestBuyPack = (pack: CreditPackDefinition) => {
        setSelectedPack(pack);
        setConfirmOpen(true);
    };

    const handleConfirmBuyPack = () => {
        if (!selectedPack) return;

        startTransition(async () => {
            const result = await buyPack(selectedPack.id as PackType);
            if ("error" in result) {
                toast.error(normalizePackPurchaseErrorMessage(result.error));
                return;
            }

            setDisplayCredits(result.availableCredits);
            toast.success(`Pack ${selectedPack.name} ajouté au solde.`);
            setConfirmOpen(false);
            setOpen(false);
            setSelectedPack(null);
        });
    };

    return (
        <div className="space-y-4">
            <GlassCard
                variant={creditState === "normal" ? "interactive" : "glass"}
                className={cn(
                    creditState === "empty" && "border-[hsl(var(--destructive)/0.5)]",
                    creditState === "low" && "border-[hsl(var(--amber)/0.45)]",
                )}
            >
                <div className="p-6">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Crédits</span>
                        <Coins className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    {typeof displayCredits === "number" ? (
                        <AnimatedNumber value={displayCredits} className="text-2xl font-bold" />
                    ) : (
                        <div className="text-2xl font-bold">—</div>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                        Solde disponible pour vos validations de réservation
                    </p>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="mt-4 w-full" size="sm" variant="teal">
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Acheter des crédits
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Choisir un pack de crédits</DialogTitle>
                                <DialogDescription>
                                    Ajoutez des crédits à votre solde. Un crédit est consommé lorsqu&apos;une réservation est validée.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-3">
                                {CREDIT_PACKS.map((pack) => (
                                    <div
                                        key={pack.id}
                                        className={cn(
                                            "relative flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200",
                                            pack.popular
                                                ? "border-[hsl(var(--teal)/0.35)] card-shadow-md"
                                                : "border-border hover:card-shadow-md",
                                        )}
                                    >
                                        {pack.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-[0_0_12px_hsl(var(--teal)/0.3)]">
                                                Populaire
                                            </div>
                                        )}
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold">{pack.name}</h3>
                                            <div className="mt-2 flex items-baseline">
                                                <span className="text-2xl font-bold">{pack.price} €</span>
                                            </div>
                                            <p className="mt-1 text-sm font-medium text-primary">
                                                {pack.credits} crédit{pack.credits > 1 ? "s" : ""}
                                            </p>
                                        </div>

                                        <ul className="mb-6 flex-1 space-y-2">
                                            {pack.features.map((feature) => (
                                                <li key={feature} className="flex items-center text-xs text-muted-foreground">
                                                    <Check className="mr-2 h-3 w-3 text-[hsl(var(--emerald))]" aria-hidden="true" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            className="w-full"
                                            onClick={() => requestBuyPack(pack)}
                                            disabled={isPending}
                                            variant={pack.popular ? "teal" : "outline"}
                                        >
                                            Choisir
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirmer l&apos;achat</DialogTitle>
                                <DialogDescription>
                                    {selectedPack
                                        ? `Ajouter le pack ${selectedPack.name} (${selectedPack.credits} crédit${selectedPack.credits > 1 ? "s" : ""}) pour ${selectedPack.price} € ?`
                                        : "Confirmez l'ajout de crédits à votre solde."}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmOpen(false)}
                                    disabled={isPending}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    variant="teal"
                                    onClick={handleConfirmBuyPack}
                                    disabled={isPending || !selectedPack}
                                >
                                    {isPending ? "Ajout..." : "Confirmer l'achat"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </GlassCard>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <AlertTitle>Solde indisponible</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!error && creditState === "unknown" && (
                <Alert>
                    <Coins className="h-4 w-4" aria-hidden="true" />
                    <AlertTitle>Solde indisponible</AlertTitle>
                    <AlertDescription>
                        Le solde de crédits ne peut pas être affiché pour le moment.
                    </AlertDescription>
                </Alert>
            )}

            {!error && creditState === "empty" && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <AlertTitle>Solde épuisé</AlertTitle>
                    <AlertDescription>
                        Votre solde est à zéro. Ajoutez un pack avant vos prochaines validations.
                    </AlertDescription>
                </Alert>
            )}

            {!error && creditState === "low" && (
                <Alert className="border-[hsl(var(--amber)/0.35)] bg-[hsl(var(--amber)/0.08)]">
                    <Coins className="h-4 w-4" aria-hidden="true" />
                    <AlertTitle>Crédits faibles</AlertTitle>
                    <AlertDescription>
                        Il vous reste peu de crédits. Pensez à recharger votre solde.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
