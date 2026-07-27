import {
  BookOpen,
  Brain,
  ChefHat,
  Dumbbell,
  HeartHandshake,
  Home,
  Moon,
  Palette,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type MetierCategory = "soin" | "educatif" | "support";

export interface Metier {
  id: string;
  label: string;
  icon: LucideIcon;
  category: MetierCategory;
}

export const METIERS: Metier[] = [
  // Soin
  {
    id: "psychologue",
    label: "Psychologue",
    icon: Brain,
    category: "soin",
  },
  {
    id: "auxiliaire-de-vie",
    label: "Auxiliaire de vie",
    icon: HeartHandshake,
    category: "soin",
  },
  {
    id: "art-therapeute",
    label: "Art thérapeute",
    icon: Palette,
    category: "soin",
  },
  // Éducatif
  {
    id: "educateur-specialise",
    label: "Éducateur spécialisé",
    icon: BookOpen,
    category: "educatif",
  },
  {
    id: "moniteur-educateur",
    label: "Moniteur éducateur",
    icon: BookOpen,
    category: "educatif",
  },
  {
    id: "educateur-sportif",
    label: "Éducateur sportif",
    icon: Dumbbell,
    category: "educatif",
  },
  // Support
  {
    id: "surveillant-de-nuit",
    label: "Surveillant de nuit",
    icon: Moon,
    category: "support",
  },
  {
    id: "maitresse-de-maison",
    label: "Maîtresse de maison",
    icon: Home,
    category: "support",
  },
  {
    id: "agent-de-service",
    label: "Agent de service",
    icon: Sparkles,
    category: "support",
  },
  {
    id: "cuisinier",
    label: "Cuisinier",
    icon: ChefHat,
    category: "support",
  },
  {
    id: "autre",
    label: "Autre métier",
    icon: Users,
    category: "support",
  },
];

export const METIERS_BY_CATEGORY: Record<MetierCategory, Metier[]> = {
  soin: METIERS.filter((m) => m.category === "soin"),
  educatif: METIERS.filter((m) => m.category === "educatif"),
  support: METIERS.filter((m) => m.category === "support"),
};

export const CATEGORY_LABELS: Record<MetierCategory, string> = {
  soin: "Soin",
  educatif: "Éducatif",
  support: "Support",
};

export const HOURLY_RATE_MIN = 15;
export const HOURLY_RATE_MAX = 45;
export const HOURLY_RATE_DEFAULT = 20;
export const MAX_SLOTS = 5;

function findMetierById(id: string): Metier | undefined {
  return METIERS.find((m) => m.id === id);
}

const LEGACY_METIER_ALIASES: Record<string, string> = {
  "veilleur-de-nuit": "surveillant-de-nuit",
  VEILLEUR_DE_NUIT: "surveillant-de-nuit",
  MAITRESSE_DE_MAISON: "maitresse-de-maison",
  AGENT_DE_SERVICE: "agent-de-service",
  CUISINIER: "cuisinier",
};

const LEGACY_METIER_LABELS: Record<string, string> = {
  "aide-soignant": "Aide-soignant(e)",
  AIDE_SOIGNANT: "Aide-soignant(e)",
  infirmier: "Infirmier(ère)",
  INFIRMIER: "Infirmier(ère)",
  "amp-aes": "AMP / AES",
  AMP_AES: "AMP / AES",
  "accompagnant-educatif": "Accompagnant(e) éducatif et social",
  ACCOMPAGNANT_EDUCATIF: "Accompagnant(e) éducatif et social",
  "chef-de-service": "Chef de service",
  CHEF_DE_SERVICE: "Chef de service",
  psychomotricien: "Psychomotricien",
  sophrologue: "Sophrologue",
  formateur: "Formateur",
  "intervenant-bien-etre": "Intervenant bien-être",
};

export function normalizeMetierId(id: string | null | undefined): string | null {
  const normalized = id?.trim();
  if (!normalized) return null;

  if (findMetierById(normalized)) return normalized;

  return LEGACY_METIER_ALIASES[normalized] ?? normalized;
}

export function getMetierById(id: string): Metier | undefined {
  const normalized = normalizeMetierId(id);
  return normalized ? findMetierById(normalized) : undefined;
}

export function getMetierLabel(id: string): string {
  return getMetierById(id)?.label ?? LEGACY_METIER_LABELS[id] ?? id;
}

// ─── SOS Renfort v2 — Dictionnaires ──────────────────────────────────────────

export const TYPES_ETABLISSEMENTS = [
  "EHPAD",
  "MAS",
  "FAM",
  "MECS",
  "IME",
  "Domicile",
  "SSIAD",
  "Foyer de vie",
  "Clinique",
  "Autre",
] as const;

export const PUBLIC_CIBLE_OPTIONS = [
  "Enfants",
  "Adolescents",
  "Adultes",
  "Personnes âgées",
  "Handicap psychique",
  "Handicap moteur",
  "TSA / autisme",
  "Troubles cognitifs",
  "Protection de l'enfance",
  "Addictions",
  "Précarité",
  "Rééducation",
] as const;

export const PERKS_OPTIONS = [
  { id: "MEALS_PROVIDED", label: "Repas fourni sur place" },
  { id: "FREE_PARKING", label: "Parking gratuit" },
  { id: "KM_REIMBURSEMENT", label: "Remboursement frais kilométriques" },
  { id: "ACCOMMODATION", label: "Logement / Chambre de garde" },
  { id: "TRANSPORT_REIMBURSEMENT", label: "Remboursement transport en commun" },
] as const;

export const SKILLS_OPTIONS = [
  "Accompagnement éducatif",
  "Troubles du comportement",
  "Handicap psychique",
  "Handicap moteur",
  "TSA / autisme",
  "Addictions",
  "Protection de l'enfance",
  "Médiation artistique",
  "Médiation corporelle",
  "Animation de groupe",
  "Gestion de crise",
  "Travail de nuit",
  "Transmission équipe",
  "Rééducation",
] as const;

export const TRANSMISSION_TIMES = [
  "5 min",
  "10 min",
  "15 min",
  "20 min",
  "30 min",
] as const;
