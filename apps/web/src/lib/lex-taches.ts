/**
 * LES TROIS TÂCHES DE LEX (01/10/2026, décision de Siham).
 *
 * Source unique pour l'écran `LexQuotidien` et pour les boutons « Adapter
 * avec LEX » des ressources gratuites (`lib/ressources.ts`) : un lien de
 * ressource désigne un `outil` d'ici, jamais un texte libre.
 *
 * ⚠ Le métier change les écrits proposés et les exemples, jamais le moteur.
 * ⚠ Les identifiants de trame sont ceux de l'enum Prisma `AssistantTrame`.
 */

export type MetierLex = "education" | "animation" | "protection" | "handicap" | "social" | "associatif";
export type TacheLex = "activite" | "ameliorer" | "notes";

export const METIERS_LEX: { id: MetierLex; label: string }[] = [
  { id: "education", label: "Éducation" },
  { id: "animation", label: "Animation" },
  { id: "protection", label: "Protection de l’enfance" },
  { id: "handicap", label: "Handicap" },
  { id: "social", label: "Social" },
  { id: "associatif", label: "Associatif" },
];

const TOUS: MetierLex[] = METIERS_LEX.map((m) => m.id);

export const TACHES_LEX: { id: TacheLex; titre: string; sousTitre: string }[] = [
  {
    id: "activite",
    titre: "Préparer ou adapter une activité",
    sousTitre: "Une fiche modifiable, cohérente avec la durée, le lieu et le matériel.",
  },
  {
    id: "ameliorer",
    titre: "Améliorer mon écrit",
    sousTitre: "La version proposée, les formulations à vérifier, des questions si une information manque.",
  },
  {
    id: "notes",
    titre: "Transformer mes notes en compte rendu",
    sousTitre: "Faits, décisions, points à compléter et prochaines étapes.",
  },
];

export interface ChampLex {
  id: string;
  label: string;
  exemple: string;
  requis?: boolean;
  /** Longueur minimale attendue par l'API quand le champ est requis. */
  min?: number;
  long?: boolean;
}

export interface OutilLex {
  id: string;
  tache: TacheLex;
  label: string;
  description: string;
  metiers: MetierLex[];
  champs: ChampLex[];
  /** Tâche « notes » : la trame d'écrit envoyée à /assistant/generer. */
  trame?: string;
  /** Tâche « notes » sur l'écrit libre : le nom du document. */
  intitule?: string;
  /** Tâche « améliorer » : le but envoyé à /assistant/ameliorer. */
  but?: "clair" | "factuel" | "court" | "objectifs";
  /** Tâche « activité » : la précision ajoutée à la demande. */
  consigne?: string;
}

const CHAMPS_ACTIVITE: ChampLex[] = [
  { id: "objectif", label: "Objectif", exemple: "ex. coopérer, se faire confiance", requis: true, min: 3 },
  { id: "public", label: "Âge et nombre de participants", exemple: "ex. 8 adolescents de 13 à 15 ans", requis: true, min: 3 },
  { id: "duree", label: "Durée", exemple: "ex. 20 minutes" },
  {
    id: "options",
    label: "Lieu, matériel, adaptations",
    exemple: "ex. salle intérieure, sans matériel, possibilité de participer sans parler devant le groupe",
    long: true,
  },
];

const CHAMPS_NOTES: ChampLex[] = [
  {
    id: "notes",
    label: "Vos notes, en vrac",
    exemple: "Écrivez comme ça vient : qui, quoi, quand, ce qui a été dit, ce qui a été décidé…",
    requis: true,
    min: 20,
    long: true,
  },
  { id: "dest", label: "Pour qui ?", exemple: "ex. l’équipe, la direction, le bureau de l’association" },
];

const CHAMPS_TEXTE: ChampLex[] = [
  { id: "texte", label: "Votre texte", exemple: "Collez ici l’écrit à améliorer", requis: true, min: 20, long: true },
];

