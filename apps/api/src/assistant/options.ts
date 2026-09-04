/**
 * Les listes de choix de LEX.
 *
 * Un professionnel qui n'a pas le temps d'écrire un paragraphe doit pouvoir
 * cadrer sa demande en trois clics. Ces listes sont le troisième chemin
 * d'entrée du studio, à côté du formulaire libre et de l'import d'un écrit
 * existant : on coche, LEX comprend.
 *
 * Elles sont volontairement courtes et écrites dans le vocabulaire du terrain.
 * Une liste qu'on ne peut pas lire d'un coup d'œil n'est pas cochée, elle est
 * sautée.
 *
 * Rien ici ne décide à la place du professionnel : ces choix orientent la
 * forme, le cadre et le destinataire — jamais le contenu clinique, jamais
 * l'orientation d'une personne accompagnée.
 */

export interface ChoixLex {
  /** Identifiant stable, seul élément qui transite entre l'interface et l'API. */
  readonly cle: string;
  readonly libelle: string;
}

export interface GroupeChoix {
  readonly cle: string;
  readonly titre: string;
  /** Une phrase qui dit à quoi sert le groupe, affichée sous le titre. */
  readonly aide: string;
  /** Faux = un seul choix possible. */
  readonly multiple: boolean;
  /** Au-delà, la consigne devient contradictoire et la sortie se dilue. */
  readonly max: number;
  readonly choix: readonly ChoixLex[];
}

// ─────────────────────────────────────────────────────────────
// Générateur d'activités
// ─────────────────────────────────────────────────────────────

const MEDIATIONS: GroupeChoix = {
  cle: 'mediations',
  titre: 'Supports envisagés',
  aide: 'Le matériau de l’activité. Laissez vide si vous voulez que LEX propose.',
  multiple: true,
  max: 4,
  choix: [
    { cle: 'sport-adapte', libelle: 'Sport adapté' },
    { cle: 'jeu-cooperatif', libelle: 'Jeu coopératif' },
    { cle: 'arts-plastiques', libelle: 'Arts plastiques' },
    { cle: 'musique', libelle: 'Musique' },
    { cle: 'expression-theatre', libelle: 'Expression, théâtre' },
    { cle: 'ecriture', libelle: 'Écriture' },
    { cle: 'cuisine', libelle: 'Cuisine' },
    { cle: 'nature-jardinage', libelle: 'Nature, jardinage' },
    { cle: 'mediation-animale', libelle: 'Médiation animale' },
    { cle: 'numerique', libelle: 'Numérique' },
    { cle: 'relaxation', libelle: 'Relaxation, respiration' },
    { cle: 'groupe-de-parole', libelle: 'Groupe de parole' },
    { cle: 'sortie', libelle: 'Sortie extérieure' },
    { cle: 'bricolage', libelle: 'Bricolage, manuel' },
  ],
};

const COMPETENCES: GroupeChoix = {
  cle: 'competences',
  titre: 'Ce qu’on cherche à travailler',
  aide: 'Deux ou trois suffisent : une activité qui vise tout ne vise rien.',
  multiple: true,
  max: 4,
  choix: [
    { cle: 'estime-de-soi', libelle: 'Estime de soi' },
    { cle: 'emotions', libelle: 'Reconnaître et dire ses émotions' },
    { cle: 'cooperation', libelle: 'Coopérer avec les autres' },
    { cle: 'communication', libelle: 'Communiquer, se faire comprendre' },
    { cle: 'autonomie', libelle: 'Autonomie du quotidien' },
    { cle: 'cadre-et-regles', libelle: 'Tenir un cadre, des règles' },
    { cle: 'concentration', libelle: 'Attention, concentration' },
    { cle: 'motricite', libelle: 'Motricité, schéma corporel' },
    { cle: 'gestion-du-conflit', libelle: 'Gérer un conflit sans violence' },
    { cle: 'reperes-temporels', libelle: 'Repères de temps et d’espace' },
    { cle: 'hygiene-sante', libelle: 'Hygiène, santé, sommeil' },
    { cle: 'ouverture-culturelle', libelle: 'Ouverture culturelle' },
  ],
};

