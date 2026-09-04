// LES TROIS NIVEAUX DU CATALOGUE GRATUIT — demandé par Siham le 4/09/2026.
//
// Le catalogue comptait onze parcours posés côte à côte, sans ordre. Un
// professionnel qui arrive dessus ne sait pas par où commencer, et l'ordre
// compte réellement ici : « Renforcer ce qui va » ne veut pas dire grand-chose
// tant qu'on n'a pas compris ce qu'un comportement obtient, et « Préparer une
// ESS » suppose qu'on sache déjà décrire un comportement sans le juger.
//
// ⚠⚠ LE MOT « CERTIFICAT » N'APPARAÎT NULLE PART, ET CE N'EST PAS NÉGOCIABLE.
//
// La demande initiale disait « obtenir un certificat professionnel ». On ne
// peut pas, et il faut que la raison soit écrite ici plutôt que redécouverte
// dans six mois :
//
//   · un « certificat professionnel » désigne en France une certification
//     enregistrée au RNCP ou au Répertoire spécifique, délivrée par un
//     organisme certificateur habilité par France Compétences ;
//   · **Qualiopi n'est pas cela.** Qualiopi certifie la QUALITÉ DU PROCESSUS
//     d'un organisme de formation. Elle n'autorise à délivrer aucun titre,
//     aucune certification, aucun droit à exercer ;
//   · vendre 20 € un document présenté comme un « certificat professionnel »
//     serait une pratique commerciale trompeuse (art. L121-1 c. conso), et
//     elle serait d'autant plus lourdement retenue contre un organisme
//     précisément certifié Qualiopi.
//
// Ce que l'association peut délivrer, et qui est déjà écrit dans les CGV :
// une **attestation de suivi**, par parcours. Ce fichier ajoute une
// **attestation de parcours** pour un niveau complet — même nature juridique,
// simplement un document qui liste plusieurs parcours au lieu d'un seul.
//
// ⚠ Si Siham veut une VRAIE certification un jour, le chemin existe et il est
// long : déposer un dossier au Répertoire spécifique auprès de France
// Compétences, avec référentiel de compétences, référentiel d'évaluation, jury
// indépendant et preuves d'insertion. Cela se compte en mois et en milliers
// d'euros. C'est une décision d'association, pas un réglage de site.

export interface ParcoursNiveau {
  /** Slug de la fiche formation. Doit exister dans seed-mini-formations.js. */
  slug: string;
  titre: string;
  /** Ce que le parcours apprend à FAIRE, en une ligne. */
  competence: string;
  /** Vrai tant que le parcours n'est pas publié. Affiché en « bientôt ». */
  aVenir?: boolean;
}

export interface Niveau {
  numero: 1 | 2 | 3;
  cle: string;
  nom: string;
  /** La promesse du niveau, en une phrase. */
  promesse: string;
  /** À qui il s'adresse, concrètement. */
  pourQui: string;
  /** Ce qu'on sait faire à la sortie. Sert aussi de texte d'attestation. */
  aLaSortie: string[];
  parcours: ParcoursNiveau[];
}

/**
 * ⚠ L'ORDRE À L'INTÉRIEUR D'UN NIVEAU EST UN ORDRE CONSEILLÉ, PAS UNE BARRIÈRE.
 * Aucun verrou technique n'empêche d'ouvrir le troisième parcours en premier,
 * et c'est volontaire : un professionnel qui arrive avec une situation de crise
 * lundi matin doit pouvoir lire le parcours crise lundi matin. On guide, on
 * n'enferme pas — c'est la même doctrine que l'indicateur de complétude des
 * fiches ateliers.
 */
