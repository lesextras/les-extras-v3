// LES DEUX MODES D'EMPLOI, PAS À PAS.
//
// Le centre d'aide répond à des questions ponctuelles ; il manquait le
// document qu'on lit UNE FOIS, dans l'ordre, avant de se lancer — celui qu'une
// direction transfère à sa secrétaire de direction, ou qu'un éducateur qui
// hésite à se mettre à son compte lit un dimanche soir. C'est aussi la page
// qu'une campagne d'acquisition peut viser sans faire atterrir les gens sur un
// formulaire à froid.
//
// Écrit en dur, comme le centre d'aide, et pour les mêmes raisons : indexable,
// disponible même quand l'API tousse, versionné avec le produit qu'il décrit.
// Chaque étape est FACTUELLE — elle décrit ce que le logiciel fait réellement,
// vérifié dans le code au moment de l'écriture. Aucun prix n'y figure en
// dehors de « gratuit » et « sans commission », qui sont le modèle publié sur
// /frais-de-service.

export interface Etape {
  titre: string;
  texte: string[];
  /** Chemin de l'écran concerné, pour le lien « y aller » et le HowTo. */
  lien?: { href: string; label: string };
}

export interface Guide {
  slug: string;
  /** Balise title (calibrée en amont, < 52 caractères). */
  titre: string;
  /** H1 de la page. */
  accroche: string;
  description: string;
  duree: string;
  etapes: Etape[];
}