const CADRE_ACTIVITE: GroupeChoix = {
  cle: 'cadre',
  titre: 'Contraintes du terrain',
  aide: 'Ce qui doit être vrai pour que l’activité soit faisable demain matin.',
  multiple: true,
  max: 5,
  choix: [
    { cle: 'interieur', libelle: 'En intérieur' },
    { cle: 'exterieur', libelle: 'En extérieur' },
    { cle: 'sans-materiel', libelle: 'Sans matériel' },
    { cle: 'budget-nul', libelle: 'Budget nul' },
    { cle: 'petit-espace', libelle: 'Petit espace' },
    { cle: 'effectif-variable', libelle: 'Effectif qui varie' },
    { cle: 'mobilite-reduite', libelle: 'Mobilité réduite' },
    { cle: 'temps-court', libelle: 'Moins de 45 minutes' },
    { cle: 'sans-lecture-ecriture', libelle: 'Sans lecture ni écriture' },
    { cle: 'un-seul-encadrant', libelle: 'Un seul encadrant' },
  ],
};

export const GROUPES_ACTIVITE: readonly GroupeChoix[] = [MEDIATIONS, COMPETENCES, CADRE_ACTIVITE];

// ─────────────────────────────────────────────────────────────
// Écrits professionnels
// ─────────────────────────────────────────────────────────────

const DESTINATAIRE: GroupeChoix = {
  cle: 'destinataire',
  titre: 'Pour qui l’écrit est-il rédigé ?',
  aide: 'Le destinataire change tout : le niveau de détail, le vocabulaire, ce qui se dit et ce qui ne se dit pas.',
  multiple: false,
  max: 1,
  choix: [
    { cle: 'equipe', libelle: 'L’équipe, en interne' },
    { cle: 'direction', libelle: 'La direction' },
    { cle: 'famille', libelle: 'La famille ou le représentant légal' },
    { cle: 'ase', libelle: 'L’aide sociale à l’enfance' },
    { cle: 'juge', libelle: 'Le juge des enfants' },
    { cle: 'mdph', libelle: 'La MDPH' },
    { cle: 'partenaire', libelle: 'Un partenaire extérieur' },
  ],
};

const REGISTRE: GroupeChoix = {
  cle: 'registre',
  titre: 'Registre',
  aide: 'La façon de dire, pas ce qui est dit.',
  multiple: false,
  max: 1,
  choix: [
    { cle: 'factuel', libelle: 'Strictement factuel' },
    { cle: 'synthetique', libelle: 'Synthétique, va à l’essentiel' },
    { cle: 'argumente', libelle: 'Argumenté, appuyé sur des observations' },
    { cle: 'pedagogique', libelle: 'Pédagogique, accessible à un non-professionnel' },
  ],
};

const SECTIONS: GroupeChoix = {
  cle: 'sections',
  titre: 'Parties à faire figurer',
  aide: 'Si vous ne cochez rien, LEX suit le plan habituel de la trame choisie.',
  multiple: true,
  max: 6,
  choix: [
    { cle: 'contexte', libelle: 'Contexte, rappel de la situation' },
    { cle: 'faits', libelle: 'Faits observés, datés' },
    { cle: 'paroles', libelle: 'Paroles rapportées' },
    { cle: 'analyse', libelle: 'Analyse professionnelle' },
    { cle: 'moyens', libelle: 'Moyens mis en œuvre' },
    { cle: 'evolution', libelle: 'Évolution depuis le dernier écrit' },
    { cle: 'preconisations', libelle: 'Préconisations' },
    { cle: 'suites', libelle: 'Suites à donner, échéances' },
  ],
};

const LONGUEUR: GroupeChoix = {
  cle: 'longueur',
  titre: 'Longueur visée',
  aide: 'Un ordre de grandeur, pas un couperet.',
  multiple: false,
  max: 1,
  choix: [
    { cle: 'bref', libelle: 'Bref, une demi-page' },
    { cle: 'standard', libelle: 'Standard, une page' },
    { cle: 'detaille', libelle: 'Détaillé, deux pages' },
  ],
};

export const GROUPES_ECRIT: readonly GroupeChoix[] = [DESTINATAIRE, REGISTRE, SECTIONS, LONGUEUR];

// ─────────────────────────────────────────────────────────────
// Appui scolaire
// ─────────────────────────────────────────────────────────────

