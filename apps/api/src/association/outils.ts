/**
 * LA CARTE DES OUTILS.
 *
 * L'outil refuse de refaire ce que d'autres font bien ; il doit alors dire
 * clairement qui le fait. Pour chaque besoin : l'outil, ce qu'il fait, ce
 * qu'il coûte en ordre de grandeur (jamais un tarif précis, ils changent), et
 * comment il s'articule avec le classeur et les dossiers.
 *
 * Les concurrents sont nommés par leur nom. Une association qui a besoin
 * d'une gestion complète payante doit le savoir ici, pas le découvrir ailleurs.
 */

export type Cout = 'GRATUIT' | 'PUBLIC' | 'PAYANT' | 'GRATUIT_PUIS_PAYANT';

export interface Outil {
  nom: string;
  lien: string;
  ceQuIlFait: string;
  cout: Cout;
  /** Précision sur le coût, en langage courant, sans montant. */
  coutDetail?: string;
}

export interface BesoinOutille {
  code: string;
  besoin: string;
  /** Pourquoi ce besoin n'est pas couvert ici. */
  pourquoiAilleurs: string;
  outils: Outil[];
  /** Comment le résultat revient dans le pilotage. */
  articulation: string;
}

export const LIBELLES_COUT: Record<Cout, string> = {
  GRATUIT: 'Gratuit',
  PUBLIC: 'Service public, gratuit',
  PAYANT: 'Payant',
  GRATUIT_PUIS_PAYANT: 'Gratuit au départ, payant ensuite',
};