export const GUIDES: Guide[] = [
  {
    slug: "etablissement",
    titre: "Mode d'emploi — établissements",
    accroche: "Publier un renfort ou réserver un atelier, pas à pas",
    description:
      "De la création du compte à la facture réglée : le parcours complet d'un établissement médico-social sur Les Extras, étape par étape, sans jargon.",
    duree: "PT15M",
    etapes: [
      {
        titre: "Créez le compte de votre structure",
        texte: [
          "Choisissez « Établissement » à l'inscription, au nom de votre structure — MECS, IME, ITEP, SESSAD, EHPAD, CHRS, service de collectivité… Le compte est gratuit, sans engagement et sans carte bancaire.",
          "Vous pourrez ensuite inviter vos collègues (direction, chefs de service, secrétariat) avec des droits différenciés, et créer vos unités si votre structure en a plusieurs : planning et statistiques se filtrent par unité.",
        ],
        lien: { href: "/register?type=etablissement", label: "Créer le compte" },
      },
      {
        titre: "Renseignez votre identité de facturation",
        texte: [
          "Dans Mon compte, indiquez raison sociale, SIRET et adresse : ce sont elles qui s'impriment sur les contrats et les factures. Deux minutes maintenant vous évitent un document incomplet plus tard.",
          "C'est aussi là que se règlent les notifications : activez-les sur le téléphone de garde, c'est lui qui doit sonner quand un renfort est pourvu.",
        ],
      },
      {
        titre: "Publiez un besoin de renfort…",
        texte: [
          "Depuis RenforTeam, « Publier un besoin » : métier attendu, unité, dates, taux horaire. La diffusion descend palier par palier — vos propres salariés rattachés d'abord, puis les intervenants déjà venus chez vous, puis le réseau — et s'arrête dès que c'est pourvu.",
          "Le premier intervenant qui accepte emporte la mission ; le contrat est généré automatiquement, à double signature électronique. À moins de vingt-quatre heures du besoin, la diffusion s'ouvre plus vite.",
        ],
        lien: { href: "/renforteam", label: "Découvrir RenforTeam" },
      },
      {
        titre: "… ou réservez un atelier au catalogue",
        texte: [
          "Le catalogue est public : objectifs, méthode, public visé, durée et prix sur chaque fiche, sans compte. Depuis une fiche, vous demandez un devis.",
          "L'intervenant chiffre, vous acceptez en ligne — le devis porte la mention « Bon pour accord » et vaut engagement — et la réservation se crée avec son contrat et sa facture. Chaque profil a été vérifié avant d'être visible : diplômes, expériences, pièces d'identité.",
        ],
        lien: { href: "/ateliers", label: "Parcourir les ateliers" },
      },
      {
        titre: "Suivez l'intervention, validez les heures",
        texte: [
          "Le planning partagé, la messagerie rattachée à la mission et le pointage sont au même endroit. L'intervenant déclare ses heures, vous les validez — c'est cette validation qui fait foi pour la facture.",
          "Les pièces de conformité (diplôme, casier, URSSAF, assurance) sont dans le coffre-fort, surveillées : une alerte part avant chaque échéance, pas après.",
        ],
      },
      {
        titre: "Réglez la facture",
        texte: [
          "La facture PDF se télécharge depuis votre espace, avec les mentions légales et le détail des heures : votre comptabilité n'a rien à reconstituer.",
          "Une facture d'intervenant se règle par virement, directement auprès de lui, au tarif qu'il a fixé — la plateforme n'ajoute ni commission ni frais. Seules les formations Qualiopi et les crédits LEX, facturés par l'association, se règlent en ligne par carte.",
        ],
      },
    ],
  },
  {
    slug: "intervenant",
    titre: "Mode d'emploi — intervenants",
    accroche: "De votre profil à votre première facture, pas à pas",
    description:
      "Créer son profil vérifié, recevoir des missions de renfort, publier ses ateliers et facturer 100 % de son tarif : le parcours complet d'un intervenant sur Les Extras.",
    duree: "PT20M",
    etapes: [
      {
        titre: "Créez votre compte et votre profil",
        texte: [
          "Choisissez « Intervenant » à l'inscription — éducateur spécialisé, moniteur-éducateur, EJE, AES, psychologue, psychomotricien, art-thérapeute… Renseignez métier, diplômes, expériences et zones d'intervention.",
          "Si vous êtes salarié d'un établissement et non indépendant, la tuile « Salarié » existe aussi : votre compte se rattache alors à votre structure.",
        ],
        lien: { href: "/register?type=intervenant", label: "Créer le compte" },
      },
      {
        titre: "Faites vérifier vos pièces",
        texte: [
          "Déposez diplômes, pièce d'identité, extrait de casier, attestation URSSAF et assurance dans le coffre-fort. L'équipe contrôle chaque profil avant publication — c'est cette vérification qui fait la confiance des établissements, et donc vos missions.",
          "Le coffre-fort surveille les échéances : une alerte part avant qu'une attestation n'expire, jamais après.",
        ],
      },
      {
        titre: "Recevez des missions de renfort",
        texte: [
          "Une fois le profil validé, les besoins de renfort qui correspondent à votre métier et à votre secteur vous arrivent directement. Le premier qui accepte emporte la mission : activez les notifications sur votre téléphone.",
          "Le contrat se signe électroniquement, les heures se déclarent dans l'application, l'établissement les valide — et c'est cette validation qui déclenche la facturation.",
        ],
      },
      {
        titre: "Publiez vos propres ateliers",
        texte: [
          "Créez une fiche : objectifs, méthode, public, durée, tarif. Relue par l'équipe, elle rejoint le catalogue public — c'est votre vitrine, indexée par Google, avec vos avis clients.",
          "Quand un établissement demande un devis, vous le chiffrez ; il l'accepte en ligne, et la réservation se crée avec le contrat.",
        ],
        lien: { href: "/intervenant-independant", label: "Pourquoi publier ici" },
      },
      {
        titre: "Facturez, et gardez tout",
        texte: [
          "Contrat, déclaration d'heures, facture PDF : tout est généré depuis la mission, à votre nom et sous votre SIRET. Vous facturez l'établissement en direct.",
          "Aucune commission n'est prélevée : vous touchez 100 % de votre tarif. Le modèle associatif se finance sur les formations Qualiopi et les crédits LEX — jamais sur votre rémunération.",
        ],
      },
      {
        titre: "Animez des formations sous Qualiopi, si vous le souhaitez",
        texte: [
          "Vous pouvez animer des formations sans être organisme de formation : vous apportez le contenu, l'association porte la certification Qualiopi, le cadre réglementaire et le bilan pédagogique.",
          "C'est le seul cas où elle s'interpose — la certification l'impose : elle vend la formation à l'établissement, et vous la lui facturez ensuite au montant convenu, depuis votre compte et sous votre SIRET.",
        ],
        lien: { href: "/formations", label: "Voir les formations" },
      },
    ],
  },
];

export function trouverGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
