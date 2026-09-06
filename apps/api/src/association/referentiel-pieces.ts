/**
 * LE RÉFÉRENTIEL DES PIÈCES D'UNE ASSOCIATION.
 *
 * Chaque pièce dit d'où elle vient, combien de temps elle vaut, et à quoi elle
 * sert. C'est un référentiel VERSIONNÉ et SOURCÉ : une pièce sans source ne
 * doit pas y entrer, parce que l'outil affiche ces obligations à des gens qui
 * vont les croire. Une obligation périmée affichée avec assurance détruit la
 * confiance en un instant.
 *
 * ⚠ À FAIRE VALIDER PAR UN JURISTE avant la mise en ligne payante : durées de
 * validité, textes de référence, et liste des pièces exigées par dispositif.
 * Les valeurs ci-dessous sont celles des formulaires officiels et de la
 * pratique courante des financeurs ; elles sont datées.
 */

export type CategoriePiece =
  | 'IDENTITE'
  | 'GOUVERNANCE'
  | 'FINANCIER'
  | 'ASSURANCE'
  | 'AGREMENT'
  | 'RH';

export interface TypeDePiece {
  code: string;
  libelle: string;
  categorie: CategoriePiece;
  /** En une phrase, sans jargon : à quoi sert cette pièce et qui la demande. */
  pourquoi: string;
  /** Où la personne la trouve ou l'obtient. */
  ouLaTrouver: string;
  /** Durée de validité en mois ; absente = valable tant qu'elle n'est pas remplacée. */
  dureeValiditeMois?: number;
  /** À renouveler à chaque exercice comptable. */
  parExercice?: boolean;
  /** Texte, formulaire ou pratique qui fonde l'exigence. */
  source: string;
  /** Date de dernière vérification du contenu de cette entrée. */
  verifieLe: string;
  /** Peut-on la DÉDUIRE des données publiques (RNA, SIRENE) sans dépôt ? */
  deductible?: 'RNA' | 'SIRENE';
}

export const VERSION_REFERENTIEL = '2026-09-07';

