/**
 * NOS AGRÉMENTS.
 *
 * Un agrément, c'est une reconnaissance officielle : l'État (ou une
 * collectivité) dit « cette association remplit nos conditions ». Certains
 * ouvrent des financements réservés, d'autres autorisent une activité.
 *
 * Chaque fiche renvoie à la page officielle : c'est elle qui fait foi, les
 * conditions changent. Aucune condition n'est écrite ici sans venir de cette
 * page. Relu le 7 septembre 2026.
 */

export const AGREMENTS_VERIFIE_LE = '2026-09-07';

export interface Agrement {
  /** Sert d'ancre : /agrements#jep */
  code: string;
  nom: string;
  /** Qui le délivre. */
  par: string;
  /** Ce qu'il ouvre, en une phrase. */
  ouvre: string;
  /** Pour qui, écrit simplement. */
  pourQui: string;
  duree?: string;
  ou: string;
  lien: string;
  lienLibelle: string;
}

export interface FamilleAgrements {
  code: string;
  titre: string;
  enUnMot: string;
  agrements: Agrement[];
}

/** Le tronc commun : les conditions que presque tous les agréments reprennent. */
export const TRONC_COMMUN = {
  titre: 'Le tronc commun : ce qu’on te demandera dans tous les cas',
  enUnMot:
    "Avant tout agrément, l'administration vérifie trois choses, toujours les mêmes. Si elles sont vraies chez toi, tu peux demander presque n'importe quel agrément.",
  conditions: [
    {
      titre: 'Un objet d’intérêt général',
      detail: "L'association sert autre chose que ses propres membres : le quartier, les jeunes, les familles, la santé, la culture.",
    },
    {
      titre: 'Un fonctionnement démocratique',
      detail: 'Une assemblée générale par an, un bureau élu, des comptes rendus écrits : les décisions se prennent à plusieurs et se prouvent.',
    },
    {
      titre: 'La transparence financière',
      detail: 'Des comptes tenus et présentés en assemblée, un budget prévisionnel, un rapport financier.',
    },
    {
      titre: 'Le contrat d’engagement républicain',
      detail: "Depuis 2021, on le signe pour demander un agrément ou une subvention publique : respect des lois, de la laïcité, pas de discrimination, pas de violence.",
    },
    {
      titre: 'Souvent : trois ans d’existence',
      detail: 'Beaucoup d’agréments demandent que l’association existe depuis au moins trois ans. Vérifie sur la page officielle de celui que tu vises.',
    },
  ],
  lien: 'https://associations.gouv.fr/agrements',
  lienLibelle: 'Les agréments sur associations.gouv.fr',
};

