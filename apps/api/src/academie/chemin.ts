/**
 * LE CHEMIN D'UNE ACADÉMIE : de l'idée à l'organisme certifié, puis ce qui
 * revient chaque année.
 *
 * Le pendant exact du chemin de l'association. Rien en base : un référentiel
 * écrit en dur, versionné avec le code, que l'espace coche au fur et à mesure.
 * Une étape se coche de deux façons : automatiquement quand la donnée arrive
 * (`deduite`), ou à la main par la personne.
 *
 * Cinq temps (le web les découpe par numéro, voir apps/web/src/app/academie/_chemin.ts) :
 *   Exister (1 à 5), Se tenir (6 à 8), Se certifier (9 à 12),
 *   Chaque année (13 à 17) : ces étapes repassent « À faire » au 1er janvier,
 *   Être finançable (18 et 19) : chacune peut être marquée « Pas concerné ».
 * Les temps 4 et 5 ont été ajoutés le 01/10/2026 ; les slugs des étapes 1 à
 * 12 ne bougent pas (les coches déjà enregistrées restent valables).
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
  /** L'étape revient chaque année : cochée une autre année, elle est à refaire. */
  chaqueAnnee?: boolean;
  /** L'étape peut être marquée « Pas concerné » (elle compte alors comme faite). */
  peutNePasConcerner?: boolean;
  /** Les pages officielles pour faire l'étape. */
  liens?: { nom: string; lien: string }[];
}

export const VERSION_CHEMIN_ACADEMIE = '2026-10';

