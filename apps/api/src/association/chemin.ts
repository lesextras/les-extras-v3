/**
 * LE CHEMIN : PILOTER UNE ASSOCIATION, UNE ÉTAPE À LA FOIS.
 *
 * Pour la personne qui vient de créer son association et ne sait pas par où
 * commencer. Tout est écrit pour être compris du premier coup, sans rien
 * connaître : des phrases courtes, un mot compliqué = son explication juste à
 * côté, et à chaque étape les vrais formulaires (CERFA) et des documents
 * exemples qu'on peut recopier.
 *
 * Le chemin a sept parties (les numéros d'étape se recalculent, les slugs
 * jamais : les coches enregistrées portent les slugs) :
 *   1. Faire naître l'association
 *   2. La faire vivre
 *   3. Demander une subvention ou répondre à un appel à projets
 *   4. Les agréments (01/10/2026) : ceux qui ouvrent des financements. Chacun
 *      peut être marqué « Pas concerné ». L'agrément ESUS y est passé depuis
 *      « Selon ton activité », avec le même slug.
 *   5. Chaque année : ce qui revient tous les ans. Une étape annuelle revient
 *      dans « À faire » quand son cycle change (voir common/chemin-suivi.ts).
 *   6. Selon ton activité : ce qui ne concerne que certaines associations.
 *   7. Organiser un événement : la buvette, la tombola.
 * La troisième est le but : le chemin sert à obtenir des subventions, et
 * chaque étape dit ce qu'elle débloque comme financement (`debloque`).
 *
 * Dans chaque partie, les étapes se rangent par priorité (1 = d'abord), puis
 * dans l'ordre d'origine, sans passer devant ce qu'il faut faire avant
 * (common/chemin-obligations.ts, `ordonnerEtapes`). Toute étape qui n'est pas
 * obligatoire pour toutes les associations peut être « Pas concerné ».
 *
 * Chaque étape dit aussi si elle est obligatoire, ce qui la déclenche, son
 * échéance légale et ce qu'il faut avoir fait avant (common/chemin-obligations.ts).
 *
 * Règles tenues par ce fichier :
 *  - jamais de recommandation commerciale : les renvois vont vers les services
 *    publics, ou vers un outil quand il n'a pas d'équivalent public ;
 *  - une étape faite ailleurs se coche, on ne force personne à refaire ;
 *  - le chemin est gratuit et le reste.
 */

import { ordonnerEtapes, type ObligationEtape, type ReperesFinancement } from '../common/chemin-obligations';

export type PartieChemin = 'NAITRE' | 'VIVRE' | 'SUBVENTION' | 'AGREMENTS' | 'CHAQUE_ANNEE' | 'SELON_ACTIVITE' | 'EVENEMENT';

export interface DescriptionPartie {
  code: PartieChemin;
  numero: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  titre: string;
  /** Une phrase toute simple. */
  enUnMot: string;
  /** Quand cette partie est finie, on a… */
  resultat: string;
}

export const PARTIES_CHEMIN: readonly DescriptionPartie[] = [
  {
    code: 'NAITRE',
    numero: 1,
    titre: "Faire naître l'association",
    enUnMot: "Ton association existe pour de vrai, avec ses numéros et ses papiers d'identité.",
    resultat: 'Un numéro RNA, un numéro SIRET, un compte en banque, une assurance.',
  },
  {
    code: 'VIVRE',
    numero: 2,
    titre: 'La faire vivre',
    enUnMot: 'Des membres, des comptes tenus, une réunion par an où tout le monde décide.',
    resultat: "Une liste de membres, un cahier de comptes, un procès-verbal d'assemblée.",
  },
  {
    code: 'SUBVENTION',
    numero: 3,
    titre: 'Demander une subvention',
    enUnMot: "Tu racontes ton projet, tu chiffres ce qu'il coûte, tu déposes le dossier, tu rends compte.",
    resultat: 'Un dossier déposé chez un financeur, puis un compte rendu qui ouvre la porte au suivant.',
  },
  {
    code: 'AGREMENTS',
    numero: 4,
    titre: 'Les agréments',
    enUnMot: "Un agrément, c'est l'État ou la CAF qui reconnaît ton association. Beaucoup de financements le demandent. Pas pour toi ? « Pas concerné ».",
    resultat: 'Les agréments utiles à ton activité sont demandés, avec leur date de fin notée.',
  },
  {
    code: 'CHAQUE_ANNEE',
    numero: 5,
    titre: 'Chaque année',
    enUnMot: "Ce qui revient tous les ans. Une fois la date de l'année passée, l'étape revient dans « À faire » pour l'année suivante.",
    resultat: 'Une assemblée tenue, des changements déclarés, des comptes en règle.',
  },
  {
    code: 'SELON_ACTIVITE',
    numero: 6,
    titre: 'Selon ton activité',
    enUnMot: "Ce qui dépend de ce que fait l'association. Si une étape ne te concerne pas, tu le dis en un clic.",
    resultat: 'Chaque obligation qui te concerne est en place, les autres sont écartées.',
  },
  {
    code: 'EVENEMENT',
    numero: 7,
    titre: 'Organiser un événement',
    enUnMot: "Une fête, un vide-grenier, un loto : la buvette et la tombola se demandent à la mairie avant. Pas d'événement ? « Pas concerné ».",
    resultat: 'Chaque événement a ses autorisations, demandées à temps.',
  },
];

export type GenreDocument = 'CERFA' | 'MODELE' | 'EXEMPLE' | 'SITE';

export interface DocumentEtape {
  /** Ce qu'on voit sur la carte. */
  titre: string;
  lien: string;
  genre: GenreDocument;
  /** « CERFA 12156 » par exemple. */
  numero?: string;
  /** Une phrase : à quoi ça sert, quand on s'en sert. */
  aQuoiCaSert: string;
}

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

export interface PasAPas {
  /** Une action courte, qui commence par un verbe. */
  titre: string;
  /** Comment on s'y prend, concrètement, en deux ou trois phrases. */
  detail: string;
}

export interface EtapeChemin extends ObligationEtape, ReperesFinancement {
  numero: number;
  slug: string;
  titre: string;
  partie: PartieChemin;
  /** Une phrase toute simple : c'est quoi, cette étape. */
  enUnMot: string;
  /** Pourquoi c'est important, sans jargon. */
  pourquoi: string;
  /** Ce qu'il faut avoir sous la main avant de commencer. */
  ilTeFaut: string[];
  /** Comment faire, dans l'ordre. */
  commentFaire: PasAPas[];
  /** Les actions, en une ligne chacune (résumé de commentFaire). */
  quoiFaire: string[];
  /** Estimation honnête, en langage courant. */
  dureeEstimee: string;
  /** Ce que ça coûte. */
  cout: string;
  /** Les formulaires officiels, modèles et exemples. */
  documents: DocumentEtape[];
  /** Les pages officielles pour aller plus loin. */
  renvois: Renvoi[];
  /** Quand c'est fini, tu as… */
  quandCestFini: string;
  /** Ce que l'étape apporte une fois faite (version courte). S'appelait `debloque` avant le 01/10/2026. */
  apporte: string;
  lexique: MotExplique[];
  /** Codes du référentiel des pièces que cette étape ajoute au classeur. */
  piecesAjoutees: string[];
  /** Peut-on vérifier l'étape automatiquement avec les données publiques ? */
  verifiableAvec?: 'RNA' | 'SIRENE';
  /** L'étape revient chaque année : cochée une autre année, elle est à refaire. */
  chaqueAnnee?: boolean;
  /** L'étape peut être marquée « Pas concerné » (elle compte alors comme faite). */
  peutNePasConcerner?: boolean;
}

/** Une étape telle qu'elle est écrite plus bas : la priorité et les financements viennent de `REPERES`. */
type EtapeEcrite = Omit<EtapeChemin, keyof ReperesFinancement>;

const MODELES = '/association/modeles';

