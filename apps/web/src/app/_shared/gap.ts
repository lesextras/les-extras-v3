// Types partagés du GAP (Groupe d'Analyse de Pratique) — miroir des DTO de l'API.
export interface QuestionCard {
  id: string;
  title: string;
  extrait: string;
  metier: string;
  publicVise: string;
  status: "OUVERTE" | "RESOLUE" | "FERMEE";
  views: number;
  nbReponses: number;
  auteur: string;
  estMienne: boolean;
  createdAt: string;
}

export interface Reponse {
  id: string;
  content: string;
  retenue: boolean;
  auteur: string;
  votes: number;
  aVote: boolean;
  estMienne: boolean;
  createdAt: string;
}

export interface QuestionDetail {
  id: string;
  title: string;
  situation: string;
  tente?: string | null;
  metier: string;
  publicVise: string;
  status: "OUVERTE" | "RESOLUE" | "FERMEE";
  views: number;
  auteur: string;
  estMienne: boolean;
  createdAt: string;
  reponses: Reponse[];
}

export interface ListeQuestions {
  items: QuestionCard[];
  total: number;
  sansReponse: number;
  metiers: { valeur: string; nb: number }[];
  publics: { valeur: string; nb: number }[];
}

export const METIERS = [
  "Éducateur spécialisé",
  "Moniteur-éducateur",
  "AES / AMP",
  "Éducateur de jeunes enfants",
  "Assistant de service social",
  "Psychologue",
  "Infirmier",
  "Aide-soignant",
  "Animateur",
  "Chef de service / Direction",
  "Art-thérapeute / Intervenant spécialisé",
  "Autre",
];

export const PUBLICS = [
  "Enfance et protection de l’enfance",
  "Adolescents",
  "Handicap mental et psychique",
  "Handicap moteur et polyhandicap",
  "Troubles du spectre autistique",
  "Adultes en insertion",
  "Grand âge et EHPAD",
  "Addictologie",
  "Public mixte",
];
