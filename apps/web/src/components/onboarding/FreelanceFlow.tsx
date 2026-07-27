"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { OnboardingSplitLayout } from "./OnboardingSplitLayout";
import { OnboardingStepper } from "./OnboardingStepper";
import { OnboardingFormCard } from "./OnboardingFormCard";
import { OnboardingContextPanel, FREELANCE_CONTEXT_STEPS } from "./OnboardingContextPanel";
import { ValidatedField } from "./ValidatedField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveOnboardingStep, completeOnboarding, type OnboardingData } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FreelanceFlow({ currentStep }: { currentStep: number }) {
    const [step, setStep] = useState(currentStep === 0 ? 1 : currentStep);
    const [isPending, startTransition] = useTransition();
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();
    const totalSteps = 2;

    // Step 1 — Identité
    const [jobTitle, setJobTitle] = useState("");
    const [bio, setBio] = useState("");

    // Step 2 — Localisation
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [phone, setPhone] = useState("");

    const handleBack = () => setStep((s) => Math.max(1, s - 1));

    const handleNext = () => {
        startTransition(async () => {
            try {
                let data: OnboardingData = {};

                if (step === 1) {
                    if (!jobTitle) { toast.error("Veuillez sélectionner votre métier."); return; }
                    if (!bio || bio.length < 10) { toast.error("Veuillez écrire une courte bio (10 caractères min)."); return; }
                    data = { jobTitle, bio };
                } else if (step === 2) {
                    if (!address) { toast.error("Veuillez renseigner votre adresse."); return; }
                    if (!city) { toast.error("Veuillez renseigner votre ville."); return; }
                    data = { address, city, zipCode, phone };
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
                        router.push("/marketplace");
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
                        steps={FREELANCE_CONTEXT_STEPS}
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
                                Profil complété !
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
                        <div className="space-y-2">
                            <Label>
                                Votre métier <span className="ml-0.5 text-[hsl(var(--coral))]">*</span>
                            </Label>
                            <Select onValueChange={setJobTitle} value={jobTitle}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Sélectionnez votre métier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Educateur Spécialisé">Éducateur Spécialisé (ES)</SelectItem>
                                    <SelectItem value="Moniteur Educateur">Moniteur Éducateur (ME)</SelectItem>
                                    <SelectItem value="AES / AMP">AES / AMP</SelectItem>
                                    <SelectItem value="Surveillant de Nuit">Surveillant de Nuit</SelectItem>
                                    <SelectItem value="Maîtresse de Maison">Maîtresse de Maison</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">
                                Présentez-vous en quelques mots <span className="ml-0.5 text-[hsl(var(--coral))]">*</span>
                            </Label>
                            <Textarea
                                id="bio"
                                className="rounded-xl resize-none"
                                placeholder="Votre expérience, vos spécialités, ce qui vous motive..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                            />
                            <p className="text-xs text-[hsl(var(--text-tertiary))]">
                                {bio.length}/500 caractères · 10 minimum
                            </p>
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
                                id="zipCode"
                                label="Code postal"
                                value={zipCode}
                                onChange={setZipCode}
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
                            id="phone"
                            label="Téléphone"
                            type="tel"
                            value={phone}
                            onChange={setPhone}
                            placeholder="06 12 34 56 78"
                        />
                        <p className="text-xs text-[hsl(var(--text-tertiary))] -mt-2">
                            Sert au calcul des frais kilométriques et à vous contacter.
                        </p>
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
                    steps={FREELANCE_CONTEXT_STEPS}
                />
            }
            rightPanel={
                <div className="w-full max-w-lg space-y-8">
                    <OnboardingStepper
                        currentStep={step}
                        totalSteps={totalSteps}
                        labels={["Profil", "Localisation"]}
                    />
                    <OnboardingFormCard
                        stepKey={step}
                        eyebrow={`Étape ${step} sur ${totalSteps}`}
                        title={step === 1 ? "Votre Profil" : "Localisation & Contact"}
                        description={
                            step === 1
                                ? "Dites-nous qui vous êtes."
                                : "Pour des missions proches de chez vous."
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
                                        <>Terminer <ArrowRight className="h-4 w-4" /></>
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
