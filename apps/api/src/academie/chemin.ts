/**
 * LE CHEMIN D'UNE ACADÉMIE : de l'idée à l'organisme certifié, puis ce qui
 * revient chaque année.
 *
 * Le pendant exact du chemin de l'association. Rien en base : un référentiel
 * écrit en dur, versionné avec le code, que l'espace coche au fur et à mesure.
 * Une étape se coche de deux façons : automatiquement quand la donnée arrive
 * (`deduite`), ou à la main par la personne.
 *
 * Six temps (le web les découpe par numéro, voir apps/web/src/app/academie/_chemin.ts) :
 *   Exister (1 à 5), Se tenir (6 à 8), Se certifier (9 à 12),
 *   À chaque session (13 à 15) : ce qui se refait pour chaque formation vendue,
 *   Chaque année (16 à 22) : ces étapes repassent « À faire » au 1er janvier,
 *   Être finançable (23 à 26) : chacune peut être marquée « Pas concerné ».
 *   L'agrément ESUS et le Carif-Oref (Dokelio en Île-de-France) y passent en
 *   tête depuis le 01/10/2026 : les numéros bougent, les slugs non.
 * Les temps « Chaque année » et « Être finançable » ont été ajoutés le
 * 01/10/2026, puis « À chaque session » le même jour. Les slugs ne bougent
 * jamais (les coches enregistrées portent les slugs, pas les numéros).
 *
 * Chaque étape dit aussi si elle est obligatoire, ce qui la déclenche, son
 * échéance légale et ce qu'il faut avoir fait avant (common/chemin-obligations.ts).
 *
 * Depuis le 01/10/2026 (deuxième passe), chaque étape a une priorité (1 à 3)
 * et dit les financements qu'elle ouvre (`debloque` : OPCO, CPF, France
 * Travail, Région…). Dans chaque temps, les étapes se rangent par priorité,
 * sans passer devant un prérequis, puis sont renumérotées : chaque temps garde
 * le même nombre d'étapes, donc les bornes du web restent justes. Toute étape
 * qui n'est pas obligatoire pour tous peut être marquée « Pas concerné ».
 */

import { ordonnerEtapes, type ObligationEtape, type ReperesFinancement } from '../common/chemin-obligations';

