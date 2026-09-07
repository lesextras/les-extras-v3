/**
 * LE CHEMIN D'UNE ACADÉMIE — douze étapes, de l'idée à l'organisme certifié.
 *
 * Le pendant exact du chemin de l'association. Rien en base : un référentiel
 * écrit en dur, versionné avec le code, que l'espace coche au fur et à mesure.
 * Une étape se coche de deux façons — automatiquement quand la donnée arrive
 * (`deduite`), ou à la main par la personne.
 */

export interface EtapeAcademie {
  slug: string;
  numero: number;
  titre: string;
  resume: string;
  /** Ce qu'il faut avoir fait pour passer à la suivante, en une phrase. */
  pourPasser: string;
  /**
   * Le champ de la fiche qui, une fois rempli, coche l'étape tout seul.
   * Sans lui, l'étape se coche à la main.
   */
  deduite?: 'nda' | 'referentHandicap' | 'auditPrevuLe' | 'certifieDu' | 'siret';
}

export const VERSION_CHEMIN_ACADEMIE = '2026-09';

export const ETAPES_ACADEMIE: EtapeAcademie[] = [
  {
    slug: 'est-ce-de-la-formation',
    numero: 1,
    titre: 'Vérifier que c\'est bien de la formation',
    resume:
      "Toute transmission de savoir n'est pas de la formation professionnelle. L'action doit viser une compétence pour l'emploi, avoir des objectifs évaluables, un programme, une durée et un public identifié. De l'animation, du conseil ou du coaching relèvent d'autres régimes — et n'ouvrent pas droit aux financements.",
    pourPasser: 'Tu sais dire en une phrase quelle compétence professionnelle ta formation fait acquérir.',
  },
  {
    slug: 'porteur-juridique',
    numero: 2,
    titre: 'Choisir le porteur juridique',
    resume:
      "Trois voies : adosser l'organisme à une association qui existe déjà, créer une structure à part, ou déclarer une activité en nom propre. L'association qui forme reste une association ; c'est la déclaration d'activité, pas la forme juridique, qui fait l'organisme de formation.",
    pourPasser: 'La structure qui portera l\'activité est choisie.',
  },
  {
    slug: 'siret-et-ape',
    numero: 3,
    titre: 'Obtenir le SIRET et le bon code APE',
    resume:
      "Sans SIRET, pas de déclaration d'activité. Le code APE de la formation continue d'adultes est le 85.59A ; un code différent ne bloque rien mais attire l'œil des financeurs, et se corrige auprès de l'INSEE.",
    pourPasser: 'Le SIRET est renseigné dans ta fiche.',
    deduite: 'siret',
  },
  {
    slug: 'premiere-convention',
    numero: 4,
    titre: 'Signer la première convention',
    resume:
      "C'est le point que personne ne voit venir : la déclaration d'activité n'est recevable qu'accompagnée d'une première convention de formation professionnelle — ou d'un contrat, si l'apprenant paie lui-même. Il faut donc une première vente avant d'être déclaré.",
    pourPasser: 'Une convention ou un contrat de formation est signé.',
  },
  {
    slug: 'declaration-dreets',
    numero: 5,
    titre: 'Déposer la déclaration d\'activité',
    resume:
      "Le dossier part à la DREETS de ta région, dans les trois mois qui suivent la première convention. En retour, le numéro de déclaration d'activité (NDA) — onze chiffres. Il ne vaut pas agrément et ne se présente jamais comme tel : la mention exacte est « Cet enregistrement ne vaut pas agrément de l'État ».",
    pourPasser: 'Ton NDA est renseigné dans ta fiche.',
    deduite: 'nda',
  },
  {
    slug: 'documents-socles',
    numero: 6,
    titre: 'Écrire les documents socles',
    resume:
      "Quatre pièces qu'on te demandera tout le temps : le règlement intérieur, les conditions générales de vente, le livret d'accueil et la procédure de réclamation. Elles se rédigent une fois et servent des années.",
    pourPasser: 'Les quatre pièces sont dans ton secrétariat.',
  },
  {
    slug: 'referents',
    numero: 7,
    titre: 'Désigner le référent handicap',
    resume:
      "Obligatoire, et vérifié en audit : une personne nommée, joignable, dont le nom est publié. Elle n'a pas à être experte — elle doit savoir orienter et adapter. Le référent pédagogique se désigne dans la foulée.",
    pourPasser: 'Le référent handicap est nommé dans ta fiche.',
    deduite: 'referentHandicap',
  },
  {
    slug: 'premiere-fiche-programme',
    numero: 8,
    titre: 'Bâtir la première fiche programme',
    resume:
      "La fiche conforme dit tout avant l'inscription : objectifs évaluables, prérequis, public, durée, modalités, tarif, délais d'accès, méthodes d'évaluation, accessibilité aux personnes handicapées. C'est la pièce que l'auditeur ouvre en premier, et celle que le financeur lit.",
    pourPasser: 'Une formation complète est publiée dans ton catalogue.',
  },
  {
    slug: 'dossier-qualiopi',
    numero: 9,
    titre: 'Monter le dossier Qualiopi',
    resume:
      "Sept critères, trente-deux indicateurs, une preuve pour chacun. Tous ne s'appliquent pas à tout le monde : les indicateurs de l'apprentissage et ceux du bilan de compétences ne concernent que ceux qui en font. La certification est obligatoire pour tout financement public ou mutualisé.",
    pourPasser: 'Chaque indicateur qui te concerne a sa preuve déposée.',
  },
  {
    slug: 'choisir-certificateur',
    numero: 10,
    titre: 'Choisir un certificateur et planifier l\'audit',
    resume:
      "L'audit se passe avec un organisme certificateur accrédité par le COFRAC. Les tarifs et les délais varient beaucoup : il vaut la peine d'en consulter trois. Compte plusieurs semaines entre la demande et la date.",
    pourPasser: 'La date de ton audit initial est posée.',
    deduite: 'auditPrevuLe',
  },
  {
    slug: 'passer-audit',
    numero: 11,
    titre: 'Passer l\'audit et lever les écarts',
    resume:
      "L'auditeur échantillonne : il demande des preuves sur des sessions réelles, pas des modèles vides. Une non-conformité mineure se lève sous trois mois ; une majeure bloque la certification. Le certificat vaut trois ans, avec un audit de surveillance entre la quatorzième et la vingt-deuxième mois.",
    pourPasser: 'Ton certificat est obtenu et ses dates sont renseignées.',
    deduite: 'certifieDu',
  },
  {
    slug: 'ouvrir-financements',
    numero: 12,
    titre: 'S\'ouvrir aux financements',
    resume:
      "Certifié, tu peux te référencer : EDOF pour le CPF, conventionnement avec les OPCO, catalogue France Travail. Et chaque année avant le 30 avril, le bilan pédagogique et financier — l'oublier suspend la déclaration d'activité.",
    pourPasser: 'Tu es référencé sur au moins un dispositif de financement.',
  },
];

export function trouverEtapeAcademie(slug: string): EtapeAcademie | undefined {
  return ETAPES_ACADEMIE.find((e) => e.slug === slug);
}
