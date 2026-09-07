/**
 * CE À QUOI UNE ASSOCIATION A DROIT, ET COMMENT ÊTRE VISIBLE EN LIGNE.
 *
 * Deux listes, une seule forme. Chaque entrée dit ce qu'on gagne, pour qui
 * c'est, ce qu'il faut avoir sous la main, comment faire (dans l'ordre), et
 * le lien direct pour le demander. Les conditions et les liens ont été
 * relus sur les sites officiels le 7 septembre 2026 ; les offres changent,
 * la date est affichée en bas de page.
 *
 * Aucun prix n'est inventé : on écrit gratuit, remise ou public. Un chiffre
 * n'apparaît que s'il vient du site de l'organisme.
 */

export type CoutAvantage = 'GRATUIT' | 'REMISE' | 'PUBLIC';

export const LIBELLES_COUT: Record<CoutAvantage, string> = {
  GRATUIT: 'Gratuit',
  REMISE: 'Remise',
  PUBLIC: 'Service public',
};

export interface LienUtile {
  libelle: string;
  url: string;
}

export interface Avantage {
  /** Sert d'ancre dans la page : /avantages#canva */
  code: string;
  nom: string;
  /** Qui l'offre : Google, l'État, l'Urssaf… */
  par: string;
  /** Ce que tu gagnes, en une phrase. */
  gain: string;
  cout: CoutAvantage;
  coutDetail?: string;
  /** Pour qui c'est : les conditions, écrites simplement. */
  pourQui: string;
  /** Ce qu'il faut avoir sous la main avant de commencer. */
  ilTeFaut: string[];
  /** La marche à suivre, dans l'ordre. */
  commentFaire: string[];
  /** Le lien direct pour demander. Interne s'il commence par « / ». */
  lien: string;
  lienLibelle: string;
  liensUtiles?: LienUtile[];
  delai?: string;
}

export interface FamilleAvantages {
  code: string;
  titre: string;
  enUnMot: string;
  avantages: Avantage[];
}

export const VERIFIE_LE = '2026-09-07';

/* ------------------------------------------------------ ce à quoi j'ai droit */

