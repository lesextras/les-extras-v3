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
export const CHOIX_COMPTE: (ChoixCompte & { key: CleCompte })[] = [
  {
    key: 'ESTABLISHMENT',
    icon: Building2,
    titre: 'Je travaille en établissement',
    accroche: 'Direction, chef de service, coordinateur, salarié.',
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
    titre: 'Je suis intervenant indépendant',
    accroche: 'Éducateur, moniteur, thérapeute, formateur.',
    detail:
      'Vous proposez vos ateliers à votre compte : fiches publiées, demandes de ' +
      'devis reçues, documents édités ici.',
    points: ['Publication au catalogue', '0 % de commission', 'Devis et factures édités'],
  },
  {
    key: 'PARTICULIER',
    icon: Heart,
    titre: 'Je suis parent ou particulier',
    accroche: 'Pour mon enfant, mon proche, ou moi-même.',
    detail:
      'Vous réservez pour votre enfant ou votre proche, suivez vos inscriptions ' +
      'et retrouvez vos factures. Aucune sollicitation professionnelle.',
    points: ['Réservation d’ateliers', 'Inscription aux formations', 'Aucune publication'],
  },
];

/**
 * ⚠ Le type est ÉNUMÉRÉ, pas déduit de la liste des cartes. Déduit, il valait
 * `string` — et une clé mal orthographiée dans `CHOIX_COMPTE` serait passée
 * jusqu'au serveur sans que rien ne l'arrête.
 */
export type CleCompte = 'ESTABLISHMENT' | 'FREELANCE' | 'PARTICULIER';

/** Les étapes du parcours, dans l'ordre. */
export type CleEtape = 'profil' | 'etablissement' | 'identite' | 'poste';

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
    'Cette réponse choisit votre espace. Vous pourrez créer un second compte plus tard si vous cumulez deux situations.',
};

const ETAPE_IDENTITE: Etape = {
  cle: 'identite',
  titre: 'Vos identifiants',
  explication:
    'De quoi vous connecter. Votre compte est créé dès cette étape : tout ce qui suit se complète aussi plus tard, depuis votre espace.',
};

/**
 * QUATRE ÉTAPES, PLUS SIX.
 *
 * Structure, établissement et service étaient trois écrans séparés. Ils ne
 * posent pourtant qu'une seule question — « où travaillez-vous ? » — et la
 * découper en trois faisait trois fois le même geste : lire un titre, remplir
 * un champ, cliquer Continuer. Trois écrans pour trois champs, c'est un
 * formulaire qui se ferme.
 *
 * Ils sont réunis. Le découpage garde son sens là où il en a : la situation,
 * le lieu de travail, les identifiants, le poste.
 *
 * ⚠ CONSÉQUENCE TECHNIQUE, et elle explique la forme du code : l'étape
 * « établissement » arrive AVANT la création du compte. Elle ne peut donc
 * appeler que des routes PUBLIQUES (`/public/etablissements`,
 * `/public/structures`). Le rattachement à la structure et la création du
 * service, eux, sont des écritures : ils sont mis de côté et appliqués juste
 * après la création du compte. Ne remontez pas d'appel authentifié dans cette
 * étape — il échouerait en 401 sans rien dire.
 *
 * ⚠ AUCUNE ÉTAPE APRÈS « identite » N'EST BLOQUANTE. Le compte existe déjà :
 * quelqu'un qui s'arrête en route garde son accès et retrouve le reste dans
 * son espace, sur « Mon poste ».
 */
export const PARCOURS: Record<CleCompte, Etape[]> = {
  ESTABLISHMENT: [
    ETAPE_IDENTITE,
    ETAPE_PROFIL,
    {
      cle: 'etablissement',
      titre: 'Où vous travaillez',
      explication:
        'Votre établissement, la structure qui le gère, et votre service. Seul le nom de l’établissement est obligatoire — le reste se complète aussi plus tard.',
    },
    {
      cle: 'poste',
      titre: 'Votre poste et vos droits',
      explication:
        'Ce que vous faites, et ce que vous pouvez engager pour votre établissement. C’est cette déclaration qui décide de ce que vous voyez et de ce que vous pouvez faire.',
    },
  ],
  FREELANCE: [ETAPE_IDENTITE, ETAPE_PROFIL],
  PARTICULIER: [ETAPE_IDENTITE, ETAPE_PROFIL],
};
