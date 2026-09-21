// LES PAGES D'ATTERRISSAGE, UNE PAR PRODUIT — 4/09/2026.
//
// Demande de Siham : « fait des landing page pour chaque produit du logiciel
// […] courte mais percutante marketing pour obtenir mails de contact ». Elles
// existent pour une seule chose : recevoir le trafic d'une campagne (courriel de
// prospection, post, annonce) et transformer une visite en adresse de contact.
// Elles ne remplacent pas les pages de fond (/renforteam, /ateliers, /gap…),
// qui expliquent ; elles promettent une chose, en apportent trois preuves, et
// demandent une adresse.
//
// ⚠ TROIS RÈGLES, ET ELLES VIENNENT DE LOIN :
//  1. Aucun prix inventé : ceux qui figurent ici sont ceux du code
//     (billing.service.ts, credits.constants.ts). « 0 % de commission » et
//     « 15 générations gratuites par mois » sont les seuls chiffres d'argent.
//  2. Jamais « freelance » (vocabulaire sanctionné par le CE du 11/02/2025),
//     jamais « certificat », jamais « intervenants vérifiés » (faux).
//  3. Chaque preuve est vérifiable sur le site : rien ici ne promet ce qu'une
//     page de fond ne tient pas.
//
// Le formulaire dépose une demande de contact (`POST /public/contact`) avec
// `type = "Landing · <produit>"` : elle arrive dans /admin/contacts, l'équipe
// est prévenue par courriel, et la source de la visite est conservée.

export interface Landing {
  slug: string;
  /** Balise <title>. */
  titre: string;
  /** Eyebrow : à qui on parle. */
  public: string;
  /** H1, une promesse, une ligne. */
  promesse: string;
  /** Une phrase sous le H1. */
  sous: string;
  /** Trois preuves, vérifiables. */
  preuves: { titre: string; texte: string }[];
  /** Ce que la personne obtient en laissant son adresse. */
  offre: string;
  /** Libellé du bouton. */
  bouton: string;
  /** Champ « structure » affiché ? (établissements oui, intervenants non). */
  structure: boolean;
  /** Lien vers la page de fond. */
  enSavoirPlus: { href: string; label: string };
  /** Sujet posé sur la demande de contact. */
  sujet: string;
}