export const TYPES_DE_PIECES: readonly TypeDePiece[] = [
  {
    code: 'STATUTS',
    libelle: 'Statuts en vigueur',
    categorie: 'IDENTITE',
    pourquoi:
      "C'est la carte d'identité de l'association : son nom, son objet, comment elle décide. Tous les financeurs les demandent.",
    ouLaTrouver:
      "Le document signé lors de la création, ou la dernière version modifiée en assemblée générale extraordinaire. Si vous ne les retrouvez pas, la préfecture (greffe des associations) en conserve une copie.",
    source: 'Loi du 1er juillet 1901, art. 5 ; formulaire CERFA 12156*06 (pièces à joindre)',
    verifieLe: '2026-09-07',
  },
  {
    code: 'RECEPISSE_PREFECTURE',
    libelle: 'Récépissé de déclaration en préfecture (numéro RNA)',
    categorie: 'IDENTITE',
    pourquoi:
      "La preuve que l'association existe officiellement. Le numéro RNA commence par W et figure sur ce récépissé.",
    ouLaTrouver:
      "Reçu par courrier ou dans votre espace sur le site des démarches associatives après la déclaration. Le numéro RNA se retrouve aussi sur le Journal officiel des associations.",
    source: 'Loi du 1er juillet 1901, art. 5 ; décret du 16 août 1901',
    verifieLe: '2026-09-07',
    deductible: 'RNA',
  },
  {
    code: 'JOAFE',
    libelle: "Publication au Journal officiel des associations (JOAFE)",
    categorie: 'IDENTITE',
    pourquoi:
      "Certains financeurs demandent l'annonce de création. Elle est gratuite depuis 2020 et se retrouve en ligne.",
    ouLaTrouver: "Sur le site du Journal officiel, rubrique associations, en cherchant votre nom ou votre numéro RNA.",
    source: 'Décret du 16 août 1901, art. 1 ; gratuité depuis le 1er janvier 2020',
    verifieLe: '2026-09-07',
    deductible: 'RNA',
  },
  {
    code: 'SIRET',
    libelle: 'Avis de situation SIRENE (numéro SIRET)',
    categorie: 'IDENTITE',
    pourquoi:
      "Sans SIRET, aucune subvention ne peut être versée : c'est le numéro que l'administration utilise pour payer.",
    ouLaTrouver:
      "Demande d'immatriculation à l'INSEE (gratuite). Une fois obtenu, l'avis de situation se télécharge à tout moment sur le site de l'INSEE.",
    source: 'Formulaire CERFA 12156*06, rubrique 1 ; pratique de tous les financeurs publics',
    verifieLe: '2026-09-07',
    deductible: 'SIRENE',
  },
  {
    code: 'LISTE_DIRIGEANTS',
    libelle: 'Liste des dirigeants en exercice',
    categorie: 'GOUVERNANCE',
    pourquoi:
      "Le financeur veut savoir qui engage l'association. La liste doit correspondre à la dernière déclaration faite en préfecture.",
    ouLaTrouver:
      "Le procès-verbal de la dernière assemblée générale qui a élu le bureau, et le récépissé de la déclaration de changement de dirigeants.",
    source: 'Loi du 1er juillet 1901, art. 5 (déclaration des changements dans les trois mois)',
    verifieLe: '2026-09-07',
  },
  {
    code: 'RIB',
    libelle: "Relevé d'identité bancaire au nom de l'association",
    categorie: 'IDENTITE',
    pourquoi:
      "La subvention est virée sur ce compte. Il doit être au nom exact de l'association, jamais d'une personne.",
    ouLaTrouver: "Votre banque, dans l'espace en ligne ou sur le chéquier.",
    source: 'Formulaire CERFA 12156*06, pièces à joindre',
    verifieLe: '2026-09-07',
  },
  {
    code: 'ASSURANCE_RC',
    libelle: "Attestation d'assurance responsabilité civile",
    categorie: 'ASSURANCE',
    pourquoi:
      "Elle couvre les dommages que l'association pourrait causer lors de ses activités. Beaucoup de communes et de financeurs l'exigent, et elle expire chaque année.",
    ouLaTrouver: "Votre assureur vous l'envoie chaque année ; sinon, demandez-la, elle est gratuite.",
    dureeValiditeMois: 12,
    source: 'Pratique courante des financeurs ; obligatoire pour certaines activités (accueil de mineurs, sport)',
    verifieLe: '2026-09-07',
  },
  {
    code: 'RAPPORT_ACTIVITE',
    libelle: "Rapport d'activité de l'année précédente",
    categorie: 'FINANCIER',
    pourquoi:
      "Ce que l'association a fait l'an dernier. Pour une association créée dans l'année, on le remplace par une présentation du projet.",
    ouLaTrouver: "Rédigé avant l'assemblée générale annuelle ; c'est le texte lu aux adhérents.",
    parExercice: true,
    source: 'Formulaire CERFA 12156*06, rubrique 7 ; pratique des financeurs',
    verifieLe: '2026-09-07',
  },
  {
    code: 'COMPTES_ANNUELS',
    libelle: "Comptes de l'année précédente approuvés en assemblée générale",
    categorie: 'FINANCIER',
    pourquoi:
      "Les recettes et dépenses de l'an dernier, votées par les adhérents. Le financeur vérifie que l'association tient ses comptes.",
    ouLaTrouver:
      "Le bilan présenté à l'assemblée générale. Pour une petite association, un simple tableau recettes/dépenses suffit tant qu'elle reste sous les seuils légaux.",
    parExercice: true,
    source: 'Formulaire CERFA 12156*06, rubrique 7 ; obligation de comptabilité au-delà de 153 000 € d\'aides publiques',
    verifieLe: '2026-09-07',
  },
  {
    code: 'BUDGET_PREVISIONNEL',
    libelle: "Budget prévisionnel de l'année",
    categorie: 'FINANCIER',
    pourquoi:
      "Ce que l'association prévoit de dépenser et de recevoir cette année. Le financeur regarde si sa subvention a une place cohérente dedans.",
    ouLaTrouver: "À construire chaque année ; le chemin vous guide pour le faire en une heure.",
    parExercice: true,
    source: 'Formulaire CERFA 12156*06, rubrique 4 et 5',
    verifieLe: '2026-09-07',
  },
  {
    code: 'PV_DERNIERE_AG',
    libelle: 'Procès-verbal de la dernière assemblée générale',
    categorie: 'GOUVERNANCE',
    pourquoi:
      "La preuve que l'association vit : elle s'est réunie, a voté ses comptes, a élu ses dirigeants.",
    ouLaTrouver: "Rédigé après chaque assemblée générale et signé par le président et le secrétaire.",
    parExercice: true,
    source: 'Pratique des financeurs ; statuts de l\'association',
    verifieLe: '2026-09-07',
  },
  {
    code: 'ATTESTATION_URSSAF',
    libelle: 'Attestation de régularité URSSAF',
    categorie: 'RH',
    pourquoi:
      "Demandée dès que l'association a des salariés : elle prouve que les cotisations sont à jour. Elle vaut six mois.",
    ouLaTrouver: "Sur votre espace URSSAF en ligne, en quelques clics. Inutile si l'association n'a aucun salarié.",
    dureeValiditeMois: 6,
    source: 'Code du travail, art. L. 8222-1 (obligation de vigilance) ; pratique des financeurs',
    verifieLe: '2026-09-07',
  },
  {
    code: 'AGREMENT',
    libelle: 'Agréments et habilitations',
    categorie: 'AGREMENT',
    pourquoi:
      "Jeunesse et éducation populaire, sport, service civique, ESUS… Un agrément ouvre des financements et impose un renouvellement.",
    ouLaTrouver: "L'arrêté ou la décision reçue de l'administration qui l'a délivré.",
    source: 'Textes propres à chaque agrément',
    verifieLe: '2026-09-07',
  },
];

