import { Building2, UserRound } from 'lucide-react';
import type { ChoixCompte } from './CarteChoix';
import { renfortSalarieVisible } from '@/lib/offre';

/**
 * LE CHOIX DE COMPTE — DEUX PORTES, ET C'EST L'HISTOIRE D'UN DÉGROSSISSAGE.
 *
 * Il y a eu quatre tuiles, puis trois, et il en reste deux.
 *
 * « Établissement » et « Salarié » ont fusionné les premières : elles posaient
 * la mauvaise question. Techniquement elles créaient deux comptes différents ;
 * humainement, la personne qui arrive ne sait pas laquelle la concerne — une
 * directrice adjointe EST salariée de son établissement, et un chef de service
 * qui cherche du renfort remplit exactement le rôle décrit par la tuile
 * « Établissement ». Ce n'est plus une tuile qui décide du rôle mais l'étape
 * « poste », où l'on déclare son métier et son niveau de responsabilité.
 *
 * « Particulier » a suivi le 21/09/2026, pour la même raison poussée d'un
 * cran : toutes ces cartes demandaient à la personne de se ranger dans une
 * CATÉGORIE avant de savoir ce que la catégorie ouvrait. Les deux qui restent
 * portent une INTENTION — je cherche, je propose — et c'est la seule chose que
 * quelqu'un sait de lui-même en arrivant.
 */
/**
 * CE QUE PORTE CHAQUE CARTE, ET POURQUOI — quatre champs, quatre rôles.
 *
 * Les cartes se ressemblaient trait pour trait : même bordure grise,
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
 * ⚠ CHAQUE CARTE A SA TEINTE, et c'est le contour qui la porte. Deux portes
 * vers deux côtés opposés du marché ne doivent pas se ressembler. Les teintes
 * viennent de la palette du site — voir `TEINTES` dans CarteChoix.tsx, qui
 * explique pourquoi on n'en invente pas une troisième. La teinte `vert`, qui
 * portait la carte « Particulier », n'est plus utilisée ici : elle reste
 * définie, et c'est très bien — une teinte de moins à l'écran ne se supprime
 * pas d'une palette.
 */
export const CHOIX_COMPTE: (ChoixCompte & {
  key: CoteMarche;
  /** Le type de compte créé quand on clique cette carte. */
  typeParDefaut: CleCompte;
})[] = [
  {
    key: 'DEMANDE',
    typeParDefaut: 'ESTABLISHMENT',
    icon: Building2,
    teinte: 'framboise',
    categorie: 'Je cherche',
    titre: 'Je cherche un intervenant',
    accroche: 'Établissement, service, ou pour un proche.',
    benefice: 'Décrivez le besoin, le réseau répond, et les documents s’éditent ici.',
    // ⚠ Le verso est contraint par la hauteur de la carte : ces textes tiennent
    // en trois lignes, pas plus. Les rallonger les fait couper au survol.
    detail:
      'MECS, IME, ITEP, SESSAD, EHPAD, école, ou un parent pour son enfant. ' +
      'L’écran suivant vous demande simplement lequel des deux.',
    points: [
      'Renforts, ateliers, formations',
      'Devis et facture édités ici',
      'Rien n’est engagé sans votre accord',
    ],
  },
  {
    key: 'OFFRE',
    typeParDefaut: 'FREELANCE',
    icon: UserRound,
    teinte: 'terracotta',
    categorie: 'Je propose',
    titre: 'Je propose mes services',
    accroche: 'Éducateur, moniteur, thérapeute, formateur, psychomotricien…',
    benefice: 'Être trouvé par les établissements, et éditer vos devis et factures ici.',
    detail: renfortSalarieVisible()
      ? 'Ateliers, formations, renforts personnalisés, à votre compte. Ou vos ' +
        'seules disponibilités, si vous venez pour des remplacements.'
      : 'Ateliers, formations et renforts personnalisés, à votre compte, sous votre SIRET.',
    points: [
      'Publication au catalogue',
      'Devis et factures édités',
      'Vous choisissez ce que vous acceptez',
    ],
  },
];

/**
 * ⚠⚠ DEUX PORTES, PAS TROIS — 21/09/2026, demande de Siham : « supprime le
 * compte particulier et met je cherche un intervenant et je propose mes
 * services comme 2 comptes (inspire toi de la concurrence) ».
 *
 * C'est la forme qu'ont Brigad et Hublo, et elle est juste : une place de
 * marché a DEUX côtés, et la première question qu'on pose à quelqu'un doit
 * porter sur son INTENTION (« je cherche » / « je propose »), pas sur une
 * catégorie de compte (« établissement », « particulier », « indépendant »)
 * qui est du vocabulaire de logiciel. Les trois anciennes cartes demandaient
 * à la personne de se ranger dans une case avant de savoir ce que la case
 * ouvrait.
 *
 * ⚠ LE COMPTE PARTICULIER N'EST PAS SUPPRIMÉ EN BASE, ET IL NE DOIT PAS
 * L'ÊTRE. `AccountType.PARTICULIER` porte des comptes existants, leurs
 * réservations et leurs factures (règle n° 6 : rien ne se supprime), et il a
 * son propre accueil (`AccueilParticulier`) et son propre menu, tous deux
 * écrits parce que servir « taux de couverture » à un parent revient à lui
 * dire que le site n'est pas pour lui. Ce qui disparaît, c'est la CARTE : le
 * particulier se déclare maintenant d'un clic sur l'écran des identifiants,
 * sous « Vous êtes ? ». Une question de moins sur la première page, et la
 * même finesse derrière.
 *
 * ⚠ CE N'EST PAS UNE QUESTION DE PLUS POUR UN ÉTABLISSEMENT : « un
 * établissement » est la réponse par défaut, déjà cochée. Qui ne la lit pas
 * obtient exactement ce qu'il aurait obtenu avant.
 */