const SUPPORTS_APPUI: GroupeChoix = {
  cle: 'supports',
  titre: 'Ce qu’on veut en sortir',
  aide: 'Le livrable, pas la méthode. Un support qu’on peut imprimer et poser sur la table.',
  multiple: true,
  max: 3,
  choix: [
    { cle: 'fiche-memo', libelle: 'Fiche mémo visuelle' },
    { cle: 'carte-mentale', libelle: 'Carte mentale' },
    { cle: 'script-de-deblocage', libelle: 'Script pour débloquer l’enfant' },
    { cle: 'jeu-de-revision', libelle: 'Jeu de révision' },
    { cle: 'plan-de-seance', libelle: 'Plan de séance' },
    { cle: 'exercices-progressifs', libelle: 'Exercices progressifs' },
    { cle: 'checklist', libelle: 'Checklist d’organisation' },
    { cle: 'rituel-court', libelle: 'Rituel de 5 minutes' },
  ],
};

const OBSTACLES: GroupeChoix = {
  cle: 'obstacles',
  titre: 'Ce qui bloque, tel qu’on l’observe',
  aide: 'Ce que vous voyez, pas un diagnostic : LEX n’en pose aucun et n’en posera jamais.',
  multiple: true,
  max: 3,
  choix: [
    { cle: 'dechiffrage', libelle: 'Déchiffrage, lecture' },
    { cle: 'comprehension-consigne', libelle: 'Comprendre la consigne' },
    { cle: 'memorisation', libelle: 'Mémorisation' },
    { cle: 'attention', libelle: 'Attention, tenir en place' },
    { cle: 'motivation', libelle: 'Motivation, sens du travail' },
    { cle: 'confiance', libelle: 'Confiance, peur de l’erreur' },
    { cle: 'organisation', libelle: 'Organisation, matériel' },
    { cle: 'ecriture', libelle: 'Écriture, geste' },
    { cle: 'calcul', libelle: 'Calcul, nombres' },
    { cle: 'gestion-du-temps', libelle: 'Gestion du temps' },
  ],
};

const POSTURE: GroupeChoix = {
  cle: 'posture',
  titre: 'Comment ça se passe',
  aide: 'Le cadre de l’accompagnement change complètement le support à produire.',
  multiple: false,
  max: 1,
  choix: [
    { cle: 'individuel', libelle: 'En individuel' },
    { cle: 'petit-groupe', libelle: 'En petit groupe' },
    { cle: 'autonomie', libelle: 'L’enfant seul, en autonomie' },
    { cle: 'avec-la-famille', libelle: 'Avec la famille' },
  ],
};

export const GROUPES_APPUI: readonly GroupeChoix[] = [SUPPORTS_APPUI, OBSTACLES, POSTURE];

// ─────────────────────────────────────────────────────────────
// Du choix coché à la consigne
// ─────────────────────────────────────────────────────────────

/**
 * Traduit les clés cochées en libellés, en écartant en silence tout ce qui
 * n'appartient pas au catalogue. Une clé inconnue vient d'une interface
 * périmée ou d'un appel bricolé : on l'ignore plutôt que de la faire passer
 * telle quelle dans un prompt.
 */
export function libellesRetenus(groupe: GroupeChoix, cles: readonly string[] | undefined): string[] {
  if (!cles || cles.length === 0) return [];
  const connus = new Map(groupe.choix.map((c) => [c.cle, c.libelle]));
  const vus = new Set<string>();
  const libelles: string[] = [];
  for (const cle of cles) {
    const libelle = connus.get(cle);
    if (!libelle || vus.has(cle)) continue;
    vus.add(cle);
    libelles.push(libelle);
    if (libelles.length >= groupe.max) break;
  }
  return libelles;
}

/**
 * Construit les lignes de consigne à ajouter au message. Un groupe vide ne
 * produit rien : mieux vaut laisser LEX proposer que lui imposer du vide.
 */
export function consignesDepuisChoix(
  groupes: readonly GroupeChoix[],
  choix: Readonly<Record<string, readonly string[] | undefined>>,
): string[] {
  const lignes: string[] = [];
  for (const groupe of groupes) {
    const libelles = libellesRetenus(groupe, choix[groupe.cle]);
    if (libelles.length === 0) continue;
    lignes.push(`${groupe.titre} : ${libelles.join(', ')}.`);
  }
  return lignes;
}

/** Ce que l'interface récupère pour dessiner les cases à cocher. */
export function catalogueChoix(): {
  activite: readonly GroupeChoix[];
  ecrit: readonly GroupeChoix[];
  appui: readonly GroupeChoix[];
} {
  return { activite: GROUPES_ACTIVITE, ecrit: GROUPES_ECRIT, appui: GROUPES_APPUI };
}
