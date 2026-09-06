/**
 * LE CHEMIN : PILOTER UNE ASSOCIATION, UNE ÉTAPE À LA FOIS.
 *
 * Pour la personne qui vient de créer son association et ne sait pas par où
 * commencer. Chaque étape dit trois choses, et seulement trois : pourquoi (une
 * phrase), quoi faire (une action), combien de temps (une estimation honnête).
 *
 * Règles tenues par ce fichier :
 *  - aucun jargon sans son explication en place (voir `lexique`) ;
 *  - jamais de recommandation commerciale : les renvois vont vers les services
 *    publics, ou vers un outil quand il n'a pas d'équivalent public ;
 *  - une étape faite ailleurs se coche, on ne force personne à refaire ;
 *  - le chemin est gratuit et le reste.
 *
 * Chaque étape est aussi une page publique : c'est ce qui amène les
 * associations débutantes.
 */

export interface Renvoi {
  nom: string;
  lien: string;
  /** Une phrase : ce qu'on y fait. */
  pourQuoi: string;
}

export interface MotExplique {
  mot: string;
  explication: string;
}

export interface EtapeChemin {
  numero: number;
  slug: string;
  titre: string;
  /** Une phrase, sans jargon. */
  pourquoi: string;
  /** Les actions, dans l'ordre. Une action = une phrase qui commence par un verbe. */
  quoiFaire: string[];
  /** Estimation honnête, en langage courant. */
  dureeEstimee: string;
  renvois: Renvoi[];
  /** Ce que l'étape apporte une fois faite. */
  debloque: string;
  lexique: MotExplique[];
  /** Codes du référentiel des pièces que cette étape ajoute au classeur. */
  piecesAjoutees: string[];
  /** Peut-on vérifier l'étape automatiquement avec les données publiques ? */
  verifiableAvec?: 'RNA' | 'SIRENE';
}