export interface EtapeAcademie extends ObligationEtape, ReperesFinancement {
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

export const VERSION_CHEMIN_ACADEMIE = '2026-10d';

/** Une étape telle qu'elle est écrite : la priorité et les financements viennent de `REPERES`. */
type EtapeEcrite = Omit<EtapeAcademie, keyof ReperesFinancement>;

const ETAPES_ECRITES: EtapeEcrite[] = [
  {
    slug: 'est-ce-de-la-formation',
    numero: 1,
    titre: 'Vérifier que c\'est bien de la formation',
    nature: 'CONSEILLE',
    resume:
      "Toute transmission de savoir n'est pas de la formation professionnelle. L'action doit viser une compétence pour l'emploi, avoir des objectifs évaluables, un programme, une durée et un public identifié. De l'animation, du conseil ou du coaching relèvent d'autres régimes, et n'ouvrent pas droit aux financements.",
    pourPasser: 'Tu sais dire en une phrase quelle compétence professionnelle ta formation fait acquérir.',
  },
  {
    slug: 'porteur-juridique',
    numero: 2,
    titre: 'Choisir le porteur juridique',
    nature: 'OBLIGATOIRE',
    declencheur: 'Avant de déclarer quoi que ce soit : il faut une structure qui porte l\'activité.',
    prerequis: ['est-ce-de-la-formation'],
    resume:
      "Trois voies : adosser l'organisme à une association qui existe déjà, créer une structure à part, ou déclarer une activité en nom propre. L'association qui forme reste une association ; c'est la déclaration d'activité, pas la forme juridique, qui fait l'organisme de formation.",
    pourPasser: 'La structure qui portera l\'activité est choisie.',
  },
  {
    slug: 'siret-et-ape',
    numero: 3,
    titre: 'Obtenir le SIRET et le bon code APE',
    nature: 'OBLIGATOIRE',
    declencheur: "Sans SIRET, pas de déclaration d'activité.",
    prerequis: ['porteur-juridique'],
    resume:
      "Sans SIRET, pas de déclaration d'activité. Le code APE de la formation continue d'adultes est le 85.59A ; un code différent ne bloque rien mais attire l'œil des financeurs, et se corrige auprès de l'INSEE.",
    pourPasser: 'Le SIRET est renseigné dans ta fiche.',
    deduite: 'siret',
  },
  {
    slug: 'premiere-convention',
    numero: 4,
    titre: 'Signer la première convention',
    nature: 'OBLIGATOIRE',
    declencheur: "La déclaration d'activité n'est recevable qu'avec une première convention ou un premier contrat.",
    prerequis: ['porteur-juridique', 'premiere-fiche-programme'],
    resume:
      "C'est le point que personne ne voit venir : la déclaration d'activité n'est recevable qu'accompagnée d'une première convention de formation professionnelle (ou d'un contrat, si l'apprenant paie lui-même). Il faut donc une première vente avant d'être déclaré.",
    pourPasser: 'Une convention ou un contrat de formation est signé.',
  },
  {
    slug: 'declaration-dreets',
    numero: 5,
    titre: 'Déposer la déclaration d\'activité',
    nature: 'OBLIGATOIRE',
    declencheur: 'Dès la première convention ou le premier contrat de formation signé.',
    echeance: { texte: 'Dans les 3 mois après la première convention.' },
    prerequis: ['siret-et-ape', 'premiere-convention'],
    resume:
      "Le dossier part à la DREETS de ta région, dans les trois mois qui suivent la première convention. En retour, le numéro de déclaration d'activité (NDA), onze chiffres. Il ne vaut pas agrément et ne se présente jamais comme tel : la mention exacte est « Cet enregistrement ne vaut pas agrément de l'État ».",
    pourPasser: 'Ton NDA est renseigné dans ta fiche.',
    deduite: 'nda',
  },
  {
    slug: 'documents-socles',
    numero: 6,
    titre: 'Écrire les documents socles',
    nature: 'OBLIGATOIRE',
    declencheur: 'Le règlement intérieur est obligatoire dès le premier stagiaire (article L6352-3 du code du travail).',
    prerequis: ['porteur-juridique'],
    resume:
      "Quatre pièces qu'on te demandera tout le temps : le règlement intérieur, les conditions générales de vente, le livret d'accueil et la procédure de réclamation. Elles se rédigent une fois et servent des années.",
    pourPasser: 'Les quatre pièces sont dans ton secrétariat.',
  },
  {
    slug: 'referents',
    numero: 7,
    titre: 'Désigner le référent handicap',
    nature: 'SI_CONCERNE',
    declencheur: 'Exigé pour Qualiopi (indicateur 26), et dans tout CFA.',
    resume:
      "Obligatoire, et vérifié en audit : une personne nommée, joignable, dont le nom est publié. Elle n'a pas à être experte : elle doit savoir orienter et adapter. Le référent pédagogique se désigne dans la foulée.",
    pourPasser: 'Le référent handicap est nommé dans ta fiche.',
    deduite: 'referentHandicap',
  },
  {
    slug: 'premiere-fiche-programme',
    numero: 8,
    titre: 'Bâtir la première fiche programme',
    nature: 'OBLIGATOIRE',
    declencheur: "Avant toute inscription : le programme est remis au stagiaire (article L6353-8).",
    prerequis: ['est-ce-de-la-formation'],
    resume:
      "La fiche conforme dit tout avant l'inscription : objectifs évaluables, prérequis, public, durée, modalités, tarif, délais d'accès, méthodes d'évaluation, accessibilité aux personnes handicapées. C'est la pièce que l'auditeur ouvre en premier, et celle que le financeur lit.",
    pourPasser: 'Une formation complète est publiée dans ton catalogue.',
  },
  {
    slug: 'dossier-qualiopi',
    numero: 9,
    titre: 'Monter le dossier Qualiopi',
    nature: 'SI_CONCERNE',
    declencheur: 'Pour toucher des fonds publics ou mutualisés : CPF, OPCO, France Travail, région.',
    prerequis: ['declaration-dreets', 'documents-socles', 'referents', 'premiere-fiche-programme'],
    resume:
      "Sept critères, trente-deux indicateurs, une preuve pour chacun. Tous ne s'appliquent pas à tout le monde : les indicateurs de l'apprentissage et ceux du bilan de compétences ne concernent que ceux qui en font. La certification est obligatoire pour tout financement public ou mutualisé.",
    pourPasser: 'Chaque indicateur qui te concerne a sa preuve déposée.',
  },
  {
    slug: 'choisir-certificateur',
    numero: 10,
    titre: 'Choisir un certificateur et planifier l\'audit',
    nature: 'SI_CONCERNE',
    declencheur: 'Pour toucher des fonds publics ou mutualisés : CPF, OPCO, France Travail, région.',
    prerequis: ['dossier-qualiopi'],
    resume:
      "L'audit se passe avec un organisme certificateur accrédité par le COFRAC. Les tarifs et les délais varient beaucoup : il vaut la peine d'en consulter trois. Compte plusieurs semaines entre la demande et la date.",
    pourPasser: 'La date de ton audit initial est posée.',
    deduite: 'auditPrevuLe',
  },
  {
    slug: 'passer-audit',
    numero: 11,
    titre: 'Passer l\'audit et lever les écarts',
    nature: 'SI_CONCERNE',
    declencheur: 'Pour toucher des fonds publics ou mutualisés : CPF, OPCO, France Travail, région.',
    echeance: { texte: 'Une non-conformité mineure se lève sous 3 mois.' },
    prerequis: ['choisir-certificateur'],
    resume:
      "L'auditeur échantillonne : il demande des preuves sur des sessions réelles, pas des modèles vides. Une non-conformité mineure se lève sous trois mois ; une majeure bloque la certification. Le certificat vaut trois ans, avec un audit de surveillance entre le quatorzième et le vingt-deuxième mois.",
    pourPasser: 'Ton certificat est obtenu et ses dates sont renseignées.',
    deduite: 'certifieDu',
  },
  {
    slug: 'ouvrir-financements',
    numero: 12,
    titre: 'S\'ouvrir aux financements',
    nature: 'SI_CONCERNE',
    declencheur: 'Pour toucher des fonds publics ou mutualisés : CPF, OPCO, France Travail, région.',
    prerequis: ['passer-audit'],
    resume:
      "Certifié, tu peux te référencer : EDOF pour le CPF, les OPCO pour les entreprises, le Carif-Oref et France Travail pour les demandeurs d'emploi. Le détail de chaque financement suit plus bas dans le chemin, et le bilan pédagogique et financier revient chaque année.",
    pourPasser: 'Tu es référencé sur au moins un dispositif de financement.',
  },
  // -------------------------------------------------- 4. À CHAQUE SESSION
  {
    slug: 'convention-ou-contrat-conforme',
    numero: 13,
    titre: 'Signer une convention ou un contrat conforme',
    nature: 'OBLIGATOIRE',
    declencheur: "Pour chaque vente : une convention avec l'entreprise qui paie, un contrat avec la personne qui paie elle-même.",
    echeance: { texte: 'Particulier : 10 jours pour se rétracter, et pas plus de 30 % du prix payé à la signature.' },
    prerequis: ['premiere-fiche-programme'],
    resume:
      "La convention dit l'intitulé, la nature, la durée, l'effectif, le déroulement, la sanction et le prix de la formation. Avec un particulier qui paie lui-même, c'est un contrat : il a dix jours pour se rétracter, rien ne se paie avant, et le premier versement ne dépasse pas 30 % du prix.",
    pourPasser: 'Ton modèle de convention et ton modèle de contrat contiennent toutes les mentions obligatoires.',
    liens: [
      {
        nom: 'Le guide des droits et obligations des prestataires de formation (DREETS Bretagne)',
        lien: 'https://bretagne.dreets.gouv.fr/sites/bretagne.dreets.gouv.fr/IMG/pdf/guide_droits_et_obligations.pdf',
      },
    ],
  },
  {
    slug: 'informer-avant-l-entree',
    numero: 14,
    titre: "Informer le stagiaire avant l'entrée",
    nature: 'OBLIGATOIRE',
    declencheur: "Pour chaque stagiaire, avant son inscription définitive (articles L6353-8 et L6353-9).",
    echeance: { texte: "Avant l'inscription définitive et tout paiement." },
    prerequis: ['documents-socles', 'premiere-fiche-programme'],
    resume:
      "Avant l'inscription définitive, le stagiaire reçoit le programme et les objectifs, la liste des formateurs et leurs titres, les horaires, les modalités d'évaluation, le contact d'une personne pour ses questions, et le règlement intérieur. S'il paie lui-même, il reçoit aussi les tarifs et les conditions d'abandon.",
    pourPasser: 'Chaque stagiaire reçoit ce dossier avant de s\'inscrire, et tu en gardes la preuve.',
  },
  {
    slug: 'attestation-de-fin-de-formation',
    numero: 15,
    titre: "Remettre l'attestation de fin de formation",
    nature: 'OBLIGATOIRE',
    declencheur: 'À la fin de chaque formation, pour chaque stagiaire (article L6353-1).',
    echeance: { texte: "À l'issue de la formation." },
    prerequis: ['convention-ou-contrat-conforme'],
    resume:
      "À la fin de la formation, chaque stagiaire reçoit une attestation qui dit les objectifs, la nature et la durée de l'action, et les résultats de l'évaluation des acquis. C'est aussi une preuve pour le financeur et pour l'auditeur.",
    pourPasser: 'Ton modèle d\'attestation porte les quatre mentions, et chaque stagiaire de l\'année a reçu la sienne.',
  },
  // ------------------------------------------------------ 5. CHAQUE ANNÉE
  {
    slug: 'bilan-pedagogique-et-financier',
    numero: 16,
    titre: 'Envoyer le bilan pédagogique et financier',
    nature: 'OBLIGATOIRE',
    declencheur: "Chaque année, dès que tu as un numéro de déclaration d'activité, même sans formation dans l'année.",
    echeance: {
      texte: 'Chaque année, à la date fixée par le ministère (le formulaire indique avant le 30 avril).',
      dateFixe: '04-30',
      indicative: true,
    },
    prerequis: ['declaration-dreets'],
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
    numero: 17,
    titre: 'Garder Qualiopi dans la durée',
    nature: 'SI_CONCERNE',
    declencheur: 'Dès que tu es certifié Qualiopi.',
    echeance: { texte: 'Audit de surveillance entre le 14e et le 22e mois, renouvellement avant la fin des 3 ans.' },
    prerequis: ['passer-audit'],
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
    numero: 18,
    titre: 'Garder les preuves de chaque session',
    nature: 'OBLIGATOIRE',
    declencheur: "Pour chaque session : l'émargement et l'attestation prouvent la formation aux financeurs et à l'auditeur.",
    prerequis: ['attestation-de-fin-de-formation'],
    chaqueAnnee: true,
    resume:
      "Pour chaque session : la convocation, les feuilles d'émargement, l'évaluation des acquis, les appréciations des stagiaires (à chaud, et à froid si tu le prévois) et l'attestation de fin de formation. Range-les au fil de l'eau et garde-les au moins trois ans, la durée d'un cycle Qualiopi : c'est là que l'auditeur et les financeurs viennent chercher.",
    pourPasser: "Les preuves des sessions de l'année sont complètes et rangées.",
  },
  {
    slug: 'reclamations-et-amelioration',
    numero: 19,
    titre: 'Traiter les réclamations et améliorer',
    nature: 'SI_CONCERNE',
    declencheur: 'Exigé par Qualiopi (critère 7).',
    prerequis: ['passer-audit'],
    chaqueAnnee: true,
    resume:
      "Le critère 7 de Qualiopi demande trois choses : recueillir les appréciations (indicateur 30), traiter les difficultés et les réclamations (indicateur 31), en tirer des améliorations (indicateur 32). Une fois par an, relis tes réclamations et note ce que tu as changé grâce à elles.",
    pourPasser: "Le bilan de l'année est écrit : réclamations traitées, améliorations décidées.",
  },
  {
    slug: 'dossier-des-formateurs',
    numero: 20,
    titre: 'Tenir le dossier de chaque formateur',
    nature: 'SI_CONCERNE',
    declencheur: 'Dès que quelqu\'un d\'autre que toi forme. Exigé par Qualiopi (indicateurs 21 et 27).',
    chaqueAnnee: true,
    resume:
      "Pour chaque formateur : son CV et les justificatifs de ses compétences (indicateur 21). S'il n'est pas salarié, un contrat de sous-traitance signé (indicateur 27) : tu restes responsable de la qualité de ce qu'il fait. Pour une formation vendue sur Mon Compte Formation, le sous-traitant doit aussi avoir son propre numéro de déclaration d'activité.",
    pourPasser: "Chaque formateur de l'année a son dossier complet.",
    liens: [
      { nom: 'Les règles de la sous-traitance (Mon Compte Formation)', lien: 'https://of.moncompteformation.gouv.fr/aide/quelles-sont-les-regles-du-recours-la-sous-traitance' },
    ],
  },
  {
    slug: 'declarer-les-modifications',
    numero: 21,
    titre: 'Déclarer les changements à la DREETS',
    chaqueAnnee: true,
    nature: 'OBLIGATOIRE',
    declencheur: "À chaque changement : adresse, dirigeant, forme juridique, SIRET, ou arrêt de l'activité.",
    echeance: { texte: 'Dans les 30 jours après le changement.' },
    prerequis: ['declaration-dreets'],
    resume:
      "Ta déclaration d'activité doit rester juste. Un changement d'adresse, de dirigeant, de statut ou de SIRET se signale dans les trente jours (article R6351-8 du code du travail). Les petites mises à jour se font sur Mon activité formation ; un changement de SIREN ou de région passe par le service de contrôle de ta DREETS. Rien n'a changé dans l'année ? Coche l'étape : tu as vérifié.",
    pourPasser: "Chaque changement de l'année est déclaré, ou tu as vérifié qu'il n'y en a pas eu.",
    liens: [
      { nom: "Mon activité formation", lien: 'https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/' },
      {
        nom: 'Votre situation a changé ? (DREETS Occitanie)',
        lien: 'https://occitanie.dreets.gouv.fr/Vous-etes-enregistre-comme-prestataire-de-formation-et-votre-situation-a-change',
      },
    ],
  },
  {
    slug: 'publier-les-resultats',
    numero: 22,
    titre: 'Publier tes indicateurs de résultats',
    chaqueAnnee: true,
    nature: 'SI_CONCERNE',
    declencheur: 'Dès que tu es certifié Qualiopi (indicateur 2).',
    prerequis: ['passer-audit'],
    resume:
      "Qualiopi demande de diffuser des indicateurs de résultats adaptés à tes formations et à tes publics : taux de satisfaction, taux de réussite ou d'obtention, nombre de stagiaires. Chaque année, mets-les à jour sur ton site et dans ton catalogue, avec leur date.",
    pourPasser: "Tes indicateurs de l'année sont publiés, avec leur date.",
    liens: [
      {
        nom: 'Le guide de lecture du référentiel national qualité (France Compétences)',
        lien: 'https://www.francecompetences.fr/app/uploads/2024/10/Guide-de-lecture-Qualiopi-V8-du-23-novembre-2023.pdf',
      },
    ],
  },
  // ---------------------------------------------------- 6. ÊTRE FINANÇABLE
  {
    slug: 'agrement-esus',
    numero: 23,
    titre: "Obtenir l'agrément ESUS",
    nature: 'SI_CONCERNE',
    declencheur: "Pour accéder aux financements solidaires (épargne salariale solidaire, investisseurs solidaires), ou quand un financeur le demande.",
    echeance: { texte: "Valable 5 ans, ou 2 ans si la structure a moins de 3 ans : à redemander avant la fin." },
    prerequis: ['porteur-juridique', 'siret-et-ape'],
    peutNePasConcerner: true,
    resume:
      "L'agrément « Entreprise solidaire d'utilité sociale » (article L3332-17-1 du code du travail) est demandé par la structure qui porte l'activité : pour une académie adossée à une association, c'est l'association. Il ouvre l'accès à l'épargne salariale solidaire (les fonds dits 90/10), à une réduction d'impôt majorée pour ceux qui investissent chez toi, et à certains financements solidaires. Certaines structures l'ont de plein droit (insertion par l'activité économique, entreprises adaptées, ESAT, aide sociale à l'enfance, associations reconnues d'utilité publique qui poursuivent une utilité sociale, entre autres). Les autres, dont la plupart des associations, montrent une utilité sociale réelle (publics fragiles, cohésion territoriale, éducation à la citoyenneté, développement durable), des salaires plafonnés (la moyenne des cinq plus hauts sous 7 SMIC, le plus haut sous 10 SMIC) et des statuts qui l'écrivent. La demande se fait en ligne sur la plateforme ESUS ; c'est la direction départementale du siège (DDETS) qui instruit.",
    pourPasser: "L'agrément est obtenu, et sa date de fin est notée pour le redemander à temps.",
    liens: [
      { nom: 'La plateforme de demande ESUS', lien: 'https://esus.economie.gouv.fr/' },
      { nom: "L'agrément ESUS (economie.gouv.fr)", lien: 'https://www.economie.gouv.fr/entreprises/agrement-entreprise-solidaire-utilite-sociale-ess' },
      { nom: "Demander l'agrément ESUS en Île-de-France (DRIEETS)", lien: 'https://idf.drieets.gouv.fr/Vous-souhaitez-faire-une-demande-d-agrement-ESUS' },
    ],
  },
  {
    slug: 'carif-oref-et-france-travail',
    numero: 24,
    titre: 'Publier ton offre au Carif-Oref (Dokelio en Île-de-France)',
    nature: 'SI_CONCERNE',
    declencheur: 'Pour former des demandeurs d\'emploi financés par France Travail ou la région.',
    prerequis: ['passer-audit'],
    peutNePasConcerner: true,
    resume:
      "Chaque région a sa base de l'offre de formation, tenue par son Carif-Oref. En Île-de-France, c'est Dokelio+, tenue par la Région depuis la fermeture de Défi métiers fin 2022 : tu y crées le compte de ton organisme, puis tu y saisis chaque formation. Ton offre devient visible des conseillers France Travail et remonte dans KAIROS, l'outil où France Travail suit les demandeurs d'emploi en formation et reçoit tes devis. Pour les entreprises, chaque OPCO a ses propres règles de prise en charge : renseigne-toi auprès de celui de tes clients.",
    pourPasser: 'Ton offre est publiée dans la base de ta région (Dokelio+ en Île-de-France) et ton accès KAIROS est ouvert.',
    liens: [
      { nom: 'En Île-de-France : Dokelio+ (Région Île-de-France)', lien: 'https://dokelio.iledefrance.fr/' },
      { nom: 'Le réseau des Carif-Oref', lien: 'https://www.intercariforef.org/' },
      { nom: 'Présentation de KAIROS (France Travail)', lien: 'https://actuformation.francetravail.org/sujets/presentation-applicatif-kairos/' },
    ],
  },
  {
    slug: 'mon-compte-formation',
    numero: 25,
    titre: 'Vendre sur Mon Compte Formation',
    nature: 'SI_CONCERNE',
    declencheur: 'Pour vendre des formations payées par le CPF.',
    prerequis: ['passer-audit', 'bilan-pedagogique-et-financier'],
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
    slug: 'tva-des-formations',
    numero: 26,
    titre: 'Vérifier la TVA de tes formations',
    peutNePasConcerner: true,
    nature: 'SI_CONCERNE',
    declencheur: "Si ta structure doit la TVA sur ses ventes, ou en cas de doute.",
    prerequis: ['declaration-dreets'],
    resume:
      "La formation professionnelle continue peut être exonérée de TVA (article 261-4-4° a du code général des impôts), sur attestation demandée à la DREETS (formulaire 3511). L'exonération vaut à partir de l'attestation, pas avant. Une association à gestion désintéressée qui ne concurrence pas d'entreprise n'est en général pas soumise à la TVA : dans ce cas, choisis « Pas concerné ».",
    pourPasser: "Tu sais si tes formations sont soumises à la TVA, et tu as l'attestation si tu en as besoin.",
    liens: [
      {
        nom: 'Le guide des droits et obligations des prestataires de formation (DREETS Bretagne)',
        lien: 'https://bretagne.dreets.gouv.fr/sites/bretagne.dreets.gouv.fr/IMG/pdf/guide_droits_et_obligations.pdf',
      },
    ],
  },
];

const FONDS_PUBLICS = ['OPCO', 'CPF', 'France Travail (AIF)', 'Région'];

/** Priorité 1 : obligation à échéance, ou étape qui bloque un financement. */
const REPERES: Record<string, ReperesFinancement> = {
  // Exister
  'est-ce-de-la-formation': { priorite: 2 },
  'porteur-juridique': { priorite: 1 },
  'siret-et-ape': { priorite: 1 },
  'premiere-convention': { priorite: 1, debloque: ['Première vente'] },
  'declaration-dreets': { priorite: 1, debloque: ['Conventions avec les entreprises', 'OPCO'] },
  // Se tenir
  'documents-socles': { priorite: 1 },
  referents: { priorite: 2 },
  'premiere-fiche-programme': { priorite: 1 },
  // Se certifier
  'dossier-qualiopi': { priorite: 1, debloque: FONDS_PUBLICS },
  'choisir-certificateur': { priorite: 1, debloque: FONDS_PUBLICS },
  'passer-audit': { priorite: 1, debloque: FONDS_PUBLICS },
  'ouvrir-financements': { priorite: 1, debloque: FONDS_PUBLICS },
  // À chaque session
  'convention-ou-contrat-conforme': { priorite: 1, debloque: ['OPCO'] },
  'informer-avant-l-entree': { priorite: 1 },
  'attestation-de-fin-de-formation': { priorite: 1, debloque: ['Paiement des financeurs'] },
  // Chaque année
  'bilan-pedagogique-et-financier': { priorite: 1, debloque: ['Maintien du NDA', 'CPF'] },
  'qualiopi-dans-la-duree': { priorite: 1, debloque: FONDS_PUBLICS },
  'preuves-des-sessions': { priorite: 2, debloque: ['Paiement des financeurs'] },
  'reclamations-et-amelioration': { priorite: 2 },
  'dossier-des-formateurs': { priorite: 2 },
  'declarer-les-modifications': { priorite: 1 },
  'publier-les-resultats': { priorite: 2 },
  // Être finançable
  'agrement-esus': { priorite: 1, debloque: ['Épargne solidaire', 'Investisseurs solidaires'] },
  'carif-oref-et-france-travail': { priorite: 1, debloque: ['France Travail (AIF)', 'Région'] },
  'mon-compte-formation': { priorite: 1, debloque: ['CPF'] },
  'tva-des-formations': { priorite: 3 },
};

/** Les temps du chemin, par numéro d'écriture (le web a les mêmes bornes, apps/web/src/app/academie/_chemin.ts). */
const FIN_DES_TEMPS = [5, 8, 12, 15, 22, Infinity];
const tempsDuNumero = (n: number) => FIN_DES_TEMPS.findIndex((fin) => n <= fin);

export const ETAPES_ACADEMIE: EtapeAcademie[] = ordonnerEtapes(
  ETAPES_ECRITES.map((e): EtapeAcademie => ({
    ...e,
    ...(REPERES[e.slug] ?? { priorite: 2 }),
    peutNePasConcerner: e.peutNePasConcerner ?? e.nature !== 'OBLIGATOIRE',
  })),
  (e) => tempsDuNumero(e.numero),
);

export function trouverEtapeAcademie(slug: string): EtapeAcademie | undefined {
  return ETAPES_ACADEMIE.find((e) => e.slug === slug);
}