export const CARTE_DES_OUTILS: readonly BesoinOutille[] = [
  {
    code: 'ENCAISSER',
    besoin: 'Adhésions, dons, billetterie, paiement en ligne',
    pourquoiAilleurs:
      "Encaisser de l'argent pour le compte d'autrui demande un agrément de prestataire de paiement. Ce n'est pas notre métier, et un service le fait sans frais pour l'association.",
    outils: [
      {
        nom: 'HelloAsso',
        lien: 'https://www.helloasso.com/',
        ceQuIlFait: "Encaisse adhésions, dons et billets pour l'association, gère la liste des adhérents et les reçus fiscaux.",
        cout: 'GRATUIT',
        coutDetail: 'Financé par un pourboire facultatif laissé par le payeur.',
      },
      {
        nom: 'AssoConnect',
        lien: 'https://www.assoconnect.com/',
        ceQuIlFait: 'Gestion complète : adhésions, comptabilité, e-mailing, boutique, site.',
        cout: 'GRATUIT_PUIS_PAYANT',
        coutDetail: 'Abonnement mensuel selon la taille de l\'association.',
      },
      {
        nom: 'Yapla',
        lien: 'https://www.yapla.com/',
        ceQuIlFait: 'Adhésions, événements, dons, comptabilité et site.',
        cout: 'GRATUIT_PUIS_PAYANT',
        coutDetail: 'Abonnement mensuel selon les modules choisis.',
      },
    ],
    articulation: 'Vous exportez la liste des adhérents (fichier CSV) et vous l\'importez dans votre répertoire.',
  },
  {
    code: 'COMPTABILITE',
    besoin: 'Tenir la comptabilité',
    pourquoiAilleurs:
      "La comptabilité est un métier réglementé au-dessus de certains seuils. Nous exportons vers la comptabilité, nous ne tenons pas les comptes.",
    outils: [
      {
        nom: 'Basicompta',
        lien: 'https://www.basicompta.fr/',
        ceQuIlFait: 'Comptabilité associative simple, conçue pour les bénévoles, avec les documents de fin d\'exercice.',
        cout: 'PAYANT',
        coutDetail: 'Abonnement annuel, souvent proposé par les fédérations à leurs adhérents.',
      },
      {
        nom: 'Un expert-comptable',
        lien: 'https://www.experts-comptables.fr/',
        ceQuIlFait: "Tient ou vérifie les comptes, obligatoire au-delà de certains seuils de subventions.",
        cout: 'PAYANT',
      },
    ],
    articulation: 'Vos dépenses exportées servent au compte rendu financier de chaque subvention.',
  },
  {
    code: 'CHERCHER_FINANCEMENTS',
    besoin: 'Chercher des financements',
    pourquoiAilleurs:
      "L'annuaire national des aides change tous les jours. Nous suivons les dispositifs que VOUS avez repérés, pas l'annuaire entier.",
    outils: [
      {
        nom: 'Aides-territoires',
        lien: 'https://aides-territoires.beta.gouv.fr/',
        ceQuIlFait: 'Annuaire public de toutes les aides, filtrable par territoire, par type de structure et par thème.',
        cout: 'PUBLIC',
      },
      {
        nom: 'Subventia',
        lien: 'https://www.subventia.fr/',
        ceQuIlFait: 'Veille des appels à projets et aide à la rédaction des dossiers.',
        cout: 'PAYANT',
        coutDetail: 'Abonnement annuel.',
      },
    ],
    articulation: 'Un dispositif repéré s\'ajoute à vos dossiers, avec sa date limite et la liste des pièces demandées.',
  },
  {
    code: 'DEPOSER_ETAT',
    besoin: "Déposer une demande de subvention à l'État",
    pourquoiAilleurs:
      "Le dépôt se fait sur le portail du financeur, par la personne habilitée. Nous préparons les pièces et le texte ; vous déposez.",
    outils: [
      {
        nom: 'Le Compte Asso',
        lien: 'https://lecompteasso.associations.gouv.fr/',
        ceQuIlFait: "Le portail de l'État : dépôt du dossier CERFA 12156, FDVA, et suivi des demandes.",
        cout: 'PUBLIC',
      },
    ],
    articulation: 'Votre classeur contient toutes les pièces à téléverser ; votre projet en une page et votre budget se copient dans le formulaire.',
  },
  {
    code: 'FORMALITES',
    besoin: "Créer, modifier, dissoudre l'association",
    pourquoiAilleurs:
      "Ce sont des démarches administratives officielles, gratuites, avec leurs téléservices. Le chemin vous y renvoie à chaque formalité.",
    outils: [
      {
        nom: 'Service-public.gouv.fr, rubrique associations',
        lien: 'https://www.service-public.gouv.fr/associations',
        ceQuIlFait: 'Déclaration, modification, dissolution en ligne, et toutes les fiches pratiques.',
        cout: 'PUBLIC',
      },
      {
        nom: 'Associations.gouv.fr',
        lien: 'https://associations.gouv.fr/',
        ceQuIlFait: "Les guides du ministère chargé de la vie associative : gouvernance, comptabilité, bénévolat.",
        cout: 'PUBLIC',
      },
    ],
    articulation: 'Chaque récépissé obtenu se range dans le classeur.',
  },
  {
    code: 'VERIFIER_UNE_ASSOCIATION',
    besoin: "Vérifier l'existence et les données publiques d'une association",
    pourquoiAilleurs:
      "Les données d'identité (RNA, SIRENE) sont publiques. Nous les lisons pour pré-remplir votre classeur ; leur source reste l'administration.",
    outils: [
      {
        nom: 'Annuaire des entreprises et associations',
        lien: 'https://annuaire-entreprises.data.gouv.fr/',
        ceQuIlFait: 'La fiche publique de toute structure immatriculée : SIREN, SIRET, adresse, date de création.',
        cout: 'PUBLIC',
      },
      {
        nom: 'Journal officiel des associations (JOAFE)',
        lien: 'https://www.journal-officiel.gouv.fr/pages/associations-recherche/',
        ceQuIlFait: "Les annonces de création, modification et dissolution publiées au Journal officiel.",
        cout: 'PUBLIC',
      },
    ],
    articulation: "C'est ce que fait l'outil « vérifier mon dossier » : il lit ces données pour vous.",
  },
  {
    code: 'SE_FORMER',
    besoin: 'Se former à la gestion associative',
    pourquoiAilleurs:
      "Se former fait partie de l'outil : les formations liées à chaque rôle arrivent dans l'espace Se former. En attendant, les ressources publiques sont là.",
    outils: [
      {
        nom: 'Guichet unique de la formation des bénévoles',
        lien: 'https://associations.gouv.fr/',
        ceQuIlFait: 'Les formations gratuites pour bénévoles financées par le FDVA 1, département par département.',
        cout: 'PUBLIC',
      },
      {
        nom: 'Toulali, centre de formation',
        lien: 'https://toulali.fr/',
        ceQuIlFait: "Les formations de l'opérateur de cet outil, finançables par votre OPCO pour les associations employeuses.",
        cout: 'PAYANT',
        coutDetail: 'Prise en charge possible par l\'OPCO.',
      },
    ],
    articulation: 'Les formations suivies et leurs attestations se rangent dans le classeur.',
  },
];