export const OUTILS_LEX: OutilLex[] = [
  // ── Activité ─────────────────────────────────────────────────────────────
  {
    id: "groupe",
    tache: "activite",
    label: "Activité de groupe",
    description: "Objectifs, matériel, déroulé, points de vigilance et ce qu’on observe.",
    metiers: TOUS,
    champs: CHAMPS_ACTIVITE,
    consigne: "Activité de groupe.",
  },
  {
    id: "adapter",
    tache: "activite",
    label: "Adapter une activité aux besoins",
    description: "Les consignes et les façons de participer ajustées aux besoins que vous décrivez, sans rien déduire d’un diagnostic.",
    metiers: TOUS,
    champs: [
      ...CHAMPS_ACTIVITE.slice(0, 3),
      {
        id: "besoins",
        label: "Les besoins à prendre en compte",
        exemple: "ex. deux enfants qui ont besoin de repères visuels, un jeune qui se fatigue vite",
        requis: true,
        min: 10,
        long: true,
      },
      CHAMPS_ACTIVITE[3],
    ],
  },
  {
    id: "grandjeu",
    tache: "activite",
    label: "Grand jeu ou veillée",
    description: "Un imaginaire, des règles simples, le rôle de l’équipe et la sécurité.",
    metiers: ["animation"],
    champs: CHAMPS_ACTIVITE,
    consigne: "Grand jeu ou veillée en accueil collectif de mineurs, avec un imaginaire, des règles simples à lire aux enfants et le rôle de chaque animateur.",
  },
  {
    id: "collective",
    tache: "activite",
    label: "Action collective",
    description: "Une séance type, avec son objectif, son déroulé et ce que l’on observe pour suivre l’action.",
    metiers: ["social", "associatif", "protection"],
    champs: CHAMPS_ACTIVITE,
    consigne: "Action collective (séance type d’un cycle), avec les partenaires possibles.",
  },

  // ── Améliorer ────────────────────────────────────────────────────────────
  {
    id: "clair",
    tache: "ameliorer",
    label: "Plus clair",
    description: "Des phrases plus simples, le même sens, rien d’ajouté.",
    metiers: TOUS,
    champs: CHAMPS_TEXTE,
    but: "clair",
  },
  {
    id: "factuel",
    tache: "ameliorer",
    label: "Plus factuel",
    description: "Les jugements sont signalés et reformulés en faits ou en hypothèses, sans transformer une appréciation en fait observé.",
    metiers: TOUS,
    champs: CHAMPS_TEXTE,
    but: "factuel",
  },
  {
    id: "court",
    tache: "ameliorer",
    label: "Plus court",
    description: "Le même contenu, en moins de mots.",
    metiers: TOUS,
    champs: CHAMPS_TEXTE,
    but: "court",
  },
  {
    id: "objectifs",
    tache: "ameliorer",
    label: "Objectifs observables",
    description: "Chaque objectif avec un verbe d’action et un critère, présenté « à confirmer par l’équipe ».",
    metiers: TOUS,
    champs: CHAMPS_TEXTE,
    but: "objectifs",
  },

  // ── Notes en compte rendu ────────────────────────────────────────────────
  {
    id: "reunion",
    tache: "notes",
    label: "Réunion",
    description: "Présents, points abordés, décisions, qui fait quoi et pour quand.",
    metiers: TOUS,
    champs: CHAMPS_NOTES,
    trame: "SYNTHESE_REUNION",
  },
  {
    id: "intervention",
    tache: "notes",
    label: "Activité ou intervention",
    description: "Ce qui a été fait, comment le groupe a réagi, et la suite proposée.",
    metiers: TOUS,
    champs: CHAMPS_NOTES,
    trame: "COMPTE_RENDU_ATELIER",
  },
  {
    id: "bilan",
    tache: "notes",
    label: "Bilan d’action",
    description: "Ce qui a été réalisé, la participation et les effets constatés, sans inventer d’impact.",
    metiers: TOUS,
    champs: CHAMPS_NOTES,
    trame: "ECRIT_LIBRE",
    intitule: "Bilan d’action",
  },
  {
    id: "observation",
    tache: "notes",
    label: "Note d’observation",
    description: "Les faits, les paroles rapportées et vos hypothèses, chacun à sa place.",
    metiers: ["education", "protection", "handicap", "animation", "social"],
    champs: CHAMPS_NOTES,
    trame: "NOTE_OBSERVATION",
  },
  {
    id: "transmission",
    tache: "notes",
    label: "Transmission",
    description: "L’essentiel pour l’équipe suivante, à lire en trente secondes.",
    metiers: ["education", "protection", "handicap", "animation"],
    champs: CHAMPS_NOTES,
    trame: "TRANSMISSION",
  },
];

export function outilsPour(tache: TacheLex, metier: MetierLex): OutilLex[] {
  return OUTILS_LEX.filter((o) => o.tache === tache && o.metiers.includes(metier));
}

/** Les champs qu'un lien de ressource peut préremplir : des réglages, jamais des notes. */
export const CHAMPS_PREREMPLISSABLES = ["objectif", "public", "duree", "options"] as const;

/** Le lien qui ouvre LEX sur une tâche déjà réglée. */
export function lienLex(outil: string, valeurs: Partial<Record<(typeof CHAMPS_PREREMPLISSABLES)[number], string>> = {}): string {
  const p = new URLSearchParams({ outil });
  for (const c of CHAMPS_PREREMPLISSABLES) if (valeurs[c]) p.set(c, valeurs[c] as string);
  return `/dashboard/assistant?${p.toString()}`;
}
