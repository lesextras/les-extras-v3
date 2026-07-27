"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { OnboardingSplitLayout } from "./OnboardingSplitLayout";
import { OnboardingStepper } from "./OnboardingStepper";
import { OnboardingFormCard } from "./OnboardingFormCard";
import { OnboardingContextPanel, ESTABLISHMENT_CONTEXT_STEPS } from "./OnboardingContextPanel";
import { ValidatedField } from "./ValidatedField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    saveOnboardingStep,
    completeOnboarding,
    type OnboardingData,
} from "@/app/actions/onboarding";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ESTABLISHMENT_TYPES: Record<string, string[]> = {
    "Protection de l'enfance": ["MECS", "AEMO", "Foyer de l'Enfance", "PEAD"],
    "Personnes âgées": ["EHPAD", "USLD", "Résidence Autonomie", "SSIAD"],
    "Handicap adulte": ["FAM", "MAS", "SAMSAH", "ESAT", "Foyer de vie", "Foyer d'hébergement"],
    "Handicap enfant": ["IME", "ITEP", "SESSAD", "CAMSP", "CMPP"],
    "Addiction & Précarité": ["CSAPA", "CHRS", "LHSS", "ACT"],
    "Autre": ["SAAD", "SPASAD", "Autre"],
};

export function EstablishmentFlow({ currentStep }: { currentStep: number }) {
    const router = useRouter();
    const [step, setStep] = useState(currentStep === 0 ? 1 : currentStep);
    const [isPending, startTransition] = useTransition();
    const [showSuccess, setShowSuccess] = useState(false);
    const totalSteps = 2;

    // Step 1 — Identité structure
    const [establishmentName, setEstablishmentName] = useState("");
    const [establishmentType, setEstablishmentType] = useState("");

    // Step 2 — Adresse & Contact
    const [address, setAddress] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [city, setCity] = useState("");
    const [contactName, setContactName] = useState("");
    const [phone, setPhone] = useState("");

    const handleBack = () => setStep((s) => Math.max(1, s - 1));

    const handleNext = () => {
        startTransition(async () => {
            try {
                let data: OnboardingData = {};

                if (step === 1) {
                    if (!establishmentName) { toast.error("Le nom de l'établissement est requis."); return; }
                    if (!establishmentType) { toast.error("Le type de structure est requis."); return; }
                    data = { establishmentName, establishmentType };
                } else if (step === 2) {
                    if (!address) { toast.error("L'adresse est requise."); return; }
                    if (!city) { toast.error("La ville est requise."); return; }
                    if (!contactName) { toast.error("Le nom du responsable est requis."); return; }
                    if (!phone) { toast.error("Le téléphone est requis."); return; }
                    data = { address, city, zipCode: postalCode, contactName, phone };
                }

                const saveResult = await saveOnboardingStep(step, data);
                if (saveResult.error) { toast.error(saveResult.error); return; }

                if (step < totalSteps) {
                    setStep(step + 1);
                } else {
                    const completeResult = await completeOnboarding();
                    if (completeResult.error) { toast.error(completeResult.error); return; }
                    setShowSuccess(true);
                    setTimeout(() => {
                        router.push("/dashboard");
                        router.refresh();
                    }, 1800);
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
            }
        });
    };

    if (showSuccess) {
        return (
            <OnboardingSplitLayout
                leftPanel={
                    <OnboardingContextPanel
                        currentStep={step}
                        steps={ESTABLISHMENT_CONTEXT_STEPS}
                    />
                }
                rightPanel={
                    <div className="flex flex-col items-center justify-center gap-6 text-center">
                        <div className="success-ring-glow rounded-full p-6">
                            <svg className="success-ring-anim h-20 w-20" viewBox="0 0 52 52">
                                <circle
                                    cx="26" cy="26" r="25"
                                    fill="none"
                                    stroke="hsl(var(--teal))"
                                    strokeWidth="2"
                                />
                                <polyline
                                    points="16,26 23,33 36,20"
                                    fill="none"
                                    stroke="hsl(var(--teal))"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-[hsl(var(--text-primary))]">
                                Établissement configuré !
                            </h2>
                            <p className="text-[hsl(var(--text-secondary))]">
                                Bienvenue sur Les-Extras. Redirection…
                            </p>
                        </div>
                    </div>
                }
            />
        );
    }

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <ValidatedField
                            id="name"
                            label="Nom de l'établissement"
                            required
                            value={establishmentName}
                            onChange={setEstablishmentName}
                            validate={(v) => (!v ? "Le nom est requis" : null)}
                            placeholder="Ex: MECS Les Érables"
                        />
                        <div className="space-y-2">
                            <Label htmlFor="type">
                                Type de structure <span className="ml-0.5 text-[hsl(var(--coral))]">*</span>
                            </Label>
                            <Select onValueChange={setEstablishmentType} value={establishmentType}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Sélectionnez le type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ESTABLISHMENT_TYPES).map(([group, types]) => (
                                        <SelectGroup key={group}>
                                            <SelectLabel className="uppercase text-xs tracking-wider text-[hsl(var(--text-tertiary))]">
                                                {group}
                                            </SelectLabel>
                                            {types.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );

            case 2:
                return (
                    <>
                        <ValidatedField
                            id="address"
                            label="Adresse"
                            required
                            value={address}
                            onChange={setAddress}
                            validate={(v) => (!v ? "L'adresse est requise" : null)}
                            placeholder="10 rue de la République"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <ValidatedField
                                id="postal"
                                label="Code postal"
                                value={postalCode}
                                onChange={setPostalCode}
                                placeholder="75001"
                                maxLength={5}
                            />
                            <ValidatedField
                                id="city"
                                label="Ville"
                                required
                                value={city}
                                onChange={setCity}
                                validate={(v) => (!v ? "La ville est requise" : null)}
                                placeholder="Paris"
                            />
                        </div>
                        <ValidatedField
                            id="contact"
                            label="Nom du Responsable"
                            required
                            value={contactName}
                            onChange={setContactName}
                            validate={(v) => (!v ? "Le nom est requis" : null)}
                            placeholder="Jean Dupont"
                        />
                        <ValidatedField
                            id="phone"
                            label="Téléphone"
                            required
                            type="tel"
                            value={phone}
                            onChange={setPhone}
                            validate={(v) => (!v ? "Le téléphone est requis" : null)}
                            placeholder="06 12 34 56 78"
                        />
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <OnboardingSplitLayout
            leftPanel={
                <OnboardingContextPanel
                    currentStep={step}
                    steps={ESTABLISHMENT_CONTEXT_STEPS}
                />
            }
            rightPanel={
                <div className="w-full max-w-lg space-y-8">
                    <OnboardingStepper
                        currentStep={step}
                        totalSteps={totalSteps}
                        labels={["Structure", "Contact"]}
                    />
                    <OnboardingFormCard
                        stepKey={step}
                        eyebrow={`Étape ${step} sur ${totalSteps}`}
                        title={step === 1 ? "Votre Structure" : "Adresse & Contact"}
                        description={
                            step === 1
                                ? "Identifiez votre établissement."
                                : "Pour les factures et échanges avec les intervenants."
                        }
                        footer={
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    disabled={isPending || step === 1}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour
                                </Button>
                                <Button
                                    variant="coral"
                                    onClick={handleNext}
                                    disabled={isPending}
                                    className="gap-2"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Enregistrement…
                                        </>
                                    ) : step < totalSteps ? (
                                        <>Continuer <ArrowRight className="h-4 w-4" /></>
                                    ) : (
                                        <>Valider mon profil <ArrowRight className="h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                        }
                    >
                        {renderStepContent()}
                    </OnboardingFormCard>
                </div>
            }
        />
    );
}