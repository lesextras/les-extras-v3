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
export const CHOIX_COMPTE: ChoixCompte[] = [
  {
    key: 'ESTABLISHMENT',
    icon: Building2,
    titre: 'Je travaille en établissement',
    accroche: 'Direction, chef de service, coordinateur, salarié.',
    detail:
      'MECS, IME, ITEP, EHPAD, SESSAD, ESAT… Vous déclarez votre structure, ' +
      'votre établissement et votre service, puis votre poste. Ce sont eux qui ' +
      'déterminent ce que vous pouvez faire — pas une case cochée au départ.',
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
      'Vous proposez vos ateliers et vos interventions à votre compte. Vous ' +
      'publiez vos fiches, recevez les demandes de devis et éditez vos ' +
      'documents depuis la plateforme.',
    points: ['Publication au catalogue', '0 % de commission', 'Devis et factures édités'],
  },
  {
    key: 'PARTICULIER',
    icon: Heart,
    titre: 'Je suis parent ou particulier',
    accroche: 'Pour mon enfant, mon proche, ou moi-même.',
    detail:
      'Vous cherchez un atelier, une activité ou un accompagnement. Vous ' +
      'réservez, suivez vos inscriptions et retrouvez vos factures. Vous ne ' +
      'publiez rien et ne recevez aucune sollicitation professionnelle.',
    points: ['Réservation d’ateliers', 'Inscription aux formations', 'Aucune publication'],
  },
];

export type CleCompte = (typeof CHOIX_COMPTE)[number]['key'];

/** Les étapes du parcours, dans l'ordre. */
export type CleEtape =
  | 'profil'
  | 'etablissement'
  | 'identite'
  | 'structure'
  | 'service'
  | 'poste';

export interface Etape {
  cle: CleEtape;
  titre: string;
  /** Ce que l'étape sert à faire, en une phrase, affiché sous le titre. */
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
    'De quoi vous connecter. Votre compte est créé à la fin de cette étape — les suivantes se complètent aussi plus tard, depuis votre espace.',
};

/**
 * LE PARCOURS ÉTABLISSEMENT EST EN SIX ÉTAPES, ET C'EST VOLONTAIRE.
 *
 * Un formulaire unique portant structure, établissement, service, poste, statut
 * cadre et droits déclarés ferait une page de vingt champs. Personne ne la
 * remplit : on la ferme. Découpé, chaque écran pose UNE question, l'explique,
 * et se répond en dix secondes.
 *
 * ⚠ AUCUNE ÉTAPE APRÈS « identite » N'EST BLOQUANTE. Le compte existe déjà :
 * quelqu'un qui s'arrête en route garde son accès et retrouve le parcours dans
 * son espace. Exiger l'organigramme complet avant de laisser entrer, c'est
 * perdre la moitié des gens sur un écran administratif.
 */
export const PARCOURS: Record<CleCompte, Etape[]> = {
  ESTABLISHMENT: [
    ETAPE_PROFIL,
    {
      cle: 'etablissement',
      titre: 'Votre établissement',
      explication:
        'Le lieu où vous travaillez. C’est ce nom qui apparaîtra sur vos devis et vos factures.',
    },
    ETAPE_IDENTITE,
    {
      cle: 'structure',
      titre: 'Votre structure',
      explication:
        'L’entité juridique qui possède votre établissement : association, fondation, mairie, groupe. Nous la retrouvons pour vous dans l’annuaire public.',
    },
    {
      cle: 'service',
      titre: 'Votre service',
      explication:
        'Internat, pôle jour, SESSAD… Si un collègue l’a déjà créé, nous vous le dirons plutôt que d’en créer un second.',
    },
    {
      cle: 'poste',
      titre: 'Votre poste et vos droits',
      explication:
        'Ce que vous faites, et ce que vous pouvez engager pour votre établissement. C’est cette déclaration qui décide de ce que vous voyez et de ce que vous pouvez faire.',
    },
  ],
  FREELANCE: [ETAPE_PROFIL, ETAPE_IDENTITE],
  PARTICULIER: [ETAPE_PROFIL, ETAPE_IDENTITE],
};