export const NIVEAUX: readonly Niveau[] = [
  {
    numero: 1,
    cle: 'socles',
    nom: 'Les socles',
    promesse:
      'Comprendre ce qui se passe avant de vouloir le changer. Quatre parcours qui donnent le vocabulaire commun d’une équipe.',
    pourQui:
      'Toute personne qui accompagne, quel que soit son métier et son ancienneté : professionnels du médico-social, parents, assistants familiaux, AESH, encadrement.',
    aLaSortie: [
      'Décrire un comportement en termes observables, sans y mettre d’intention.',
      'Identifier ce qu’un comportement obtient, à l’aide d’une grille en quatre colonnes.',
      'Repérer ce que l’environnement impose à la personne, et ce qu’on peut y régler.',
      'Réduire ce que l’adulte ajoute pendant une crise, et préparer sa conduite à froid.',
    ],
    parcours: [
      {
        slug: 'les-quatre-fonctions-d-un-comportement',
        titre: 'Les quatre fonctions d’un comportement',
        competence: 'Trouver ce qu’un comportement obtient, avant de vouloir le changer.',
      },
      {
        slug: 'rendre-l-environnement-previsible',
        titre: 'Rendre l’environnement prévisible',
        competence: 'Poser des repères de temps et des supports visuels qui tiennent.',
      },
      {
        slug: 'les-premieres-minutes-d-une-crise',
        titre: 'Les premières minutes d’une crise',
        competence: 'Réduire ce que l’adulte ajoute pendant, et décider à froid.',
      },
      {
        slug: 'decrire-un-comportement-sans-le-juger',
        titre: 'Décrire un comportement sans le juger',
        competence: 'Écrire ce qu’on a vu, pas ce qu’on en a pensé.',
        aVenir: true,
      },
    ],
  },
  {
    numero: 2,
    cle: 'approfondissement',
    nom: 'L’approfondissement',
    promesse:
      'Agir sur une situation précise, avec un relevé et un réglage à la fois. C’est le niveau où l’on change quelque chose au quotidien.',
    pourQui:
      'Ceux qui ont fait le niveau 1, ou qui manient déjà le vocabulaire de l’observation. Chaque parcours demande dix à quinze jours de relevé.',
    aLaSortie: [
      'Enseigner un moyen de remplacement plus facile que le comportement à remplacer.',
      'Faire augmenter un comportement souhaité, en réglant le délai, le critère et la fréquence.',
      'Découper une routine en étapes, et retirer son aide sans que tout s’effondre.',
      'Formuler une consigne exécutable, et réduire le coût d’entrée dans une tâche.',
    ],
    parcours: [
      {
        slug: 'apprendre-a-demander-plutot-qu-a-crier',
        titre: 'Apprendre à demander plutôt qu’à crier',
        competence: 'Enseigner un moyen d’obtenir la même chose, en plus facile.',
      },
      {
        slug: 'renforcer-ce-qui-va',
        titre: 'Renforcer ce qui va',
        competence: 'Faire augmenter un comportement qui existe déjà.',
        aVenir: true,
      },
      {
        slug: 'decomposer-une-routine-en-etapes',
        titre: 'Décomposer une routine en étapes',
        competence: 'Enseigner une séquence, une marche à la fois.',
      },
      {
        slug: 'guider-puis-s-effacer',
        titre: 'Guider puis s’effacer',
        competence: 'Retirer l’aide par paliers, sans perdre l’acquis.',
      },
      {
        slug: 'l-enfant-qui-dit-non-a-tout',
        titre: 'L’enfant qui dit non à tout',
        competence: 'Formuler une consigne qui puisse être suivie.',
      },
      {
        slug: 'aider-a-demarrer-une-tache',
        titre: 'Aider quelqu’un à démarrer une tâche',
        competence: 'Réduire le coût des trente premières secondes.',
      },
    ],
  },
  {
    numero: 3,
    cle: 'expertise',
    nom: 'L’expertise',
    promesse:
      'Les situations où la lecture comportementale ne suffit plus : le parcours de la personne, les partenaires, et les écrits qui engagent.',
    pourQui:
      'Professionnels expérimentés, référents de parcours, encadrement. Ces parcours supposent les deux niveaux précédents, et ils le disent.',
    aLaSortie: [
      'Relire un comportement à la lumière du parcours de vie, sans poser de diagnostic.',
      'Arriver à une équipe de suivi de la scolarisation avec des éléments écrits.',
      'Mesurer un comportement dans la durée, et distinguer un progrès d’une variation.',
      'Construire une solution avec la personne plutôt que de la lui appliquer.',
    ],
    parcours: [
      {
        slug: 'lire-un-comportement-comme-une-reaction-de-survie',
        titre: 'Lire un comportement comme une réaction de survie',
        competence: 'Relire, puis régler le quotidien. Jamais diagnostiquer.',
      },
      {
        slug: 'preparer-une-equipe-de-suivi-de-la-scolarisation',
        titre: 'Préparer une équipe de suivi de la scolarisation',
        competence: 'Arriver avec trois éléments écrits, et pas les mains vides.',
      },
      {
        slug: 'mesurer-un-comportement-ligne-de-base',
        titre: 'Mesurer un comportement : ligne de base et courbe',
        competence: 'Lire une tendance sans se laisser avoir par trois jours.',
        aVenir: true,
      },
      {
        slug: 'resoudre-un-probleme-avec-la-personne',
        titre: 'Résoudre un problème avec la personne plutôt que contre elle',
        competence: 'Chercher la solution à deux, et tenir l’accord obtenu.',
        aVenir: true,
      },
    ],
  },
] as const;

/** Le nombre de parcours réellement ouverts dans un niveau. */
export function parcoursOuverts(n: Niveau): ParcoursNiveau[] {
  return n.parcours.filter((p) => !p.aVenir);
}

/** Le niveau auquel appartient un parcours, si on le connaît. */
export function niveauDuParcours(slug: string): Niveau | undefined {
  return NIVEAUX.find((n) => n.parcours.some((p) => p.slug === slug));
}

/**
 * ⚠ CE TEXTE EST LA LIMITE JURIDIQUE DU DISPOSITIF, et il est affiché tel quel
 * sur la page. Il reprend mot pour mot ce que disent déjà les CGV. Toute
 * réécriture qui laisserait entendre autre chose doit être refusée.
 */
export const CE_QUE_CE_N_EST_PAS = {
  titre: 'Ce que ces niveaux ne sont pas',
  points: [
    'Ce ne sont pas des diplômes. Aucun des trois niveaux ne délivre un titre, un grade ou un droit à exercer.',
    'Ce ne sont pas des certifications professionnelles. Aucun n’est enregistré au RNCP ni au Répertoire spécifique de France Compétences.',
    'La certification Qualiopi de l’association porte sur la qualité de ses processus de formation. Elle ne l’autorise pas à délivrer une certification professionnelle, et aucun organisme certifié Qualiopi ne peut le faire à ce seul titre.',
    'Ce que l’association délivre est une attestation de suivi : un document qui atteste que vous avez suivi un parcours, ou l’ensemble d’un niveau. Rien de plus, et c’est déjà utile dans un entretien professionnel ou un dossier de formation continue.',
  ],
} as const;