export const LANDINGS: Landing[] = [
  {
    slug: 'renfort',
    titre: 'Un remplaçant en CDD, sans commission',
    public: 'Directions et chefs de service — IME, ITEP, MECS, SESSAD, ESAT',
    promesse: 'Un poste à couvrir demain matin. Un remplaçant en CDD, 0 % de commission.',
    sous:
      'Vous publiez le besoin. Il part d’abord à votre équipe, puis aux intervenants qui connaissent déjà la maison, puis au réseau. Le contrat est édité, signé en ligne, et vous ne payez rien à la plateforme.',
    preuves: [
      {
        titre: '0 % de commission, et ce n’est pas une promotion',
        texte:
          'L’établissement paie le tarif du remplaçant, qui le touche intégralement. C’est un projet associatif, pas une agence.',
      },
      {
        titre: 'Le CDD direct, le seul montage sûr',
        texte:
          'Le Conseil d’État a jugé qu’un aide-soignant ne peut pas exercer en établissement sous statut d’indépendant (11 février 2025). Ici, c’est un CDD entre vous et le remplaçant, rien d’autre.',
      },
      {
        titre: 'Contrat, signature et paie préparés',
        texte:
          'Le CDD est généré avec vos mentions, signé électroniquement, et les heures sont pointées. Vous récupérez un dossier, pas une pile de courriels.',
      },
    ],
    offre: 'Dites-nous quel poste vous manque le plus souvent. On vous répond sous 24 h ouvrées, sans rien créer.',
    bouton: 'Être rappelé',
    structure: true,
    enSavoirPlus: { href: '/renforteam', label: 'Comment marche le renfort' },
    sujet: 'Landing · Renfort',
  },
  {
    slug: 'ateliers',
    titre: 'Des ateliers réservables pour votre établissement',
    public: 'Directions, chefs de service, coordinateurs — protection de l’enfance, handicap, ESAT',
    promesse: 'Un atelier pour vos jeunes, animé par quelqu’un qui connaît votre type de structure.',
    sous:
      'Boxe éducative, théâtre, musicothérapie, photo : un catalogue d’ateliers conçus pour les IME, ITEP, MECS, SESSAD et ESAT, réservables en ligne, sans commission.',
    preuves: [
      {
        titre: 'Des fiches qui disent ce qu’un chef de service veut savoir',
        texte:
          'Durée, nombre de participants, matériel, prérequis, créneaux, objectifs, déroulé, évaluation : ce qu’il faut pour caler l’atelier dans un planning et le défendre en réunion.',
      },
      {
        titre: 'Un devis sans créer de compte',
        texte:
          'Vous décrivez le besoin en trois lignes, l’intervenant répond, vous décidez. Rien n’est engagé avant votre accord.',
      },
      {
        titre: 'Pensé pour vos contraintes de lieu',
        texte:
          'Chaque type d’établissement a sa page : ce qu’un atelier apporte en IME n’est pas ce qu’il apporte en MECS, et les contraintes de la maison sont prises en compte avant le premier jour.',
      },
    ],
    offre: 'Dites-nous quel atelier vous cherchez, pour quel public. On vous envoie deux ou trois fiches qui correspondent.',
    bouton: 'Recevoir des fiches',
    structure: true,
    enSavoirPlus: { href: '/ateliers', label: 'Voir le catalogue' },
    sujet: 'Landing · Ateliers',
  },
  {
    slug: 'lex',
    titre: 'LEX, l’assistant d’écriture des écrits professionnels',
    public: 'Éducateurs, chefs de service, référents — et les établissements qui les emploient',
    promesse: 'Le rapport de situation en trente minutes, et les noms ne sortent jamais de chez vous.',
    sous:
      'Vous dictez les faits, LEX rédige dans la trame attendue — rapport, projet personnalisé, bilan, courrier. Les noms sont remplacés avant que quoi que ce soit ne parte, et rétablis chez vous.',
    preuves: [
      {
        titre: '15 générations gratuites par mois, sans carte bancaire',
        texte:
          'Une dotation permanente, reportable trois mois. De quoi écrire quinze documents avant de décider quoi que ce soit.',
      },
      {
        titre: 'Les noms ne quittent pas votre poste',
        texte:
          'Un pseudonymiseur remplace chaque personne par un rôle ([LE JEUNE], [LA MÈRE]) avant l’envoi, et restaure les prénoms localement. C’est la différence avec un assistant généraliste.',
      },
      {
        titre: 'Votre trame, pas la nôtre',
        texte:
          'Déposez un écrit déjà rendu : LEX en apprend la structure et le style, et rédige les suivants dans le même moule. Export Word ou PDF.',
      },
    ],
    offre: 'Laissez votre adresse : on vous envoie un exemple d’écrit avant/après, et l’accès aux 15 générations gratuites.',
    bouton: 'Voir un exemple',
    structure: false,
    enSavoirPlus: { href: '/confiance-lex', label: 'Comment LEX protège les noms' },
    sujet: 'Landing · LEX',
  },
  {
    slug: 'parcours',
    titre: 'Douze parcours gratuits sur les comportements-défis',
    public: 'Professionnels du médico-social, AESH, assistants familiaux — et parents',
    promesse: 'Douze parcours gratuits pour comprendre un comportement avant de vouloir le changer.',
    sous:
      'Quarante-cinq minutes de lecture, quatre modules, une situation qui dérape, un exercice sur votre propre cas, une fiche A4 à punaiser. Sans carte bancaire, sans date de fin.',
    preuves: [
      {
        titre: 'Une compétence par parcours, pas un cours',
        texte:
          '« Les premières minutes d’une crise », « Décrire un comportement sans le juger », « L’enfant qui dit non à tout » : chaque parcours apprend à faire une chose, et on la vérifie sur votre terrain.',
      },
      {
        titre: 'Ce que ça ne fait jamais',
        texte:
          'Aucun geste d’intervention physique enseigné, aucun diagnostic, aucune méthode pour faire obéir. On travaille sur ce qui coûte à la personne, pas sur ce qui gêne l’entourage.',
      },
      {
        titre: 'La fiche récap A4, en libre accès',
        texte:
          'Tout le parcours sur une page : la notion clé, la grille de relevé à recopier, les erreurs qui coûtent. Elle s’imprime et se punaise en salle d’équipe.',
      },
    ],
    offre: 'Laissez votre adresse : vous recevez la fiche récap du premier parcours, et le lien pour commencer.',
    bouton: 'Recevoir la première fiche',
    structure: false,
    enSavoirPlus: { href: '/parcours-de-formation', label: 'Par où commencer' },
    sujet: 'Landing · Parcours gratuits',
  },
  {
    slug: 'intervenants',
    titre: 'Publiez vos ateliers, gardez 100 % de votre tarif',
    public: 'Intervenants, formateurs, animateurs du médico-social',
    promesse: 'Vos ateliers devant les établissements qui les cherchent. Vous gardez 100 % de votre tarif.',
    sous:
      'Une fiche, un catalogue lu par des directions d’IME, de MECS et d’ESAT, des demandes de devis qui arrivent dans votre boîte. Contrats et factures édités par la plateforme. Aucune commission sur vos ateliers.',
    preuves: [
      {
        titre: 'Zéro commission sur vos ateliers, zéro abonnement',
        texte:
          'L’établissement paie votre tarif, vous le touchez intégralement. Seul RenforTeam est commissionné : l’association y vérifie chaque intervenant avant de l’envoyer, et c’est ce travail-là qui se paie.',
      },
      {
        titre: 'Les papiers sont faits',
        texte:
          'Devis, contrat, signature électronique, facture numérotée : vous animez, la plateforme édite. Et 15 générations LEX par mois pour vos écrits.',
      },
      {
        titre: 'Des missions de renfort, en plus',
        texte:
          'Quand un établissement a un poste à couvrir, les intervenants qui le connaissent sont prévenus d’abord. Un CDD direct, sans intermédiaire.',
      },
    ],
    offre: 'Dites-nous ce que vous animez. On vous dit sous 24 h ouvrées si le catalogue a des demandes pour ça.',
    bouton: 'Proposer mon atelier',
    structure: false,
    enSavoirPlus: { href: '/intervenant-independant', label: 'Comment ça marche pour un intervenant' },
    sujet: 'Landing · Intervenants',
  },
];

export function trouverLanding(slug: string): Landing | undefined {
  return LANDINGS.find((l) => l.slug === slug);
}
