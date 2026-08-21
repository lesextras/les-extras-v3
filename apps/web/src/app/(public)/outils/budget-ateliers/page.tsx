import type { Metadata } from "next";
import { metaPublique } from "@/lib/meta";
import { CalculateurBudget } from "../../../_shared/CalculateurBudget";

// Titre et description de partage étaient déjà identiques à ceux de la page :
// le helper les produit à l'identique, et apporte en plus la carte de partage
// que cet objet `openGraph` effaçait en remplaçant celui du layout racine.
export const metadata: Metadata = metaPublique({
  title: "Calculateur de budget d'ateliers éducatifs",
  description:
    "Estimez le budget annuel d'ateliers de votre MECS, IME ou foyer : coût total, coût par jeune, coût par mois. Gratuit, sans inscription.",
  path: "/outils/budget-ateliers",
});

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
