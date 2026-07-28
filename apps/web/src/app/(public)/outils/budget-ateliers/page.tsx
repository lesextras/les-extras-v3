import type { Metadata } from "next";
import { CalculateurBudget } from "../../../_shared/CalculateurBudget";

export const metadata: Metadata = {
  title: "Calculateur : budget annuel d'ateliers éducatifs pour un établissement",
  description:
    "Estimez le budget annuel d'ateliers éducatifs de votre MECS, IME ou foyer : coût total, coût par jeune et par mois. Outil gratuit, sans inscription.",
  alternates: { canonical: "/outils/budget-ateliers" },
};

export default function BudgetAteliersPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <span className="eyebrow">Outil gratuit · sans inscription</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
          Quel budget d'ateliers prévoir cette année ?
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Traduisez votre projet d'établissement en budget : coût annuel, coût par jeune,
          coût par jeune et par mois — les trois chiffres qui font passer un arbitrage.
        </p>
      </div>
      <CalculateurBudget />
    </div>
  );
}
