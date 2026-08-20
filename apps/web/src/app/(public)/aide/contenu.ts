// Contenu du centre d'aide.
//
// Écrit en dur plutôt que stocké en base : ces réponses changent quelques fois
// par an, elles doivent être indexables par Google, et un article d'aide qui
// dépend de l'API est un article d'aide indisponible le jour où l'API tousse.
// Elles vivent avec le code, donc elles suivent les évolutions du produit dans
// le même commit que la fonctionnalité qu'elles décrivent.

export interface Article {
  slug: string;
  question: string;
  reponse: string[];
}

export interface Rubrique {
  slug: string;
  titre: string;
  resume: string;
  /** Nom d'icône lucide, résolu côté page. */
  icone: "building" | "user" | "wallet" | "shield" | "bell" | "graduation";
  articles: Article[];
}

export const RUBRIQUES: Rubrique[] = [
  {
    slug: "etablissements",
    titre: "Établissements",
    resume: "Publier un renfort, réserver un atelier, suivre vos interventions.",
    icone: "building",
    articles: [
      {
        slug: "publier-un-renfort",
        question: "Comment publier un besoin de renfort ?",
        reponse: [
          "Depuis votre tableau de bord, ouvrez RenforTeam puis « Publier un besoin ». Vous renseignez le métier attendu, l'unité concernée, les dates et le taux horaire.",
          "Le besoin n'est pas envoyé à tout le monde d'un coup : il descend palier par palier. Vos propres salariés rattachés au compte d'abord, puis les intervenants déjà venus chez vous, puis le réseau. Il s'arrête dès qu'il est pourvu.",
          "Le premier intervenant qui accepte emporte la mission. Le contrat est généré automatiquement, vous n'avez rien à arbitrer.",
        ],
      },
      {
        slug: "choisir-le-palier-de-depart",
        question: "Puis-je démarrer directement au niveau du réseau ?",
        reponse: [
          "Oui. À la publication, vous choisissez le palier de départ. Si vous savez que votre équipe ne peut pas couvrir, vous démarrez directement au palier des habitués ou du réseau.",
          "Le palier de départ est proposé automatiquement selon le délai : à moins de vingt-quatre heures, la diffusion s'ouvre plus vite.",
        ],
      },
      {
        slug: "reserver-un-atelier",
        question: "Comment réserver un atelier ?",
        reponse: [
          "Le catalogue est public : vous consultez les fiches sans compte. Chaque fiche indique les objectifs, la méthode, le public visé, la durée et le prix.",
          "Depuis une fiche, vous demandez un devis. L'intervenant le chiffre, vous l'acceptez en ligne, et la réservation se crée avec son contrat et sa facture.",
        ],
      },
      {
        slug: "verification-des-intervenants",
        question: "Comment les intervenants sont-ils vérifiés ?",
        reponse: [
          "Chaque profil est contrôlé par l'équipe avant d'être visible : diplômes, expériences et pièces d'identité.",
          "Les pièces de conformité — diplôme, extrait de casier, attestation URSSAF, assurance — sont déposées dans le coffre-fort et surveillées : une alerte part avant chaque échéance, pas après.",
        ],
      },
      {
        slug: "plusieurs-unites",
        question: "Nous avons plusieurs unités. Comment les gérer ?",
        reponse: [
          "Vous créez vos unités depuis Mon compte. Chaque membre et chaque mission peuvent être rattachés à une unité.",
          "Le planning et les statistiques se filtrent par unité, et un chef de service ne voit que la sienne s'il n'a pas les droits sur le compte entier.",
        ],
      },
    ],
  },
  {
    slug: "intervenants",
    titre: "Intervenants",
    resume: "Créer votre profil, recevoir des missions, publier vos ateliers.",
    icone: "user",
    articles: [
      {
        slug: "rejoindre-le-reseau",
        question: "Comment rejoindre le réseau ?",
        reponse: [
          "Vous créez un compte intervenant, puis vous remplissez votre profil : métier, diplômes, expériences, zones d'intervention.",
          "L'équipe vérifie les pièces avant publication. Une fois le profil validé, vous recevez les missions qui correspondent à votre métier et à votre secteur.",
        ],
      },
      {
        slug: "combien-ca-coute",
        question: "Combien la plateforme me prélève-t-elle ?",
        reponse: [
          "Rien. Aucune commission n'est prélevée sur ce que vous facturez : vous touchez 100 % de votre prix, et la mise en relation est gratuite pour l'établissement aussi.",
          "C'est le parti pris du modèle associatif. L'association se finance sur les formations Qualiopi qu'elle facture au devis et sur les crédits LEX (l'assistant IA), jamais sur votre rémunération.",
        ],
      },
      {
        slug: "publier-un-atelier",
        question: "Puis-je proposer mes propres ateliers ?",
        reponse: [
          "Oui. Vous créez une fiche avec vos objectifs, votre méthode, votre public et votre tarif. Elle rejoint le catalogue public une fois relue par l'équipe.",
          "Votre prix reste le vôtre, intégralement : l'établissement paie votre tarif, sans commission ajoutée ni prélevée.",
        ],
      },
      {
        slug: "contrats-et-factures",
        question: "Qui s'occupe des contrats et des factures ?",
        reponse: [
          "Tout est généré depuis la mission : contrat à double signature, déclaration d'heures, facture PDF.",
          "Vous facturez l'association, et l'association facture l'établissement. Vous avez donc un seul payeur au lieu d'un par structure.",
        ],
      },
      {
        slug: "animer-une-formation",
        question: "Puis-je animer une formation sans être organisme de formation ?",
        reponse: [
          "Oui. Vous intervenez sous la certification Qualiopi portée par l'association : vous apportez le contenu, elle porte le cadre réglementaire.",
          "Vous n'avez ni Qualiopi à obtenir, ni bilan pédagogique et financier à produire.",
        ],
      },
    ],
  },
  {
    slug: "compte-et-facturation",
    titre: "Compte & facturation",
    resume: "Ce qui est gratuit, ce qui est payant, comment on vous facture.",
    icone: "wallet",
    articles: [
      {
        slug: "ce-qui-est-gratuit",
        question: "Qu'est-ce qui est gratuit ?",
        reponse: [
          "Toute la mise en relation et l'aide à la contractualisation : publier un renfort, réserver un atelier, contrats, factures, planning, messagerie, pointage, coffre-fort de conformité — gratuit, pour les établissements comme pour les intervenants, sans commission.",
          "Deux services seulement se paient : les formations Qualiopi (au devis, facturées par l'association) et LEX, l'assistant IA à crédits. Un renfort ou un atelier se paie à son intervenant, à son tarif — la plateforme n'ajoute rien.",
        ],
      },
      {
        slug: "adhesion",
        question: "Comment fonctionnent les crédits LEX ?",
        reponse: [
          "LEX, l'assistant IA (écriture professionnelle, générateur d'activités, fiches pré-remplies, GAPiste), fonctionne à crédits : un crédit par génération. Chaque compte reçoit 15 générations offertes à son ouverture puis le 1er de chaque mois, sans carte bancaire et sans date de fin ; ce qui n'est pas consommé se reporte jusqu'à trois mois. Au-delà, vous rechargez par packs ou par un abonnement à dotation mensuelle.",
          "Votre consommation, votre solde et les tarifs sont visibles dans votre espace, page « LEX — Crédits & abonnement ». Le bot d'aide, lui, reste gratuit. Les recettes soutiennent les actions de l'association.",
        ],
      },
      {
        slug: "payer-une-facture",
        question: "Comment régler une facture ?",
        reponse: [
          "Chaque facture est téléchargeable en PDF depuis votre espace, et payable en ligne par carte.",
          "Les mentions légales, la commission et le détail des heures y figurent, pour que votre comptabilité n'ait rien à reconstituer.",
        ],
      },
    ],
  },
  {
    slug: "notifications",
    titre: "Notifications",
    resume: "Être prévenu à temps, sur le bon appareil.",
    icone: "bell",
    articles: [
      {
        slug: "activer-les-notifications",
        question: "Comment activer les notifications sur mon téléphone ?",
        reponse: [
          "Ouvrez Mon compte, puis « Être prévenu sur cet appareil » et autorisez les notifications. Un bouton d'essai permet de vérifier tout de suite que ça arrive.",
          "L'activation vaut pour l'appareil, pas pour le compte : l'activer sur le téléphone n'active rien sur l'ordinateur, et c'est voulu.",
        ],
      },
      {
        slug: "notifications-iphone",
        question: "Je suis sur iPhone et je ne vois pas le bouton",
        reponse: [
          "Sur iPhone, les notifications ne sont disponibles que si l'application a été ajoutée à l'écran d'accueil.",
          "Dans Safari : bouton Partager, puis « Sur l'écran d'accueil ». Ouvrez ensuite Les Extras depuis l'icône, et le réglage apparaît dans Mon compte.",
        ],
      },
      {
        slug: "installer-application",
        question: "Y a-t-il une application à télécharger ?",
        reponse: [
          "Il n'y a rien à installer depuis un magasin d'applications. Les Extras s'ajoute à l'écran d'accueil depuis le navigateur et se comporte ensuite comme une application.",
          "Elle se met à jour toute seule : vous avez toujours la dernière version.",
        ],
      },
    ],
  },
  {
    slug: "donnees-et-securite",
    titre: "Données & sécurité",
    resume: "Ce que nous stockons, ce que nous ne stockons pas.",
    icone: "shield",
    articles: [
      {
        slug: "anonymat-du-gap",
        question: "Le GAP est-il vraiment anonyme ?",
        reponse: [
          "Vous publiez sous un libellé de métier, jamais sous votre nom. Les prénoms détectés dans votre texte sont remplacés à l'enregistrement, et ne sont stockés nulle part en clair.",
          "Rien n'est visible depuis le site et rien n'est indexé par les moteurs de recherche : un compte est nécessaire pour lire comme pour écrire.",
        ],
      },
      {
        slug: "assistant-ia",
        question: "Que devient ce que j'écris dans LEX ?",
        reponse: [
          "Les noms sont masqués avant traitement, et vos notes brutes ne sont pas conservées.",
          "LEX ne pose aucun diagnostic. Il produit un écrit ou une proposition d'activité, que vous relisez et validez : vous restez l'auteur.",
        ],
      },
      {
        slug: "export-et-suppression",
        question: "Comment récupérer ou effacer mes données ?",
        reponse: [
          "Depuis Mon compte, rubrique Données personnelles, vous exportez l'ensemble de vos données dans un fichier, ou vous demandez leur suppression.",
          "La suppression efface aussi les fichiers déposés, pas seulement les lignes en base.",
        ],
      },
    ],
  },
  {
    slug: "formations",
    titre: "Formations",
    resume: "Qualiopi, financement OPCO, attestations.",
    icone: "graduation",
    articles: [
      {
        slug: "financement-opco",
        question: "Vos formations sont-elles finançables ?",
        reponse: [
          "Oui. Les parcours sont certifiés Qualiopi au titre des actions de formation et des bilans de compétences, donc mobilisables auprès des OPCO et des financeurs publics.",
          "Le numéro de déclaration d'activité figure sur chaque convention. Cet enregistrement ne vaut pas agrément de l'État.",
        ],
      },
      {
        slug: "emargement-attestations",
        question: "Comment se passent l'émargement et les attestations ?",
        reponse: [
          "L'émargement se fait en ligne, séance par séance. Les attestations de fin de formation et les certificats sont générés automatiquement à partir des présences.",
          "Le registre et les éléments du bilan pédagogique se remplissent au fil des séances, au lieu d'être reconstitués après coup.",
        ],
      },
    ],
  },
];

export function trouverRubrique(slug: string): Rubrique | undefined {
  return RUBRIQUES.find((r) => r.slug === slug);
}

/** Toutes les questions à plat — sert à la recherche et au sitemap. */
export const TOUS_LES_ARTICLES = RUBRIQUES.flatMap((r) =>
  r.articles.map((a) => ({ ...a, rubrique: r })),
);