const ETAPES_ECRITES: readonly EtapeEcrite[] = [
  // ------------------------------------------------------------ 1. NAÎTRE
  {
    numero: 1,
    slug: 'declarer-l-association',
    titre: "Déclarer l'association",
    nature: 'OBLIGATOIRE',
    declencheur: "Avant tout le reste : sans déclaration, pas de compte en banque, pas de subvention, pas de contrat.",
    partie: 'NAITRE',
    enUnMot: "Tu dis à l'État : « notre association existe ». En retour, tu reçois son numéro.",
    pourquoi:
      "Tant que tu ne l'as pas déclarée, ton association n'existe pas pour l'administration. Elle ne peut pas ouvrir un compte en banque, ni recevoir un euro.",
    ilTeFaut: [
      'Au moins deux personnes (toi et une autre).',
      "Un nom pour l'association.",
      "Une adresse (chez toi, c'est possible).",
      "Un compte sur le site de l'État (comme pour les impôts) : ça se crée en deux minutes.",
    ],
    commentFaire: [
      {
        titre: 'Écris les statuts',
        detail:
          "Les statuts, c'est le règlement de l'association : son nom, ce qu'elle veut faire, son adresse, et comment on décide. Prends le modèle officiel ci-dessous, remplace les mots entre crochets. Une page ou deux suffisent.",
      },
      {
        titre: 'Réunis les fondateurs et écris le procès-verbal',
        detail:
          "Vous vous réunissez (même autour d'une table de cuisine). Vous dites « oui » aux statuts et vous choisissez qui est président, trésorier, secrétaire. Tu écris ça sur une feuille : c'est le procès-verbal. Il y a un exemple ci-dessous à recopier.",
      },
      {
        titre: 'Déclare en ligne',
        detail:
          "Va sur le service en ligne de l'État (bouton ci-dessous). Tu réponds aux questions, tu joins les statuts et le procès-verbal. C'est gratuit. Si tu préfères le papier, c'est le formulaire CERFA 13973, avec la liste des dirigeants (CERFA 13971).",
      },
      {
        titre: 'Attends le récépissé',
        detail:
          "Quelques jours à quelques semaines plus tard, tu reçois un document qui dit « c'est enregistré ». Dessus, un numéro qui commence par W : c'est ton numéro RNA. Range-le dans ton classeur.",
      },
    ],
    quoiFaire: [
      'Écris les statuts avec le modèle officiel.',
      'Réunis les fondateurs et écris le procès-verbal.',
      "Déclare l'association en ligne (gratuit).",
      'Range le récépissé et le numéro RNA dans le classeur.',
    ],
    dureeEstimee: 'Une soirée pour les statuts, une réunion, dix minutes en ligne. Le récépissé arrive en quelques jours à quelques semaines.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Exemple de statuts (officiel)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R2631',
        genre: 'MODELE',
        aQuoiCaSert: 'Tu le recopies et tu remplaces les mots entre crochets par les tiens.',
      },
      {
        titre: "Exemple de procès-verbal d'assemblée constitutive",
        lien: `${MODELES}/exemple-proces-verbal-assemblee-constitutive.docx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: "La feuille à écrire après la première réunion : qui était là, ce qui a été décidé.",
      },
      {
        titre: "Déclarer l'association en ligne",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R1757',
        genre: 'SITE',
        aQuoiCaSert: "Le service officiel, gratuit. C'est là que tu déclares.",
      },
      {
        titre: "Création d'une association (papier)",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R19467',
        genre: 'CERFA',
        numero: 'CERFA 13973',
        aQuoiCaSert: 'Le formulaire papier, si tu ne peux pas faire en ligne.',
      },
      {
        titre: 'Liste des dirigeants (papier)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R20991',
        genre: 'CERFA',
        numero: 'CERFA 13971',
        aQuoiCaSert: 'À joindre au formulaire papier : qui est président, trésorier, secrétaire.',
      },
    ],
    renvois: [
      {
        nom: 'Rédiger les statuts (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1120',
        pourQuoi: 'Ce que les statuts doivent contenir, expliqué par le service public.',
      },
      {
        nom: 'Le kit gratuit pour votre association (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/le-kit-gratuit-pour-votre-association',
        pourQuoi: "Les guides de l'État pour démarrer.",
      },
    ],
    quandCestFini: "Tu as un récépissé et un numéro RNA (il commence par W). Ton association existe officiellement.",
    apporte: 'Le récépissé et le numéro RNA entrent dans ton classeur.',
    lexique: [
      { mot: 'Statuts', explication: "Le règlement de l'association : son nom, son but, comment on décide." },
      { mot: 'Assemblée constitutive', explication: 'La toute première réunion, où on dit « oui » aux statuts et on choisit les responsables.' },
      { mot: 'Procès-verbal', explication: 'La feuille qui raconte une réunion : qui était là, ce qui a été décidé.' },
      { mot: 'Récépissé', explication: "Le papier que la préfecture renvoie pour dire « c'est enregistré »." },
      { mot: 'RNA', explication: "Le numéro de ton association, qui commence par W. Il prouve qu'elle est déclarée." },
    ],
    piecesAjoutees: ['STATUTS', 'RECEPISSE_PREFECTURE', 'JOAFE'],
    verifiableAvec: 'RNA',
  },
  {
    numero: 2,
    slug: 'obtenir-le-siret',
    titre: 'Obtenir le numéro SIRET',
    nature: 'SI_CONCERNE',
    declencheur: 'Dès que tu demandes une subvention, que tu embauches ou que tu paies des impôts.',
    prerequis: ['declarer-l-association'],
    partie: 'NAITRE',
    enUnMot: "Le SIRET, c'est le numéro qui permet à quelqu'un de te verser de l'argent.",
    pourquoi:
      "Aucune subvention ne peut être payée sans SIRET. La mairie, le département, l'État : tous le demandent avant de verser quoi que ce soit.",
    ilTeFaut: [
      'Le récépissé de déclaration (étape 1).',
      'Les statuts.',
      "La publication au Journal officiel (elle arrive toute seule après la déclaration, tu la retrouves en ligne).",
    ],
    commentFaire: [
      {
        titre: 'Va sur Le Compte Asso',
        detail:
          "C'est le site de l'État pour les associations. Crée ton compte, puis choisis « Demander l'attribution d'un numéro SIREN/SIRET ». C'est gratuit.",
      },
      {
        titre: 'Réponds aux questions et joins les papiers',
        detail: 'On te demande le numéro RNA, les statuts et la publication au Journal officiel. Tu envoies. Rien à payer.',
      },
      {
        titre: 'Attends le certificat',
        detail:
          "En deux à quatre semaines, tu reçois un certificat avec deux numéros : le SIREN (9 chiffres, l'association) et le SIRET (14 chiffres, l'association à son adresse). Range-le dans le classeur.",
      },
    ],
    quoiFaire: ['Demande le SIRET sur Le Compte Asso (gratuit).', 'Attends le certificat et range-le dans le classeur.'],
    dureeEstimee: 'Dix minutes pour la demande. Le numéro arrive en deux à quatre semaines.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Demander le SIRET sur Le Compte Asso',
        lien: 'https://lecompteasso.associations.gouv.fr/demander-lattribution-dun-n-siren-siret/',
        genre: 'SITE',
        aQuoiCaSert: "Le service en ligne pour les associations qui veulent des subventions.",
      },
      {
        titre: 'Inscription au répertoire Sirene (service public)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R55385',
        genre: 'SITE',
        aQuoiCaSert: 'La fiche officielle de la démarche, avec les cas particuliers.',
      },
    ],
    renvois: [
      {
        nom: 'Immatriculer une association (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1926',
        pourQuoi: "Si tu embauches ou si tu paies des impôts, la démarche change : c'est expliqué ici.",
      },
    ],
    quandCestFini: 'Tu as un SIRET. Un financeur peut maintenant te verser une subvention.',
    apporte: 'Le SIRET entre dans ton classeur. Tu peux demander une subvention.',
    lexique: [
      { mot: 'SIRET', explication: "14 chiffres qui identifient ton association à son adresse. C'est le numéro que les financeurs demandent." },
      { mot: 'SIREN', explication: 'Les 9 premiers chiffres du SIRET.' },
      { mot: 'Le Compte Asso', explication: "Le site de l'État où les associations font leurs démarches et déposent leurs demandes de subvention." },
    ],
    piecesAjoutees: ['SIRET'],
    verifiableAvec: 'SIRENE',
  },
  {
    numero: 3,
    slug: 'les-cinq-pieces-d-identite',
    titre: "Les cinq papiers d'identité",
    nature: 'CONSEILLE',
    prerequis: ['declarer-l-association', 'obtenir-le-siret'],
    partie: 'NAITRE',
    enUnMot: "Cinq papiers que tout le monde te demandera. On les range une bonne fois.",
    pourquoi:
      "Chaque financeur demande les mêmes cinq papiers. Si tu les as sous la main, la moitié de chaque dossier est déjà faite.",
    ilTeFaut: ['Ta boîte mail (la plupart des papiers y sont déjà).', 'Dix minutes.'],
    commentFaire: [
      {
        titre: 'Retrouve les cinq papiers',
        detail:
          "1. Les statuts. 2. Le récépissé de la préfecture. 3. La liste des dirigeants (qui est président, trésorier, secrétaire). 4. Le certificat SIRET. 5. Le RIB de l'association (pas le tien).",
      },
      {
        titre: 'Mets-les dans ton classeur',
        detail:
          "Dans l'espace « Le classeur », chaque papier a sa case. Tu déposes le fichier (photo ou PDF). Pour ceux qui expirent, on te préviendra avant.",
      },
    ],
    quoiFaire: ['Retrouve les cinq papiers.', 'Dépose-les dans le classeur.'],
    dureeEstimee: 'Cinq minutes si tout est dans ta boîte mail. Une heure si tu dois chercher.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Liste des dirigeants',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R20991',
        genre: 'CERFA',
        numero: 'CERFA 13971',
        aQuoiCaSert: "Si tu n'as pas gardé la liste déclarée, ce formulaire te sert de modèle.",
      },
    ],
    renvois: [],
    quandCestFini: 'Ton classeur contient les cinq papiers. Chaque dossier de subvention partira de là.',
    apporte: 'Ton classeur est prêt à 40 %.',
    lexique: [
      { mot: 'Liste des dirigeants', explication: 'Les noms et les rôles des responsables (président, trésorier, secrétaire), comme déclarés en préfecture.' },
      { mot: 'RIB', explication: "Le papier de la banque avec le numéro du compte de l'association." },
    ],
    piecesAjoutees: ['LISTE_DIRIGEANTS', 'RIB'],
  },
  {
    numero: 4,
    slug: 'le-compte-bancaire-et-l-assurance',
    titre: "Le compte en banque et l'assurance",
    nature: 'CONSEILLE',
    declencheur: "L'assurance devient obligatoire pour certaines activités : sport, accueil de mineurs, local ouvert au public.",
    prerequis: ['declarer-l-association'],
    partie: 'NAITRE',
    enUnMot: "Un compte à son nom pour l'argent, une assurance au cas où quelqu'un se blesse.",
    pourquoi:
      "L'argent de l'association ne doit pas se mélanger avec celui des personnes. Et si ton activité abîme quelque chose ou blesse quelqu'un, c'est l'assurance qui paie, pas toi.",
    ilTeFaut: ['Les statuts, le récépissé et le procès-verbal (étape 1).', "Une pièce d'identité du président et du trésorier."],
    commentFaire: [
      {
        titre: 'Ouvre un compte au nom de l\'association',
        detail:
          "Va dans une banque (ou une banque en ligne) avec les statuts, le récépissé, le procès-verbal et les pièces d'identité. Le compte est au nom de l'association. Si une banque refuse, tu as un droit au compte : la Banque de France peut en désigner une.",
      },
      {
        titre: 'Prends une assurance « responsabilité civile »',
        detail:
          "Demande un devis à un assureur en décrivant ce que fait l'association (des ateliers, des sorties, un local…). Tu reçois une attestation : une page qui dit que tu es assuré, valable un an.",
      },
      {
        titre: "Range l'attestation dans le classeur",
        detail: "Elle expire chaque année. Dans le classeur, tu mets sa date de fin : on te préviendra deux mois avant.",
      },
    ],
    quoiFaire: ["Ouvre un compte au nom de l'association.", 'Prends une assurance responsabilité civile.', "Range l'attestation avec sa date de fin."],
    dureeEstimee: "Un rendez-vous en banque ou une demande en ligne. Un devis d'assurance en une demi-heure.",
    cout: "Le compte : souvent quelques euros par mois. L'assurance : selon l'activité.",
    documents: [
      {
        titre: "Assurance d'une association",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1124',
        genre: 'SITE',
        aQuoiCaSert: "Ce qui est obligatoire et ce qui est conseillé, selon ce que tu fais.",
      },
      {
        titre: 'Le droit au compte bancaire',
        lien: 'https://associations.gouv.fr/le-droit-au-compte-bancaire',
        genre: 'SITE',
        aQuoiCaSert: "Si une banque refuse d'ouvrir le compte : ce que tu peux faire.",
      },
    ],
    renvois: [],
    quandCestFini: "L'association a son compte en banque et son attestation d'assurance, datée.",
    apporte: "L'attestation d'assurance entre dans le classeur, avec sa date de fin.",
    lexique: [
      { mot: 'Responsabilité civile', explication: "Réparer ce qu'on a cassé ou le mal qu'on a causé à quelqu'un. L'assurance paie à la place de l'association." },
      { mot: 'Attestation', explication: "La page que l'assureur te donne pour prouver que tu es assuré." },
      { mot: 'Droit au compte', explication: 'Si une banque refuse, la Banque de France peut obliger une banque à ouvrir le compte.' },
    ],
    piecesAjoutees: ['ASSURANCE_RC'],
  },
  // ------------------------------------------------------------- 2. VIVRE
  {
    numero: 5,
    slug: 'les-adherents-et-les-cotisations',
    titre: 'Les membres et la cotisation',
    nature: 'CONSEILLE',
    prerequis: ['declarer-l-association'],
    partie: 'VIVRE',
    enUnMot: 'Qui fait partie de l\'association, et combien on paie pour en faire partie (ou rien).',
    pourquoi:
      "Un membre à jour peut voter aux réunions. Sans liste des membres, on ne peut pas prouver qu'une décision est valable.",
    ilTeFaut: ['Une réunion des responsables pour décider.', 'Un tableau (papier ou en ligne) pour la liste.'],
    commentFaire: [
      {
        titre: 'Décide la cotisation',
        detail: "Un montant par an (5 €, 10 €, 20 €…) ou gratuit : les deux sont permis. Note la décision dans un procès-verbal.",
      },
      {
        titre: 'Tiens la liste des membres',
        detail: "Pour chaque personne : nom, date d'entrée, cotisation payée ou non. Un simple tableau suffit.",
      },
      {
        titre: 'Encaisse en ligne si tu veux',
        detail: "Un service de paiement pour associations permet d'encaisser les cotisations sans frais pour l'association.",
      },
    ],
    quoiFaire: ['Décide le montant de la cotisation (ou gratuit).', 'Tiens la liste des membres à jour.'],
    dureeEstimee: 'Une réunion pour décider. Dix minutes pour ouvrir un espace de paiement en ligne.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'HelloAsso',
        lien: 'https://www.helloasso.com/',
        genre: 'SITE',
        aQuoiCaSert: "Encaisser les cotisations et les dons en ligne, sans frais pour l'association.",
      },
    ],
    renvois: [],
    quandCestFini: 'Tu sais qui est membre, et qui est à jour.',
    apporte: 'Ta liste des membres est ouverte.',
    lexique: [
      { mot: 'Membre (adhérent)', explication: "Une personne qui a rejoint l'association et, s'il y a une cotisation, l'a payée." },
      { mot: 'Cotisation', explication: "Ce qu'on paie chaque année pour être membre. Ça peut être zéro." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 6,
    slug: 'tenir-des-comptes-simples',
    titre: 'Tenir des comptes simples',
    nature: 'SI_CONCERNE',
    declencheur: "Obligatoire dès qu'il y a une subvention, des reçus fiscaux ou un salarié. Sinon, très conseillé.",
    prerequis: ['le-compte-bancaire-et-l-assurance'],
    partie: 'VIVRE',
    enUnMot: "Un cahier : l'argent qui rentre à gauche, l'argent qui sort à droite.",
    pourquoi:
      "Un financeur veut savoir d'où vient l'argent et où il va. Pour une petite association, un cahier des recettes et des dépenses suffit.",
    ilTeFaut: ['Un tableau (il y a un exemple ci-dessous).', 'Les tickets et factures, gardés dans une boîte ou un dossier.'],
    commentFaire: [
      {
        titre: 'Note chaque euro qui entre ou qui sort',
        detail: "La date, ce que c'est, le montant, et le numéro du ticket ou de la facture. Une ligne par mouvement.",
      },
      {
        titre: "À la fin de l'année, fais les totaux",
        detail:
          "Total des recettes moins total des dépenses : c'est le compte de résultat. Ce que l'association possède et ce qu'elle doit : c'est le bilan. Pour une petite association, le tableau exemple fait les deux.",
      },
      {
        titre: 'Range les comptes dans le classeur',
        detail: "Les comptes de l'année sont demandés dans presque tous les dossiers.",
      },
    ],
    quoiFaire: ['Note chaque entrée et chaque sortie d\'argent.', "Fais les totaux à la fin de l'année.", 'Range les comptes dans le classeur.'],
    dureeEstimee: "Une heure par mois. Une demi-journée à la fin de l'année.",
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Exemple de cahier de comptes (tableau)',
        lien: `${MODELES}/exemple-cahier-de-comptes.xlsx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: 'Le tableau à remplir chaque mois. Les totaux se calculent tout seuls.',
      },
      {
        titre: 'Réglementation comptable des associations',
        lien: 'https://associations.gouv.fr/reglementation-comptable',
        genre: 'SITE',
        aQuoiCaSert: "Ce qui est obligatoire selon la taille de l'association et les subventions reçues.",
      },
    ],
    renvois: [],
    quandCestFini: "Tu peux dire, à n'importe quel moment, combien l'association a et où l'argent est passé.",
    apporte: "Les comptes de l'année entreront dans le classeur.",
    lexique: [
      { mot: 'Recette', explication: "De l'argent qui entre (cotisation, subvention, vente)." },
      { mot: 'Dépense', explication: "De l'argent qui sort (achat, location, assurance)." },
      { mot: 'Exercice', explication: "L'année sur laquelle on fait les comptes, souvent du 1er janvier au 31 décembre." },
      { mot: 'Compte de résultat', explication: 'Recettes moins dépenses, sur l\'année.' },
      { mot: 'Bilan', explication: "La photo, à la fin de l'année, de ce que l'association possède et de ce qu'elle doit." },
    ],
    piecesAjoutees: ['COMPTES_ANNUELS'],
  },
  {
    numero: 7,
    slug: 'la-premiere-assemblee-generale',
    titre: "L'assemblée générale",
    nature: 'OBLIGATOIRE',
    declencheur: 'Si tes statuts la prévoient, ce qui est presque toujours le cas.',
    echeance: { texte: 'Dans le délai fixé par tes statuts, avec une convocation envoyée à temps.' },
    prerequis: ['les-adherents-et-les-cotisations', 'tenir-des-comptes-simples'],
    partie: 'VIVRE',
    enUnMot: "La grande réunion de l'année : les membres regardent les comptes, votent, choisissent les responsables.",
    pourquoi:
      "Le procès-verbal de cette réunion est demandé dans presque tous les dossiers de subvention. C'est la preuve que l'association est vivante et que ses membres décident.",
    ilTeFaut: ['La liste des membres (étape 5).', "Les comptes de l'année (étape 6).", 'Une date, un lieu, et les statuts pour savoir combien de jours avant il faut prévenir.'],
    commentFaire: [
      {
        titre: 'Préviens les membres',
        detail:
          "Envoie une convocation (un mail suffit) avec la date, le lieu et l'ordre du jour : la liste de ce dont on va parler. Respecte le délai écrit dans les statuts (souvent 15 jours).",
      },
      {
        titre: 'Le jour venu, fais signer une feuille de présence',
        detail: "Chaque personne présente signe. Ça prouve qu'il y avait assez de monde pour décider.",
      },
      {
        titre: "Présente l'année et les comptes, puis vote",
        detail:
          "Le rapport d'activité (ce qu'on a fait) et les comptes (l'argent). Les membres votent « oui » ou « non ». Puis on élit ou on confirme les responsables.",
      },
      {
        titre: 'Écris le procès-verbal',
        detail: "Qui était là, ce qui a été décidé, avec combien de voix. Signé par le président et le secrétaire. Range-le dans le classeur.",
      },
      {
        titre: 'Si les responsables changent, déclare-le',
        detail: 'En ligne, dans les trois mois. Gratuit.',
      },
    ],
    quoiFaire: [
      'Envoie la convocation avec l\'ordre du jour.',
      'Fais signer la feuille de présence.',
      "Présente l'année et les comptes, vote.",
      'Écris et signe le procès-verbal.',
      'Déclare un changement de responsables, si besoin.',
    ],
    dureeEstimee: 'Deux heures de préparation, une réunion, une heure pour le procès-verbal.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: "Exemple de procès-verbal d'assemblée générale",
        lien: `${MODELES}/exemple-proces-verbal-assemblee-generale.docx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: 'À recopier après la réunion, en changeant les noms et les chiffres.',
      },
      {
        titre: "Exemple de rapport d'activité",
        lien: `${MODELES}/exemple-rapport-activite.docx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: "Une page qui raconte l'année. Les financeurs le demandent aussi.",
      },
      {
        titre: 'Déclarer un changement de dirigeants',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34797',
        genre: 'SITE',
        aQuoiCaSert: 'Si le président, le trésorier ou le secrétaire change.',
      },
    ],
    renvois: [
      {
        nom: 'Faut-il déclarer quelque chose après chaque assemblée ? (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34728',
        pourQuoi: "La réponse officielle, cas par cas.",
      },
    ],
    quandCestFini: "Tu as un procès-verbal signé et un rapport d'activité. Les deux entrent dans le classeur.",
    apporte: "Le procès-verbal et le rapport d'activité entrent dans le classeur.",
    lexique: [
      { mot: 'Assemblée générale (AG)', explication: "La réunion de tous les membres, au moins une fois par an." },
      { mot: 'Ordre du jour', explication: 'La liste de ce dont on va parler, envoyée avec la convocation.' },
      { mot: 'Feuille de présence', explication: 'La liste des présents, signée par chacun.' },
      { mot: 'Procès-verbal (PV)', explication: 'Le compte rendu écrit et signé de la réunion.' },
      { mot: "Rapport d'activité", explication: "Le texte qui raconte ce que l'association a fait dans l'année." },
    ],
    piecesAjoutees: ['PV_DERNIERE_AG', 'RAPPORT_ACTIVITE'],
  },
  // -------------------------------------------------------- 3. SUBVENTION
  {
    numero: 8,
    slug: 'le-projet-en-une-page',
    titre: 'Raconter le projet en une page',
    nature: 'CONSEILLE',
    partie: 'SUBVENTION',
    enUnMot: "Une page qui dit : pour qui, quoi, comment. C'est le cœur de toute demande.",
    pourquoi:
      "Chaque dossier de subvention et chaque appel à projets demande de raconter ce que tu fais. Écrit une fois, ce texte sert partout. Un financeur lit des dizaines de dossiers : il retient celui qui est clair.",
    ilTeFaut: ['Une heure au calme.', "L'exemple ci-dessous, à côté de toi."],
    commentFaire: [
      {
        titre: 'Réponds à quatre questions',
        detail:
          "Pour qui ? (les enfants du quartier, les personnes âgées de la commune…). Quoi ? (des ateliers, des sorties, un lieu ouvert…). Comment ? (qui s'en occupe, où, quand, avec quel matériel). Et après ? (ce qui aura changé pour les gens).",
      },
      {
        titre: 'Écris une page, pas plus',
        detail: "Des phrases courtes. Des chiffres quand tu en as (10 enfants, 2 ateliers par mois). Pas de mots compliqués.",
      },
      {
        titre: 'Fais-le lire à quelqu\'un qui ne connaît pas l\'association',
        detail: "S'il comprend tout du premier coup, c'est bon. Sinon, simplifie.",
      },
    ],
    quoiFaire: ['Réponds aux quatre questions : pour qui, quoi, comment, et après.', 'Écris une page, pas plus.'],
    dureeEstimee: "Une heure, seul ou à deux. Le texte s'améliore à chaque dossier.",
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Exemple de projet en une page',
        lien: `${MODELES}/exemple-projet-en-une-page.docx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: "Le modèle à suivre : les quatre questions, remplies pour une association imaginaire.",
      },
    ],
    renvois: [],
    quandCestFini: 'Tu as un texte prêt à copier dans tous les dossiers.',
    apporte: 'Ton projet en une page est prêt.',
    lexique: [
      { mot: 'Projet associatif', explication: "Le texte qui dit ce que l'association veut faire et pourquoi." },
      { mot: 'Appel à projets', explication: "Quand un financeur dit : « j'ai de l'argent pour tel sujet, envoyez-moi vos projets avant telle date »." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 9,
    slug: 'le-premier-budget',
    titre: 'Chiffrer le budget',
    nature: 'SI_CONCERNE',
    declencheur: 'Demandé dans toute demande de subvention.',
    prerequis: ['le-projet-en-une-page'],
    partie: 'SUBVENTION',
    enUnMot: 'Un tableau : ce que ça va coûter à gauche, d\'où vient l\'argent à droite. Les deux totaux sont égaux.',
    pourquoi:
      "Un financeur ne donne pas d'argent sans savoir combien il te faut, pour quoi, et ce que tu apportes toi-même.",
    ilTeFaut: ['Le projet en une page (étape 8).', 'Le trésorier, ou une calculatrice.', "L'exemple de budget ci-dessous."],
    commentFaire: [
      {
        titre: 'Liste les dépenses',
        detail: "Tout ce que le projet va coûter : matériel, location de salle, transport, assurance, goûters… Une ligne par chose, avec un montant.",
      },
      {
        titre: 'Liste les recettes',
        detail:
          "D'où vient l'argent : cotisations, ventes, la subvention que tu demandes, ce que l'association met de sa poche. Le total des recettes doit être égal au total des dépenses. C'est ce qu'on appelle un budget équilibré.",
      },
      {
        titre: 'Ajoute le temps des bénévoles',
        detail:
          "Les heures données gratuitement, comptées en euros (par exemple 20 heures × 12 €). Ça ne change pas les totaux, mais le financeur voit ce que vous apportez vous-mêmes.",
      },
    ],
    quoiFaire: ['Liste les dépenses.', 'Liste les recettes, pour arriver au même total.', 'Ajoute le temps des bénévoles.'],
    dureeEstimee: 'Deux heures avec le trésorier.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Exemple de budget prévisionnel (tableau)',
        lien: `${MODELES}/exemple-budget-previsionnel.xlsx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: 'Le tableau à remplir. Les totaux se calculent tout seuls et te disent si le budget est équilibré.',
      },
      {
        titre: 'Valoriser le bénévolat',
        lien: 'https://associations.gouv.fr/la-valorisation-comptable-du-benevolat',
        genre: 'SITE',
        aQuoiCaSert: 'La méthode officielle pour compter le temps des bénévoles.',
      },
    ],
    renvois: [],
    quandCestFini: 'Tu as un budget équilibré, prêt à recopier dans le formulaire de demande.',
    apporte: 'Le budget prévisionnel entre dans le classeur.',
    lexique: [
      { mot: 'Budget prévisionnel', explication: "Le tableau des dépenses et des recettes prévues pour le projet ou pour l'année." },
      { mot: 'Équilibré', explication: 'Quand le total des recettes est égal au total des dépenses.' },
      { mot: 'Valorisation du bénévolat', explication: 'Compter en euros les heures données gratuitement.' },
    ],
    piecesAjoutees: ['BUDGET_PREVISIONNEL'],
  },
  {
    numero: 10,
    slug: 'trouver-le-premier-financeur',
    titre: 'Trouver à qui demander',
    nature: 'CONSEILLE',
    prerequis: ['le-projet-en-une-page', 'le-premier-budget'],
    partie: 'SUBVENTION',
    enUnMot: "La mairie d'abord, puis l'État (le FDVA), puis le département. Et les appels à projets.",
    pourquoi:
      "Le premier soutien d'une petite association vient presque toujours de tout près. La mairie connaît ton quartier ; le FDVA est fait pour les petites associations ; les appels à projets ouvrent des portes précises.",
    ilTeFaut: ['Le projet en une page et le budget (étapes 8 et 9).', 'Une demi-journée.'],
    commentFaire: [
      {
        titre: 'Va voir ta mairie',
        detail:
          "Demande le « service vie associative ». Dis ce que tu fais, demande le formulaire de subvention et la date limite. Souvent, c'est le CERFA 12156, à rendre avant la fin de l'année pour l'année suivante.",
      },
      {
        titre: 'Repère le FDVA de ton département',
        detail:
          "Le FDVA, c'est l'aide de l'État pour les petites associations. Chaque département ouvre sa campagne une fois par an, souvent au premier semestre. La demande se fait sur Le Compte Asso.",
      },
      {
        titre: 'Cherche les appels à projets qui te ressemblent',
        detail:
          "Sur Aides-territoires, tu tapes ta commune et ton sujet : la liste des aides et des appels à projets s'affiche, avec les dates limites. Note celles qui te correspondent.",
      },
      {
        titre: 'Note chaque piste dans « Mes dossiers »',
        detail: "Le financeur, le dispositif, la date limite. C'est ton tableau de suivi : plus rien n'est oublié.",
      },
    ],
    quoiFaire: ['Va voir le service vie associative de la mairie.', 'Repère la campagne FDVA de ton département.', 'Cherche les appels à projets sur Aides-territoires.', 'Note chaque piste dans Mes dossiers.'],
    dureeEstimee: 'Une demi-journée de repérage, un rendez-vous en mairie.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Aides-territoires',
        lien: 'https://aides-territoires.beta.gouv.fr/',
        genre: 'SITE',
        aQuoiCaSert: "L'annuaire public des aides et des appels à projets, par commune et par sujet.",
      },
      {
        titre: 'Le FDVA expliqué',
        lien: 'https://associations.gouv.fr/fonds-pour-le-developpement-de-la-vie-associative-fdva',
        genre: 'SITE',
        aQuoiCaSert: "L'aide de l'État aux petites associations : qui peut demander, quand, comment.",
      },
      {
        titre: 'Le Compte Asso',
        lien: 'https://lecompteasso.associations.gouv.fr/',
        genre: 'SITE',
        aQuoiCaSert: "Le site de l'État où tu déposes une demande FDVA.",
      },
      {
        titre: 'Exemple de lettre à la mairie',
        lien: `${MODELES}/exemple-lettre-demande-subvention-mairie.docx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: 'Pour accompagner le formulaire, ou pour demander un rendez-vous.',
      },
    ],
    renvois: [],
    quandCestFini: 'Tu as au moins une piste avec une date limite, notée dans Mes dossiers.',
    apporte: 'Un premier dossier est repéré, avec sa date limite.',
    lexique: [
      { mot: 'FDVA', explication: "Le fonds pour le développement de la vie associative : l'aide de l'État aux petites associations, département par département." },
      { mot: 'Dispositif', explication: "Un programme d'aide précis, avec son financeur, ses règles et sa date limite." },
      { mot: 'Appel à projets', explication: "Un financeur annonce un sujet et une date : les associations envoient leur projet, les meilleurs sont financés." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 11,
    slug: 'constituer-et-deposer-le-dossier',
    titre: 'Remplir et déposer le dossier',
    nature: 'SI_CONCERNE',
    declencheur: "Pour toute subvention publique, avec le contrat d'engagement républicain.",
    echeance: { texte: 'Avant la date limite du financeur.' },
    prerequis: ['obtenir-le-siret', 'les-cinq-pieces-d-identite', 'le-premier-budget', 'trouver-le-premier-financeur'],
    partie: 'SUBVENTION',
    enUnMot: 'Le formulaire CERFA 12156, ton projet, ton budget, les papiers du classeur. Tu vérifies, tu déposes.',
    pourquoi:
      "Un dossier incomplet est mis de côté sans être lu. Vérifier avant de déposer, c'est la différence entre une réponse et un silence.",
    ilTeFaut: ['Le projet en une page (8), le budget (9), une piste avec sa date limite (10).', 'Les papiers du classeur (3, 4, 7).', 'Deux à trois heures la première fois.'],
    commentFaire: [
      {
        titre: 'Ouvre le formulaire CERFA 12156',
        detail:
          "C'est le formulaire commun de demande de subvention : presque tous les financeurs publics l'utilisent. Il a une notice (la 51781) qui explique chaque case. Sur Le Compte Asso, le même formulaire se remplit en ligne.",
      },
      {
        titre: 'Remplis les cases avec ce que tu as déjà',
        detail:
          "L'identité de l'association : les numéros du classeur. Le projet : ton texte en une page. Le budget : ton tableau, ligne par ligne. Tu recopies, tu n'inventes rien.",
      },
      {
        titre: 'Joins les papiers demandés',
        detail:
          "Le financeur donne une liste : statuts, récépissé, RIB, dernier procès-verbal, comptes, budget… Dans « Mes dossiers », tu coches chaque papier ; ceux du classeur sont déjà là.",
      },
      {
        titre: "Signe le contrat d'engagement républicain",
        detail:
          "Chaque demande de subvention publique engage l'association à respecter ce contrat : sept engagements, comme le respect des lois de la République, la liberté de conscience, l'égalité et la dignité des personnes. Tu le souscris en signant l'attestation sur l'honneur du formulaire. L'association veille ensuite à ce que ses dirigeants, salariés, membres et bénévoles le respectent.",
      },
      {
        titre: 'Vérifie, puis dépose toi-même',
        detail:
          "Chaque papier présent, à jour, lisible. Puis tu déposes : en ligne (Le Compte Asso pour l'État, le site de la mairie ou du département) ou en main propre. Note la date de dépôt dans Mes dossiers.",
      },
    ],
    quoiFaire: [
      'Ouvre le CERFA 12156.',
      'Recopie ton projet et ton budget.',
      'Joins les papiers demandés.',
      "Signe l'attestation qui souscrit au contrat d'engagement républicain.",
      'Vérifie, puis dépose et note la date.',
    ],
    dureeEstimee: 'Deux à trois heures la première fois, moins ensuite.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Demande de subvention',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R1271',
        genre: 'CERFA',
        numero: 'CERFA 12156',
        aQuoiCaSert: 'Le formulaire commun de demande de subvention, avec sa notice 51781.',
      },
      {
        titre: 'Déposer une demande sur Le Compte Asso',
        lien: 'https://lecompteasso.associations.gouv.fr/',
        genre: 'SITE',
        aQuoiCaSert: "Pour l'État (FDVA et autres) : le CERFA se remplit directement en ligne.",
      },
      {
        titre: 'Exemple de budget prévisionnel (tableau)',
        lien: `${MODELES}/exemple-budget-previsionnel.xlsx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: 'Les lignes de ce tableau correspondent aux cases budget du CERFA.',
      },
    ],
    renvois: [
      {
        nom: "Le contrat d'engagement républicain, le guide pratique (associations.gouv.fr)",
        lien: 'https://www.associations.gouv.fr/le-contrat-d-engagement-republicain-le-guide-pratique.html',
        pourQuoi: "Les sept engagements expliqués, et ce qui se passe s'ils ne sont pas respectés.",
      },
    ],
    quandCestFini: "Le dossier est déposé, la date est notée. Il ne reste qu'à attendre la réponse, puis à rendre compte.",
    apporte: 'Le dossier est déposé. La date du compte rendu est notée pour toi.',
    lexique: [
      { mot: 'CERFA', explication: "Un formulaire officiel de l'administration. Chaque CERFA a un numéro." },
      { mot: 'CERFA 12156', explication: 'Le formulaire de demande de subvention, le même pour presque tous les financeurs publics.' },
      { mot: 'Notice', explication: 'Le mode d\'emploi du formulaire, case par case.' },
      { mot: 'Recevable', explication: "Un dossier complet, arrivé à temps : le financeur accepte de le lire." },
      {
        mot: "Contrat d'engagement républicain",
        explication: "Sept engagements que toute association souscrit quand elle demande une subvention publique. La signature se fait dans l'attestation du formulaire.",
      },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 12,
    slug: 'rendre-compte',
    titre: "Rendre compte de l'argent reçu",
    nature: 'SI_CONCERNE',
    declencheur: 'Dès qu\'une subvention est reçue.',
    echeance: {
      texte: "Dans les 6 mois après la fin de l'exercice de la subvention, sauf autre date dans la convention.",
      dateFixe: '06-30',
      indicative: true,
    },
    prerequis: ['constituer-et-deposer-le-dossier', 'tenir-des-comptes-simples'],
    partie: 'SUBVENTION',
    enUnMot: "Tu montres ce que tu as fait avec l'argent. Sans ça, pas de subvention l'année suivante.",
    pourquoi:
      "Une subvention reçue doit être justifiée : le financeur veut voir ce que son argent a permis. Le compte rendu est obligatoire, et il est demandé avant toute nouvelle subvention.",
    ilTeFaut: ['Le budget que tu avais déposé (étape 9).', 'Le cahier de comptes tenu pendant l\'action (étape 6).', 'Les tickets et factures.'],
    commentFaire: [
      {
        titre: 'Ouvre le formulaire CERFA 15059',
        detail: "C'est le compte rendu financier de subvention. Il ressemble au budget, mais avec les vrais chiffres à côté des chiffres prévus.",
      },
      {
        titre: 'Mets les vrais chiffres en face des prévus',
        detail: "Pour chaque ligne : ce que tu avais prévu, ce que tu as vraiment dépensé. Explique en une phrase les écarts importants.",
      },
      {
        titre: "Raconte ce que l'action a produit",
        detail: "Combien de personnes, combien de séances, ce qui a changé. Des chiffres simples et une ou deux phrases.",
      },
      {
        titre: 'Envoie dans les six mois',
        detail:
          "Au plus tard six mois après la fin de l'année de la subvention (ou la date écrite dans la convention). Joins les justificatifs si on te les demande. Garde une copie dans le classeur.",
      },
    ],
    quoiFaire: ['Ouvre le CERFA 15059.', 'Mets les vrais chiffres en face des prévus.', "Raconte ce que l'action a produit.", 'Envoie dans les six mois, garde une copie.'],
    dureeEstimee: "Deux heures, si les comptes ont été tenus au fil de l'année.",
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Compte rendu financier de subvention',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R46623',
        genre: 'CERFA',
        numero: 'CERFA 15059',
        aQuoiCaSert: 'Le formulaire officiel à renvoyer au financeur.',
      },
      {
        titre: 'Exemple de cahier de comptes (tableau)',
        lien: `${MODELES}/exemple-cahier-de-comptes.xlsx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: "Si tu l'as tenu pendant l'année, les chiffres du compte rendu sont déjà dedans.",
      },
    ],
    renvois: [],
    quandCestFini: "Le dossier est soldé. Tu peux redemander l'année suivante. La suite du chemin, c'est ce qui revient chaque année.",
    apporte: "Le dossier est soldé. Le chemin continue avec ce qui revient chaque année.",
    lexique: [
      { mot: 'Compte rendu financier', explication: "Le document qui montre au financeur comment sa subvention a été dépensée et ce qu'elle a permis." },
      { mot: 'Convention', explication: "Le contrat signé avec le financeur pour les grosses subventions : il fixe les engagements et les dates." },
      { mot: 'Soldé', explication: "Un dossier fini : l'argent a été reçu, dépensé et justifié." },
    ],
    piecesAjoutees: [],
  },
  // ------------------------------------------------------ 4. CHAQUE ANNÉE
  {
    numero: 13,
    slug: 'assemblee-generale-de-l-annee',
    titre: "Tenir l'assemblée générale de l'année",
    nature: 'OBLIGATOIRE',
    declencheur: 'Chaque année, si tes statuts la prévoient (presque toujours).',
    echeance: { texte: 'Dans le délai fixé par tes statuts, souvent dans les mois qui suivent la fin des comptes.' },
    prerequis: ['les-adherents-et-les-cotisations', 'tenir-des-comptes-simples'],
    partie: 'CHAQUE_ANNEE',
    chaqueAnnee: true,
    enUnMot: "Une fois par an, les membres se réunissent : on raconte l'année, on montre les comptes, on vote.",
    pourquoi:
      "Les statuts prévoient presque toujours une assemblée par an. Les financeurs demandent le procès-verbal de la dernière assemblée et les comptes approuvés : ceux d'il y a deux ans ne suffisent plus.",
    ilTeFaut: ["Les comptes de l'année qui vient de finir.", "Le rapport d'activité de l'année.", 'La liste des membres à jour.'],
    commentFaire: [
      {
        titre: "Prépare le rapport d'activité et les comptes",
        detail: "Une page sur ce que l'association a fait, et les totaux du cahier de comptes. Le trésorier présente les comptes, le président présente l'année.",
      },
      {
        titre: 'Convoque les membres',
        detail: "Une convocation avec la date, le lieu et l'ordre du jour, dans le délai écrit dans les statuts (souvent 15 jours). Un mail suffit, sauf si les statuts disent autre chose.",
      },
      {
        titre: 'Faites voter',
        detail:
          "Le rapport d'activité, les comptes de l'année, le budget de l'année qui commence. Si des mandats arrivent à leur fin, on élit les responsables.",
      },
      {
        titre: 'Écris le procès-verbal et range-le',
        detail: "Signé par le président et le secrétaire, avec les comptes approuvés. Les deux vont dans le classeur. Note aussi la date dans ton espace.",
      },
    ],
    quoiFaire: [
      "Prépare le rapport d'activité et les comptes.",
      'Convoque les membres dans le délai des statuts.',
      "Faites voter l'année, les comptes et le budget.",
      'Écris le procès-verbal et range-le avec les comptes.',
    ],
    dureeEstimee: 'Une demi-journée de préparation, une réunion, une heure pour le procès-verbal.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: "Exemple de procès-verbal d'assemblée générale",
        lien: `${MODELES}/exemple-proces-verbal-assemblee-generale.docx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: 'À recopier après la réunion, en changeant les noms et les chiffres.',
      },
      {
        titre: "Exemple de rapport d'activité",
        lien: `${MODELES}/exemple-rapport-activite.docx`,
        genre: 'EXEMPLE',
        aQuoiCaSert: "Une page qui raconte l'année. Les financeurs le demandent aussi.",
      },
    ],
    renvois: [
      {
        nom: 'Faut-il déclarer quelque chose après chaque assemblée ? (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34728',
        pourQuoi: 'Ce qui se déclare après la réunion, et ce qui ne se déclare pas.',
      },
    ],
    quandCestFini: "Le procès-verbal de l'année est signé et les comptes sont approuvés. Les deux sont dans le classeur.",
    apporte: "Le procès-verbal, le rapport d'activité et les comptes de l'année entrent dans le classeur. L'étape revient l'an prochain.",
    lexique: [
      { mot: 'Approuver les comptes', explication: "Les membres votent « oui » aux comptes présentés par le trésorier. C'est ce que les financeurs veulent voir." },
      { mot: 'Mandat', explication: "La durée pour laquelle un responsable est élu. Elle est écrite dans les statuts." },
    ],
    piecesAjoutees: ['PV_DERNIERE_AG', 'RAPPORT_ACTIVITE', 'COMPTES_ANNUELS'],
  },
  {
    numero: 14,
    slug: 'declarer-les-changements',
    titre: "Déclarer les changements de l'année",
    nature: 'OBLIGATOIRE',
    declencheur: "À chaque changement de dirigeant, de siège, de nom, d'objet ou de statuts.",
    echeance: { texte: 'Dans les 3 mois après le changement.' },
    prerequis: ['declarer-l-association'],
    partie: 'CHAQUE_ANNEE',
    chaqueAnnee: true,
    enUnMot: 'Un nouveau président, une nouvelle adresse, des statuts modifiés : tu le déclares dans les trois mois.',
    pourquoi:
      "Tant qu'un changement n'est pas déclaré, il ne compte pas pour les autres : la banque, la mairie et les financeurs voient encore l'ancien président ou l'ancienne adresse. Ne pas déclarer expose aussi les dirigeants à une amende.",
    ilTeFaut: ["Le procès-verbal de la réunion qui a décidé le changement.", 'Les statuts à jour, si tu les as modifiés.', 'Ton numéro RNA.'],
    commentFaire: [
      {
        titre: "Fais la liste des changements de l'année",
        detail:
          "Les responsables (président, trésorier, secrétaire), l'adresse du siège, le nom, l'objet, les statuts. Rien n'a bougé ? Tu n'as rien à déclarer : coche l'étape, tu as vérifié.",
      },
      {
        titre: 'Déclare en ligne dans les trois mois',
        detail:
          "La déclaration part au greffe des associations, en ligne et gratuitement. Joins le procès-verbal, et les nouveaux statuts s'ils ont changé.",
      },
      {
        titre: "Préviens l'INSEE si le nom, l'objet ou l'adresse changent",
        detail: "Ton SIRET doit suivre. Sinon, les financeurs trouvent une adresse qui n'est plus la bonne.",
      },
      {
        titre: 'Range le récépissé dans le classeur',
        detail: "Le greffe renvoie un récépissé de modification. C'est la preuve que le changement est enregistré.",
      },
    ],
    quoiFaire: [
      "Fais la liste des changements de l'année.",
      'Déclare-les en ligne dans les trois mois (gratuit).',
      "Préviens l'INSEE si le nom, l'objet ou l'adresse changent.",
      'Range le récépissé dans le classeur.',
    ],
    dureeEstimee: 'Dix minutes pour vérifier. Un quart d\'heure en ligne par changement.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Déclarer un changement de dirigeants',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34797',
        genre: 'SITE',
        aQuoiCaSert: 'Si le président, le trésorier ou le secrétaire change.',
      },
      {
        titre: "Modifier le nom, l'objet ou le siège (service en ligne)",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R19468',
        genre: 'SITE',
        aQuoiCaSert: "Le service officiel pour déclarer les autres changements, gratuit.",
      },
      {
        titre: 'Modifier les statuts',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1123',
        genre: 'SITE',
        aQuoiCaSert: 'Comment on décide une modification, et comment on la déclare.',
      },
    ],
    renvois: [
      {
        nom: 'Faut-il déclarer quelque chose après chaque assemblée ? (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34728',
        pourQuoi: 'La liste officielle de ce qui se déclare dans les trois mois.',
      },
    ],
    quandCestFini: "Chaque changement de l'année est déclaré, ou tu as vérifié qu'il n'y en a pas eu.",
    apporte: "La liste des dirigeants du classeur est à jour. L'étape revient l'an prochain.",
    lexique: [
      { mot: 'Greffe des associations', explication: "Le service de l'État qui enregistre les associations et leurs changements." },
      { mot: 'Récépissé de modification', explication: "Le papier qui prouve que le changement est enregistré." },
    ],
    piecesAjoutees: ['LISTE_DIRIGEANTS'],
  },
  {
    numero: 15,
    slug: 'declarer-les-recus-fiscaux',
    titre: "Déclarer les reçus fiscaux de l'année",
    nature: 'SI_CONCERNE',
    declencheur: "Dès que l'association délivre des reçus fiscaux pour des dons.",
    echeance: { texte: "Dans les 3 mois après la fin de l'exercice. Exercice civil : au plus tard le 2e jour ouvré après le 1er mai." },
    prerequis: ['tenir-des-comptes-simples'],
    partie: 'CHAQUE_ANNEE',
    chaqueAnnee: true,
    peutNePasConcerner: true,
    enUnMot: "Si l'association donne des reçus pour les dons, elle dit chaque année aux impôts combien elle a reçu et combien de reçus elle a donnés.",
    pourquoi:
      "C'est obligatoire pour les dons reçus depuis 2021 (article 222 bis du code général des impôts). Les impôts peuvent contrôler les reçus : une association qui en délivre sans y avoir droit risque une amende.",
    ilTeFaut: ["Le cahier de comptes de l'année.", 'La liste des reçus fiscaux délivrés.'],
    commentFaire: [
      {
        titre: 'Fais deux totaux',
        detail: "Le montant des dons pour lesquels tu as donné un reçu fiscal, et le nombre de reçus délivrés pendant l'exercice.",
      },
      {
        titre: 'Choisis le bon formulaire',
        detail:
          "Si l'association dépose déjà une déclaration de résultat (formulaire 2065 ou 2070), les deux chiffres vont dans le cadre prévu. Sinon, il existe un formulaire en ligne, indiqué sur impots.gouv.fr.",
      },
      {
        titre: "Envoie dans les trois mois après la fin de l'exercice",
        detail: "Pour un exercice du 1er janvier au 31 décembre, c'est début mai.",
      },
      {
        titre: 'Pas de reçus fiscaux ? Choisis « Pas concerné »',
        detail: "Si l'association ne donne aucun reçu, il n'y a rien à déclarer. L'étape revient l'an prochain, au cas où.",
      },
    ],
    quoiFaire: [
      'Additionne les dons reçus avec reçu fiscal.',
      'Compte les reçus délivrés.',
      "Déclare les deux chiffres dans les trois mois après la fin de l'exercice.",
    ],
    dureeEstimee: 'Une demi-heure si le cahier de comptes est à jour.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Déclaration des dons et reçus (impots.gouv.fr)',
        lien: 'https://www.impots.gouv.fr/professionnel/declaration-des-dons-et-recus',
        genre: 'SITE',
        aQuoiCaSert: 'Qui déclare, quoi, où et quand : la page officielle des impôts.',
      },
      {
        titre: 'Déclaration des dons et des reçus fiscaux (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/declaration-des-dons-et-des-recus-fiscaux',
        genre: 'SITE',
        aQuoiCaSert: 'La même obligation, expliquée pour les associations.',
      },
    ],
    renvois: [],
    quandCestFini: "Les deux chiffres de l'année sont déclarés, ou l'association n'a donné aucun reçu.",
    apporte: "Tes reçus fiscaux sont en règle pour l'année. L'étape revient l'an prochain.",
    lexique: [
      { mot: 'Reçu fiscal', explication: "Le papier qui permet au donateur de déduire une partie de son don de ses impôts." },
      { mot: 'Exercice', explication: "L'année sur laquelle on fait les comptes, souvent du 1er janvier au 31 décembre." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 16,
    slug: 'publier-les-comptes',
    titre: 'Publier les comptes au Journal officiel',
    nature: 'SI_CONCERNE',
    declencheur: "Au-delà de 153 000 € de subventions publiques, ou de dons avec reçu fiscal, dans l'année.",
    echeance: { texte: "Dans les 3 mois après l'approbation des comptes par l'assemblée." },
    prerequis: ['assemblee-generale-de-l-annee'],
    partie: 'CHAQUE_ANNEE',
    chaqueAnnee: true,
    peutNePasConcerner: true,
    enUnMot: "Au-delà de 153 000 € de subventions ou de dons dans l'année, les comptes sont certifiés puis publiés en ligne.",
    pourquoi:
      "Une association qui reçoit plus de 153 000 € de subventions publiques dans l'année doit établir des comptes complets, les faire certifier par un commissaire aux comptes et les publier. Même chose au-delà de 153 000 € de dons qui donnent droit à une réduction d'impôt. Les deux seuils se comptent séparément.",
    ilTeFaut: ["Le total des subventions publiques de l'année.", "Le total des dons avec reçu fiscal de l'année."],
    commentFaire: [
      {
        titre: "Fais les deux totaux de l'année",
        detail:
          "D'un côté les subventions publiques, de l'autre les dons qui donnent droit à une réduction d'impôt. Aucun des deux ne dépasse 153 000 € ? Choisis « Pas concerné ».",
      },
      {
        titre: 'Nomme un commissaire aux comptes',
        detail: "Si un seuil est dépassé, l'association désigne un commissaire aux comptes et un suppléant. Il vérifie les comptes et les certifie.",
      },
      {
        titre: "Fais approuver les comptes par l'assemblée",
        detail: "Les comptes complets (bilan, compte de résultat, annexe) et le rapport du commissaire sont présentés aux membres.",
      },
      {
        titre: 'Publie en ligne, dans les trois mois',
        detail: "Dans les trois mois qui suivent l'approbation, les comptes et le rapport du commissaire se publient sur le service en ligne du Journal officiel. C'est gratuit.",
      },
    ],
    quoiFaire: [
      'Fais le total des subventions publiques et celui des dons.',
      'Au-delà de 153 000 €, nomme un commissaire aux comptes.',
      "Fais approuver les comptes par l'assemblée.",
      'Publie les comptes en ligne dans les trois mois.',
    ],
    dureeEstimee: "Une heure pour vérifier les seuils. Si tu es concerné, compte plusieurs jours pour la certification.",
    cout: 'La publication est gratuite. Le commissaire aux comptes est payant.',
    documents: [
      {
        titre: 'Publier les comptes annuels (service en ligne)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R823',
        genre: 'SITE',
        aQuoiCaSert: 'Le service officiel et gratuit pour publier les comptes au Journal officiel.',
      },
      {
        titre: 'Quand faut-il un commissaire aux comptes ?',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2907',
        genre: 'SITE',
        aQuoiCaSert: 'Les seuils officiels, avec un exemple chiffré.',
      },
    ],
    renvois: [
      {
        nom: 'Obligations comptables et publicité des comptes (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/obligations-comptables-et-publicite-des-comptes',
        pourQuoi: 'Ce que la loi demande selon la taille de l\'association.',
      },
    ],
    quandCestFini: "Les comptes de l'année sont publiés, ou l'association reste sous les seuils.",
    apporte: "Les comptes certifiés entrent dans le classeur. L'étape revient l'an prochain.",
    lexique: [
      { mot: 'Commissaire aux comptes', explication: "Un professionnel indépendant qui vérifie les comptes et dit s'ils sont justes." },
      { mot: 'Certifier', explication: "Le commissaire aux comptes signe un rapport qui dit que les comptes sont réguliers et sincères." },
      { mot: 'Journal officiel', explication: "Le journal de l'État où sont publiés les comptes des grandes associations." },
    ],
    piecesAjoutees: ['COMPTES_ANNUELS'],
  },
  {
    numero: 17,
    slug: 'garder-les-papiers',
    titre: 'Garder les papiers le temps qu\'il faut',
    nature: 'OBLIGATOIRE',
    declencheur: 'Dès le premier papier : statuts, comptes, reçus fiscaux, contrats, fiches de paie.',
    partie: 'CHAQUE_ANNEE',
    chaqueAnnee: true,
    enUnMot: "Chaque papier a une durée de conservation fixée par la loi. Une fois par an, tu ranges ce qui doit rester et tu jettes ce qui a fait son temps.",
    pourquoi:
      "Un financeur, les impôts ou l'Urssaf peuvent demander une pièce des années plus tard. Si elle a été jetée trop tôt, l'association ne peut pas se défendre. À l'inverse, garder des données personnelles trop longtemps est interdit.",
    ilTeFaut: ['Le classeur papier ou numérique de l\'association.', "Le tableau des durées de service-public.gouv.fr."],
    commentFaire: [
      {
        titre: 'Garde pour toujours les statuts',
        detail: "Les statuts et leurs versions successives se gardent toute la vie de l'association, avec les récépissés de la préfecture.",
      },
      {
        titre: 'Garde 10 ans les comptes et les subventions',
        detail: "Les comptes annuels, les pièces comptables (factures, relevés) et les dossiers de subvention se gardent au moins 10 ans.",
      },
      {
        titre: 'Garde 6 ans les papiers fiscaux',
        detail: 'Les documents fiscaux et les doubles des reçus remis aux donateurs se gardent au moins 6 ans.',
      },
      {
        titre: 'Garde 5 ans les papiers des personnes',
        detail: "Les procès-verbaux d'assemblée, les fiches de paie et les contrats de travail : au moins 5 ans. La liste des membres : la durée de l'adhésion, puis 5 ans.",
      },
      {
        titre: 'Une fois par an, fais le tri',
        detail: 'Range les papiers de l\'année qui vient de finir, et détruis ceux qui ont dépassé leur durée, surtout ceux qui contiennent des données personnelles.',
      },
    ],
    quoiFaire: [
      'Garde les statuts pour toujours.',
      'Garde 10 ans les comptes et les dossiers de subvention.',
      'Garde 6 ans les papiers fiscaux et les reçus.',
      "Garde 5 ans les PV d'assemblée, les fiches de paie et les contrats.",
      'Fais le tri une fois par an.',
    ],
    dureeEstimee: "Une heure par an, si les papiers sont rangés au fil de l'eau.",
    cout: 'Gratuit.',
    documents: [
      {
        titre: "Les délais de conservation des documents d'une association",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F32081',
        genre: 'SITE',
        aQuoiCaSert: 'Le tableau officiel, papier par papier.',
      },
    ],
    renvois: [],
    quandCestFini: "Les papiers de l'année sont rangés, et ceux qui avaient fait leur temps sont détruits.",
    apporte: "Le classeur est en ordre pour un contrôle. L'étape revient l'an prochain.",
    lexique: [
      { mot: 'Durée de conservation', explication: 'Le temps minimum pendant lequel la loi demande de garder un papier.' },
      { mot: 'Pièce comptable', explication: "Une facture, un ticket ou un relevé qui prouve une ligne du cahier de comptes." },
    ],
    piecesAjoutees: [],
  },
  // --------------------------------------------- 5. SELON TON ACTIVITÉ
  {
    numero: 18,
    slug: 'le-premier-salarie',
    titre: 'Embaucher le premier salarié',
    nature: 'SI_CONCERNE',
    declencheur: 'Dès le premier salarié, même à temps partiel.',
    echeance: { texte: "DPAE dans les 8 jours avant l'embauche, puis déclaration des salaires chaque mois." },
    prerequis: ['obtenir-le-siret'],
    partie: 'SELON_ACTIVITE',
    peutNePasConcerner: true,
    enUnMot: 'Avant le premier jour de travail, une déclaration. Ensuite, chaque mois, une déclaration des salaires.',
    pourquoi:
      "Employer quelqu'un fait de l'association un employeur, avec les mêmes obligations qu'une entreprise. Le chèque emploi associatif de l'Urssaf fait une grande partie des démarches à ta place, gratuitement.",
    ilTeFaut: ['Le SIRET de l\'association (étape 2).', 'Le budget qui montre que le salaire est payable.', 'Les papiers du futur salarié.'],
    commentFaire: [
      {
        titre: "Déclare l'embauche avant le premier jour",
        detail:
          "La déclaration préalable à l'embauche (DPAE) se fait en ligne, dans les huit jours qui précèdent l'embauche. Avec le chèque emploi associatif, un seul document sert de DPAE et de contrat de travail.",
      },
      {
        titre: 'Trouve ta convention collective',
        detail:
          "Elle dépend de l'activité de l'association. Pour l'animation, l'éducation populaire et les loisirs, c'est souvent la convention ÉCLAT (IDCC 1518). Vérifie sur le Code du travail numérique.",
      },
      {
        titre: 'Propose une mutuelle',
        detail: "Tout employeur privé, association comprise, doit proposer une complémentaire santé collective à ses salariés, sauf exceptions.",
      },
      {
        titre: 'Adhère à un service de santé au travail',
        detail: "Le salarié passe une visite d'information et de prévention dans les trois mois qui suivent sa prise de poste.",
      },
      {
        titre: 'Déclare les salaires chaque mois',
        detail: "La déclaration sociale nominative (DSN) se fait en ligne chaque mois, dès le premier salaire. Le chèque emploi associatif la fait pour toi.",
      },
    ],
    quoiFaire: [
      "Fais la DPAE dans les huit jours avant l'embauche.",
      'Trouve la convention collective qui s\'applique.',
      'Propose une complémentaire santé collective.',
      'Adhère à un service de santé au travail.',
      'Déclare les salaires chaque mois (DSN).',
    ],
    dureeEstimee: 'Une demi-journée pour tout mettre en place, puis quelques minutes par mois avec le chèque emploi associatif.',
    cout: "Les démarches sont gratuites. Le salaire, les cotisations et la mutuelle sont à la charge de l'association.",
    documents: [
      {
        titre: 'Le chèque emploi associatif (Urssaf)',
        lien: 'https://www.urssaf.fr/accueil/services/services-employeurs/service-cea.html',
        genre: 'SITE',
        aQuoiCaSert: 'Le service gratuit qui fait la DPAE, les bulletins de paie et la DSN pour les associations.',
      },
      {
        titre: "Les démarches d'un nouvel employeur (Urssaf)",
        lien: 'https://www.urssaf.fr/accueil/employeur/embaucher-gerer-salaries/embaucher/employeur-demarches-embauche.html',
        genre: 'SITE',
        aQuoiCaSert: "La DPAE, la DSN et le reste, dans l'ordre.",
      },
      {
        titre: 'La convention collective ÉCLAT',
        lien: 'https://code.travail.gouv.fr/convention-collective/1518-education-culture-loisirs-et-animation-au-service-des-territoires-eclat',
        genre: 'SITE',
        aQuoiCaSert: "La convention de l'animation, expliquée sur le Code du travail numérique.",
      },
      {
        titre: 'La complémentaire santé obligatoire',
        lien: 'https://entreprendre.service-public.gouv.fr/vosdroits/F33754',
        genre: 'SITE',
        aQuoiCaSert: "Ce que l'employeur doit proposer, et les cas de dispense.",
      },
      {
        titre: "La visite d'information et de prévention",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34061',
        genre: 'SITE',
        aQuoiCaSert: 'La visite de médecine du travail après l\'embauche.',
      },
    ],
    renvois: [],
    quandCestFini: 'Le salarié est déclaré, couvert, suivi par la médecine du travail, et ses salaires sont déclarés chaque mois.',
    apporte: "L'association est en règle comme employeur. Pas de salarié ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'DPAE', explication: "La déclaration préalable à l'embauche, à faire avant le premier jour de travail." },
      { mot: 'DSN', explication: 'La déclaration sociale nominative : chaque mois, les salaires et les cotisations déclarés en ligne.' },
      { mot: 'Convention collective', explication: "Les règles d'un secteur (salaires minimum, congés, primes) qui s'ajoutent au code du travail." },
      { mot: 'Chèque emploi associatif', explication: "Le service gratuit de l'Urssaf qui fait la paie et les déclarations des associations." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 19,
    slug: 'accueillir-des-mineurs',
    titre: 'Accueillir des enfants en groupe',
    nature: 'SI_CONCERNE',
    declencheur: 'Dès 7 mineurs accueillis hors de la famille : accueil de loisirs, séjour, accueil de jeunes.',
    echeance: { texte: "Fiche initiale 2 mois avant l'accueil, fiche complémentaire au plus tard 8 jours avant." },
    prerequis: ['le-compte-bancaire-et-l-assurance'],
    partie: 'SELON_ACTIVITE',
    peutNePasConcerner: true,
    enUnMot: "Un centre de loisirs, un séjour, un accueil de jeunes : l'accueil se déclare à l'État avant de commencer.",
    pourquoi:
      "À partir de 7 mineurs, un accueil de loisirs ou un séjour est en général un accueil collectif de mineurs. Il se déclare au service jeunesse de l'État de ton département (SDJES), qui vérifie que les personnes qui encadrent ont le droit de travailler avec des enfants.",
    ilTeFaut: ["Le projet éducatif de l'association.", "La liste de l'équipe (directeur, animateurs, bénévoles).", 'Les dates et le lieu de l\'accueil.'],
    commentFaire: [
      {
        titre: 'Vérifie que ton activité est un accueil collectif de mineurs',
        detail:
          "Accueil de loisirs (7 à 300 mineurs, au moins 14 jours par an), séjours avec nuits, accueil de jeunes. Un simple atelier ne l'est pas toujours. En cas de doute, demande au SDJES de ton département.",
      },
      {
        titre: 'Déclare en ligne avec TAM',
        detail:
          "Dans la plupart des cas, la fiche initiale part deux mois avant le début de l'accueil. Puis une fiche complémentaire, avec l'équipe, au plus tard huit jours avant.",
      },
      {
        titre: "Vérifie l'honorabilité de toute l'équipe",
        detail:
          "Salariés ou bénévoles : l'organisateur vérifie qu'aucune personne n'est interdite d'encadrer des mineurs. La consultation se fait dans TAM, et l'administration contrôle le casier judiciaire de l'équipe déclarée.",
      },
      {
        titre: 'Écris le projet éducatif',
        detail: "Il est demandé avec la déclaration. Le directeur et son équipe écrivent ensuite le projet pédagogique de l'accueil.",
      },
      {
        titre: "Respecte les règles d'encadrement",
        detail: "Le nombre d'animateurs et leurs diplômes (BAFA, BAFD) sont fixés par la réglementation. Le SDJES te dit ce qui s'applique à ton accueil.",
      },
    ],
    quoiFaire: [
      "Vérifie que ton activité est un accueil collectif de mineurs.",
      'Déclare-le en ligne avec TAM, dans les délais.',
      "Vérifie l'honorabilité de chaque personne de l'équipe.",
      'Écris le projet éducatif.',
    ],
    dureeEstimee: "Une demi-journée pour la première déclaration. Commence au moins deux mois avant l'accueil.",
    cout: 'La déclaration est gratuite.',
    documents: [
      {
        titre: 'Organisateurs, ce qu\'il faut savoir (jeunes.gouv.fr)',
        lien: 'https://www.jeunes.gouv.fr/organisateurs-ce-qu-il-faut-savoir-sur-les-accueils-collectifs-de-mineurs-217',
        genre: 'SITE',
        aQuoiCaSert: 'Les types d\'accueil, les délais, l\'encadrement et le contrôle d\'honorabilité.',
      },
      {
        titre: 'La téléprocédure TAM',
        lien: 'https://www.jeunes.gouv.fr/la-teleprocedure-accueils-de-mineurs-tam-250',
        genre: 'SITE',
        aQuoiCaSert: "Le service officiel pour déclarer l'accueil, avec ses guides.",
      },
    ],
    renvois: [],
    quandCestFini: "L'accueil est déclaré, l'équipe est vérifiée, le projet éducatif est écrit.",
    apporte: "Ton accueil est en règle. Pas d'accueil de mineurs ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'Accueil collectif de mineurs', explication: 'Un accueil de loisirs, un séjour ou un accueil de jeunes, hors de la famille, à partir de 7 mineurs en général.' },
      { mot: 'SDJES', explication: "Le service départemental à la jeunesse, à l'engagement et aux sports : il reçoit les déclarations." },
      { mot: 'TAM', explication: "La téléprocédure Accueils de mineurs : le site où l'on déclare." },
      { mot: 'Honorabilité', explication: "Le fait de n'avoir ni condamnation ni interdiction qui empêche de travailler avec des enfants." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 20,
    slug: 'les-donnees-des-membres',
    titre: 'Protéger les données des membres',
    nature: 'SI_CONCERNE',
    declencheur: "Dès que l'association garde des noms, des adresses ou des téléphones.",
    prerequis: ['les-adherents-et-les-cotisations'],
    partie: 'SELON_ACTIVITE',
    peutNePasConcerner: true,
    enUnMot: 'La liste des membres contient des données personnelles. Tu les notes dans un registre et tu ne les gardes pas trop longtemps.',
    pourquoi:
      "Une association qui garde des noms, des adresses ou des téléphones doit respecter le RGPD, comme une entreprise. La CNIL propose un guide et un modèle de registre gratuits.",
    ilTeFaut: ['La liste de tes fichiers : membres, bénévoles, donateurs, lettre d\'information.', 'Une heure.'],
    commentFaire: [
      {
        titre: 'Remplis le registre des traitements',
        detail:
          "Une fiche par fichier : à quoi il sert, quelles données il contient, qui y a accès, combien de temps on les garde. Le modèle de la CNIL suffit.",
      },
      {
        titre: "Ne garde que l'utile",
        detail: "Pour une adhésion, le nom et un moyen de contact suffisent souvent. Ne demande rien dont tu n'as pas besoin.",
      },
      {
        titre: 'Fixe les durées de conservation',
        detail: "La CNIL recommande de garder les données d'un ancien membre trois ans après la fin de son adhésion, puis de les supprimer.",
      },
      {
        titre: 'Informe les personnes',
        detail: "Sur le bulletin d'adhésion, dis à quoi servent leurs données et comment demander leur effacement.",
      },
    ],
    quoiFaire: [
      'Remplis le registre des traitements avec le modèle de la CNIL.',
      "Ne garde que les données utiles.",
      'Supprime les données des anciens membres après trois ans.',
      "Informe les personnes sur le bulletin d'adhésion.",
    ],
    dureeEstimee: 'Une heure pour le registre, puis un coup d\'œil une fois par an.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Le guide RGPD pour les associations (CNIL)',
        lien: 'https://www.cnil.fr/sites/cnil/files/atoms/files/cnil-guide_association.pdf',
        genre: 'MODELE',
        aQuoiCaSert: 'Ce que le RGPD demande à une association, avec des exemples concrets.',
      },
      {
        titre: 'Le registre des activités de traitement (CNIL)',
        lien: 'https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement',
        genre: 'SITE',
        aQuoiCaSert: 'Comment tenir le registre, avec le modèle à télécharger.',
      },
    ],
    renvois: [],
    quandCestFini: 'Ton registre est tenu, les durées sont fixées, les membres sont informés.',
    apporte: "Les données de tes membres sont protégées. Aucun fichier de personnes ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'RGPD', explication: 'Le règlement européen qui protège les données personnelles.' },
      { mot: 'Donnée personnelle', explication: "Tout ce qui permet de reconnaître une personne : nom, adresse, téléphone, photo." },
      { mot: 'Registre des traitements', explication: "Le document qui liste les fichiers de l'association et ce qu'on en fait." },
      { mot: 'CNIL', explication: "L'autorité publique qui veille à la protection des données personnelles." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 21,
    slug: 'vendre-des-activites',
    titre: 'Vérifier les impôts de ce que tu vends',
    nature: 'SI_CONCERNE',
    declencheur: "Dès que l'association vend quelque chose : buvette, cours payants, boutique.",
    prerequis: ['tenir-des-comptes-simples'],
    partie: 'SELON_ACTIVITE',
    peutNePasConcerner: true,
    enUnMot: "Une buvette, des cours payants, une boutique : selon la façon de vendre, l'association peut devoir la TVA et l'impôt sur les sociétés.",
    pourquoi:
      "En principe, une association ne paie pas ces impôts. Mais si elle vend comme une entreprise, elle peut y être soumise. Mieux vaut le vérifier avant qu'un contrôle le fasse.",
    ilTeFaut: ['La liste de ce que l\'association vend, avec les recettes de l\'année.', 'Les prix pratiqués par les entreprises du coin.'],
    commentFaire: [
      {
        titre: 'Vérifie que la gestion est désintéressée',
        detail: "Les responsables ne sont pas payés (sauf cas prévus par la loi) et personne ne se partage les bénéfices.",
      },
      {
        titre: 'Regarde si tu concurrences une entreprise',
        detail: "Une entreprise proche propose-t-elle la même chose au même public ? Si non, l'activité n'est pas lucrative.",
      },
      {
        titre: 'Si oui, applique la règle des 4P',
        detail:
          "Le Produit, le Public, le Prix, la Publicité, dans cet ordre d'importance. Un produit qui répond à un besoin mal couvert, un public en difficulté, des prix nettement plus bas : l'association reste exonérée.",
      },
      {
        titre: 'Profite de la franchise si les ventes restent accessoires',
        detail:
          "Si l'essentiel de l'activité n'est pas lucratif et que les recettes lucratives restent sous un plafond revu chaque année, l'association reste exonérée. Le montant à jour est sur service-public.gouv.fr.",
      },
      {
        titre: 'Un doute ? Pose la question par écrit',
        detail: "Ton service des impôts peut te répondre par écrit sur ta situation. Garde sa réponse dans le classeur.",
      },
    ],
    quoiFaire: [
      'Vérifie que la gestion est désintéressée.',
      'Regarde si tu concurrences une entreprise.',
      'Si oui, applique la règle des 4P.',
      'Vérifie le plafond de la franchise de l\'année.',
    ],
    dureeEstimee: "Une heure pour faire le point. Plus si l'activité vendue est importante.",
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Fiscalité des activités lucratives (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34104',
        genre: 'SITE',
        aQuoiCaSert: 'La règle des 4P et le plafond de la franchise, à jour.',
      },
      {
        titre: 'Une association peut-elle avoir une activité commerciale ?',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31838',
        genre: 'SITE',
        aQuoiCaSert: "Ce qui est permis, et ce qu'il faut prévoir dans les statuts.",
      },
      {
        titre: "L'assujettissement aux impôts commerciaux (associations.gouv.fr)",
        lien: 'https://associations.gouv.fr/lexception-lassujettissement-aux-impots-commerciaux',
        genre: 'SITE',
        aQuoiCaSert: 'Les cas où une association paie la TVA et l\'impôt sur les sociétés.',
      },
    ],
    renvois: [],
    quandCestFini: "Tu sais si ce que vend l'association est imposable, et pourquoi.",
    apporte: "Tes ventes sont en règle. L'association ne vend rien ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'Gestion désintéressée', explication: "Les responsables ne s'enrichissent pas grâce à l'association." },
      { mot: 'Lucratif', explication: "Qui rapporte de l'argent comme une entreprise." },
      { mot: 'Règle des 4P', explication: "Produit, Public, Prix, Publicité : les quatre questions des impôts pour savoir si l'association vend comme une entreprise." },
      { mot: 'Franchise', explication: "Un plafond de recettes en dessous duquel les petites ventes ne sont pas imposées." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 22,
    slug: 'les-frais-des-benevoles',
    titre: 'Rembourser les frais des bénévoles',
    nature: 'SI_CONCERNE',
    declencheur: "Dès qu'un bénévole avance de l'argent pour l'association : trajets, achats, timbres.",
    prerequis: ['tenir-des-comptes-simples'],
    partie: 'SELON_ACTIVITE',
    peutNePasConcerner: true,
    enUnMot: "Un bénévole qui paie pour l'association peut être remboursé sur justificatifs, ou renoncer au remboursement et recevoir un reçu fiscal.",
    pourquoi:
      "Un bénévole ne doit pas être payé, mais il ne doit pas perdre d'argent non plus. Rembourser sans justificatif, ou au forfait, peut être vu comme un salaire caché. Et si le bénévole renonce à son remboursement, ce renoncement peut devenir un don.",
    ilTeFaut: ['Les justificatifs : tickets, factures, billets de train, trajets notés.', "Une note de frais (un simple tableau suffit)."],
    commentFaire: [
      {
        titre: 'Rembourse sur justificatifs',
        detail: "Le bénévole remplit une note de frais avec les tickets. La voiture se rembourse au barème kilométrique si les frais réels ne sont pas connus.",
      },
      {
        titre: 'Ou propose l\'abandon de frais',
        detail:
          "Le bénévole écrit sur la note de frais qu'il renonce à son remboursement. Si l'association est d'intérêt général, elle lui remet un reçu fiscal : il déduit une partie de la somme de ses impôts.",
      },
      {
        titre: 'Garde tout dans les comptes',
        detail: "Les notes de frais, les justificatifs et les renoncements écrits restent dans le cahier de comptes. Le reçu fiscal compte dans la déclaration des reçus de l'année.",
      },
      {
        titre: 'Vérifie que les bénévoles sont assurés',
        detail: "Demande à ton assureur si le contrat couvre les bénévoles pendant les activités et les trajets.",
      },
    ],
    quoiFaire: [
      'Rembourse seulement sur justificatifs.',
      "Propose l'abandon de frais contre un reçu fiscal, si l'association y a droit.",
      'Range notes de frais et renoncements dans les comptes.',
      "Vérifie que l'assurance couvre les bénévoles.",
    ],
    dureeEstimee: 'Une heure pour mettre en place la note de frais.',
    cout: "Gratuit. Les remboursements sont des dépenses de l'association.",
    documents: [
      {
        titre: "Frais des bénévoles d'une association : quelle fiscalité ?",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1132',
        genre: 'SITE',
        aQuoiCaSert: "Les conditions de l'abandon de frais et du reçu fiscal.",
      },
    ],
    renvois: [],
    quandCestFini: 'Chaque frais de bénévole est remboursé sur justificatif, ou transformé en don avec un reçu.',
    apporte: "Les frais des bénévoles sont en règle. Pas de frais ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'Note de frais', explication: "Le tableau où le bénévole liste ce qu'il a payé, avec les tickets." },
      { mot: 'Abandon de frais', explication: "Le bénévole renonce par écrit à être remboursé : la somme devient un don." },
      { mot: 'Barème kilométrique', explication: "Le tarif officiel par kilomètre, utilisé quand on ne connaît pas les frais réels de la voiture." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 23,
    slug: 'ouvrir-un-local-au-public',
    titre: 'Ouvrir un local au public',
    nature: 'SI_CONCERNE',
    declencheur: "Dès que l'association accueille du public dans un local, même gratuitement.",
    prerequis: ['le-compte-bancaire-et-l-assurance'],
    partie: 'SELON_ACTIVITE',
    peutNePasConcerner: true,
    enUnMot: "Un local qui reçoit du public est un « établissement recevant du public » : il a des règles de sécurité et d'accessibilité.",
    pourquoi:
      "En cas d'incendie ou d'accident, le responsable du lieu doit prouver qu'il a respecté les règles. Et une assurance qui couvre les activités ne couvre pas toujours le local lui-même.",
    ilTeFaut: ['Le bail ou la convention de mise à disposition du local.', "Le nombre de personnes que le local peut accueillir."],
    commentFaire: [
      {
        titre: 'Vérifie la catégorie du local',
        detail:
          "Un petit local (en général moins de 300 personnes) est en 5e catégorie. Si c'est une salle municipale, la mairie s'occupe souvent de la sécurité : demande-lui ce qui reste à ta charge.",
      },
      {
        titre: "Assure le local",
        detail: "Demande à ton assureur une garantie pour le local (incendie, dégâts des eaux, vol), en plus de la responsabilité civile.",
      },
      {
        titre: 'Mets en place la sécurité',
        detail: "Au moins un extincteur par niveau, l'éclairage de secours, les consignes affichées, et un registre de sécurité où tu notes les vérifications.",
      },
      {
        titre: "Tiens le registre d'accessibilité",
        detail:
          "Tout établissement recevant du public tient un registre public d'accessibilité, consultable à l'accueil. En 5e catégorie, tu remplis toi-même l'attestation d'accessibilité.",
      },
    ],
    quoiFaire: [
      'Vérifie la catégorie du local avec la mairie.',
      'Assure le local, pas seulement les activités.',
      'Mets en place extincteurs, consignes et registre de sécurité.',
      "Tiens le registre public d'accessibilité.",
    ],
    dureeEstimee: "Une demi-journée pour faire le point, plus si des travaux sont nécessaires.",
    cout: "Les démarches sont gratuites. L'assurance et le matériel de sécurité sont payants.",
    documents: [
      {
        titre: "Qu'est-ce qu'un établissement recevant du public ?",
        lien: 'https://entreprendre.service-public.gouv.fr/vosdroits/F32351',
        genre: 'SITE',
        aQuoiCaSert: 'La définition et les catégories.',
      },
      {
        titre: "Les règles de sécurité d'un ERP",
        lien: 'https://entreprendre.service-public.gouv.fr/vosdroits/F31684',
        genre: 'SITE',
        aQuoiCaSert: "Extincteurs, alarme, consignes, registre de sécurité.",
      },
      {
        titre: "L'accessibilité d'un ERP",
        lien: 'https://entreprendre.service-public.gouv.fr/vosdroits/F32873',
        genre: 'SITE',
        aQuoiCaSert: "Le registre public d'accessibilité et l'attestation de 5e catégorie.",
      },
      {
        titre: "Assurance d'une association",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1124',
        genre: 'SITE',
        aQuoiCaSert: 'Ce qui est obligatoire et ce qui est conseillé.',
      },
    ],
    renvois: [],
    quandCestFini: "Le local est assuré, la sécurité est en place, le registre d'accessibilité est à l'accueil.",
    apporte: "Ton local est en règle. Pas de local ouvert au public ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'ERP', explication: 'Établissement recevant du public : tout lieu où des personnes extérieures entrent, même sur invitation.' },
      { mot: 'Registre de sécurité', explication: 'Le cahier où sont notées les vérifications et les formations à la sécurité.' },
      { mot: "Registre public d'accessibilité", explication: "Le document qui dit comment le lieu accueille les personnes handicapées." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 24,
    slug: 'appel-a-la-generosite',
    titre: 'Lancer un grand appel aux dons',
    nature: 'SI_CONCERNE',
    declencheur: "Au-delà de 153 000 € de dons collectés par une campagne publique, sur l'année en cours ou l'une des deux précédentes.",
    echeance: { texte: 'Déclaration à la préfecture avant de lancer la campagne, puis un compte d\'emploi des ressources chaque année.' },
    prerequis: ['tenir-des-comptes-simples', 'declarer-les-recus-fiscaux'],
    partie: 'SELON_ACTIVITE',
    peutNePasConcerner: true,
    enUnMot: "Une collecte de dons auprès du grand public, en ligne ou dans la rue : au-delà d'un seuil, elle se déclare avant de commencer.",
    pourquoi:
      "Les donateurs doivent pouvoir savoir à quoi sert leur argent. Au-dessus du seuil, l'association déclare sa campagne à la préfecture et rend compte chaque année de l'emploi des dons.",
    ilTeFaut: ['Le total des dons des deux dernières années.', "L'objet de la campagne."],
    commentFaire: [
      {
        titre: 'Fais le total des dons',
        detail: "Additionne les dons reçus par appel au public, cette année et les deux précédentes. En dessous de 153 000 € par an, pas de déclaration : choisis « Pas concerné ».",
      },
      {
        titre: 'Déclare la campagne à la préfecture',
        detail: "Au-dessus du seuil, la déclaration préalable part à la préfecture du siège, avant le début de la campagne.",
      },
      {
        titre: "Établis le compte d'emploi des ressources",
        detail: "Chaque année, un tableau dit d'où viennent les dons et à quoi ils ont servi. Il suit un modèle fixé par arrêté.",
      },
    ],
    quoiFaire: [
      'Fais le total des dons collectés auprès du public.',
      'Au-delà de 153 000 €, déclare la campagne avant de la lancer.',
      "Établis chaque année le compte d'emploi des ressources.",
    ],
    dureeEstimee: "Une heure pour vérifier le seuil. Plus si tu es concerné.",
    cout: 'Gratuit.',
    documents: [
      {
        titre: "L'appel à la générosité du public (préfecture d'Île-de-France)",
        lien: 'https://www.prefectures-regions.gouv.fr/ile-de-france/Region-et-institutions/Demarches-administratives/Associations-Fondations/Creation-et-droits/L-appel-a-la-generosite-du-public',
        genre: 'SITE',
        aQuoiCaSert: "Le seuil, la déclaration et le compte d'emploi. Chaque préfecture a sa page.",
      },
    ],
    renvois: [],
    quandCestFini: "La campagne est déclarée et le compte d'emploi est tenu, ou l'association reste sous le seuil.",
    apporte: "Ta collecte est en règle. Pas de grande campagne ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'Appel à la générosité du public', explication: "Une campagne qui demande des dons à tout le monde, et pas seulement aux membres." },
      { mot: "Compte d'emploi des ressources", explication: "Le tableau annuel qui montre d'où viennent les dons et à quoi ils ont servi." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 25,
    slug: 'agrement-esus',
    titre: "Obtenir l'agrément ESUS",
    nature: 'SI_CONCERNE',
    declencheur: "Pour accéder aux financements solidaires (épargne salariale solidaire, investisseurs solidaires), ou quand un financeur le demande.",
    echeance: { texte: "Valable 5 ans, ou 2 ans si l'association a moins de 3 ans : à redemander avant la fin." },
    prerequis: ['obtenir-le-siret', 'les-cinq-pieces-d-identite'],
    partie: 'AGREMENTS',
    peutNePasConcerner: true,
    enUnMot: "Un agrément de l'État qui reconnaît que l'association est une entreprise solidaire d'utilité sociale (ESUS).",
    pourquoi:
      "L'agrément ESUS (article L3332-17-1 du code du travail) ouvre l'accès à l'épargne salariale solidaire (les fonds dits 90/10), à une réduction d'impôt majorée pour ceux qui investissent chez toi, et à certains financements solidaires. Certains financeurs le demandent.",
    ilTeFaut: [
      'Le SIRET et les statuts à jour.',
      "Les comptes du dernier exercice, ou un budget prévisionnel si l'association est jeune.",
      "Une présentation de ton utilité sociale : qui tu aides, comment, avec quels moyens.",
    ],
    commentFaire: [
      {
        titre: "Regarde si tu l'as de plein droit",
        detail:
          "Certaines structures sont agréées de plein droit, en remplissant quand même le dossier : structures d'insertion par l'activité économique, entreprises adaptées, ESAT, aide sociale à l'enfance, centres d'hébergement et de réinsertion sociale, régies de quartier, associations reconnues d'utilité publique qui poursuivent une utilité sociale, entre autres. La plupart des associations n'en font pas partie et montrent les conditions une à une.",
      },
      {
        titre: 'Vérifie les conditions',
        detail:
          "L'utilité sociale est le but principal (publics fragiles, cohésion territoriale, éducation à la citoyenneté, développement durable) et pèse dans les comptes. Les salaires sont plafonnés : la moyenne des cinq plus hauts sous 7 SMIC, le plus haut sous 10 SMIC. Les statuts écrivent ces règles : modifie-les en assemblée si besoin.",
      },
      {
        titre: 'Dépose la demande en ligne',
        detail:
          "La demande se fait sur la plateforme ESUS, par le représentant légal. C'est la direction départementale du siège (DDETS) qui instruit. Note la date de fin de l'agrément pour le redemander à temps.",
      },
    ],
    quoiFaire: [
      "Regarde si l'association est agréée de plein droit.",
      'Vérifie les conditions et, si besoin, adapte les statuts.',
      'Dépose la demande sur la plateforme ESUS.',
    ],
    dureeEstimee: "Une demi-journée pour le dossier, puis quelques semaines d'instruction.",
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'La plateforme de demande ESUS',
        lien: 'https://esus.economie.gouv.fr/',
        genre: 'SITE',
        aQuoiCaSert: "C'est là que la demande se dépose et se suit, puis se renouvelle.",
      },
    ],
    renvois: [
      {
        nom: "L'agrément ESUS (economie.gouv.fr)",
        lien: 'https://www.economie.gouv.fr/entreprises/agrement-entreprise-solidaire-utilite-sociale-ess',
        pourQuoi: 'Les conditions, la durée et ce que l\'agrément apporte.',
      },
      {
        nom: "Demander l'agrément ESUS en Île-de-France (DRIEETS)",
        lien: 'https://idf.drieets.gouv.fr/Vous-souhaitez-faire-une-demande-d-agrement-ESUS',
        pourQuoi: 'Les contacts de chaque département francilien.',
      },
    ],
    quandCestFini: "L'association a son agrément ESUS, et sa date de fin est notée.",
    apporte: "Les financements solidaires te sont ouverts. Pas besoin de ces financements ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'ESUS', explication: "Entreprise solidaire d'utilité sociale : un agrément de l'État pour les structures de l'économie sociale et solidaire qui ont une forte utilité sociale." },
      { mot: 'Fonds 90/10', explication: "Des fonds d'épargne salariale qui placent 5 à 10 % de leur argent dans des structures agréées ESUS." },
      { mot: 'DDETS', explication: "La direction départementale de l'emploi, du travail et des solidarités : le service de l'État qui instruit la demande." },
    ],
    piecesAjoutees: [],
  },
  // ------------------------------------------------------- 4. LES AGRÉMENTS
  // Ajoutés le 01/10/2026 (l'agrément ESUS, plus haut, y est rangé aussi).
  // Sources vérifiées le 01/10/2026 : associations.gouv.fr (liste des
  // agréments, JEP, sport), servicesalapersonne.gouv.fr, caf.fr,
  // service-civique.gouv.fr, jeunes.gouv.fr, impots.gouv.fr.
  {
    numero: 28,
    slug: 'rescrit-interet-general',
    titre: 'Demander le rescrit « intérêt général »',
    nature: 'CONSEILLE',
    declencheur: 'Avant de délivrer tes premiers reçus fiscaux pour des dons.',
    echeance: { texte: "L'administration a 6 mois pour répondre. Sans réponse, c'est un accord." },
    prerequis: ['declarer-l-association', 'obtenir-le-siret'],
    partie: 'AGREMENTS',
    enUnMot: "Tu demandes aux impôts de confirmer que tes donateurs ont droit à une réduction d'impôt.",
    pourquoi:
      "Un reçu fiscal délivré à tort coûte cher : une amende de 25 % des sommes écrites sur le reçu. Le rescrit te met à l'abri : si l'administration dit oui, ou ne répond pas dans les 6 mois, elle ne peut plus revenir dessus tant que rien ne change. Les donateurs et les entreprises mécènes sont aussi plus confiants.",
    ilTeFaut: [
      'Les statuts à jour.',
      "Une description précise de tes activités : pour qui, quoi, où, gratuitement ou non.",
      'Les comptes du dernier exercice, ou un budget si l\'association est jeune.',
    ],
    commentFaire: [
      {
        titre: 'Vérifie les conditions',
        detail:
          "L'association agit en France (sauf action humanitaire), dans un domaine reconnu (social, culturel, éducatif, sportif, familial, humanitaire…), avec une gestion désintéressée, et elle ne profite pas à un cercle restreint de personnes.",
      },
      {
        titre: 'Dépose la demande',
        detail:
          "En ligne avec le formulaire de rescrit mécénat, ou par la messagerie de ton espace professionnel sur impots.gouv.fr, ou par courrier recommandé à la direction des finances publiques de ton siège. Décris tes activités en détail.",
      },
      {
        titre: 'Garde la réponse',
        detail:
          "La réponse arrive dans les 6 mois ; sans réponse, la demande vaut accord. Range la réponse avec les statuts : elle prouve ton droit aux reçus fiscaux.",
      },
    ],
    quoiFaire: ['Vérifie les conditions.', 'Dépose la demande de rescrit mécénat.', 'Garde la réponse dans le classeur.'],
    dureeEstimee: 'Une heure pour la demande, puis jusqu\'à 6 mois de réponse.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Le formulaire de demande de rescrit mécénat',
        lien: 'https://demarche.numerique.gouv.fr/commencer/d996ffa8-c0a9-45fb-82bf-23431d5b125f',
        genre: 'SITE',
        aQuoiCaSert: 'La demande en ligne, la plus simple.',
      },
    ],
    renvois: [
      {
        nom: 'Dons et réduction d\'impôt (impots.gouv.fr)',
        lien: 'https://www.impots.gouv.fr/professionnel/dons-et-reduction-dimpot',
        pourQuoi: 'Les conditions, les façons de demander le rescrit, le délai de 6 mois.',
      },
      {
        nom: 'Le rescrit mécénat : le silence vaut accord (service-public.gouv.fr)',
        lien: 'https://www.service-public.gouv.fr/demarches-silence-vaut-accord/demarches/784',
        pourQuoi: 'La règle officielle du silence qui vaut accord.',
      },
    ],
    quandCestFini: "Tu as la réponse des impôts, ou les 6 mois sont passés sans réponse.",
    apporte: 'Tes reçus fiscaux sont sûrs. Pas de dons ? Choisis « Pas concerné ».',
    lexique: [
      { mot: 'Rescrit', explication: "Une question écrite aux impôts. Leur réponse les engage pour l'avenir." },
      { mot: 'Reçu fiscal', explication: "Le papier remis au donateur. Il lui donne une réduction d'impôt." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 29,
    slug: 'agrement-jeunesse-education-populaire',
    titre: "Demander l'agrément Jeunesse et éducation populaire",
    nature: 'CONSEILLE',
    declencheur: "Pour une association qui agit avec et pour les jeunes, ou dans l'éducation populaire, depuis au moins 3 ans en général.",
    echeance: { texte: 'Valable 5 ans : à redemander avant la fin.' },
    prerequis: ['declarer-l-association', 'la-premiere-assemblee-generale'],
    partie: 'AGREMENTS',
    enUnMot: "L'État reconnaît que ton association fait de l'éducation populaire ou travaille pour la jeunesse.",
    pourquoi:
      "L'agrément JEP permet de bénéficier de financements particuliers de l'État et de participer aux instances de concertation. Il donne aussi des tarifs réduits à la SACEM. Les postes FONJEP de la jeunesse et de l'éducation populaire se demandent avec lui.",
    ilTeFaut: [
      "En général, 3 ans d'existence.",
      'Les statuts, la liste des dirigeants, les derniers procès-verbaux d\'assemblée.',
      "Les rapports d'activité et les comptes des dernières années.",
      'Le contrat d\'engagement républicain signé.',
    ],
    commentFaire: [
      {
        titre: 'Vérifie le socle commun',
        detail:
          "Tout agrément demande le même socle : un objet d'intérêt général, un fonctionnement démocratique, une gestion transparente. Relis tes statuts avec le guide du tronc commun d'agrément.",
      },
      {
        titre: 'Contacte ton SDJES',
        detail:
          "Pour une association locale, c'est le service départemental à la jeunesse, à l'engagement et aux sports (SDJES) qui décide. Chaque département a sa façon de déposer le dossier : demande-la.",
      },
      {
        titre: 'Dépose le dossier et note la date de fin',
        detail: "L'agrément vaut 5 ans. Note sa date de fin pour le renouveler à temps.",
      },
    ],
    quoiFaire: ['Relis tes statuts avec le tronc commun.', 'Contacte le SDJES de ton département.', 'Dépose le dossier, note la date de fin.'],
    dureeEstimee: 'Une journée pour le dossier, puis quelques mois d\'instruction.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: "Le tronc commun d'agrément (associations.gouv.fr)",
        lien: 'https://associations.gouv.fr/un-socle-commun-dagrement-pour-les-associations',
        genre: 'SITE',
        aQuoiCaSert: "Les critères que tout agrément vérifie, avec le guide pratique.",
      },
    ],
    renvois: [
      {
        nom: "L'agrément JEP, trois façons de l'obtenir (associations.gouv.fr)",
        lien: 'https://associations.gouv.fr/lagrement-jep-trois-modalites-pour-en-beneficier',
        pourQuoi: 'Départemental, national, ou par extension d\'un réseau agréé.',
      },
      {
        nom: 'Les contacts des SDJES (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/agrement-jep-departemental-attribue-aux-associations-locales-liste-des-contacts',
        pourQuoi: 'À qui écrire dans ton département.',
      },
    ],
    quandCestFini: "L'association a son agrément JEP, et sa date de fin est notée.",
    apporte: "Ton association est reconnue par l'État pour la jeunesse et l'éducation populaire.",
    lexique: [
      { mot: 'SDJES', explication: "Le service de l'État, dans chaque département, pour la jeunesse, l'engagement et le sport." },
      { mot: 'FONJEP', explication: "Une aide de l'État, versée chaque année, pour payer une partie d'un poste salarié." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 30,
    slug: 'agrement-espace-de-vie-sociale',
    titre: "Demander l'agrément Espace de vie sociale à la CAF",
    nature: 'SI_CONCERNE',
    declencheur: "Pour une association de quartier ou de village qui veut porter un espace de vie sociale financé par la CAF.",
    echeance: { texte: "Agrément de 4 ans au plus : prépare le renouvellement avant la fin." },
    prerequis: ['obtenir-le-siret', 'la-premiere-assemblee-generale'],
    partie: 'AGREMENTS',
    enUnMot: "La CAF reconnaît ton association comme un lieu de vie et de lien pour les habitants : un espace de vie sociale (EVS).",
    pourquoi:
      "L'agrément « animation de la vie sociale » ouvre la prestation de service « animation locale » de la CAF, versée chaque année pendant la durée de l'agrément. Seules des associations locales peuvent porter un EVS, avec les habitants au cœur du projet.",
    ilTeFaut: [
      'Un territoire sans centre social ni autre EVS qui fait déjà la même chose.',
      'Des habitants prêts à construire le projet avec toi.',
      'Un premier contact avec la CAF de ton département.',
    ],
    commentFaire: [
      {
        titre: 'Prends contact avec la CAF',
        detail:
          "Appelle le service animation de la vie sociale de ta CAF. Il te dit si ton territoire est prioritaire dans le schéma départemental, et il t'accompagne.",
      },
      {
        titre: 'Fais le diagnostic avec les habitants',
        detail:
          "Qui vit là, de quoi les gens ont besoin, ce qui existe déjà. Les habitants participent : c'est la condition de l'agrément.",
      },
      {
        titre: 'Écris le projet social et dépose-le',
        detail:
          "Le projet social dit tes axes d'action pour les familles, les jeunes, les liens entre voisins. Le conseil d'administration de la CAF décide, pour 4 ans au plus.",
      },
    ],
    quoiFaire: ['Contacte la CAF de ton département.', 'Fais le diagnostic avec les habitants.', 'Écris et dépose le projet social.'],
    dureeEstimee: 'Plusieurs mois : le diagnostic et le projet se font avec les habitants.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Le guide méthodologique des EVS (CAF)',
        lien: 'https://www.caf.fr/sites/default/files/medias/661/Espace-Partenaires/Documents-Partenaires/AVS/ProjetEVS/Guide-methodologique-EVS.pdf',
        genre: 'MODELE',
        aQuoiCaSert: 'Les étapes du diagnostic et du projet social, pas à pas.',
      },
    ],
    renvois: [
      {
        nom: 'Les espaces de vie sociale (CAF du Calvados)',
        lien: 'https://www.caf.fr/professionnels/offres-et-services/caf-du-calvados/partenaires-locaux/centres-sociaux-et-espaces-de-vie-sociale/les-espaces-de-vie-sociale',
        pourQuoi: "Ce qu'est un EVS, l'agrément de 4 ans au plus, la prestation « animation locale ».",
      },
      {
        nom: "Le schéma de l'animation de la vie sociale (CAF de Seine-et-Marne)",
        lien: 'https://www.caf.fr/professionnels/offres-et-services/caf-de-seine-et-marne/partenaires-locaux/l-animation-de-la-vie-sociale/le-schema-directeur-de-l-animation-de-la-vie-sociale',
        pourQuoi: 'Un exemple de schéma départemental : chaque CAF a le sien.',
      },
    ],
    quandCestFini: "La CAF a agréé ton espace de vie sociale, et la date de fin de l'agrément est notée.",
    apporte: "Ton espace de vie sociale est agréé et financé par la CAF. Pas d'EVS ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'EVS', explication: 'Espace de vie sociale : un lieu porté par une association locale, pour créer du lien entre habitants.' },
      { mot: 'Projet social', explication: 'Le document qui dit, avec les habitants, ce que fera l\'EVS pendant la durée de l\'agrément.' },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 31,
    slug: 'agrement-service-civique',
    titre: "Demander l'agrément Service civique",
    nature: 'SI_CONCERNE',
    declencheur: 'Pour accueillir des jeunes volontaires en Service civique.',
    echeance: { texte: "L'agrément vaut 5 ans au plus, puis se renouvelle." },
    prerequis: ['declarer-l-association', 'le-compte-bancaire-et-l-assurance'],
    partie: 'AGREMENTS',
    enUnMot: "L'Agence du Service civique t'autorise à accueillir des volontaires, sur des missions d'intérêt général.",
    pourquoi:
      "Avec l'agrément, l'État verse l'indemnité mensuelle des volontaires et paie leur protection sociale. L'agrément dit combien de volontaires tu peux accueillir. En échange, tu nommes un tuteur et tu rends compte chaque année.",
    ilTeFaut: [
      "Une ou plusieurs missions d'intérêt général, qui ne remplacent pas un emploi.",
      'Un tuteur dans l\'association pour chaque volontaire.',
      'Les statuts et les comptes de l\'association.',
    ],
    commentFaire: [
      {
        titre: 'Écris les missions',
        detail:
          "Une mission dit ce que le jeune fera, pour qui, et ce qu'il y apprendra. Elle complète le travail des salariés et des bénévoles, elle ne le remplace pas.",
      },
      {
        titre: 'Fais la demande en ligne',
        detail:
          "La demande se fait depuis l'espace organisme du site du Service civique. Les services de l'État de ta région ou de ton département l'instruisent, en deux mois en général.",
      },
      {
        titre: 'Prépare le tutorat',
        detail: 'Nomme un tuteur, prévois la formation civique et citoyenne du volontaire, et le bilan annuel.',
      },
    ],
    quoiFaire: ['Écris les missions.', 'Fais la demande en ligne.', 'Nomme un tuteur.'],
    dureeEstimee: 'Une demi-journée pour la demande, puis environ deux mois.',
    cout: 'Gratuit. Une petite part de l\'indemnité reste à la charge de l\'association.',
    documents: [],
    renvois: [
      {
        nom: "Réaliser les démarches d'agrément (service-civique.gouv.fr)",
        lien: 'https://www.service-civique.gouv.fr/accueillir-un-volontaire/etape02-realiser-les-demarches-d-agrement',
        pourQuoi: 'Qui peut être agréé, comment demander, ce que l\'État prend en charge.',
      },
      {
        nom: 'La liste des agréments (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/liste-des-agrements-existants',
        pourQuoi: 'Le Service civique et les autres agréments, en une page.',
      },
    ],
    quandCestFini: "L'association est agréée, et le nombre de volontaires autorisé est noté.",
    apporte: 'Tu peux accueillir des volontaires en Service civique. Pas de volontaire prévu ? Choisis « Pas concerné ».',
    lexique: [
      { mot: 'Service civique', explication: "Un engagement de 6 à 12 mois pour les 16 à 25 ans (30 ans en situation de handicap), indemnisé par l'État." },
      { mot: 'Tuteur', explication: "La personne de l'association qui accompagne le volontaire pendant sa mission." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 32,
    slug: 'agrement-sport',
    titre: "Avoir l'agrément Sport",
    nature: 'SI_CONCERNE',
    declencheur: "Pour une association sportive qui veut une aide de l'État : sans agrément, pas d'aide de l'État.",
    prerequis: ['declarer-l-association'],
    partie: 'AGREMENTS',
    enUnMot: "Une association sportive affiliée à une fédération agréée est agréée d'office. Les autres le demandent au préfet.",
    pourquoi:
      "Le code du sport (article L121-4) réserve l'aide de l'État aux associations sportives agréées. L'agrément ouvre aussi des règles de cotisations sociales propres au sport et l'ouverture exceptionnelle de buvettes dans les équipements sportifs.",
    ilTeFaut: [
      "L'affiliation à une fédération sportive agréée par l'État, si ton association pratique un sport.",
      "Sinon : des statuts qui garantissent un fonctionnement démocratique, une gestion transparente et l'égal accès des femmes et des hommes aux instances dirigeantes.",
    ],
    commentFaire: [
      {
        titre: 'Affilie-toi à une fédération agréée',
        detail:
          "Si ton association pratique un sport, l'affiliation à une fédération agréée par l'État vaut agrément : il n'y a pas d'autre démarche. Garde l'attestation d'affiliation de l'année.",
      },
      {
        titre: 'Sinon, demande au préfet',
        detail:
          "Une association qui développe ou promeut le sport sans le pratiquer elle-même demande l'agrément au préfet du département, par le SDJES. Les statuts doivent contenir les clauses du code du sport.",
      },
    ],
    quoiFaire: ['Affilie l\'association à une fédération agréée.', 'Ou demande l\'agrément au préfet par le SDJES.'],
    dureeEstimee: "Le temps de l'affiliation, ou quelques semaines d'instruction.",
    cout: "Gratuit. L'affiliation à la fédération a son prix, fixé par elle.",
    documents: [],
    renvois: [
      {
        nom: "L'agrément des associations sportives non affiliées (associations.gouv.fr)",
        lien: 'https://associations.gouv.fr/lagrement-des-associations-sportives-non-affiliees',
        pourQuoi: "La règle de l'affiliation qui vaut agrément, et ce que les statuts doivent contenir.",
      },
    ],
    quandCestFini: "L'association est affiliée à une fédération agréée, ou le préfet lui a donné l'agrément.",
    apporte: "L'aide de l'État t'est ouverte. Pas d'activité sportive ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'Affiliation', explication: "L'adhésion de ton club à une fédération sportive." },
      { mot: 'Fédération agréée', explication: "Une fédération reconnue par le ministère des Sports." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 33,
    slug: 'services-a-la-personne',
    titre: 'Déclarer les services à la personne, et demander l\'agrément',
    nature: 'SI_CONCERNE',
    declencheur:
      "Pour rendre des services à domicile (ménage, soutien scolaire, garde d'enfants…) avec l'avantage fiscal pour tes clients. L'agrément, lui, est obligatoire auprès des publics fragiles.",
    echeance: { texte: "L'agrément vaut 5 ans et se renouvelle. La déclaration n'a pas de date de fin." },
    prerequis: ['obtenir-le-siret'],
    partie: 'AGREMENTS',
    enUnMot:
      "La déclaration donne à tes clients un crédit d'impôt. L'agrément est obligatoire pour les enfants de moins de 3 ans, et pour les personnes âgées ou handicapées en mode mandataire.",
    pourquoi:
      "Déclarée, l'association fait profiter ses clients d'un crédit d'impôt de 50 % et accepte le CESU. Sans l'agrément, elle ne peut pas garder des enfants de moins de 3 ans à domicile. L'aide aux personnes âgées ou handicapées en mode prestataire demande, elle, une autorisation du conseil départemental.",
    ilTeFaut: [
      'Le SIRET et les statuts.',
      'La liste des activités que tu veux exercer, et en quel mode : prestataire ou mandataire.',
      "Pour l'agrément : le respect du cahier des charges (personnel qualifié, livret d'accueil, devis).",
    ],
    commentFaire: [
      {
        titre: 'Repère tes activités',
        detail:
          "Il y a 26 activités de services à la personne. Regarde, pour chacune des tiennes, si elle demande une simple déclaration, un agrément ou une autorisation.",
      },
      {
        titre: 'Fais la déclaration sur NOVA',
        detail:
          "La déclaration se fait en ligne sur NOVA. En principe, la structure ne doit faire que des services à la personne : demande aux services de l'État de ton département si tu peux en être dispensée.",
      },
      {
        titre: "Demande l'agrément si tu en as besoin",
        detail:
          "Pour les publics fragiles, l'agrément se demande aussi sur NOVA. C'est la direction départementale de l'emploi, du travail et des solidarités (DDETS, en Île-de-France l'unité départementale de la DRIEETS) qui instruit.",
      },
    ],
    quoiFaire: ['Repère tes activités et leur régime.', 'Déclare-toi sur NOVA.', "Demande l'agrément pour les publics fragiles."],
    dureeEstimee: 'Une heure pour la déclaration. Plusieurs semaines pour un agrément.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'NOVA, le site des démarches',
        lien: 'https://nova.entreprises.gouv.fr/',
        genre: 'SITE',
        aQuoiCaSert: "C'est là que la déclaration et la demande d'agrément se déposent.",
      },
    ],
    renvois: [
      {
        nom: 'Les 26 activités de services à la personne (servicesalapersonne.gouv.fr)',
        lien: 'https://www.servicesalapersonne.gouv.fr/tout-savoir-sur-les-services-la-personne/les-26-activites-de-services-la-personne',
        pourQuoi: 'Pour chaque activité : déclaration, agrément ou autorisation.',
      },
      {
        nom: 'La liste des agréments (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/liste-des-agrements-existants',
        pourQuoi: "Les publics fragiles qui demandent l'agrément.",
      },
    ],
    quandCestFini: "L'association est déclarée sur NOVA, et agréée si elle s'adresse à des publics fragiles.",
    apporte: 'Tes clients ont droit au crédit d\'impôt. Pas de services à domicile ? Choisis « Pas concerné ».',
    lexique: [
      { mot: 'Mode prestataire', explication: "L'association emploie l'intervenant et facture le client." },
      { mot: 'Mode mandataire', explication: "Le client est l'employeur ; l'association s'occupe des démarches pour lui." },
      { mot: 'CESU', explication: 'Le chèque emploi service universel, pour payer des services à domicile.' },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 34,
    slug: 'agrement-education-nationale',
    titre: "Demander l'agrément de l'Éducation nationale",
    nature: 'CONSEILLE',
    declencheur: "Pour une association qui intervient dans les écoles, les collèges ou les lycées publics, ou autour d'eux.",
    echeance: { texte: 'Valable 5 ans. Le dépôt se fait aux dates fixées par ton académie.' },
    prerequis: ['declarer-l-association', 'la-premiere-assemblee-generale'],
    partie: 'AGREMENTS',
    enUnMot: "Le rectorat reconnaît ton association comme « association éducative complémentaire de l'enseignement public ».",
    pourquoi:
      "L'agrément garantit aux écoles que ton association respecte les principes de l'enseignement public. Il n'est pas obligatoire pour intervenir dans une classe, mais il rassure les équipes et facilite les partenariats.",
    ilTeFaut: [
      "En général, au moins deux ans d'activité.",
      "Les statuts, la liste des dirigeants, les rapports d'activité et les comptes.",
      'Les CV des personnes qui interviennent.',
    ],
    commentFaire: [
      {
        titre: 'Choisis le bon niveau',
        detail:
          "Une association qui agit dans une seule académie demande l'agrément académique au recteur. Une association présente dans plusieurs académies le demande au ministère.",
      },
      {
        titre: 'Dépose aux dates de ton académie',
        detail: 'Chaque académie fixe ses périodes de dépôt. Regarde la page de ton rectorat et envoie le dossier complet.',
      },
    ],
    quoiFaire: ['Choisis agrément académique ou national.', 'Dépose le dossier aux dates de ton académie.'],
    dureeEstimee: 'Une journée pour le dossier, puis quelques mois.',
    cout: 'Gratuit.',
    documents: [],
    renvois: [
      {
        nom: 'La liste des agréments (associations.gouv.fr)',
        lien: 'https://associations.gouv.fr/liste-des-agrements-existants',
        pourQuoi: "Ce que garantit l'agrément de l'Éducation nationale.",
      },
      {
        nom: "L'agrément académique, l'exemple de Montpellier",
        lien: 'https://www.ac-montpellier.fr/agrement-des-associations-educatives-complementaires-de-l-enseignement-public-121802',
        pourQuoi: 'Les pièces, les périodes de dépôt, la durée de 5 ans.',
      },
    ],
    quandCestFini: "L'association a son agrément, et sa date de fin est notée.",
    apporte: "Les écoles savent que tu respectes les principes de l'enseignement public. Pas d'action avec l'école ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'Rectorat', explication: "Le service de l'Éducation nationale qui dirige une académie." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 35,
    slug: 'habilitation-bafa-bafd',
    titre: "Demander l'habilitation BAFA ou BAFD",
    nature: 'SI_CONCERNE',
    declencheur: 'Pour organiser toi-même des sessions de formation au BAFA ou au BAFD.',
    echeance: { texte: "Par campagnes de 3 ans, avec une date limite de dépôt (souvent le 15 septembre) : regarde celle de ta région." },
    prerequis: ['declarer-l-association', 'la-premiere-assemblee-generale'],
    partie: 'AGREMENTS',
    enUnMot: "L'État autorise ton association à former des animateurs (BAFA) ou des directeurs (BAFD) d'accueils de mineurs.",
    pourquoi:
      "Sans habilitation, pas de session BAFA ou BAFD. L'habilitation est donnée pour une période de 3 ans, après examen d'un projet éducatif, d'une équipe de formateurs et de leur formation. Elle est régionale (moins de 8 régions) ou nationale.",
    ilTeFaut: [
      'Un projet éducatif qui respecte les valeurs de la République et la laïcité.',
      'Une équipe de formateurs et de directeurs de session qualifiés.',
      'Une implantation réelle dans la région, et des lieux de formation.',
    ],
    commentFaire: [
      {
        titre: 'Repère la prochaine campagne',
        detail:
          "Les habilitations se demandent par campagnes. La DRAJES de ta région (direction régionale académique à la jeunesse, à l'engagement et aux sports) publie la date limite et le dossier.",
      },
      {
        titre: 'Monte le dossier',
        detail: 'Le formulaire officiel, le projet éducatif, les dossiers des formateurs, le calendrier des sessions. Chaque critère demande sa preuve.',
      },
      {
        titre: 'Dépose à temps',
        detail: 'Envoie le dossier complet à la DRAJES avant la date limite. La décision arrive avant le début de la période.',
      },
    ],
    quoiFaire: ['Repère la date de la prochaine campagne.', 'Monte le dossier, critère par critère.', 'Dépose-le à la DRAJES avant la date limite.'],
    dureeEstimee: 'Plusieurs semaines de préparation.',
    cout: 'Gratuit.',
    documents: [],
    renvois: [
      {
        nom: "L'habilitation des organismes de formation BAFA BAFD (jeunes.gouv.fr)",
        lien: 'https://www.jeunes.gouv.fr/l-habilitation-des-organismes-de-formation-preparant-aux-bafa-bafd-325',
        pourQuoi: 'Les règles de l\'habilitation et les campagnes.',
      },
    ],
    quandCestFini: "L'association est habilitée pour la période, et la date de la prochaine campagne est notée.",
    apporte: "Tu peux organiser tes sessions BAFA ou BAFD. Pas de formation d'animateurs ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'BAFA', explication: "Le brevet d'aptitude aux fonctions d'animateur en accueil collectif de mineurs." },
      { mot: 'DRAJES', explication: "Le service régional de l'État pour la jeunesse, l'engagement et le sport." },
    ],
    piecesAjoutees: [],
  },
  // --------------------------------------------- 7. ORGANISER UN ÉVÉNEMENT
  {
    numero: 26,
    slug: 'tenir-une-buvette',
    titre: 'Ouvrir une buvette',
    nature: 'SI_CONCERNE',
    declencheur: "À chaque buvette lors d'une fête, d'une vente ou d'une manifestation organisée par l'association.",
    echeance: { texte: 'Demande au maire au moins 15 jours avant. 5 autorisations par an au maximum.' },
    prerequis: ['le-compte-bancaire-et-l-assurance'],
    partie: 'EVENEMENT',
    peutNePasConcerner: true,
    enUnMot: "Une buvette, même d'un jour, se demande au maire. Seules les boissons sans alcool et les boissons fermentées (vin, bière, cidre) sont permises.",
    pourquoi:
      "Vendre à boire sans autorisation est interdit, même pour une bonne cause. L'autorisation est limitée à cinq par an pour une association, et la buvette d'un équipement sportif a ses propres règles.",
    ilTeFaut: ["La date, le lieu et l'horaire de l'événement.", 'La liste des boissons vendues.'],
    commentFaire: [
      {
        titre: 'Écris au maire au moins 15 jours avant',
        detail: "Une lettre qui donne la date, le lieu, l'horaire et les boissons. Un modèle officiel existe ci-dessous.",
      },
      {
        titre: 'Limite-toi aux boissons permises',
        detail: "Groupe 1 : sans alcool. Groupe 3 : vin, bière, cidre, jusqu'à 18°. Pas d'alcools forts.",
      },
      {
        titre: 'Dans un stade ou un gymnase, vérifie la dérogation',
        detail: "L'alcool y est interdit, sauf dérogation du maire pour 48 heures au plus. Une association sportive agréée a droit à 10 dérogations par an.",
      },
      {
        titre: 'Note les recettes',
        detail: "Les recettes de la buvette entrent dans le cahier de comptes. Si les ventes deviennent régulières, regarde l'étape sur les impôts de ce que tu vends.",
      },
    ],
    quoiFaire: [
      'Demande au maire au moins 15 jours avant.',
      "Vends seulement des boissons sans alcool, du vin, de la bière ou du cidre.",
      'Pas plus de 5 buvettes par an.',
      'Note les recettes dans le cahier de comptes.',
    ],
    dureeEstimee: 'Un quart d\'heure pour la lettre.',
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Buvette ou bar tenu par une association',
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F24345',
        genre: 'SITE',
        aQuoiCaSert: 'Les règles officielles : délai, boissons, nombre de buvettes par an.',
      },
      {
        titre: "Demande d'ouverture d'une buvette temporaire",
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R24390',
        genre: 'MODELE',
        aQuoiCaSert: 'La lettre au maire, à compléter.',
      },
    ],
    renvois: [],
    quandCestFini: "L'autorisation du maire est reçue avant l'événement.",
    apporte: "Ta buvette est en règle. Pas de buvette ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'Débit de boissons temporaire', explication: "Une buvette ouverte le temps d'un événement, avec l'accord du maire." },
      { mot: 'Groupe 3', explication: "Les boissons fermentées jusqu'à 18° : vin, bière, cidre." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 27,
    slug: 'organiser-une-tombola',
    titre: 'Organiser une tombola ou un loto',
    nature: 'SI_CONCERNE',
    declencheur: 'Pour une tombola ou une loterie : autorisation du maire. Un loto traditionnel entre proches n\'en demande pas.',
    echeance: { texte: 'Tombola : autorisation du maire avant de vendre les billets.' },
    partie: 'EVENEMENT',
    peutNePasConcerner: true,
    enUnMot: "Une tombola se demande au maire avant de vendre les billets. Un loto traditionnel est libre s'il reste en cercle restreint, avec de petites mises.",
    pourquoi:
      "Les jeux d'argent sont interdits en principe. Les associations ont une exception, à condition que l'argent serve une cause sociale, culturelle, éducative, sportive, humanitaire ou philanthropique, et que les lots ne soient pas de l'argent.",
    ilTeFaut: ['La date du tirage.', 'La liste des lots et leur valeur.', 'Le nombre et le prix des billets.'],
    commentFaire: [
      {
        titre: 'Tombola : demande l\'autorisation au maire',
        detail: "Avant de vendre le moindre billet, écris au maire de la commune du siège (à Paris, au préfet de police). Les lots sont des objets, jamais de l'argent.",
      },
      {
        titre: 'Loto traditionnel : vérifie les conditions',
        detail: "Un cercle restreint, un but social, culturel, éducatif, sportif ou d'animation, des mises de moins de 20 €, des lots en nature. Alors aucune autorisation n'est demandée.",
      },
      {
        titre: 'Note les recettes',
        detail: "Les recettes vont dans le cahier de comptes. Elles restent exonérées d'impôts dans la limite de six manifestations par an.",
      },
    ],
    quoiFaire: [
      'Tombola : demande l\'autorisation au maire avant de vendre les billets.',
      'Loto : cercle restreint, mises de moins de 20 €, lots en nature.',
      'Jamais de lots en argent.',
      'Note les recettes dans le cahier de comptes.',
    ],
    dureeEstimee: "Un quart d'heure pour la demande.",
    cout: 'Gratuit.',
    documents: [
      {
        titre: 'Une association peut-elle organiser une loterie ou un loto ?',
        lien: 'https://www.economie.gouv.fr/cedef/loterie-associations',
        genre: 'SITE',
        aQuoiCaSert: 'Les conditions officielles, la tombola et le loto côte à côte.',
      },
    ],
    renvois: [],
    quandCestFini: "La tombola est autorisée avant la vente des billets, ou le loto respecte les conditions.",
    apporte: "Ton jeu est en règle. Pas de tombola ni de loto ? Choisis « Pas concerné ».",
    lexique: [
      { mot: 'Tombola (loterie)', explication: 'Un tirage au sort de lots, avec des billets vendus à l\'avance.' },
      { mot: 'Loto traditionnel', explication: 'Le loto de salle avec des cartons, entre membres et proches, pour de petites mises.' },
    ],
    piecesAjoutees: [],
  },
];

