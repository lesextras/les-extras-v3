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
  FREELANCE: [ETAPE_PROFIL, ETAPE_IDENTITE],
  PARTICULIER: [ETAPE_PROFIL, ETAPE_IDENTITE],
};
