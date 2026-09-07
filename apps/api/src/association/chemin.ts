/**
 * LE CHEMIN : PILOTER UNE ASSOCIATION, UNE ÉTAPE À LA FOIS.
 *
 * Pour la personne qui vient de créer son association et ne sait pas par où
 * commencer. Tout est écrit pour être compris du premier coup, sans rien
 * connaître : des phrases courtes, un mot compliqué = son explication juste à
 * côté, et à chaque étape les vrais formulaires (CERFA) et des documents
 * exemples qu'on peut recopier.
 *
 * Le chemin a trois parties :
 *   1. Faire naître l'association (étapes 1 à 4)
 *   2. La faire vivre (étapes 5 à 7)
 *   3. Demander une subvention ou répondre à un appel à projets (8 à 12)
 * La troisième est le but : c'est elle qu'on met en avant.
 *
 * Règles tenues par ce fichier :
 *  - jamais de recommandation commerciale : les renvois vont vers les services
 *    publics, ou vers un outil quand il n'a pas d'équivalent public ;
 *  - une étape faite ailleurs se coche, on ne force personne à refaire ;
 *  - le chemin est gratuit et le reste.
 */

export type PartieChemin = 'NAITRE' | 'VIVRE' | 'SUBVENTION';

export interface DescriptionPartie {
  code: PartieChemin;
  numero: 1 | 2 | 3;
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

export interface EtapeChemin {
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
  /** Ce que l'étape apporte une fois faite (version courte). */
  debloque: string;
  lexique: MotExplique[];
  /** Codes du référentiel des pièces que cette étape ajoute au classeur. */
  piecesAjoutees: string[];
  /** Peut-on vérifier l'étape automatiquement avec les données publiques ? */
  verifiableAvec?: 'RNA' | 'SIRENE';
}

const MODELES = '/association/modeles';

export const ETAPES_CHEMIN: readonly EtapeChemin[] = [
  // ------------------------------------------------------------ 1. NAÎTRE
  {
    numero: 1,
    slug: 'declarer-l-association',
    titre: "Déclarer l'association",
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
    debloque: 'Le récépissé et le numéro RNA entrent dans ton classeur.',
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
    debloque: 'Le SIRET entre dans ton classeur. Tu peux demander une subvention.',
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
    debloque: 'Ton classeur est prêt à 40 %.',
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
    debloque: "L'attestation d'assurance entre dans le classeur, avec sa date de fin.",
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
    debloque: 'Ta liste des membres est ouverte.',
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
    debloque: "Les comptes de l'année entreront dans le classeur.",
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
    debloque: "Le procès-verbal et le rapport d'activité entrent dans le classeur.",
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
    debloque: 'Ton projet en une page est prêt.',
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
    debloque: 'Le budget prévisionnel entre dans le classeur.',
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
    debloque: 'Un premier dossier est repéré, avec sa date limite.',
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
        titre: 'Vérifie, puis dépose toi-même',
        detail:
          "Chaque papier présent, à jour, lisible. Puis tu déposes : en ligne (Le Compte Asso pour l'État, le site de la mairie ou du département) ou en main propre. Note la date de dépôt dans Mes dossiers.",
      },
    ],
    quoiFaire: ['Ouvre le CERFA 12156.', 'Recopie ton projet et ton budget.', 'Joins les papiers demandés.', 'Vérifie, puis dépose et note la date.'],
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
    renvois: [],
    quandCestFini: "Le dossier est déposé, la date est notée. Il ne reste qu'à attendre la réponse, puis à rendre compte.",
    debloque: 'Le dossier est déposé. La date du compte rendu est notée pour toi.',
    lexique: [
      { mot: 'CERFA', explication: "Un formulaire officiel de l'administration. Chaque CERFA a un numéro." },
      { mot: 'CERFA 12156', explication: 'Le formulaire de demande de subvention, le même pour presque tous les financeurs publics.' },
      { mot: 'Notice', explication: 'Le mode d\'emploi du formulaire, case par case.' },
      { mot: 'Recevable', explication: "Un dossier complet, arrivé à temps : le financeur accepte de le lire." },
    ],
    piecesAjoutees: [],
  },
  {
    numero: 12,
    slug: 'rendre-compte',
    titre: "Rendre compte de l'argent reçu",
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
    quandCestFini: "Le dossier est soldé. Tu peux redemander l'année suivante. Le chemin est fini : l'écran du lundi prend le relais.",
    debloque: "Le dossier est soldé. Le chemin est terminé : l'écran du lundi prend le relais.",
    lexique: [
      { mot: 'Compte rendu financier', explication: "Le document qui montre au financeur comment sa subvention a été dépensée et ce qu'elle a permis." },
      { mot: 'Convention', explication: "Le contrat signé avec le financeur pour les grosses subventions : il fixe les engagements et les dates." },
      { mot: 'Soldé', explication: "Un dossier fini : l'argent a été reçu, dépensé et justifié." },
    ],
    piecesAjoutees: [],
  },
];

export function trouverEtape(slugOuNumero: string): EtapeChemin | undefined {
  const n = Number(slugOuNumero);
  return ETAPES_CHEMIN.find((e) => e.slug === slugOuNumero || (Number.isInteger(n) && e.numero === n));
}

export function trouverPartie(code: PartieChemin): DescriptionPartie {
  return PARTIES_CHEMIN.find((p) => p.code === code)!;
}
