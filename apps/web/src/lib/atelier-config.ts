import {
  HeartHandshake,
  ShieldAlert,
  MessageCircle,
  Palette,
  Dumbbell,
  Home,
  Monitor,
  Users,
  Stethoscope,
  Heart,
  Briefcase,
  Baby,
  Brain,
  Sunset,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AtelierCategory {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const ATELIER_CATEGORIES: AtelierCategory[] = [
  { id: "GESTION_EMOTIONS", label: "Gestion des émotions", icon: HeartHandshake },
  { id: "PREVENTION_VIOLENCE", label: "Prévention de la violence", icon: ShieldAlert },
  { id: "CNV", label: "Communication Non Violente", icon: MessageCircle },
  { id: "ART_THERAPIE", label: "Art-thérapie", icon: Palette },
  { id: "SPORT_ADAPTE", label: "Sport adapté / APA", icon: Dumbbell },
  { id: "VIE_QUOTIDIENNE", label: "Vie quotidienne & autonomie", icon: Home },
  { id: "NUMERIQUE", label: "Inclusion numérique", icon: Monitor },
  { id: "CITOYENNETE", label: "Citoyenneté & vie sociale", icon: Users },
  { id: "PREVENTION_SANTE", label: "Prévention santé", icon: Stethoscope },
  { id: "SEXUALITE_VIE_AFFECTIVE", label: "Sexualité & vie affective", icon: Heart },
  { id: "INSERTION_PRO", label: "Insertion professionnelle", icon: Briefcase },
  { id: "PARENTALITE", label: "Parentalité", icon: Baby },
  { id: "PSYCHO_EDUCATION", label: "Psycho-éducation", icon: Brain },
  { id: "RELAXATION", label: "Relaxation & bien-être", icon: Sunset },
  { id: "AUTRE", label: "Autre", icon: MoreHorizontal },
];

export interface PublicCibleOption {
  id: string;
  label: string;
}

export const PUBLIC_CIBLE_OPTIONS: PublicCibleOption[] = [
  { id: "ENFANTS", label: "Enfants" },
  { id: "ADOLESCENTS", label: "Adolescents" },
  { id: "ADULTES", label: "Adultes" },
  { id: "SENIORS", label: "Seniors" },
  { id: "HANDICAP_MOTEUR", label: "Handicap moteur" },
  { id: "HANDICAP_MENTAL", label: "Handicap mental" },
  { id: "HANDICAP_PSYCHIQUE", label: "Handicap psychique" },
  { id: "TSA", label: "TSA (autisme)" },
  { id: "TRISOMIE_21", label: "Trisomie 21" },
  { id: "MNA", label: "MNA" },
  { id: "PRECARITE", label: "Précarité / exclusion" },
  { id: "ADDICTOLOGIE", label: "Addictologie" },
  { id: "MILIEU_CARCERAL", label: "Milieu carcéral" },
  { id: "FAMILLES", label: "Familles" },
  { id: "PROFESSIONNELS", label: "Professionnels" },
  { id: "AUTRE", label: "Autre public" },
];

export type PricingType = "SESSION" | "PER_PARTICIPANT" | "QUOTE";

export interface PricingTypeOption {
  id: PricingType;
  label: string;
  description: string;
}

export const PRICING_TYPE_OPTIONS: PricingTypeOption[] = [
  {
    id: "SESSION",
    label: "Forfait séance",
    description: "Prix fixe par intervention, quel que soit le nombre de participants",
  },
  {
    id: "PER_PARTICIPANT",
    label: "Par participant",
    description: "Prix calculé selon le nombre de participants effectifs",
  },
  {
    id: "QUOTE",
    label: "Sur devis",
    description: "Le tarif est défini après échange avec l'établissement",
  },
];

export const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2h" },
  { value: 150, label: "2h30" },
  { value: 180, label: "3h" },
  { value: 210, label: "3h30" },
  { value: 240, label: "4h" },
  { value: 300, label: "5h" },
  { value: 360, label: "6h" },
  { value: 420, label: "7h" },
  { value: 480, label: "Journée complète (8h)" },
];

export interface ServiceSlot {
  date: string; // ISO date string
  heureDebut: string; // "HH:mm"
  heureFin: string; // "HH:mm"
}

export const MAX_SERVICE_SLOTS = 10;

export function getCategoryLabel(id: string): string {
  return ATELIER_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function getPublicCibleLabels(ids: string[]): string[] {
  return ids.map((id) => PUBLIC_CIBLE_OPTIONS.find((p) => p.id === id)?.label ?? id);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