export type CoteMarche = 'DEMANDE' | 'OFFRE';

/**
 * ⚠ Le type est ÉNUMÉRÉ, pas déduit de la liste des cartes. Déduit, il valait
 * `string` — et une clé mal orthographiée dans `CHOIX_COMPTE` serait passée
 * jusqu'au serveur sans que rien ne l'arrête.
 */
export type CleCompte = 'ESTABLISHMENT' | 'FREELANCE' | 'PARTICULIER';

/**
 * De quel côté du marché se trouve un type de compte.
 *
 * ⚠ ÉCRIT UNE SEULE FOIS. L'écran s'en sert pour savoir quelle carte est
 * active et s'il faut afficher la question « Vous êtes ? » ; deux lectures
 * différentes de la même règle finiraient par allumer la mauvaise carte quand
 * quelqu'un change d'avis.
 */
export function coteDe(type: CleCompte): CoteMarche {
  return type === 'FREELANCE' ? 'OFFRE' : 'DEMANDE';
}

/**
 * Les deux réponses à « Vous êtes ? », côté demande.
 *
 * ⚠ L'ORDRE COMPTE : l'établissement d'abord, parce que c'est le cas de loin
 * le plus fréquent et que c'est lui qui est pré-sélectionné.
 */
export const QUI_DEMANDE: {
  type: Extract<CleCompte, 'ESTABLISHMENT' | 'PARTICULIER'>;
  titre: string;
  aide: string;
}[] = [
  {
    type: 'ESTABLISHMENT',
    titre: 'Un établissement ou un service',
    aide: 'MECS, IME, ITEP, SESSAD, EHPAD, ESAT, école, mairie ou service jeunesse. Direction, chef de service, coordinateur ou salarié.',
  },
  {
    type: 'PARTICULIER',
    titre: 'Un particulier',
    aide: 'Pour votre enfant, un proche, ou vous-même. Aucun établissement à déclarer.',
  },
];

/** Les étapes du parcours, dans l'ordre. */
export type CleEtape =
  | 'profil'
  | 'identite'
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
    'De quoi vous connecter. Votre compte est créé à la fin de cette étape. Tout ce qui suit se complète aussi plus tard, depuis votre espace.',
};

/**
 * ⚠ L'ÉTAPE « votre service » N'EXISTE PLUS, ET IL NE FAUT PAS LA REMETTRE.
 *
 * Elle ne portait qu'un champ facultatif et une phrase d'explication : un
 * écran entier — titre, lecture, bouton Continuer — pour taper « Internat ».
 * Le service est maintenant demandé avec l'établissement, l'entité employeuse
 * et le poste, sur l'étape des identifiants : « l'ESAT Corail de l'ADSEA,
 * internat, chef de service » est une seule phrase, elle se remplit d'un seul
 * tenant.
 *
 * Ce qui reste ici est ce qui ne tient pas sur une ligne : le niveau de
 * responsabilité et les droits.
 */

/**
 * TROIS ÉTAPES POUR UN ÉTABLISSEMENT — ET L'ORDRE N'EST PAS ARBITRAIRE.
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
      cle: 'poste',
      titre: 'Votre niveau et vos droits',
      explication:
        'Ce que vous pouvez engager pour votre établissement. C’est cette déclaration qui décide de ce que vous voyez et de ce que vous pouvez faire.',
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
        'Ce qui facturera vos interventions. Facultatif pour entrer, nécessaire pour publier une fiche, et vous pouvez le compléter plus tard.',
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
    * ⚠ DEPUIS LE 19/09/2026 CE CHEMIN EST HORS OFFRE PUBLIQUE : le renfort
    * salarié n'est plus proposé en ligne (`@/lib/offre`). Le texte de l'étape
    * suit l'interrupteur, le compte et ses données restent intacts.
   *
   * Et c'est ce qui manque le plus au renfort : des bras, pas des demandes.
   */
  PARTICULIER: [
    ETAPE_PROFIL,
    ETAPE_IDENTITE,
    {
      cle: 'disponibilite',
      titre: 'Ce que vous cherchez',
      explication: renfortSalarieVisible()
        ? 'Réserver pour un proche, proposer vos disponibilités pour des remplacements, ou les deux. Rien n’est définitif : tout se change depuis votre espace.'
        : 'Ce que vous cherchez pour votre enfant, votre proche ou vous-même. Rien n’est définitif : tout se change depuis votre espace.',
    },
  ],
};
