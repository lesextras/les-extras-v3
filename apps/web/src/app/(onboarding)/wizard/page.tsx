import { redirect } from "next/navigation";
import { EstablishmentFlow } from "@/components/onboarding/EstablishmentFlow";
import { FreelanceFlow } from "@/components/onboarding/FreelanceFlow";
import { getSession } from "@/lib/session";
import { MAX_STEP_BY_ROLE } from "@/lib/constants";

export default async function WizardPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const { role, onboardingStep } = session.user;

    if (role === "ADMIN") {
        redirect("/dashboard");
    }

    // Si l'onboarding est déjà terminé, renvoyer vers l'espace correspondant
    const maxStep = MAX_STEP_BY_ROLE[role as keyof typeof MAX_STEP_BY_ROLE] ?? 3;
    if (onboardingStep >= maxStep) {
        redirect(role === "FREELANCE" ? "/marketplace" : "/dashboard");
    }

    return role === "ESTABLISHMENT" ? (
        <EstablishmentFlow currentStep={onboardingStep} />
    ) : (
        <FreelanceFlow currentStep={onboardingStep} />
    );
}
