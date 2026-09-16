import { Building2, UserRound, Heart } from 'lucide-react';
import type { ChoixCompte } from './CarteChoix';

/**
 * LE CHOIX DE COMPTE — TROIS PORTES, PLUS QUATRE.
 *
 * « Établissement » et « Salarié » étaient deux tuiles distinctes, et elles
 * posaient la mauvaise question. Techniquement elles créaient deux comptes
 * différents ; humainement, la personne qui arrive ne sait pas laquelle la
 * concerne — une directrice adjointe EST salariée de son établissement, et un
 * chef de service qui cherche du renfort remplit exactement le rôle décrit par
 * la tuile « Établissement ». Le choix était donc arbitraire, et beaucoup se
 * trompaient de porte.
 *
 * Elles sont fusionnées. Ce n'est plus une tuile qui décide du rôle : c'est le
 * FORMULAIRE DE QUALIFICATION, plus loin dans le parcours, où l'on déclare son
 * poste, si l'on est cadre, et son niveau de responsabilité. Une même porte,
 * puis une question à laquelle chacun sait répondre parce qu'elle porte sur son
 * métier et pas sur une catégorie de logiciel.
 */
/**
 * CE QUE PORTE CHAQUE CARTE, ET POURQUOI — quatre champs, quatre rôles.
 *
 * Les trois cartes se ressemblaient trait pour trait : même bordure grise,
 * même pastille rose, titre en petits caractères à la taille de l'accroche
 * grise. Rien ne ressortait, et il fallait les lire en entier pour savoir
 * laquelle était la sienne.
 *
 *   `categorie` — l'étiquette qu'on repère SANS lire, du coin de l'œil.
 *   `titre`     — la phrase à la première personne, en gros : on s'y reconnaît.
 *   `accroche`  — les métiers, pour lever le doute qui reste.
 *   `benefice`  — POURQUOI on ouvrirait ce compte. Une phrase, et c'est la
 *                 seule qui parle de ce qu'on gagne. Elle est sur le RECTO :
 *                 le verso ne se lit qu'au survol, c'est-à-dire jamais sur un
 *                 téléphone et jamais avant d'avoir décidé.
 *
 * ⚠ `categorie` NE RÉPÈTE PAS `titre`. Les deux disent la même chose de deux
 * façons volontairement différentes — un mot qu'on repère, une phrase qu'on
 * lit. Y recopier le titre supprimerait tout l'intérêt de la pastille.
 *
 * ⚠ CHAQUE CARTE A SA TEINTE, et c'est le contour qui la porte. Trois portes
 * vers trois produits différents ne doivent pas se ressembler. Les teintes
 * viennent de la palette du site — voir `TEINTES` dans CarteChoix.tsx, qui
 * explique pourquoi on n'en invente pas une quatrième.
 */
export const CHOIX_COMPTE: (ChoixCompte & { key: CleCompte })[] = [
  {
    key: 'ESTABLISHMENT',
    icon: Building2,
    teinte: 'framboise',
    categorie: 'Établissement',
    titre: 'Je travaille en établissement',
    accroche: 'Direction, chef de service, coordinateur ou salarié.',
    benefice: 'Trouver un remplaçant ou un atelier en quelques heures, sans commission.',
    // ⚠ Le verso est contraint par la hauteur de la carte : ces textes tiennent
    // en trois lignes, pas plus. Les rallonger les fait couper au survol.
    detail:
      'MECS, IME, ITEP, EHPAD, SESSAD… Vous déclarez votre établissement, votre ' +
      'service et votre poste : c’est cela qui décide de vos droits.',
    points: [
      'Direction : tout l’établissement',
      'Responsable : vos services',
      'Salarié : vos demandes et votre planning',
    ],
  },
  {
    key: 'FREELANCE',
    icon: UserRound,
    teinte: 'terracotta',
    categorie: 'Professionnel',
    titre: 'Je suis intervenant indépendant',
    accroche: 'Éducateur, moniteur, thérapeute, formateur, à mon compte.',
    benefice: 'Être trouvé par les établissements, et éditer vos devis et factures ici.',
    detail:
      'Vous proposez vos ateliers, vos formations et vos renforts personnalisés ' +
      'à votre compte, et vous facturez par votre structure.',
    points: ['Publication au catalogue', '0 % de commission', 'Devis et factures édités'],
  },
  {
    key: 'PARTICULIER',
    icon: Heart,
    teinte: 'vert',
    categorie: 'Particulier',
    titre: 'Je suis un particulier qui souhaite réserver des services',
    accroche: 'Pour mon enfant, mon proche, ou moi-même.',
    benefice: 'Inscrire un proche à un atelier, ou se rendre disponible près de chez soi.',
    detail:
      'Vous réservez pour un proche — et vous pouvez aussi proposer vos ' +
      'disponibilités pour des remplacements en CDD dans un établissement.',
    points: [
      'Réservation d’ateliers',
      'Inscription aux formations',
      'Remplacements en CDD, si vous le souhaitez',
    ],
  },
];

/**
 * ⚠ Le type est ÉNUMÉRÉ, pas déduit de la liste des cartes. Déduit, il valait
 * `string` — et une clé mal orthographiée dans `CHOIX_COMPTE` serait passée
 * jusqu'au serveur sans que rien ne l'arrête.
 */
export type CleCompte = 'ESTABLISHMENT' | 'FREELANCE' | 'PARTICULIER';

