"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
    buyPack,
    getCreditsSummarySafe,
    type CreditPurchaseHistoryItem,
    type PackType,
} from "@/actions/credits";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { normalizePackPurchaseErrorMessage } from "@/lib/pack-purchase-errors";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

export default function PacksPage() {
    const [isPending, startTransition] = useTransition();
    const [availableCredits, setAvailableCredits] = useState<number | null>(null);
    const [purchaseHistory, setPurchaseHistory] = useState<CreditPurchaseHistoryItem[]>([]);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const loadSummary = async () => {
        const summary = await getCreditsSummarySafe();
        setAvailableCredits(summary.availableCredits);
        setPurchaseHistory(summary.purchaseHistory);
        setSummaryError(
            [summary.creditsError, summary.historyError]
                .filter((message): message is string => Boolean(message))
                .filter((message, index, all) => all.indexOf(message) === index)
                .join(" ") || null,
        );
    };

    useEffect(() => {
        void loadSummary();
    }, []);

    const handleBuyPack = (packId: PackType, packName: string, price: number) => {
        if (confirm(`Confirmer l'ajout du pack '${packName}' pour ${price}€ ?`)) {
            startTransition(async () => {
                const result = await buyPack(packId);
                if ("error" in result) {
                    toast.error(normalizePackPurchaseErrorMessage(result.error));
                } else {
                    setAvailableCredits(result.availableCredits);
                    void loadSummary();
                    toast.success(`Pack ${packName} ajouté au solde avec succès.`);
                }
            });
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="text-center space-y-4">
                <h1 className="font-display text-heading-xl tracking-tight">Choisissez votre Pack de Crédits</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Simplifiez vos recrutements avec nos formules prépayées.
                    Plus vous achetez, plus vous économisez sur vos mises en relation.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Solde disponible</p>
                    <div className="mt-2 flex items-end gap-2">
                        <span className="text-4xl font-extrabold">
                            {availableCredits ?? "—"}
                        </span>
                        <span className="text-muted-foreground">
                            crédit{availableCredits && availableCredits > 1 ? "s" : ""}
                        </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Chaque achat ajoute des crédits à votre solde. Un crédit est consommé lorsqu&apos;une réservation est validée.
                    </p>
                    {summaryError && (
                        <p className="mt-3 text-sm text-destructive" role="alert">
                            {summaryError}
                        </p>
                    )}
                </div>

                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Historique récent</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Les 5 derniers achats visibles depuis le dashboard.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {purchaseHistory.slice(0, 5).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Aucun achat enregistré pour le moment.
                            </p>
                        ) : (
                            purchaseHistory.slice(0, 5).map((purchase) => (
                                <div
                                    key={purchase.id}
                                    className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {purchase.creditsAdded} crédit{purchase.creditsAdded > 1 ? "s" : ""} ajouté{purchase.creditsAdded > 1 ? "s" : ""}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {dateFormatter.format(new Date(purchase.createdAt))}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-[hsl(var(--teal))]">
                                        {currencyFormatter.format(purchase.amount)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                {CREDIT_PACKS.map((pack) => (
                    <div
                        key={pack.id}
                        className={`relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-xl ${pack.popular ? 'border-[hsl(var(--teal)/0.3)] ring-2 ring-[hsl(var(--teal)/0.4)] scale-105 z-10' : 'hover:border-[hsl(var(--teal)/0.3)]'
                            }`}
                    >
                        {pack.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[hsl(var(--teal))] text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current" />
                                Plus Populaire
                            </div>
                        )}

                        <div className="mb-6 space-y-2">
                            <h3 className="text-2xl font-bold">{pack.name}</h3>
                            <p className="text-sm text-muted-foreground">{pack.description}</p>
                        </div>

                        <div className="mb-6 pb-6 border-b border-border/50">
                            <div className="flex items-baseline">
                                <span className="text-5xl font-extrabold">{pack.price}€</span>
                            </div>
                            <p className="text-sm font-medium mt-2 text-[hsl(var(--teal))]">
                                Soit {Math.round(pack.price / pack.credits)}€ / crédit ajouté
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {pack.features.map((feature, i) => (
                                <li key={i} className="flex items-start text-sm text-muted-foreground">
                                    <div className={`mr-3 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${pack.popular ? 'bg-[hsl(var(--teal)/0.10)] text-[hsl(var(--teal))]' : 'bg-muted text-muted-foreground'}`}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            className={`w-full h-12 text-lg font-semibold ${pack.popular ? 'shadow-lg' : ''}`}
                            onClick={() => handleBuyPack(pack.id, pack.name, pack.price)}
                            disabled={isPending}
                            variant={pack.popular ? "coral" : "outline"}
                        >
                            {isPending ? "Traitement..." : "Choisir ce pack"}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Achat ajouté au solde et visible dans l&apos;historique
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-16 bg-[hsl(var(--color-sand-50))] rounded-xl p-8 max-w-4xl mx-auto">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--teal)/0.10)] text-[hsl(var(--teal))] text-xs">?</span>
                    Questions Fréquentes
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                    <div>
                        <strong className="text-foreground block mb-1">Comment fonctionnent les crédits ?</strong>
                        Chaque achat ajoute des crédits à votre solde. Un crédit est consommé au moment où une réservation est validée.
                    </div>
                    <div>
                        <strong className="text-foreground block mb-1">Les crédits ont-ils une date d'expiration ?</strong>
                        Non, vos crédits sont valables sans limite de temps tant que votre compte est actif.
                    </div>
                    <div>
                        <strong className="text-foreground block mb-1">Où retrouver mes achats ?</strong>
                        Les derniers achats sont affichés sur cette page avec leur montant, le nombre de crédits ajoutés et la date d&apos;achat.
                    </div>
                    <div>
                        <strong className="text-foreground block mb-1">Besoin de plus de 5 crédits ?</strong>
                        Contactez notre service commercial pour des offres sur mesure pour grands groupes.
                    </div>
                </div>
            </div>
        </div>
    );
}
