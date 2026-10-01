/**
 * LA BANQUE DE RESSOURCES GRATUITES (01/10/2026, décision de Siham).
 *
 * Fiches activité, trames d'écrits, affiches, présentations et fiches
 * pratiques, téléchargeables sans compte. C'est ce qui attire ; LEX est ce
 * qui se paie : sous chaque ressource, « Adapter avec LEX » ouvre la tâche
 * déjà réglée (`lib/lex-taches.ts`). La fiche standard est gratuite, la
 * version adaptée à votre groupe coûte un crédit.
 *
 * ⚠ RÈGLES DE CETTE LISTE :
 *   - chaque fichier existe dans `public/` (le test `ressources.test.ts` le vérifie) ;
 *   - textes originaux ADéPA, exemples fictifs, aucune image tierce ;
 *   - aucun e-mail exigé pour télécharger ;
 *   - les PDF de `public/ressources/` sont produits par
 *     `scripts/ressources/gen.js` à partir de `scripts/ressources/contenu.js`.
 */
import type { MetierLex } from "./lex-taches";

export type CategorieRessource = "activites" | "ecrits" | "affiches" | "presentations" | "accompagner";

export const CATEGORIES_RESSOURCES: { id: CategorieRessource; titre: string; texte: string }[] = [
  {
    id: "activites",
    titre: "Activités prêtes à l’emploi",
    texte: "Objectifs observables, déroulé minuté, variantes et points de vigilance, sur une page.",
  },
  {
    id: "ecrits",
    titre: "Trames et mémos d’écrits",
    texte: "Des trames à remplir et des mémos avec des exemples fictifs avant / après.",
  },
  {
    id: "affiches",
    titre: "Affiches à imprimer",
    texte: "Des supports à afficher et à compléter avec le groupe.",
  },
  {
    id: "presentations",
    titre: "Présentations à compléter",
    texte: "Des diaporamas guidés pour une réunion avec les familles ou l’accueil d’un bénévole.",
  },
  {
    id: "accompagner",
    titre: "Fiches pratiques : comprendre et accompagner",
    texte: "Les fiches récapitulatives des parcours de l’association ADéPA, une page chacune.",
  },
];

export interface Ressource {
  id: string;
  titre: string;
  description: string;
  categorie: CategorieRessource;
  /** Thème affiché sur la carte. */
  theme: string;
  format: string;
  fichier: string;
  apercu: string;
  metiers: MetierLex[];
  lex?: { outil: string; libelle: string; valeurs?: Record<string, string> };
}

const TOUS: MetierLex[] = ["education", "animation", "protection", "handicap", "social", "associatif"];
const EDUC: MetierLex[] = ["education", "protection", "handicap", "social"];

const nouvelle = (r: Omit<Ressource, "fichier" | "apercu">): Ressource => ({
  ...r,
  fichier: `/ressources/${r.id}.pdf`,
  apercu: `/ressources/apercus/${r.id}.jpg`,
});

const fiche = (
  id: string,
  titre: string,
  theme: string,
  description: string,
  lex?: Ressource["lex"],
): Ressource => ({
  id,
  titre,
  description,
  categorie: "accompagner",
  theme,
  format: "Fiche récap A4 · 1 page",
  fichier: `/fiches/${id}.pdf`,
  apercu: `/ressources/apercus/${id}.jpg`,
  metiers: EDUC,
  lex,
});

const ADAPTER = { outil: "adapter", libelle: "Adapter à mon groupe avec LEX" };
const FACTUEL = { outil: "factuel", libelle: "Rendre mon écrit plus factuel avec LEX" };