/** Les étapes du parcours, dans l'ordre. */
export type CleEtape =
  | 'profil'
  | 'identite'
  | 'etablissement'
  | 'poste'
  | 'structure'
  | 'activites'
  | 'disponibilite';

export interface Etape {
  cle: CleEtape;
  titre: string;
  /** Ce que l'étape sert à faire, en une phrase, affichée sous le titre. */
  explication: string;
}

const ETAPE_PROFIL: Etape = {
  cle: 'profil',
  titre: 'Votre situation',
  explication:
    'Une carte à choisir, et c’est tout. Vous pourrez créer un second compte plus tard si vous cumulez deux situations.',
};

const ETAPE_IDENTITE: Etape = {
  cle: 'identite',
  titre: 'Vos identifiants',
  explication:
    'De quoi vous connecter. Votre compte est créé à la fin de cette étape — tout ce qui suit se complète aussi plus tard, depuis votre espace.',
};

/**
 * QUATRE ÉTAPES — ET L'ORDRE N'EST PAS ARBITRAIRE.
 *
 * ⚠⚠ LA SITUATION VIENT AVANT LES IDENTIFIANTS, ET C'EST CE QUI PERMET DE
 * CRÉER LE COMPTE JUSTE DU PREMIER COUP.
 *
 * Nous avons d'abord fait l'inverse — le compte créé au tout premier écran,
 * puis « qualifié » ensuite. Ça paraissait plus accueillant, et ça obligeait à
 * corriger le compte après coup : son type, son nom, et son SLUG. Ce dernier
 * est calculé À LA CRÉATION à partir du nom : un compte créé avant qu'on
 * connaisse le nom de l'établissement gardait donc pour toujours l'adresse
 * publique du prénom de la personne — « /camille-durand » pour la MECS Les
 * Tilleuls. Un défaut qui ne se voit pas tout de suite et ne se rattrape plus.
 *
 * Une carte à cliquer coûte deux secondes et n'est pas un formulaire : la
 * mettre en tête ne fait fuir personne, et elle donne au serveur tout ce qu'il
 * faut pour créer un compte correct — bon type, bon nom, bon slug — sans
 * aucune route de rattrapage.
 *
 * ⚠ LE NOM DE L'ÉTABLISSEMENT EST DONC DEMANDÉ DANS « vos identifiants », et
 * il doit y rester. Le déplacer plus loin ramènerait exactement le défaut
 * ci-dessus.
 *
 * ⚠ AUCUNE ÉTAPE APRÈS LA CRÉATION N'EST BLOQUANTE. Chacune porte de quoi
 * passer outre, et tout se retrouve dans l'espace, sur « Mon poste ». Exiger
 * l'organigramme complet avant de laisser entrer, c'est perdre la moitié des
 * gens sur un écran administratif.
 */
export const PARCOURS: Record<CleCompte, Etape[]> = {
  ESTABLISHMENT: [
    ETAPE_PROFIL,
    ETAPE_IDENTITE,
    {
      cle: 'etablissement',
      titre: 'Où vous travaillez',
      explication:
        'La structure qui gère votre établissement, et votre service. Les deux sont facultatifs — ils se complètent aussi plus tard.',
    },
    {
      cle: 'poste',
      titre: 'Votre poste et vos droits',
      explication:
        'Ce que vous faites, et ce que vous pouvez engager pour votre établissement. C’est cette déclaration qui décide de ce que vous voyez et de ce que vous pouvez faire.',
    },
  ],
  /**
   * ⚠ LA STRUCTURE JURIDIQUE EST FACULTATIVE ICI, ET EXIGÉE POUR PUBLIER.
   *
   * Un intervenant qui vient regarder, répondre à un message ou préparer une
   * fiche n'a besoin d'aucun numéro. Mais publier une fiche, c'est proposer une
   * prestation facturée : là, la structure qui émettra la facture doit exister.
   * Le refus est donc posé à la publication (`StructureRequisePourPublierGuard`
   * côté API), jamais à l'inscription — on ferme la porte de la publication, on
   * ne mure pas la création de compte.
   */
  FREELANCE: [
    ETAPE_PROFIL,
    ETAPE_IDENTITE,
    {
      cle: 'structure',
      titre: 'Votre structure',
      explication:
        'Ce qui facturera vos interventions. Facultatif pour entrer, nécessaire pour publier une fiche — et vous pouvez le compléter plus tard.',
    },
    {
      cle: 'activites',
      titre: 'Ce que vous voulez faire',
      explication:
        'Ce que vous cochez décide de ce que vous verrez : les demandes qui vous arrivent, les alertes, et les rubriques de votre espace.',
    },
  ],
  /**
   * ⚠ LE COMPTE PARTICULIER N'EST PLUS SEULEMENT CELUI D'UN PARENT.
   *
   * Il ouvre aussi la porte à quelqu'un qui veut faire des remplacements en
   * établissement — étudiant, professionnel entre deux postes, retraité du
   * secteur. C'est le chemin le plus propre juridiquement : un remplacement se
   * fait en CDD, donc en salarié, donc sans structure ni SIRET à fournir.
   *
   * Et c'est ce qui manque le plus au renfort : des bras, pas des demandes.
   */
  PARTICULIER: [
    ETAPE_PROFIL,
    ETAPE_IDENTITE,
    {
      cle: 'disponibilite',
      titre: 'Ce que vous cherchez',
      explication:
        'Réserver pour un proche, proposer vos disponibilités pour des remplacements, ou les deux. Rien n’est définitif : tout se change depuis votre espace.',
    },
  ],
};