/**
 * PRIORITÉ ET FINANCEMENTS, étape par étape (01/10/2026). Priorité 1 : une
 * obligation avec une échéance légale, ou une étape qui bloque une
 * subvention. `debloque` : seulement ce qui est exact.
 */
const REPERES: Record<string, ReperesFinancement> = {
  // 1. Naître
  'declarer-l-association': { priorite: 1, debloque: ['Subventions publiques', 'Dons', 'Cotisations'] },
  'obtenir-le-siret': { priorite: 1, debloque: ['Subventions publiques', 'FDVA', 'Subvention de la mairie'] },
  'les-cinq-pieces-d-identite': { priorite: 1, debloque: ['Dossiers de subvention'] },
  'le-compte-bancaire-et-l-assurance': { priorite: 1, debloque: ['Versement des subventions', 'Dons en ligne'] },
  // 2. Vivre
  'les-adherents-et-les-cotisations': { priorite: 1, debloque: ['Cotisations'] },
  'tenir-des-comptes-simples': { priorite: 1, debloque: ['Subventions publiques'] },
  'la-premiere-assemblee-generale': { priorite: 1, debloque: ['Dossiers de subvention'] },
  // 3. Subvention
  'le-projet-en-une-page': { priorite: 1, debloque: ['FDVA', 'Subvention de la mairie', 'Appels à projets', 'Mécénat'] },
  'le-premier-budget': { priorite: 1, debloque: ['Subventions publiques', 'Fondations'] },
  'trouver-le-premier-financeur': { priorite: 1, debloque: ['FDVA', 'Subvention de la mairie', 'Fondations', 'Mécénat'] },
  'constituer-et-deposer-le-dossier': { priorite: 1, debloque: ['Subvention'] },
  'rendre-compte': { priorite: 1, debloque: ['Renouvellement de la subvention'] },
  // 4. Agréments
  'rescrit-interet-general': { priorite: 2, debloque: ['Dons défiscalisés', 'Mécénat'] },
  'agrement-jeunesse-education-populaire': { priorite: 2, debloque: ['Postes FONJEP', "Aides de l'État", 'SACEM à tarif réduit'] },
  'agrement-espace-de-vie-sociale': { priorite: 2, debloque: ['CAF', 'Prestation animation locale'] },
  'agrement-service-civique': { priorite: 2, debloque: ['Service civique', "Indemnité payée par l'État"] },
  'agrement-esus': { priorite: 3, debloque: ['Épargne solidaire', 'Investisseurs solidaires'] },
  'agrement-sport': { priorite: 3, debloque: ["Aides de l'État au sport"] },
  'services-a-la-personne': { priorite: 3, debloque: ["Crédit d'impôt des clients", 'CESU'] },
  'agrement-education-nationale': { priorite: 3, debloque: ['Partenariats avec les écoles'] },
  'habilitation-bafa-bafd': { priorite: 3, debloque: ['Recettes de formation BAFA'] },
  // 5. Chaque année
  'assemblee-generale-de-l-annee': {
    priorite: 1,
    debloque: ['Renouvellement des subventions'],
    dateChoisie: { libelle: "Date de l'AG", aide: 'Celle que fixent tes statuts. Elle revient chaque année au même jour : change-la si besoin.' },
  },
  'declarer-les-changements': { priorite: 1 },
  'declarer-les-recus-fiscaux': { priorite: 1, debloque: ['Dons défiscalisés', 'Mécénat'] },
  'publier-les-comptes': { priorite: 1, debloque: ['Subventions au-delà de 153 000 €'] },
  'garder-les-papiers': { priorite: 2 },
  // 6. Selon ton activité
  'le-premier-salarie': { priorite: 1, debloque: ["Aides à l'embauche", 'Postes FONJEP'] },
  'accueillir-des-mineurs': { priorite: 1, debloque: ['CAF (accueil de loisirs)'] },
  'les-donnees-des-membres': { priorite: 2 },
  'vendre-des-activites': { priorite: 2 },
  'les-frais-des-benevoles': { priorite: 3, debloque: ['Dons défiscalisés'] },
  'ouvrir-un-local-au-public': { priorite: 2 },
  'appel-a-la-generosite': { priorite: 2, debloque: ['Dons du public'] },
  // 7. Événement
  'tenir-une-buvette': { priorite: 1, debloque: ['Recettes de buvette'] },
  'organiser-une-tombola': { priorite: 2, debloque: ['Recettes de tombola'] },
};