export const FAMILLES_AVANTAGES: FamilleAvantages[] = [
  {
    code: 'OUTILS',
    titre: 'Des outils gratuits',
    enUnMot: "Les grandes entreprises du numérique offrent leurs logiciels aux associations. Il suffit de le demander, avec le récépissé et les statuts.",
    avantages: [
      {
        code: 'google-pour-les-associations',
        nom: 'Google pour les associations',
        par: 'Google',
        gain: "Des adresses e-mail au nom de ton association (Google Workspace), jusqu'à 10 000 $ par mois de publicité offerte sur Google (Ad Grants), et YouTube pour les associations.",
        cout: 'GRATUIT',
        pourQui:
          "Association à but non lucratif déclarée et publiée au Journal officiel des associations. Refusé : collectivités, écoles, hôpitaux.",
        ilTeFaut: [
          'Ton numéro RNA (W…) ou SIREN',
          'Ton récépissé de déclaration, ou l’annonce du Journal officiel, en PDF ou en photo nette',
          'Une adresse e-mail que tu lis vraiment : Goodstack, le partenaire de Google, t’écrit depuis verifications@mail.goodstack.org (regarde les spams)',
          'Pour Ad Grants : un site internet à toi, à jour, en https (une page HelloAsso ne suffit pas)',
        ],
        commentFaire: [
          'Va sur Google pour les associations et clique « Commencer ». Utilise l’adresse e-mail de l’association, pas la tienne.',
          'Réponds aux questions sur l’association. Goodstack vérifie qu’elle existe bien : compte 3 à 5 jours ouvrés. On peut te demander un document en plus.',
          'Quand l’e-mail d’acceptation arrive, active Google Workspace : il te faut un nom de domaine (ton-association.fr) pour créer contact@ton-association.fr. Sans domaine, garde Gmail.',
          'Pour Ad Grants : dans le même compte, « Activer les produits » › Ad Grants › « Commencer ». Google regarde ton site avant de dire oui.',
        ],
        lien: 'https://www.google.com/intl/fr/nonprofits/',
        lienLibelle: 'Demander sur Google pour les associations',
        liensUtiles: [
          { libelle: 'Les conditions pour la France', url: 'https://support.google.com/nonprofits/answer/3215869?hl=fr&co=GENIE.CountryCode%3DFR' },
          { libelle: 'La validation par Goodstack', url: 'https://support.google.com/nonprofits/answer/12016036?hl=fr' },
          { libelle: 'Ad Grants : les trois étapes', url: 'https://www.google.com/intl/fr/grants/get-started/' },
        ],
        delai: '3 à 5 jours ouvrés pour la validation',
      },
      {
        code: 'canva',
        nom: 'Canva pour les associations',
        par: 'Canva',
        gain: "Canva Pro gratuit pour ton équipe, jusqu'à 50 personnes : affiches, publications, logo, vidéos, avec tous les modèles et toutes les images payantes.",
        cout: 'GRATUIT',
        pourQui:
          "Association déclarée, à but non lucratif, indépendante de l'État. Refusé : partis politiques, écoles, fondations qui distribuent de l'argent.",
        ilTeFaut: [
          'Ton récépissé de déclaration en préfecture (PDF ou photo nette)',
          'Tes statuts',
          'Le nom exact de l’association et son numéro RNA ou SIREN',
          'Un compte Canva gratuit créé avec l’adresse e-mail de l’association',
        ],
        commentFaire: [
          'Crée un compte Canva gratuit avec l’adresse e-mail de l’association.',
          'Ouvre le formulaire Canva pour les associations et remplis-le : nom, pays, site ou page, et ta mission en deux phrases (reprends ton projet en une page).',
          'Ajoute le récépissé et les statuts. Relis bien : une fois envoyé, le dossier ne se modifie plus.',
          'La réponse arrive par e-mail sous 7 à 10 jours ouvrés. Ensuite, invite tes bénévoles dans l’équipe.',
        ],
        lien: 'https://www.canva.com/nfp-signup',
        lienLibelle: 'Remplir le formulaire Canva',
        liensUtiles: [
          { libelle: 'Ce que Canva offre aux associations', url: 'https://www.canva.com/canva-for-nonprofits/' },
          { libelle: 'Les règles pays par pays (Goodstack)', url: 'https://goodstack.org/nonprofit-definitions' },
        ],
        delai: '7 à 10 jours ouvrés',
      },
      {
        code: 'microsoft-365',
        nom: 'Microsoft 365 pour les associations',
        par: 'Microsoft',
        gain: "Microsoft 365 Business Basic gratuit jusqu'à 300 personnes : e-mails Outlook, Teams, Word et Excel en ligne, un espace de stockage chacun. Et des remises sur les versions complètes.",
        cout: 'GRATUIT',
        coutDetail:
          'Gratuit : Business Basic, 300 licences au plus. Les licences offertes vont aux salariés et aux dirigeants bénévoles ; pour les autres bénévoles, ce sont des remises.',
        pourQui:
          "Association ou ONG déclarée, à but non lucratif, dont la mission sert la communauté : aide aux personnes, éducation, bien-être social, culture, environnement.",
        ilTeFaut: [
          'Une personne qui a un rôle dans l’association (salarié ou membre du bureau) pour faire l’inscription',
          'Ton numéro SIREN ou RNA et l’adresse du siège',
          'Un nom de domaine si tu veux des adresses en @ton-association.fr (sinon elles finissent en .onmicrosoft.com)',
        ],
        commentFaire: [
          'Va sur la page d’inscription Microsoft et crée le compte au nom de l’association.',
          'Microsoft vérifie que l’association existe : quelques jours, parfois un justificatif à envoyer.',
          'Une fois accepté, dans le centre d’administration, choisis « Microsoft 365 Business Basic (offre pour les associations) » : 0 € jusqu’à 300 utilisateurs.',
          'Choisis Google ou Microsoft pour les e-mails, pas les deux : c’est plus simple pour toute l’équipe.',
        ],
        lien: 'https://aka.ms/nonprofitgetstarted',
        lienLibelle: 'S’inscrire chez Microsoft',
        liensUtiles: [
          { libelle: 'Qui est éligible', url: 'https://www.microsoft.com/fr-fr/nonprofits/eligibility' },
          { libelle: 'Les offres en cours (en anglais)', url: 'https://learn.microsoft.com/en-us/industry/nonprofit/microsoft-for-nonprofits/updates' },
        ],
        delai: 'Quelques jours',
      },
      {
        code: 'slack',
        nom: 'Slack pour les associations',
        par: 'Slack',
        gain: "Slack Pro gratuit si vous êtes 250 ou moins : les discussions de l'équipe rangées par sujet, au lieu de quarante fils de messages.",
        cout: 'GRATUIT',
        coutDetail: 'Gratuit jusqu’à 250 membres ; 85 % de remise au-delà.',
        pourQui:
          'Associations à but non lucratif. Refusé : organisations politiques, religieuses ou publiques, écoles, hôpitaux privés, fondations privées.',
        ilTeFaut: [
          'Un espace Slack déjà créé (gratuit) avec l’e-mail de l’association',
          'Le nom officiel, l’adresse, le site ou la page de l’association, et deux phrases sur ce que vous faites',
        ],
        commentFaire: [
          'Crée l’espace de travail sur slack.com, gratuitement.',
          'Remplis le formulaire « Slack pour les associations » depuis la page d’aide.',
          'TechSoup vérifie l’association (en France, son partenaire est Solidatech : si tu y es déjà inscrit, c’est plus rapide).',
          'Ton espace passe en Pro, gratuitement.',
        ],
        lien: 'https://slack.com/intl/fr-fr/help/articles/204368833',
        lienLibelle: 'Voir l’offre et le formulaire Slack',
        delai: 'Quelques jours',
      },
      {
        code: 'solidatech',
        nom: 'Solidatech',
        par: 'Solidatech, programme français de solidarité numérique',
        gain: 'Des logiciels offerts ou à tarif associatif (antivirus, comptabilité, bureautique, graphisme), des ordinateurs reconditionnés, des formations et un diagnostic numérique gratuit.',
        cout: 'GRATUIT',
        coutDetail: 'Inscription gratuite. Ensuite, chaque logiciel est offert ou à tarif associatif, souvent avec quelques euros de frais de gestion.',
        pourQui: 'Associations de bénévoles ou employeuses, fédérations et réseaux, à but non lucratif.',
        ilTeFaut: ['Tes statuts (PDF)', 'Ton numéro SIRET ou RNA', 'L’adresse e-mail de l’association'],
        commentFaire: [
          'Va sur solidatech.fr › Inscription et crée le compte de l’association.',
          'Envoie les statuts et le numéro SIRET ou RNA : Solidatech vérifie que tu es éligible.',
          'Une fois validé, fais d’abord l’autodiagnostic numérique gratuit, puis commande ce dont tu as besoin dans le catalogue.',
        ],
        lien: 'https://www.solidatech.fr/inscription-connexion/',
        lienLibelle: 'S’inscrire chez Solidatech',
        delai: 'Quelques jours',
      },
      {
        code: 'helloasso',
        nom: 'HelloAsso',
        par: 'HelloAsso',
        gain: "Encaisser sans frais : adhésions, billets, dons, cagnottes, boutique. 0 % de commission, l'argent arrive sur le compte de l'association.",
        cout: 'GRATUIT',
        coutDetail: 'Gratuit pour l’association : HelloAsso vit des pourboires que les payeurs laissent s’ils le veulent.',
        pourQui: 'Associations loi 1901 françaises, et associations d’Alsace-Moselle.',
        ilTeFaut: [
          'Le RIB du compte bancaire de l’association (étape 5 du chemin)',
          'Un justificatif d’existence : récépissé, annonce au Journal officiel ou avis de situation SIRENE',
          'La pièce d’identité de la personne qui représente l’association (le mandataire), et un téléphone pour le code par SMS',
        ],
        commentFaire: [
          'Crée le compte de l’association sur helloasso.com : nom, RNA ou SIREN, e-mail, téléphone.',
          'Termine la vérification en trois blocs : coordonnées bancaires, association, mandataire légal. Sans elle, tu peux collecter mais pas recevoir l’argent.',
          'Crée ta première campagne : une adhésion, c’est le plus simple pour commencer. Puis les billets de ton prochain évènement.',
          'Mets le lien HelloAsso sur ta fiche Google, ta page Facebook, ton site : c’est ta page publique.',
        ],
        lien: 'https://www.helloasso.com/',
        lienLibelle: 'Créer le compte HelloAsso',
        delai: 'Vérification : quelques jours',
      },
      {
        code: 'brevo',
        nom: 'Brevo',
        par: 'Brevo',
        gain: "Envoyer une lettre d'information à tes membres : gratuit jusqu'à 300 e-mails par jour, contacts sans limite. Et 20 % de remise sur les offres payantes pour les associations.",
        cout: 'GRATUIT',
        coutDetail: 'Gratuit jusqu’à 300 e-mails par jour. 20 % de remise sur les offres payantes.',
        pourQui: 'Toutes les associations pour le gratuit ; associations reconnues à but non lucratif pour la remise.',
        ilTeFaut: ['L’adresse e-mail de l’association', 'Pour la remise : un justificatif (récépissé ou avis SIRENE) à envoyer au service client'],
        commentFaire: [
          'Crée le compte gratuit sur brevo.com.',
          'Ajoute tes membres, seulement ceux qui ont accepté de recevoir tes nouvelles.',
          'Écris un premier envoi : les prochaines dates, un merci, une photo.',
          'Si tu dépasses 300 e-mails par jour, demande le code de remise au service client avec ton justificatif.',
        ],
        lien: 'https://www.brevo.com/fr/',
        lienLibelle: 'Créer le compte Brevo',
        liensUtiles: [{ libelle: 'L’offre pour les associations', url: 'https://www.brevo.com/fr/company/ngos/' }],
      },
    ],
  },
  {
    code: 'DROITS',
    titre: "De l'argent et des droits",
    enUnMot: "Ce que l'État accorde à une association qui le demande : des reçus pour ses donateurs, une aide pour fonctionner, un label, la paie faite gratuitement.",
    avantages: [
      {
        code: 'recus-fiscaux',
        nom: 'Les reçus fiscaux (rescrit mécénat)',
        par: 'L’administration fiscale',
        gain: "Tes donateurs déduisent 66 % de leur don de leurs impôts (60 % pour une entreprise). Avec le rescrit, tu peux le leur promettre noir sur blanc.",
        cout: 'PUBLIC',
        coutDetail: 'Gratuit. Rien à payer.',
        pourQui:
          "Association d'intérêt général : gestion désintéressée (personne n'est payé pour diriger), activité non lucrative, ouverte à tous et pas seulement à un petit cercle.",
        ilTeFaut: [
          'Tes statuts et ton récépissé',
          'Le dernier rapport d’activité et les comptes (ou le budget prévisionnel si tu démarres)',
          'La liste des dirigeants et le nombre de membres',
          'Un espace professionnel sur impots.gouv.fr, créé avec ton SIRET',
        ],
        commentFaire: [
          'Vérifie que l’association coche les trois conditions : désintéressée, non lucrative, ouverte à tous.',
          'Remplis le modèle de demande de rescrit : qui vous êtes, ce que vous faites, pour qui, comment c’est financé.',
          'Envoie-le depuis ton espace professionnel impots.gouv.fr (Messagerie › Écrire › Demander, déposer › Rescrit), ou par courrier recommandé à la direction départementale des finances publiques.',
          'L’administration a 6 mois pour répondre. Si elle ne répond pas, c’est oui.',
          'Ensuite, pour chaque don, remets un reçu CERFA 11580 et note-le dans ton cahier de comptes.',
        ],
        lien: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34246',
        lienLibelle: 'La démarche sur service-public.fr',
        liensUtiles: [
          { libelle: 'Le modèle de demande de rescrit', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R47828' },
          { libelle: 'Le formulaire de rescrit mécénat', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R77860' },
          { libelle: 'Le reçu à remettre au donateur (CERFA 11580)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/R17454' },
        ],
        delai: '6 mois au plus ; sans réponse, c’est accordé',
      },
      {
        code: 'fdva',
        nom: 'Le FDVA, l’aide de l’État',
        par: 'L’État (Fonds pour le développement de la vie associative)',
        gain: "De l'argent de l'État pour ton fonctionnement ou un projet nouveau (FDVA 2), et des formations de bénévoles payées (FDVA 1). Une campagne par an et par département.",
        cout: 'PUBLIC',
        pourQui:
          "Petites et moyennes associations, avec un SIRET et un compte sur Le Compte Asso. Le FDVA 1 s'adresse à celles qui forment leurs bénévoles.",
        ilTeFaut: [
          'Ton compte sur Le Compte Asso',
          'Le projet en une page, le budget, les statuts, le récépissé, le RIB, le dernier PV d’assemblée générale, les comptes',
          'Le contrat d’engagement républicain, coché en ligne',
        ],
        commentFaire: [
          'Repère la campagne de ton département : une par an, souvent entre février et avril, annoncée sur associations.gouv.fr et sur le site de la préfecture.',
          'Sur Le Compte Asso, choisis le dispositif FDVA de ton département et remplis le formulaire : c’est le CERFA 12156, en ligne.',
          'Joins les pièces du classeur, relis, dépose avant la date limite.',
          'La réponse arrive à l’été. Si c’est oui, l’argent est versé en une fois ; tu rends compte l’année suivante avec le CERFA 15059.',
        ],
        lien: 'https://www.associations.gouv.fr/fonds-pour-le-developpement-de-la-vie-associative-fdva',
        lienLibelle: 'Le FDVA sur associations.gouv.fr',
        liensUtiles: [
          { libelle: 'Déposer sur Le Compte Asso', url: 'https://lecompteasso.associations.gouv.fr/' },
          { libelle: 'Étape 10 du chemin : trouver le premier financeur', url: '/chemin/trouver-le-premier-financeur' },
        ],
        delai: 'Dépôt au printemps, réponse à l’été',
      },
      {
        code: 'agrement-jep',
        nom: 'L’agrément jeunesse et éducation populaire',
        par: 'L’État (service jeunesse de ton département, le SDJES)',
        gain: "Un label de l'État qui ouvre des subventions réservées (dont les postes FONJEP) et une place dans les instances jeunesse de ton département.",
        cout: 'PUBLIC',
        pourQui:
          "Association qui existe depuis au moins 3 ans, qui agit pour les jeunes ou l'éducation populaire, avec un fonctionnement démocratique : élections régulières, comptes transparents, égalité femmes-hommes au bureau, ouverte à tous.",
        ilTeFaut: [
          'Les statuts et la composition du bureau',
          'Les deux derniers procès-verbaux d’assemblée générale',
          'Rapports moral, financier et d’activité, les comptes, le budget prévisionnel',
          'Le contrat d’engagement républicain signé',
        ],
        commentFaire: [
          'Vérifie les 3 ans d’existence et les critères démocratiques : le bureau a bien été réélu, les comptes sont présentés en assemblée.',
          'Va sur le site des services de l’État de ton département (rubrique jeunesse, SDJES) : la demande se fait le plus souvent sur demarches-simplifiees.fr, sinon par dossier.',
          'Remplis le formulaire et joins les pièces. On te demande aussi le nombre de membres et la part de jeunes.',
          'L’agrément est donné pour 5 ans : note la date de renouvellement dans ton classeur.',
        ],
        lien: 'https://associations.gouv.fr/la-procedure-de-demande-dagrement-jep',
        lienLibelle: 'La procédure sur associations.gouv.fr',
        liensUtiles: [
          { libelle: 'Un exemple de dossier départemental (académie de Versailles)', url: 'https://www.ac-versailles.fr/l-agrement-de-jeunesse-et-d-education-populaire-jep-2024-126416' },
        ],
        delai: 'Plusieurs semaines',
      },
      {
        code: 'cheque-emploi-associatif',
        nom: 'Le chèque emploi associatif',
        par: 'L’Urssaf',
        gain: "Quand tu embauches ton premier salarié : l'Urssaf fait les bulletins de paie et les déclarations à ta place, gratuitement.",
        cout: 'PUBLIC',
        coutDetail: 'Gratuit. Tu paies seulement le salaire et les cotisations, comme tout employeur.',
        pourQui: 'Associations à but non lucratif et fondations qui emploient du personnel, quel que soit le nombre de salariés.',
        ilTeFaut: ['Ton numéro SIRET', 'Le RIB de l’association', 'Le contrat de travail signé et les informations du salarié'],
        commentFaire: [
          'Adhère sur cea.urssaf.fr avec le SIRET.',
          'Déclare le salarié : la déclaration préalable à l’embauche est faite en même temps.',
          'Chaque mois, saisis les heures et le salaire : le service calcule les cotisations, fait le bulletin de paie et les déclarations.',
          'Les cotisations sont prélevées sur le compte de l’association.',
        ],
        lien: 'https://www.cea.urssaf.fr/',
        lienLibelle: 'Adhérer sur cea.urssaf.fr',
        delai: 'Tout de suite',
      },
    ],
  },
  {
    code: 'BRAS',
    titre: 'Des bras en plus',
    enUnMot: "Des gens pour aider : des bénévoles qui te trouvent, un jeune en Service civique payé par l'État, des droits pour tes bénévoles, un conseiller près de chez toi.",
    avantages: [
      {
        code: 'jeveuxaider',
        nom: 'JeVeuxAider.gouv.fr',
        par: 'L’État (Réserve civique)',
        gain: 'Publie tes missions de bénévolat : des personnes près de chez toi proposent leur aide. Gratuit.',
        cout: 'PUBLIC',
        pourQui: "Associations d'intérêt général, collectivités, organismes publics, qui respectent la charte de la Réserve civique.",
        ilTeFaut: [
          'Le nom, le RNA ou SIREN et l’adresse de l’association',
          'Deux ou trois phrases sur ce que vous faites (reprends ton projet en une page)',
          'Une mission claire : quoi, quand, où, combien de temps',
        ],
        commentFaire: [
          'Inscris-toi comme responsable d’organisation. Un référent valide l’organisation.',
          'Crée ta première mission avec un titre concret (« Aider aux devoirs le mercredi »), le lieu, le nombre de bénévoles.',
          'Réponds vite aux candidatures : un bénévole qui attend une semaine va ailleurs.',
          'Ajoute chaque bénévole dans ton répertoire, avec son rôle.',
        ],
        lien: 'https://www.jeveuxaider.gouv.fr/inscription/responsable',
        lienLibelle: 'Inscrire mon association',
        delai: 'Validation en quelques jours',
      },
      {
        code: 'service-civique',
        nom: 'Le Service civique',
        par: 'L’Agence du Service civique',
        gain: "Accueille un jeune de 16 à 25 ans pendant 6 à 12 mois, au moins 24 h par semaine : l'État lui verse son indemnité. Toi, tu ajoutes une petite prestation et un tuteur.",
        cout: 'PUBLIC',
        coutDetail:
          'À la charge de l’association : la prestation de subsistance (114,85 € par mois au minimum, en argent ou en nature) et le tutorat. L’État verse au volontaire 504,98 € net par mois.',
        pourQui:
          "Associations à but non lucratif et organismes publics agréés par l'Agence du Service civique. Une mission d'intérêt général, pas un poste de travail.",
        ilTeFaut: [
          'Un projet d’accueil : la mission, le tuteur, les formations prévues',
          'Statuts, récépissé, SIRET, budget, comptes',
          'Un tuteur disponible dans l’association',
        ],
        commentFaire: [
          'Écris le projet d’accueil en t’aidant du référentiel de missions.',
          'Demande l’agrément à l’Agence, ou passe par une fédération déjà agréée : plus rapide pour une petite association.',
          'Une fois agréé, publie la mission sur service-civique.gouv.fr et rencontre les candidats.',
          'Signe le contrat et prévois les deux formations obligatoires : premiers secours (PSC1) et formation civique et citoyenne.',
        ],
        lien: 'https://www.service-civique.gouv.fr/organismes',
        lienLibelle: 'Accueillir un volontaire',
        liensUtiles: [{ libelle: 'Les règles côté organisme (service-public.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F13278' }],
        delai: 'Agrément : plusieurs semaines',
      },
      {
        code: 'compte-engagement-citoyen',
        nom: 'Le compte d’engagement citoyen',
        par: 'L’État',
        gain: "Tes bénévoles qui dirigent ou encadrent gagnent 240 € par an de droits à la formation (720 € au plus) sur Mon Compte Formation.",
        cout: 'PUBLIC',
        pourQui:
          "Bénévoles membres du bureau ou du conseil, ou qui encadrent d'autres bénévoles, au moins 200 heures dans l'année. L'association doit être déclarée depuis 3 ans.",
        ilTeFaut: [
          'Le compte du bénévole sur Le Compte Bénévole',
          'Un « valideur » dans l’association (président ou membre du conseil) avec un compte sur Le Compte Asso',
        ],
        commentFaire: [
          'Le bénévole déclare ses heures sur Le Compte Bénévole, entre le 1er janvier et le 30 juin de l’année suivante.',
          'Le valideur de l’association confirme sur Le Compte Asso, avant le 31 décembre.',
          'Les 240 € apparaissent sur Mon Compte Formation du bénévole, en plus de ses droits habituels.',
        ],
        lien: 'https://www.moncompteformation.gouv.fr/espace-public/le-compte-engagement-citoyen-cec',
        lienLibelle: 'Comprendre le compte d’engagement citoyen',
        liensUtiles: [{ libelle: 'Le Compte Bénévole', url: 'https://lecompteasso.associations.gouv.fr/le-compte-benevole/' }],
        delai: 'Déclaration avant le 30 juin',
      },
      {
        code: 'guid-asso',
        nom: 'Guid’Asso, un conseiller près de chez toi',
        par: 'L’État et les réseaux associatifs',
        gain: "Un accompagnement gratuit par des gens dont c'est le métier : une question, la relecture d'un dossier, un doute sur les statuts.",
        cout: 'PUBLIC',
        pourQui: 'Toutes les associations.',
        ilTeFaut: ['Ta question, écrite en une phrase', 'Tes papiers du classeur si c’est pour un dossier'],
        commentFaire: [
          'Trouve le point d’appui Guid’Asso de ton département sur la carte.',
          'Appelle ou écris : le premier rendez-vous d’information est gratuit.',
          'Viens avec tes papiers et ton projet en une page : le rendez-vous sert à quelque chose.',
        ],
        lien: 'https://ressources-guidasso.org/?GuidAssoPresDeChezMoi=',
        lienLibelle: 'Trouver Guid’Asso près de chez moi',
        liensUtiles: [{ libelle: 'Exemple : les points d’appui de Seine-et-Marne', url: 'https://kit-a-agir.fr/vie-associative/guidasso77/' }],
      },
    ],
  },
];

export const AVANTAGES = FAMILLES_AVANTAGES.flatMap((f) => f.avantages);

/* ------------------------------------------------------ être visible en ligne */

export interface EtapePresence extends Avantage {
  numero: number;
  /** Combien de temps ça prend, pour une personne seule. */
  duree: string;
}

export const ETAPES_PRESENCE: EtapePresence[] = [
  {
    numero: 1,
    code: 'kit-de-depart',
    nom: 'Le kit de départ',
    par: 'Toi',
    gain: "Trois choses que tu réutilises partout : le nom exact avec le logo, trois phrases qui disent ce que vous faites, et une photo. Tout le reste s'appuie dessus.",
    cout: 'GRATUIT',
    duree: 'Une heure',
    pourQui: 'Toutes les associations, avant de créer quoi que ce soit en ligne.',
    ilTeFaut: ['Le nom exact, celui du récépissé', 'Ton projet en une page (étape 8 du chemin)', 'Une photo d’une vraie action, avec l’accord des personnes visibles'],
    commentFaire: [
      'Écris trois phrases : pour qui, quoi, où. Pas plus. C’est ta présentation partout : Google, HelloAsso, réseaux.',
      'Fais un logo simple sur Canva (gratuit avec Canva pour les associations) : le nom, une couleur, c’est assez.',
      'Range le logo, les phrases et la photo dans « Mes documents » : l’équipe les retrouve.',
    ],
    lien: '/chemin/le-projet-en-une-page',
    lienLibelle: 'Écrire le projet en une page',
    liensUtiles: [{ libelle: 'Canva pour les associations', url: '/avantages#canva' }],
  },
  {
    numero: 2,
    code: 'fiche-google',
    nom: 'La fiche d’établissement Google',
    par: 'Google',
    gain: "Quand quelqu'un tape ton nom ou « association + ta ville » sur Google ou Maps, il voit ton adresse, tes horaires, ton téléphone, des photos et des avis.",
    cout: 'GRATUIT',
    duree: 'Vingt minutes, puis la validation',
    pourQui: "Toute association qui reçoit du public ou intervient dans une zone. Sans local, tu masques l'adresse et tu indiques la zone desservie.",
    ilTeFaut: [
      'Un compte Google, de préférence avec l’adresse de l’association',
      'Le nom exact, la catégorie (« association », « centre de loisirs »…), l’adresse ou la zone, le téléphone, les horaires',
      'Le logo et 3 à 5 photos',
    ],
    commentFaire: [
      'Cherche d’abord si une fiche existe déjà : Google en crée parfois seul. Si oui, revendique-la au lieu d’en créer une deuxième.',
      'Remplis nom, catégorie, adresse ou zone desservie, téléphone, site (ta page HelloAsso si tu n’as pas de site).',
      'Valide la fiche : Google envoie un code par courrier, téléphone ou e-mail, ou te demande une courte vidéo du lieu.',
      'Ajoute les horaires, le logo, les photos, et demande à trois membres de laisser un avis. Réponds à chaque avis.',
    ],
    lien: 'https://business.google.com/create',
    lienLibelle: 'Créer ma fiche Google',
    delai: 'Validation : de quelques minutes à deux semaines par courrier',
  },
  {
    numero: 3,
    code: 'page-helloasso',
    nom: 'Une page publique qui encaisse : HelloAsso',
    par: 'HelloAsso',
    gain: "Une page à ton nom avec un bouton adhérer, donner ou réserver, sans commission. C'est ton site tant que tu n'en as pas.",
    cout: 'GRATUIT',
    duree: 'Une heure, puis la vérification',
    pourQui: 'Associations loi 1901 françaises.',
    ilTeFaut: ['Le RIB de l’association', 'Récépissé ou avis SIRENE', 'La pièce d’identité du mandataire'],
    commentFaire: [
      'Crée le compte et termine les trois blocs de vérification (banque, association, mandataire).',
      'Écris la page de l’association avec le kit de départ : logo, trois phrases, photo.',
      'Crée une première campagne d’adhésion : le lien devient ton bouton « Nous rejoindre » partout.',
    ],
    lien: '/avantages#helloasso',
    lienLibelle: 'Voir la fiche HelloAsso',
  },
  {
    numero: 4,
    code: 'reseaux-sociaux',
    nom: 'Une page Facebook et un compte Instagram',
    par: 'Meta',
    gain: "Là où sont les familles de ton quartier. Une page (pas un profil) Facebook et un compte Instagram, reliés entre eux.",
    cout: 'GRATUIT',
    duree: 'Une heure',
    pourQui: 'Toutes les associations qui veulent être suivies par leur public.',
    ilTeFaut: [
      'Le logo pour la photo de profil, une photo pour la couverture',
      'Les trois phrases du kit',
      'Deux personnes administratrices, jamais une seule : si elle part, la page est perdue',
    ],
    commentFaire: [
      'Crée une page Facebook depuis le compte personnel d’un membre : nom exact, catégorie « Organisation à but non lucratif ».',
      'Crée le compte Instagram de l’association, passe-le en compte professionnel (catégorie association) et relie-le à la page.',
      'Ajoute une deuxième personne administratrice dans les paramètres de la page.',
      'Publie une fois par semaine : une photo, une phrase, le lien HelloAsso. La régularité compte plus que la quantité.',
    ],
    lien: 'https://www.facebook.com/pages/create',
    lienLibelle: 'Créer la page Facebook',
    liensUtiles: [{ libelle: 'Se former : community manager avec un téléphone', url: '/se-former' }],
  },
  {
    numero: 5,
    code: 'linkedin',
    nom: 'Une page LinkedIn',
    par: 'LinkedIn',
    gain: "Pour les partenaires, les financeurs et les entreprises qui pourraient te soutenir : une page au nom de l'association, là où ils sont.",
    cout: 'GRATUIT',
    duree: 'Trente minutes',
    pourQui: 'Les associations qui cherchent des partenaires, des mécènes ou des salariés.',
    ilTeFaut: ['Le profil LinkedIn d’un membre pour créer la page', 'Logo, trois phrases, site ou page HelloAsso'],
    commentFaire: [
      'Depuis le profil d’un membre : Pour les entreprises › Créer une page › « Organisation à but non lucratif ».',
      'Nom exact, logo, trois phrases, lien vers le site ou la page HelloAsso.',
      'Publie le rapport d’activité et les remerciements aux financeurs : c’est ce qu’ils regardent.',
    ],
    lien: 'https://www.linkedin.com/company/setup/new/',
    lienLibelle: 'Créer la page LinkedIn',
  },
  {
    numero: 6,
    code: 'adresses-email',
    nom: 'Des adresses e-mail au nom de l’association',
    par: 'Google ou Microsoft, avec un nom de domaine',
    gain: "contact@ton-association.fr inspire confiance à un financeur. Les boîtes mail sont offertes par Google ou Microsoft pour les associations ; il faut juste ton nom de domaine.",
    cout: 'GRATUIT',
    coutDetail: 'Les boîtes mail sont offertes. Le nom de domaine, lui, s’achète chez un bureau d’enregistrement (prix affiché sur leur site, à l’année).',
    duree: 'Une heure',
    pourQui: 'Toute association qui écrit à des financeurs, des partenaires ou des familles.',
    ilTeFaut: ['Ton compte Google ou Microsoft pour les associations, validé', 'Un nom de domaine acheté au nom de l’association, pas d’un membre'],
    commentFaire: [
      'Choisis un nom court : ton-sigle.fr ou ton-nom.org. Vérifie qu’il est libre chez un bureau d’enregistrement.',
      'Achète-le au nom de l’association, avec l’e-mail de l’association. Range l’identifiant dans le classeur : c’est un papier comme un autre.',
      'Dans Google Workspace (ou Microsoft 365), ajoute le domaine et crée contact@, presidence@, tresorerie@.',
      'Change l’adresse partout : préfecture (via Le Compte Asso), banque, HelloAsso, Google, réseaux.',
    ],
    lien: '/avantages#google-pour-les-associations',
    lienLibelle: 'Voir Google pour les associations',
    liensUtiles: [{ libelle: 'Ou Microsoft 365 pour les associations', url: '/avantages#microsoft-365' }],
  },
  {
    numero: 7,
    code: 'site-simple',
    nom: 'Un site simple, gratuit',
    par: 'Google Sites',
    gain: "Une page qui dit qui vous êtes, ce que vous faites, où, et comment adhérer ou donner. Google Sites, offert avec Google Workspace, suffit pour commencer.",
    cout: 'GRATUIT',
    duree: 'Une demi-journée',
    pourQui: 'Les associations qui veulent plus qu’une page HelloAsso, ou qui visent Google Ad Grants (un site à toi est obligatoire).',
    ilTeFaut: ['Le kit de départ', 'Ton compte Google de l’association', 'Ton nom de domaine, si tu en as un'],
    commentFaire: [
      'Ouvre Google Sites avec le compte de l’association et choisis un modèle simple.',
      'Quatre pages, pas plus : Accueil, Nos actions, Nous rejoindre (lien HelloAsso), Contact.',
      'Relie ton nom de domaine au site (Paramètres › Domaines personnalisés).',
      'Mets le lien sur ta fiche Google et tes réseaux. Ensuite seulement, demande Ad Grants.',
    ],
    lien: 'https://sites.google.com/',
    lienLibelle: 'Ouvrir Google Sites',
  },
  {
    numero: 8,
    code: 'lettre-information',
    nom: 'La lettre d’information',
    par: 'Brevo',
    gain: "Une fois par mois, un e-mail à tes membres : les dates, un merci, une photo. Gratuit jusqu'à 300 envois par jour.",
    cout: 'GRATUIT',
    duree: 'Une heure la première fois, vingt minutes ensuite',
    pourQui: 'Toutes les associations qui ont des membres ou des donateurs.',
    ilTeFaut: ['L’adresse e-mail de l’association', 'La liste des membres qui ont accepté de recevoir tes nouvelles'],
    commentFaire: [
      'Crée le compte gratuit sur Brevo et importe tes membres.',
      'Fais un modèle avec le logo et les trois phrases ; tu le réutilises chaque mois.',
      'Envoie le premier numéro : prochaines dates, un merci, une photo, le lien HelloAsso.',
    ],
    lien: 'https://www.brevo.com/fr/',
    lienLibelle: 'Créer le compte Brevo',
  },
  {
    numero: 9,
    code: 'annuaires-officiels',
    nom: 'Être juste dans les annuaires officiels',
    par: 'L’État',
    gain: "Ton association doit apparaître au Journal officiel des associations et dans l'annuaire des entreprises, avec la bonne adresse : c'est ce que regardent les financeurs.",
    cout: 'PUBLIC',
    duree: 'Cinq minutes pour vérifier',
    pourQui: 'Toutes les associations déclarées.',
    ilTeFaut: ['Le nom exact ou le numéro RNA'],
    commentFaire: [
      'Tape le nom de ton association dans « Vérifier mon association » : on lit les répertoires publics.',
      'Si le RNA manque ou si l’adresse est fausse, corrige la déclaration sur Le Compte Asso : c’est l’étape 1 du chemin.',
      'Si le SIRET manque : étape 2 du chemin. Sans lui, pas de subvention.',
    ],
    lien: '/verifier',
    lienLibelle: 'Vérifier mon association',
  },
  {
    numero: 10,
    code: 'benevoles-en-ligne',
    nom: 'Recruter des bénévoles en ligne',
    par: 'L’État (JeVeuxAider.gouv.fr)',
    gain: 'Ta mission de bénévolat publiée là où les gens cherchent à aider, gratuitement.',
    cout: 'PUBLIC',
    duree: 'Trente minutes',
    pourQui: "Associations d'intérêt général.",
    ilTeFaut: ['Le kit de départ', 'Une mission claire : quoi, quand, où'],
    commentFaire: ['Inscris l’association comme responsable d’organisation.', 'Publie une première mission concrète.', 'Réponds dans la journée aux candidatures.'],
    lien: '/avantages#jeveuxaider',
    lienLibelle: 'Voir la fiche JeVeuxAider',
  },
];