export const ETAPES_CHEMIN: readonly EtapeChemin[] = [
  {
    numero: 1,
    slug: 'declarer-l-association',
    titre: "Déclarer l'association",
    pourquoi:
      "Tant qu'elle n'est pas déclarée, votre association n'existe pas aux yeux de l'administration : elle ne peut ni ouvrir un compte, ni recevoir un euro de subvention.",
    quoiFaire: [
      'Écrivez les statuts : le nom, le but, l\'adresse du siège, et comment les décisions se prennent. Un modèle officiel suffit pour commencer.',
      'Réunissez les membres fondateurs pour une assemblée générale constitutive, et notez qui est président, trésorier, secrétaire dans un procès-verbal.',
      'Déclarez l\'association en ligne sur le téléservice du service public. Vous recevrez un récépissé avec un numéro qui commence par W : c\'est votre numéro RNA.',
    ],
    dureeEstimee: 'Une soirée pour les statuts, une réunion pour l\'assemblée, dix minutes pour la déclaration en ligne. Le récépissé arrive sous quelques jours à quelques semaines.',
    renvois: [
      {
        nom: 'Déclarer une association (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R1757',
        pourQuoi: 'Le téléservice officiel de déclaration, gratuit.',
      },
      {
        nom: 'Rédiger les statuts (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1120',
        pourQuoi: 'Ce que les statuts doivent contenir, avec les modèles officiels.',
      },
    ],
    debloque: 'Le récépissé et le numéro RNA entrent dans votre classeur.',
    lexique: [
      { mot: 'Statuts', explication: "Le texte fondateur de l'association : son nom, son but, ses règles de décision." },
      { mot: 'Assemblée générale constitutive', explication: "La première réunion des fondateurs, où l'on adopte les statuts et désigne les responsables." },
      { mot: 'Récépissé', explication: "Le document que la préfecture vous renvoie pour dire « votre déclaration est enregistrée »." },
      { mot: 'RNA', explication: "Le répertoire national des associations. Votre numéro RNA commence par W et prouve que l'association est déclarée." },
    ],
    piecesAjoutees: ['STATUTS', 'RECEPISSE_PREFECTURE', 'JOAFE'],
    verifiableAvec: 'RNA',
  },
  {
    numero: 2,
    slug: 'obtenir-le-siret',
    titre: 'Obtenir le numéro SIRET',
    pourquoi:
      "Aucune subvention publique ne peut être versée sans SIRET : c'est le numéro qui permet à un financeur de vous payer.",
    quoiFaire: [
      "Demandez l'immatriculation de l'association auprès de l'INSEE, en ligne, avec votre récépissé de déclaration.",
      "Attendez le certificat d'inscription : il contient votre SIREN (9 chiffres) et votre SIRET (14 chiffres).",
    ],
    dureeEstimee: 'Dix minutes pour la demande ; le numéro arrive en général sous deux à quatre semaines.',
    renvois: [
      {
        nom: "Immatriculer l'association, obtenir le SIRET (service-public.gouv.fr)",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1926',
        pourQuoi: 'La démarche officielle, gratuite, et le lien vers le formulaire.',
      },
    ],
    debloque: 'Le SIRET entre dans votre classeur. Vous pouvez maintenant demander une subvention.',
    lexique: [
      { mot: 'SIRET', explication: "Le numéro à 14 chiffres qui identifie votre association auprès de l'administration et des financeurs." },
      { mot: 'SIREN', explication: 'Les 9 premiers chiffres du SIRET : ils identifient l\'association, les 5 suivants identifient l\'adresse.' },
      { mot: 'INSEE', explication: "L'organisme public qui attribue les numéros SIREN et SIRET." },
    ],
    piecesAjoutees: ['SIRET'],
    verifiableAvec: 'SIRENE',
  },
  {
    numero: 3,
    slug: 'les-cinq-pieces-d-identite',
    titre: "Les cinq pièces d'identité",
    pourquoi:
      "Tous les financeurs demandent les mêmes cinq documents. Les avoir sous la main, à jour, c'est la moitié de chaque dossier déjà faite.",
    quoiFaire: [
      'Rangez dans le classeur : les statuts, le récépissé de préfecture, la liste des dirigeants, le certificat SIRET et le RIB.',
      "Pour chaque pièce que vous n'avez pas, suivez l'indication « où la trouver » : la plupart se retrouvent en quelques minutes.",
    ],
    dureeEstimee: 'Une heure, si vous devez chercher. Cinq minutes si tout est déjà dans une boîte mail.',
    renvois: [],
    debloque: 'Votre classeur est prêt à 40 %. Chaque dossier futur partira de là.',
    lexique: [
      { mot: 'Liste des dirigeants', explication: 'Les noms, prénoms, adresses et fonctions des membres du bureau, tels que déclarés en préfecture.' },
      { mot: 'RIB', explication: "Le relevé d'identité bancaire du compte de l'association, pas celui d'une personne." },
    ],
    piecesAjoutees: ['LISTE_DIRIGEANTS', 'RIB'],
  },
  {
    numero: 4,
    slug: 'le-compte-bancaire-et-l-assurance',
    titre: "Le compte bancaire et l'assurance",
    pourquoi:
      "Le compte au nom de l'association sépare son argent de celui des personnes. L'assurance couvre les dégâts que votre activité pourrait causer à quelqu'un.",
    quoiFaire: [
      "Ouvrez un compte bancaire au nom de l'association, avec les statuts, le récépissé et le procès-verbal qui désigne le président et le trésorier.",
      "Souscrivez une assurance responsabilité civile adaptée à votre activité, et rangez l'attestation dans le classeur : elle est valable un an, on vous préviendra avant qu'elle expire.",
    ],
    dureeEstimee: 'Un rendez-vous en banque ou une demande en ligne ; un devis d\'assurance se fait en une demi-heure.',
    renvois: [
      {
        nom: "Assurance d'une association (service-public.gouv.fr)",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1124',
        pourQuoi: "Ce qui est obligatoire, ce qui est conseillé, selon l'activité.",
      },
    ],
    debloque: "L'attestation d'assurance entre dans le classeur, avec sa date de fin.",
    lexique: [
      { mot: 'Responsabilité civile', explication: "L'obligation de réparer un dommage causé à autrui. L'assurance RC paie à la place de l'association." },
      { mot: 'Attestation', explication: "Le document d'une page que l'assureur vous remet et que les financeurs demandent." },
    ],
    piecesAjoutees: ['ASSURANCE_RC'],
  },
  {
    numero: 5,
    slug: 'les-adherents-et-les-cotisations',
    titre: 'Les adhérents et les cotisations',
    pourquoi:
      "Un adhérent à jour de cotisation peut voter en assemblée générale. Sans liste d'adhérents, impossible de savoir si une décision est valable.",
    quoiFaire: [
      'Fixez le montant de la cotisation, ou décidez qu\'elle est gratuite : les deux sont possibles.',
      'Tenez la liste des adhérents à jour : nom, date d\'adhésion, cotisation payée ou non.',
      "Pour encaisser en ligne, un service de paiement pour associations fait le travail ; vous pourrez importer la liste ici ensuite.",
    ],
    dureeEstimee: 'Une réunion pour décider ; dix minutes pour ouvrir un espace de paiement en ligne.',
    renvois: [
      {
        nom: 'HelloAsso',
        lien: 'https://www.helloasso.com/',
        pourQuoi: 'Adhésions, dons et billetterie en ligne, sans frais pour l\'association.',
      },
    ],
    debloque: 'Votre répertoire des membres est ouvert.',
    lexique: [
      { mot: 'Adhérent', explication: "Une personne qui a rejoint l'association et, si une cotisation existe, l'a payée." },
      { mot: 'Quorum', explication: 'Le nombre minimum de membres présents pour qu\'une assemblée puisse décider valablement, si les statuts en prévoient un.' },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 6,
    slug: 'tenir-des-comptes-simples',
    titre: 'Tenir des comptes simples',
    pourquoi:
      "Un financeur veut savoir d'où vient l'argent et où il va. Pour une petite association, un cahier des recettes et des dépenses suffit.",
    quoiFaire: [
      'Notez chaque entrée et chaque sortie d\'argent, avec la date et le justificatif (facture, reçu).',
      "À la fin de l'année, faites le total : c'est votre compte de résultat. Ce que vous possédez et ce que vous devez, c'est votre bilan.",
      "Si l'association grandit, un logiciel de comptabilité associative ou un expert-comptable prendra le relais.",
    ],
    dureeEstimee: 'Une heure par mois pour tenir le cahier ; une demi-journée en fin d\'année.',
    renvois: [
      {
        nom: 'Réglementation comptable des associations (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/reglementation-comptable',
        pourQuoi: "Ce qui est exigé selon la taille et les subventions reçues.",
      },
    ],
    debloque: "Vos comptes annuels entreront dans le classeur à la fin de l'exercice.",
    lexique: [
      { mot: 'Exercice', explication: "La période de douze mois sur laquelle on fait les comptes, souvent l'année civile." },
      { mot: 'Compte de résultat', explication: "Le total des recettes moins le total des dépenses de l'exercice." },
      { mot: 'Bilan', explication: "La photo, à la fin de l'exercice, de ce que l'association possède et de ce qu'elle doit." },
    ],
    piecesAjoutees: ['COMPTES_ANNUELS'],
  },
  {
    numero: 7,
    slug: 'la-premiere-assemblee-generale',
    titre: 'La première assemblée générale',
    pourquoi:
      "C'est le moment où les membres approuvent les comptes et confirment les responsables. Le procès-verbal de cette réunion est demandé dans presque tous les dossiers.",
    quoiFaire: [
      "Convoquez les membres dans le délai prévu par vos statuts, avec l'ordre du jour.",
      "Le jour venu, faites signer une feuille d'émargement, présentez le rapport d'activité et les comptes, votez.",
      "Rédigez le procès-verbal : qui était là, ce qui a été décidé, avec quels votes. Signez-le et rangez-le dans le classeur.",
      "Si les dirigeants changent, déclarez le changement en préfecture dans les trois mois.",
    ],
    dureeEstimee: 'Deux heures de préparation, une réunion, une heure pour le procès-verbal.',
    renvois: [
      {
        nom: 'Changement de dirigeants (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34797',
        pourQuoi: 'La déclaration de changement de dirigeants, en ligne.',
      },
    ],
    debloque: 'Le procès-verbal et le rapport d\'activité entrent dans le classeur ; les mandats des dirigeants sont datés.',
    lexique: [
      { mot: 'Ordre du jour', explication: 'La liste des sujets qui seront traités pendant la réunion, envoyée avec la convocation.' },
      { mot: "Feuille d'émargement", explication: 'La liste des présents, signée par chacun : elle prouve que le quorum était atteint.' },
      { mot: 'Procès-verbal (PV)', explication: 'Le compte rendu écrit et signé de la réunion et de ses décisions.' },
      { mot: 'Mandat', explication: "La durée pendant laquelle une personne occupe une fonction (président, trésorier…), fixée par les statuts." },
    ],
    piecesAjoutees: ['PV_DERNIERE_AG', 'RAPPORT_ACTIVITE'],
  },
  {
    numero: 8,
    slug: 'le-projet-en-une-page',
    titre: 'Le projet en une page',
    pourquoi:
      "Chaque dossier de subvention demande de raconter ce que vous faites, pour qui, et avec quoi. Écrit une fois, ce texte sert partout.",
    quoiFaire: [
      'Répondez à trois questions : pour qui travaillez-vous, que faites-vous concrètement, avec quels moyens (personnes, lieux, matériel) ?',
      'Écrivez une page, pas plus. Des phrases courtes. Un financeur lit des dizaines de dossiers : il retient ce qui est clair.',
    ],
    dureeEstimee: 'Une heure, seul ou à deux. Le texte s\'améliorera à chaque dossier.',
    renvois: [],
    debloque: 'Votre projet associatif est prêt à être copié dans tous les dossiers.',
    lexique: [
      { mot: 'Projet associatif', explication: "Le texte qui dit ce que l'association veut faire et pourquoi. C'est le cœur de chaque demande." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 9,
    slug: 'le-premier-budget',
    titre: 'Le premier budget',
    pourquoi:
      "Un financeur ne donne pas d'argent sans savoir combien vous en avez besoin, pour quoi, et ce que vous apportez vous-même.",
    quoiFaire: [
      "Listez les dépenses de l'année à venir (matériel, location, déplacements, assurance…) et les recettes (cotisations, subventions espérées, ventes).",
      "Les deux colonnes doivent être égales : c'est ce qu'on appelle un budget équilibré.",
      'Ajoutez le temps donné par les bénévoles, valorisé en euros : les financeurs y voient votre engagement.',
    ],
    dureeEstimee: 'Deux heures avec le trésorier.',
    renvois: [
      {
        nom: 'Valoriser le bénévolat (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/la-valorisation-comptable-du-benevolat',
        pourQuoi: 'La méthode officielle pour compter le temps des bénévoles dans le budget.',
      },
    ],
    debloque: 'Le budget prévisionnel entre dans le classeur.',
    lexique: [
      { mot: 'Budget prévisionnel', explication: "Le tableau des dépenses et des recettes prévues pour l'année à venir." },
      { mot: 'Valorisation du bénévolat', explication: "Compter en euros les heures données gratuitement, pour montrer ce que l'association apporte elle-même." },
    ],
    piecesAjoutees: ['BUDGET_PREVISIONNEL'],
  },
  {
    numero: 10,
    slug: 'trouver-le-premier-financeur',
    titre: 'Trouver le premier financeur',
    pourquoi:
      "Le premier soutien d'une petite association vient presque toujours de tout près : la commune, puis l'État par le fonds pour la vie associative, puis le département.",
    quoiFaire: [
      "Prenez rendez-vous au service vie associative de votre mairie : demandez le formulaire de subvention et la date limite.",
      "Repérez la campagne FDVA de votre département : elle s'ouvre chaque année, souvent au premier semestre.",
      'Pour aller plus loin, cherchez dans l\'annuaire public des aides celles qui correspondent à votre activité.',
    ],
    dureeEstimee: 'Une demi-journée de repérage, un rendez-vous en mairie.',
    renvois: [
      {
        nom: 'Aides-territoires',
        lien: 'https://aides-territoires.beta.gouv.fr/',
        pourQuoi: "L'annuaire public et gratuit des aides, filtrable par territoire et par type de structure.",
      },
      {
        nom: 'Le Compte Asso',
        lien: 'https://lecompteasso.associations.gouv.fr/',
        pourQuoi: "Le portail de l'État pour déposer une demande FDVA.",
      },
    ],
    debloque: 'Un premier dossier est repéré, avec sa date limite.',
    lexique: [
      { mot: 'FDVA', explication: "Le fonds pour le développement de la vie associative : l'aide de l'État aux petites associations, gérée département par département." },
      { mot: 'Dispositif', explication: "Un programme d'aide précis, avec son financeur, ses conditions et sa date limite." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 11,
    slug: 'constituer-et-deposer-le-dossier',
    titre: 'Constituer et déposer le dossier',
    pourquoi:
      "Un dossier incomplet est écarté sans être lu. Vérifier avant de déposer, c'est la différence entre une réponse et un silence.",
    quoiFaire: [
      'Rassemblez les pièces demandées par le financeur : elles sont déjà dans votre classeur si vous avez suivi les étapes précédentes.',
      "Remplissez le formulaire avec votre projet en une page et votre budget.",
      "Contrôlez la liste : chaque pièce présente, à jour, au bon format. Puis déposez, vous-même, sur le portail du financeur.",
    ],
    dureeEstimee: 'Deux à trois heures la première fois, moins ensuite.',
    renvois: [
      {
        nom: 'Le Compte Asso',
        lien: 'https://lecompteasso.associations.gouv.fr/',
        pourQuoi: "Le dépôt en ligne pour l'État. Pour une commune ou un département, c'est leur propre formulaire ou portail.",
      },
    ],
    debloque: 'Le dossier est déposé. La date du compte rendu est notée pour vous.',
    lexique: [
      { mot: 'CERFA 12156', explication: 'Le formulaire commun de demande de subvention. Presque tous les financeurs publics l\'utilisent ou s\'en inspirent.' },
      { mot: 'Recevable', explication: 'Un dossier complet, arrivé dans les délais : le financeur accepte de l\'examiner.' },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 12,
    slug: 'rendre-compte',
    titre: 'Rendre compte',
    pourquoi:
      "Une subvention accordée doit être justifiée : vous montrez ce que vous avez fait avec l'argent. Sans compte rendu, pas de subvention l'année suivante.",
    quoiFaire: [
      "Dans les six mois qui suivent la fin de l'action (ou la date fixée par la convention), remplissez le compte rendu financier : dépenses réelles face au budget prévu, et ce que l'action a produit.",
      'Joignez les justificatifs si le financeur les demande. Envoyez, et gardez une copie dans le classeur.',
    ],
    dureeEstimee: 'Deux heures, si les comptes ont été tenus au fil de l\'année.',
    renvois: [
      {
        nom: 'Compte rendu financier de subvention (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R46623',
        pourQuoi: 'Le formulaire officiel (CERFA 15059) et sa notice.',
      },
    ],
    debloque: "Le dossier est soldé. Le chemin est terminé : votre association tourne, et l'écran du lundi prend le relais.",
    lexique: [
      { mot: 'Compte rendu financier', explication: "Le document qui montre au financeur comment sa subvention a été dépensée et ce qu'elle a permis." },
      { mot: 'Convention', explication: "Le contrat signé avec le financeur quand la subvention dépasse un certain montant : il fixe les engagements et les dates." },
    ],
    piecesAjoutees: [],
  },
];

export function trouverEtape(slugOuNumero: string): EtapeChemin | undefined {
  const n = Number(slugOuNumero);
  return ETAPES_CHEMIN.find((e) => e.slug === slugOuNumero || (Number.isInteger(n) && e.numero === n));
}