export const ETAPES_ACADEMIE: EtapeAcademie[] = [
  {
    slug: 'est-ce-de-la-formation',
    numero: 1,
    titre: 'Vérifier que c\'est bien de la formation',
    resume:
      "Toute transmission de savoir n'est pas de la formation professionnelle. L'action doit viser une compétence pour l'emploi, avoir des objectifs évaluables, un programme, une durée et un public identifié. De l'animation, du conseil ou du coaching relèvent d'autres régimes, et n'ouvrent pas droit aux financements.",
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
      "C'est le point que personne ne voit venir : la déclaration d'activité n'est recevable qu'accompagnée d'une première convention de formation professionnelle (ou d'un contrat, si l'apprenant paie lui-même). Il faut donc une première vente avant d'être déclaré.",
    pourPasser: 'Une convention ou un contrat de formation est signé.',
  },
  {
    slug: 'declaration-dreets',
    numero: 5,
    titre: 'Déposer la déclaration d\'activité',
    resume:
      "Le dossier part à la DREETS de ta région, dans les trois mois qui suivent la première convention. En retour, le numéro de déclaration d'activité (NDA), onze chiffres. Il ne vaut pas agrément et ne se présente jamais comme tel : la mention exacte est « Cet enregistrement ne vaut pas agrément de l'État ».",
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
      "Obligatoire, et vérifié en audit : une personne nommée, joignable, dont le nom est publié. Elle n'a pas à être experte : elle doit savoir orienter et adapter. Le référent pédagogique se désigne dans la foulée.",
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
      "L'auditeur échantillonne : il demande des preuves sur des sessions réelles, pas des modèles vides. Une non-conformité mineure se lève sous trois mois ; une majeure bloque la certification. Le certificat vaut trois ans, avec un audit de surveillance entre le quatorzième et le vingt-deuxième mois.",
    pourPasser: 'Ton certificat est obtenu et ses dates sont renseignées.',
    deduite: 'certifieDu',
  },
  {
    slug: 'ouvrir-financements',
    numero: 12,
    titre: 'S\'ouvrir aux financements',
    resume:
      "Certifié, tu peux te référencer : EDOF pour le CPF, les OPCO pour les entreprises, le Carif-Oref et France Travail pour les demandeurs d'emploi. Le détail de chaque financement suit plus bas dans le chemin, et le bilan pédagogique et financier revient chaque année.",
    pourPasser: 'Tu es référencé sur au moins un dispositif de financement.',
  },
  // ------------------------------------------------------ 4. CHAQUE ANNÉE
  {
    slug: 'bilan-pedagogique-et-financier',
    numero: 13,
    titre: 'Envoyer le bilan pédagogique et financier',
    chaqueAnnee: true,
    resume:
      "Chaque année, le BPF raconte à l'État ton activité de l'année passée : stagiaires, heures, recettes. Il se dépose en ligne sur Mon activité formation, à la date fixée chaque année par le ministère du Travail (le formulaire indique avant le 30 avril). Sans BPF, ou sans formation réalisée, la déclaration d'activité tombe et tout est à refaire.",
    pourPasser: 'Le BPF de cette année est déposé sur Mon activité formation.',
    liens: [
      { nom: 'Mon activité formation, le dépôt du BPF', lien: 'https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/' },
      { nom: "La déclaration d'activité et le BPF (entreprendre.service-public.gouv.fr)", lien: 'https://entreprendre.service-public.gouv.fr/vosdroits/F19087' },
    ],
  },
  {
    slug: 'qualiopi-dans-la-duree',
    numero: 14,
    titre: 'Garder Qualiopi dans la durée',
    chaqueAnnee: true,
    resume:
      "Le certificat vaut trois ans. Un audit de surveillance a lieu entre le quatorzième et le vingt-deuxième mois, puis un audit de renouvellement avant la fin des trois ans. Chaque année, relis tes indicateurs et vérifie que les preuves suivent : l'auditeur juge sur tes sessions réelles.",
    pourPasser: "Tes indicateurs sont relus cette année et la date du prochain audit est notée.",
    liens: [
      {
        nom: 'Le guide de lecture du référentiel national qualité (France Compétences)',
        lien: 'https://www.francecompetences.fr/app/uploads/2024/10/Guide-de-lecture-Qualiopi-V8-du-23-novembre-2023.pdf',
      },
      { nom: "L'arrêté du 6 juin 2019 sur les audits (Légifrance)", lien: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000038565293' },
    ],
  },
  {
    slug: 'preuves-des-sessions',
    numero: 15,
    titre: 'Garder les preuves de chaque session',
    chaqueAnnee: true,
    resume:
      "Pour chaque session : la convocation, les feuilles d'émargement, l'évaluation des acquis, les appréciations des stagiaires (à chaud, et à froid si tu le prévois) et l'attestation de fin de formation. Range-les au fil de l'eau et garde-les au moins trois ans, la durée d'un cycle Qualiopi : c'est là que l'auditeur et les financeurs viennent chercher.",
    pourPasser: "Les preuves des sessions de l'année sont complètes et rangées.",
  },
  {
    slug: 'reclamations-et-amelioration',
    numero: 16,
    titre: 'Traiter les réclamations et améliorer',
    chaqueAnnee: true,
    resume:
      "Le critère 7 de Qualiopi demande trois choses : recueillir les appréciations (indicateur 30), traiter les difficultés et les réclamations (indicateur 31), en tirer des améliorations (indicateur 32). Une fois par an, relis tes réclamations et note ce que tu as changé grâce à elles.",
    pourPasser: "Le bilan de l'année est écrit : réclamations traitées, améliorations décidées.",
  },
  {
    slug: 'dossier-des-formateurs',
    numero: 17,
    titre: 'Tenir le dossier de chaque formateur',
    chaqueAnnee: true,
    resume:
      "Pour chaque formateur : son CV et les justificatifs de ses compétences (indicateur 21). S'il n'est pas salarié, un contrat de sous-traitance signé (indicateur 27) : tu restes responsable de la qualité de ce qu'il fait. Pour une formation vendue sur Mon Compte Formation, le sous-traitant doit aussi avoir son propre numéro de déclaration d'activité.",
    pourPasser: "Chaque formateur de l'année a son dossier complet.",
    liens: [
      { nom: 'Les règles de la sous-traitance (Mon Compte Formation)', lien: 'https://of.moncompteformation.gouv.fr/aide/quelles-sont-les-regles-du-recours-la-sous-traitance' },
    ],
  },
  // ---------------------------------------------------- 5. ÊTRE FINANÇABLE
  {
    slug: 'mon-compte-formation',
    numero: 18,
    titre: 'Vendre sur Mon Compte Formation',
    peutNePasConcerner: true,
    resume:
      "Pour être payée par le CPF, ta formation doit mener à une certification inscrite au RNCP ou au répertoire spécifique de France Compétences. Il te faut aussi un numéro de déclaration d'activité actif, Qualiopi pour ce type d'action, l'autorisation du porteur de la certification si elle n'est pas la tienne, et un BPF à jour. Ensuite, tu demandes ton référencement sur EDOF.",
    pourPasser: 'Ta première offre est en ligne sur Mon Compte Formation.',
    liens: [
      { nom: 'Comment être référencé sur Mon Compte Formation', lien: 'https://of.moncompteformation.gouv.fr/espace-public/aide/comment-etre-reference-sur-mon-compte-formation' },
      { nom: 'Démarrer sur EDOF', lien: 'https://of.moncompteformation.gouv.fr/espace-public/demarrer-sur-edof' },
      { nom: 'Les certifications professionnelles (France Compétences)', lien: 'https://www.francecompetences.fr/certification-professionnelle/' },
    ],
  },
  {
    slug: 'carif-oref-et-france-travail',
    numero: 19,
    titre: 'Publier ton offre au Carif-Oref',
    peutNePasConcerner: true,
    resume:
      "Ton offre déclarée au Carif-Oref de ta région devient visible des conseillers France Travail et remonte dans KAIROS, l'outil où France Travail suit les demandeurs d'emploi en formation et reçoit tes devis. Pour les entreprises, chaque OPCO a ses propres règles de prise en charge : renseigne-toi auprès de celui de tes clients.",
    pourPasser: 'Ton offre est publiée au Carif-Oref et ton accès KAIROS est ouvert.',
    liens: [
      { nom: 'Le réseau des Carif-Oref', lien: 'https://www.intercariforef.org/' },
      { nom: 'Présentation de KAIROS (France Travail)', lien: 'https://actuformation.francetravail.org/sujets/presentation-applicatif-kairos/' },
    ],
  },
];

export function trouverEtapeAcademie(slug: string): EtapeAcademie | undefined {
  return ETAPES_ACADEMIE.find((e) => e.slug === slug);
}