export const RESSOURCES: Ressource[] = [
  // ── Activités ────────────────────────────────────────────────────────────
  nouvelle({
    id: "activite-noeud-humain",
    titre: "Le nœud humain : coopérer en 20 minutes",
    description: "Un jeu de coopération sans matériel, avec une variante sans contact et un rôle pour qui ne veut pas parler.",
    categorie: "activites",
    theme: "Coopération",
    format: "Fiche activité A4 · 1 page",
    metiers: TOUS,
    lex: {
      ...ADAPTER,
      valeurs: { objectif: "coopérer", public: "8 adolescents de 13 à 15 ans", duree: "20 minutes", options: "salle intérieure, sans matériel" },
    },
  }),
  nouvelle({
    id: "activite-meteo-du-jour",
    titre: "La météo du jour : un rituel d’accueil",
    description: "Dix minutes pour que chacun dise comment il arrive, et repérer qui aura besoin d’un temps seul.",
    categorie: "activites",
    theme: "Accueil",
    format: "Fiche activité A4 · 1 page",
    metiers: ["education", "animation", "protection", "handicap"],
    lex: {
      ...ADAPTER,
      valeurs: { objectif: "accueillir chacun et repérer qui a besoin d’un temps seul", public: "6 enfants de 6 à 9 ans", duree: "10 minutes" },
    },
  }),
  nouvelle({
    id: "activite-grand-jeu-cinq-iles",
    titre: "Grand jeu : le trésor des cinq îles",
    description: "Un grand jeu de coopération pour 20 à 30 enfants, avec ses épreuves, ses règles à lire et son repli en salle.",
    categorie: "activites",
    theme: "Grand jeu",
    format: "Fiche grand jeu A4 · 1 page",
    metiers: ["animation", "associatif", "education"],
    lex: {
      outil: "grandjeu",
      libelle: "Créer mon grand jeu avec LEX",
      valeurs: { objectif: "coopérer en équipe", public: "24 enfants de 8 à 12 ans", duree: "1 h 30", options: "extérieur, repli possible en salle" },
    },
  }),
  nouvelle({
    id: "activite-brochettes-de-fruits",
    titre: "Atelier cuisine : les brochettes de fruits",
    description: "Une activité sans cuisson en six étapes affichées, pour les participants qui s’appuient sur des repères visuels.",
    categorie: "activites",
    theme: "Cuisine sans cuisson",
    format: "Fiche activité A4 · 1 page",
    metiers: ["education", "handicap", "animation", "protection"],
    lex: {
      ...ADAPTER,
      valeurs: { objectif: "suivre une séquence d’étapes et en faire une seul", public: "5 enfants de 7 à 10 ans", duree: "45 minutes", options: "table, sans cuisson" },
    },
  }),
  nouvelle({
    id: "activite-boite-a-sons",
    titre: "La boîte à sons : un retour au calme",
    description: "Quinze minutes d’écoute pour faire redescendre un groupe, avec des variantes pour qui supporte mal le bruit.",
    categorie: "activites",
    theme: "Retour au calme",
    format: "Fiche activité A4 · 1 page",
    metiers: ["education", "animation", "handicap", "protection"],
    lex: {
      outil: "groupe",
      libelle: "Adapter à mon groupe avec LEX",
      valeurs: { objectif: "revenir au calme", public: "12 enfants de 6 à 10 ans", duree: "15 minutes" },
    },
  }),

  // ── Écrits ───────────────────────────────────────────────────────────────
  nouvelle({
    id: "trame-note-observation",
    titre: "Trame : note d’observation",
    description: "Les faits, les paroles rapportées et les hypothèses, chacun dans sa case, avec le test de la caméra.",
    categorie: "ecrits",
    theme: "Observer et écrire",
    format: "Trame A4 · 1 page",
    metiers: ["education", "protection", "handicap", "animation", "social"],
    lex: { outil: "observation", libelle: "Transformer mes notes avec LEX" },
  }),
  nouvelle({
    id: "trame-transmission",
    titre: "Trame : transmission à l’équipe suivante",
    description: "À savoir, à faire, points de vigilance : deux transmissions par page, à lire en trente secondes.",
    categorie: "ecrits",
    theme: "Transmettre",
    format: "Trame A4 · 2 par page",
    metiers: ["education", "protection", "handicap", "animation"],
    lex: { outil: "transmission", libelle: "Écrire ma transmission avec LEX" },
  }),
  nouvelle({
    id: "trame-compte-rendu-reunion",
    titre: "Trame : compte rendu de réunion",
    description: "Présents, points abordés, décisions, et le tableau « qui fait quoi, pour quand ».",
    categorie: "ecrits",
    theme: "Réunions",
    format: "Trame A4 · 1 page",
    metiers: TOUS,
    lex: { outil: "reunion", libelle: "Passer de mes notes au compte rendu avec LEX" },
  }),
  nouvelle({
    id: "trame-bilan-action",
    titre: "Trame : bilan d’une action",
    description: "Prévu et réalisé, participation en chiffres réels, effets constatés : pour le bureau ou le financeur.",
    categorie: "ecrits",
    theme: "Associations",
    format: "Trame A4 · 1 page",
    metiers: ["associatif", "social", "animation"],
    lex: { outil: "bilan", libelle: "Préparer mon bilan avec LEX" },
  }),
  nouvelle({
    id: "memo-faits-jugements",
    titre: "Mémo : faits, hypothèses ou jugements ?",
    description: "Huit phrases reprises, avant / après, et trois réflexes pour décrire sans juger. Exemples fictifs.",
    categorie: "ecrits",
    theme: "Observer et écrire",
    format: "Mémo A4 · 1 page",
    metiers: TOUS,
    lex: FACTUEL,
  }),
  nouvelle({
    id: "memo-objectifs-observables",
    titre: "Mémo : écrire un objectif qu’on peut observer",
    description: "La formule, les verbes qu’on peut voir et ceux qu’on ne peut pas voir, cinq objectifs repris.",
    categorie: "ecrits",
    theme: "Projet et objectifs",
    format: "Mémo A4 · 1 page",
    metiers: TOUS,
    lex: { outil: "objectifs", libelle: "Travailler mes objectifs avec LEX" },
  }),

  // ── Affiches ─────────────────────────────────────────────────────────────
  nouvelle({
    id: "affiche-regles-de-vie",
    titre: "Affiche : nos règles de vie",
    description: "Six règles décidées avec le groupe, écrites comme ce qu’on fait, et signées par tous.",
    categorie: "affiches",
    theme: "Vie de groupe",
    format: "Affiche A4",
    metiers: ["education", "animation", "protection", "handicap"],
    lex: {
      outil: "groupe",
      libelle: "Préparer la séance des règles avec LEX",
      valeurs: { objectif: "écrire nos règles de vie ensemble", duree: "30 minutes" },
    },
  }),
  nouvelle({
    id: "affiche-etapes-de-ma-journee",
    titre: "Affiche : les étapes de ma journée",
    description: "Huit cases à remplir avec une heure, un mot et un dessin, et une case à cocher pour chaque étape.",
    categorie: "affiches",
    theme: "Repères",
    format: "Affiche A4",
    metiers: ["education", "handicap", "protection"],
  }),
  nouvelle({
    id: "affiche-comment-je-me-sens",
    titre: "Affiche : comment je me sens ?",
    description: "Une échelle en cinq niveaux, chacun avec ce qui aide. À adapter avec la personne.",
    categorie: "affiches",
    theme: "Émotions",
    format: "Affiche A4",
    metiers: ["education", "handicap", "protection", "animation"],
  }),

  // ── Présentations ────────────────────────────────────────────────────────
  nouvelle({
    id: "presentation-atelier-familles",
    titre: "Présenter un atelier aux familles",
    description: "Six diapositives guidées : pourquoi, comment, une séance type, ce qu’on attend des familles, les contacts.",
    categorie: "presentations",
    theme: "Familles",
    format: "Présentation A4 paysage · 6 pages",
    metiers: ["education", "animation", "handicap", "protection", "associatif"],
    lex: { outil: "clair", libelle: "Rendre mon texte plus clair avec LEX" },
  }),
  nouvelle({
    id: "presentation-accueil-benevole",
    titre: "Accueillir un nouveau bénévole",
    description: "Six diapositives guidées : l’association, le rôle, les règles, les contacts et la première semaine.",
    categorie: "presentations",
    theme: "Bénévoles",
    format: "Présentation A4 paysage · 6 pages",
    metiers: ["associatif", "social", "animation"],
    lex: { outil: "clair", libelle: "Rendre mon texte plus clair avec LEX" },
  }),

  // ── Fiches pratiques ADéPA (déjà publiées dans /fiches) ──────────────────
  fiche("les-quatre-fonctions-d-un-comportement", "Les quatre fonctions d’un comportement", "Comprendre le comportement", "Ce qu’un comportement permet d’obtenir ou d’éviter, et comment le repérer."),
  fiche("apprendre-a-demander-plutot-qu-a-crier", "Apprendre à demander plutôt qu’à crier", "Comprendre le comportement", "Enseigner une autre façon d’obtenir ce dont on a besoin."),
  fiche("lire-un-comportement-comme-une-reaction-de-survie", "Lire un comportement comme une réaction de survie", "Comprendre le comportement", "Quand le comportement protège : le lire autrement pour mieux répondre."),
  fiche("guider-puis-s-effacer", "Guider, puis s’effacer", "Apprentissages et autonomie", "Donner juste l’aide nécessaire, puis la retirer pas à pas.", ADAPTER),
  fiche("decomposer-une-routine-en-etapes", "Décomposer une routine en étapes", "Apprentissages et autonomie", "Découper une tâche du quotidien pour qu’elle s’apprenne.", ADAPTER),
  fiche("aider-a-demarrer-une-tache", "Aider quelqu’un à démarrer une tâche", "Apprentissages et autonomie", "Ce qui bloque le départ, et ce qui aide à se lancer.", ADAPTER),
  fiche("rendre-l-environnement-previsible", "Rendre l’environnement prévisible", "Environnement et repères", "Des repères de temps et de lieu qui réduisent l’inquiétude.", ADAPTER),
  fiche("les-premieres-minutes-d-une-crise", "Les premières minutes d’une crise", "Moments difficiles", "Ce qu’on fait, et ce qu’on évite, quand la tension monte."),
  fiche("l-enfant-qui-dit-non-a-tout", "L’enfant qui dit non à tout", "Moments difficiles", "Sortir du bras de fer sans renoncer au cadre."),
  fiche("renforcer-ce-qui-va", "Renforcer ce qui va", "Comportements-défis et opposition", "Remarquer et encourager ce qui fonctionne déjà."),
  fiche("decrire-un-comportement-sans-le-juger", "Décrire un comportement sans le juger", "Observer et écrire", "Le test de la caméra et la grille en trois colonnes.", FACTUEL),
  fiche("mesurer-un-comportement-ligne-de-base", "Mesurer un comportement : ligne de base et courbe", "Observer et écrire", "Compter avant d’agir, pour savoir si ça change vraiment."),
  fiche("resoudre-un-probleme-avec-la-personne", "Résoudre un problème avec la personne", "Observer et écrire", "Chercher la solution avec elle plutôt que contre elle."),
  fiche("preparer-une-equipe-de-suivi-de-la-scolarisation", "Préparer une équipe de suivi de la scolarisation", "Parcours et institutions", "Arriver préparé à l’ESS, puis suivre ce qui a été décidé."),
  {
    id: "toutes-les-fiches-recap",
    titre: "Toutes les fiches pratiques en un seul PDF",
    description: "Les quatorze fiches récapitulatives réunies, à imprimer ou à partager en équipe.",
    categorie: "accompagner",
    theme: "Recueil",
    format: "Recueil PDF",
    fichier: "/fiches/toutes-les-fiches-recap.pdf",
    apercu: "/ressources/apercus/les-quatre-fonctions-d-un-comportement.jpg",
    metiers: EDUC,
  },
];