const RANG_PARTIE = (code: PartieChemin) => PARTIES_CHEMIN.findIndex((p) => p.code === code);

/**
 * Le chemin tel qu'on le sert : rangé partie par partie, puis par priorité,
 * renuméroté de 1 à N. Toute étape qui n'est pas obligatoire pour toutes les
 * associations peut être marquée « Pas concerné ».
 */
export const ETAPES_CHEMIN: readonly EtapeChemin[] = ordonnerEtapes(
  [...ETAPES_ECRITES]
    .sort((a, b) => RANG_PARTIE(a.partie) - RANG_PARTIE(b.partie) || a.numero - b.numero)
    .map((e): EtapeChemin => ({
      ...e,
      ...(REPERES[e.slug] ?? { priorite: 2 }),
      peutNePasConcerner: e.peutNePasConcerner ?? e.nature !== 'OBLIGATOIRE',
    })),
  (e) => e.partie,
);

export function trouverEtape(slugOuNumero: string): EtapeChemin | undefined {
  const n = Number(slugOuNumero);
  return ETAPES_CHEMIN.find((e) => e.slug === slugOuNumero || (Number.isInteger(n) && e.numero === n));
}

export function trouverPartie(code: PartieChemin): DescriptionPartie {
  return PARTIES_CHEMIN.find((p) => p.code === code)!;
}