export const FAMILLES_AGREMENTS: FamilleAgrements[] = [
  {
    code: 'GENERALISTE',
    titre: 'Les agréments généralistes',
    enUnMot: "Ils ne dépendent pas de ton domaine : c'est ta façon de fonctionner qui est reconnue.",
    agrements: [
      {
        code: 'jep',
        nom: 'Agrément jeunesse et éducation populaire (JEP)',
        par: "L'État, service jeunesse de ton département (SDJES)",
        ouvre: 'Des subventions réservées (dont les postes FONJEP) et une place dans les instances jeunesse du département.',
        pourQui:
          "Association qui agit pour les jeunes ou l'éducation populaire, qui existe depuis au moins 3 ans, avec un fonctionnement démocratique et des comptes transparents.",
        duree: '5 ans, renouvelable',
        ou: 'Auprès des services de l’État de ton département, souvent sur demarches-simplifiees.fr',
        lien: 'https://associations.gouv.fr/la-procedure-de-demande-dagrement-jep',
        lienLibelle: 'La procédure sur associations.gouv.fr',
      },
      {
        code: 'esus',
        nom: 'Agrément ESUS (entreprise solidaire d’utilité sociale)',
        par: 'La Dreets de ta région (dossier déposé au département du siège)',
        ouvre:
          "L'accès aux fonds d'épargne solidaire, une réduction d'impôt majorée pour ceux qui investissent, et des financements Bpifrance ou Banque des Territoires.",
        pourQui:
          "Structures de l'économie sociale et solidaire, associations comprises, dont l'utilité sociale est l'objectif principal et pèse au moins 66 % des charges d'exploitation, avec un encadrement des plus hauts salaires.",
        duree: '5 ans (2 ans si l’association a moins de 3 ans)',
        ou: 'Dossier à envoyer à la Dreets',
        lien: 'https://www.economie.gouv.fr/entreprises/agrement-entreprise-solidaire-utilite-sociale-ess',
        lienLibelle: 'L’agrément ESUS sur economie.gouv.fr',
      },
      {
        code: 'rup',
        nom: 'Reconnaissance d’utilité publique (RUP)',
        par: 'Le ministère de l’Intérieur, par décret',
        ouvre:
          "Le droit de recevoir des legs et donations, et une présomption : une association reconnue d'utilité publique est réputée remplir le tronc commun des agréments.",
        pourQui: "Grandes associations d'intérêt général, avec une ancienneté et des ressources significatives : c'est une reconnaissance rare et longue à obtenir.",
        ou: 'Demande au ministère de l’Intérieur',
        lien: 'https://www.interieur.gouv.fr/Le-ministere/Secretariat-general/Direction-des-libertes-publiques-et-des-affaires-juridiques/Associations-fondations-et-fonds-de-dotation',
        lienLibelle: 'Les associations au ministère de l’Intérieur',
      },
    ],
  },
  {
    code: 'DOMAINES',
    titre: 'Les agréments par domaine',
    enUnMot: "Selon ce que tu fais : l'école, le sport, l'environnement, la santé, l'accueil de volontaires.",
    agrements: [
      {
        code: 'education-nationale',
        nom: 'Association éducative complémentaire de l’enseignement public',
        par: 'Le recteur d’académie (agrément académique) ou le ministre (agrément national)',
        ouvre: "Le droit d'intervenir auprès des élèves, sur le temps scolaire ou en activités complémentaires, en tant que partenaire reconnu de l'école.",
        pourQui:
          "Association qui remplit le tronc commun, signe le contrat d'engagement républicain, apporte des interventions de qualité, complémentaires de l'enseignement public, et respecte la laïcité et la non-discrimination.",
        duree: '5 ans, renouvelable',
        ou: 'Auprès du rectorat de ton académie',
        lien: 'https://www.education.gouv.fr/les-associations-agreees-par-l-education-nationale-467806',
        lienLibelle: 'Les associations agréées sur education.gouv.fr',
      },
      {
        code: 'service-civique',
        nom: 'Agrément Service Civique',
        par: 'L’Agence du Service Civique (ou son délégué territorial)',
        ouvre: "Le droit d'accueillir des volontaires en Service Civique, dont l'indemnité est prise en charge par l'État.",
        pourQui: "Associations qui proposent des missions d'intérêt général à des jeunes de 16 à 25 ans (30 ans en situation de handicap).",
        ou: 'Demande en ligne sur le site de l’Agence du Service Civique',
        lien: 'https://www.service-civique.gouv.fr/organismes/accueillir-un-volontaire',
        lienLibelle: 'Accueillir un volontaire — service-civique.gouv.fr',
      },
      {
        code: 'sport',
        nom: 'Agrément sport',
        par: "L'État ; il découle en général de l'affiliation à une fédération sportive agréée",
        ouvre: "L'accès aux aides publiques du sport (dont l'Agence nationale du Sport) et la reconnaissance de ton club comme partenaire du service public du sport.",
        pourQui: 'Clubs et associations sportives, le plus souvent via leur fédération.',
        ou: 'Auprès de ta fédération, puis des services de l’État de ton département',
        lien: 'https://www.sports.gouv.fr/federations-sportives-agreees-1844',
        lienLibelle: 'Les fédérations agréées sur sports.gouv.fr',
      },
      {
        code: 'environnement',
        nom: 'Agrément de protection de l’environnement',
        par: 'Le préfet (cadre départemental ou régional) ou le ministre (cadre national)',
        ouvre: "Le droit de siéger dans les instances consultatives environnementales et une capacité renforcée à agir en justice pour l'environnement.",
        pourQui: "Associations dont l'objet est la protection de la nature, de l'eau, de l'air, des sols, des sites et paysages, ou la lutte contre les pollutions.",
        ou: 'Auprès de la préfecture ou de la Dreal',
        lien: 'https://www.ecologie.gouv.fr/politiques-publiques/participation-associations-dialogue-environnemental-agrement-habilitation',
        lienLibelle: 'L’agrément environnement sur ecologie.gouv.fr',
      },
      {
        code: 'usagers-sante',
        nom: 'Agrément des associations d’usagers du système de santé',
        par: 'Le ministère de la Santé (agrément national) ou le préfet de région (agrément régional)',
        ouvre: "Le droit de représenter les usagers dans les hôpitaux et les instances de santé publique.",
        pourQui: "Associations qui défendent les droits des malades et des usagers du système de santé.",
        ou: 'Auprès du ministère chargé de la santé ou de l’ARS',
        lien: 'https://sante.gouv.fr/systeme-de-sante/parcours-de-sante-vos-droits/representants-des-usagers/article/agrement-des-associations-d-usagers-du-systeme-de-sante',
        lienLibelle: 'L’agrément usagers sur sante.gouv.fr',
      },
      {
        code: 'services-a-la-personne',
        nom: 'Agrément « services à la personne » (SAP)',
        par: 'La Dreets (via la téléprocédure Nova)',
        ouvre: "Le droit d'exercer les activités de services à la personne soumises à agrément (garde d'enfants de moins de 3 ans, accompagnement de personnes fragiles).",
        pourQui: 'Structures, associations comprises, qui interviennent au domicile de publics fragiles.',
        ou: 'Téléprocédure Nova',
        lien: 'https://entreprendre.service-public.fr/vosdroits/R19148',
        lienLibelle: 'La démarche Nova sur service-public.fr',
      },
    ],
  },
];