export function trouverTypeDePiece(code: string): TypeDePiece | undefined {
  return TYPES_DE_PIECES.find((t) => t.code === code);
}

/**
 * LES DISPOSITIFS DE DÉPART.
 *
 * Le référentiel complet (communes et intercommunalités du 77, département,
 * CAF, région, État) se construit dispositif par dispositif, chacun avec sa
 * source et sa date de vérification. On commence par ce qui est certain : le
 * dossier de demande standard de l'État et des collectivités (CERFA 12156),
 * qui sert de socle à presque tous les autres.
 */
export interface Dispositif {
  code: string;
  nom: string;
  financeur: string;
  description: string;
  piecesExigees: string[];
  modeDepot: string;
  lien?: string;
  source: string;
  verifieLe: string;
}

export const DISPOSITIFS: readonly Dispositif[] = [
  {
    code: 'CERFA_12156',
    nom: 'Demande de subvention standard (CERFA 12156)',
    financeur: 'État, collectivités territoriales et leurs établissements',
    description:
      "Le formulaire commun à la plupart des financeurs publics. Si vous savez le remplir, vous savez remplir presque tous les autres.",
    piecesExigees: [
      'STATUTS',
      'RECEPISSE_PREFECTURE',
      'SIRET',
      'LISTE_DIRIGEANTS',
      'RIB',
      'RAPPORT_ACTIVITE',
      'COMPTES_ANNUELS',
      'BUDGET_PREVISIONNEL',
    ],
    modeDepot: "En ligne sur Le Compte Asso pour l'État ; par le formulaire ou le portail propre à chaque collectivité.",
    lien: 'https://lecompteasso.associations.gouv.fr/',
    source: 'Formulaire CERFA 12156*06 et sa notice',
    verifieLe: '2026-09-07',
  },
  {
    code: 'FDVA_FONCTIONNEMENT',
    nom: 'FDVA 2 : fonctionnement et projets innovants',
    financeur: "État (fonds pour le développement de la vie associative), instruit par département",
    description:
      "Le premier financement de l'État accessible à une petite association, pour son fonctionnement ou un projet nouveau. Campagne annuelle, généralement au premier semestre.",
    piecesExigees: [
      'STATUTS',
      'RECEPISSE_PREFECTURE',
      'SIRET',
      'LISTE_DIRIGEANTS',
      'RIB',
      'RAPPORT_ACTIVITE',
      'COMPTES_ANNUELS',
      'BUDGET_PREVISIONNEL',
      'PV_DERNIERE_AG',
    ],
    modeDepot: 'En ligne sur Le Compte Asso, pendant la campagne de votre département.',
    lien: 'https://lecompteasso.associations.gouv.fr/',
    source: 'Note d\'orientation FDVA du ministère chargé de la vie associative ; campagne départementale',
    verifieLe: '2026-09-07',
  },
  {
    code: 'COMMUNE_77',
    nom: 'Subvention communale (Seine-et-Marne)',
    financeur: 'Votre commune ou intercommunalité',
    description:
      "Le premier chèque d'une petite association vient presque toujours de la mairie. Chaque commune a son formulaire et sa date, souvent à l'automne avant le vote du budget. Le référentiel commune par commune est en cours de constitution.",
    piecesExigees: [
      'STATUTS',
      'RECEPISSE_PREFECTURE',
      'SIRET',
      'LISTE_DIRIGEANTS',
      'RIB',
      'ASSURANCE_RC',
      'RAPPORT_ACTIVITE',
      'COMPTES_ANNUELS',
      'BUDGET_PREVISIONNEL',
    ],
    modeDepot: "Dossier papier ou formulaire en ligne selon la commune ; renseignez-vous au service vie associative de votre mairie.",
    source: 'Pratique courante des communes ; à préciser commune par commune',
    verifieLe: '2026-09-07',
  },
];

export function trouverDispositif(code: string): Dispositif | undefined {
  return DISPOSITIFS.find((d) => d.code === code);
}
