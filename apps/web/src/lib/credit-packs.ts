export type CreditPackId = "STARTER" | "PRO" | "ENTERPRISE";

export type CreditPackDefinition = {
  id: CreditPackId;
  name: string;
  credits: number;
  price: number;
  popular: boolean;
  description: string;
  features: string[];
};

export const CREDIT_PACKS: readonly CreditPackDefinition[] = [
  {
    id: "STARTER",
    name: "Starter",
    credits: 1,
    price: 150,
    popular: false,
    description: "Idéal pour un besoin ponctuel.",
    features: [
      "1 crédit ajouté au solde",
      "Suivi du solde depuis le dashboard",
      "Validité illimitée",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    credits: 3,
    price: 400,
    popular: true,
    description: "Le format le plus adapté pour plusieurs recrutements.",
    features: [
      "3 crédits ajoutés au solde",
      "Économie de 50 €",
      "Historique d'achats centralisé",
      "Prépare plusieurs recrutements",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Entreprise",
    credits: 5,
    price: 600,
    popular: false,
    description: "Pour les besoins réguliers.",
    features: [
      "5 crédits ajoutés au solde",
      "Économie de 150 €",
      "Historique d'achats centralisé",
      "Prépare les besoins récurrents",
    ],
  },
] as const;
