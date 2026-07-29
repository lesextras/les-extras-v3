/**
 * Aide contextuelle par page — affichée par <PageHelp /> sous le fil d'Ariane.
 * Correspondance par préfixe le plus long : "/admin/formations" gagne sur "/admin".
 */
export interface PageHelpEntry {
  /** Titre court de l'encart. */
  titre: string;
  /** À quoi sert la page, en une ou deux phrases. */
  texte: string;
  /** Étapes ou repères concrets (3 max). */
  etapes?: string[];
}

const AIDE: Record<string, PageHelpEntry> = {
  "/gap": {
    titre: "Le fil des situations de terrain",
    texte:
      "Ici, des professionnels décrivent des situations concrètes et d'autres racontent ce qu'ils ont tenté. C'est plus rapide qu'une recherche et plus juste qu'un manuel, parce que ça vient de gens qui accompagnent les mêmes publics que vous.",
    etapes: [
      "Répondez à une question sans réponse : cela rapporte 15 points.",
      "Si votre réponse est retenue par l'auteur, vous en gagnez 40 de plus.",
      "Les prénoms que vous citez sont masqués automatiquement.",
    ],
  },

  "/dashboard/progression": {
    titre: "Trois paliers, gagnés sur le terrain",
    texte:
      "Nouveau, Confirmé, Super Extra : votre palier est calculé uniquement sur vos missions réelles — missions terminées, note moyenne reçue, taux d'annulation. Rien de déclaratif. Le palier Super Extra vous donne un accès prioritaire aux missions : vous êtes sollicité avant leur ouverture au réseau complet.",
    etapes: [
      "Regardez les critères du prochain palier : chacun indique où vous en êtes.",
      "Honorez vos missions et évitez les annulations de dernière minute — c'est le critère qui pèse le plus.",
      "Demandez un avis après chaque prestation : la note moyenne compte dès 1 avis.",
    ],
  },
  "/dashboard/points": {
    titre: "Vos points, et comment ils deviennent des euros",
    texte:
      "Chaque contribution à la communauté crédite des points : publier un atelier, réaliser une mission, déposer un avis, écrire un article, proposer une idée retenue. 10 points valent 1 € de réduction, déduite au moment de la facturation dans la limite de 30 % du montant. Les points expirent au bout de 12 mois — mieux vaut les utiliser au fil de l'eau.",
    etapes: [
      "Repérez dans « Comment en gagner » l'action qui vous rapporte le plus.",
      "Signalez votre solde à l'équipe au moment de votre prochaine commande.",
      "Surveillez la carte « Validité » : elle prévient des points bientôt périmés.",
    ],
  },
  "/dashboard/idees": {
    titre: "Dites ce qui vous manque — c'est ce qui oriente les versions",
    texte:
      "Cette page n'est pas une boîte à suggestions décorative : les idées les plus votées passent en priorité de développement, et leur statut est mis à jour publiquement. Une idée retenue rapporte 40 points à son auteur.",
    etapes: [
      "Cherchez d'abord si quelqu'un a déjà proposé la même chose : votez plutôt que de dupliquer.",
      "Décrivez la situation concrète qui vous bloque, pas seulement la solution imaginée.",
      "Revenez voir le statut : « À l'étude », « Retenue », « Livrée ».",
    ],
  },
  "/dashboard/devenir-intervenant": {
    titre: "Proposer vos interventions en votre nom",
    texte:
      "Vous intervenez déjà auprès de publics accompagnés. Vous pouvez proposer les mêmes ateliers à d'autres structures, en votre nom propre, sans quitter votre poste. Vos deux espaces restent séparés : vous basculez de l'un à l'autre avec le sélecteur de compte.",
    etapes: [
      "Choisissez le nom sous lequel vous exercerez (votre nom propre convient).",
      "Cochez les fiches à reprendre : elles sont recopiées en brouillon, jamais publiées à votre place.",
      "Relisez chaque fiche, ajustez le tarif, puis publiez depuis « Mes ateliers ».",
    ],
  },

  // ---------- Espace personnel ----------
  '/dashboard': {
    titre: 'Votre tableau de bord',
    texte:
      'Vue d’ensemble de votre activité : les actions à traiter apparaissent en haut, les chiffres clés en dessous. Le menu de gauche donne accès à tout — survolez une entrée pour voir à quoi elle sert.',
    etapes: [
      'Traitez d’abord les alertes et demandes en attente',
      'Utilisez ⌘K (ou Ctrl+K) pour chercher n’importe quelle page',
      'Changez de compte actif depuis le menu en haut à droite',
    ],
  },
  '/dashboard/opportunites': {
    titre: 'Vos opportunités',
    texte:
      'Les missions publiées par les établissements qui correspondent à votre profil, classées par pertinence. Postulez directement depuis la fiche.',
    etapes: ['Ouvrez une mission pour voir le détail', 'Postulez en un clic', 'Suivez vos candidatures ici même'],
  },
  '/dashboard/facturation': {
    titre: 'Devis & factures',
    texte:
      'Deux vues, une page. Onglet Devis : ce qu’on vous demande de chiffrer, et ce qu’on vous propose et qu’il faut accepter ou refuser. Onglet Factures : ce qui est dû, ce qui est réglé, et le PDF de chaque document. Le chiffre à côté de chaque onglet compte ce qui attend une action de votre part.',
  },
  '/dashboard/reservations': {
    titre: 'Mes réservations',
    texte:
      'Tout ce qui a été réservé, dans les deux sens : les renforts pourvus, les ateliers commandés et les salariés inscrits en formation. Chaque ligne indique si vous êtes du côté qui réserve ou du côté qui intervient — un même compte peut faire les deux. Le contrat s’ouvre en cliquant sur l’intitulé.',
  },
  '/dashboard/planning': {
    titre: 'Votre planning',
    texte:
      'Toutes vos interventions confirmées, jour par jour. Les heures effectuées se déclarent ici puis sont validées par l’établissement — c’est ce qui déclenche la facturation.',
  },
  '/dashboard/inbox': {
    titre: 'Messagerie',
    texte:
      'Vos échanges avec les établissements ou les intervenants, rattachés à chaque mission ou réservation. Tout reste tracé au même endroit.',
  },
  '/dashboard/activites': {
    titre: 'Générateur d’activités',
    texte:
      'Décrivez votre public et les besoins ou difficultés à travailler : l’assistant propose deux activités structurées (déroulé, matériel, variantes, points de vigilance). Les noms sont masqués avant tout traitement.',
    etapes: ['Décrivez le public et les besoins', 'Générez, ajustez à votre contexte', 'Validez en équipe pluridisciplinaire avant de mettre en œuvre'],
  },
  '/dashboard/assistant': {
    titre: 'Assistant d’écriture',
    texte:
      'Transformez des notes brutes en écrit professionnel (note d’observation, transmission, rapport…). Les noms sont masqués avant tout traitement et vos notes ne sont jamais stockées : seul le document que vous validez est conservé.',
    etapes: ['Choisissez une trame', 'Collez ou dictez vos notes', 'Relisez, ajustez puis validez — c’est vous qui signez'],
  },
  '/dashboard/ateliers': {
    titre: 'Vos ateliers',
    texte:
      'Créez et gérez vos interventions au catalogue : description, objectifs, public, tarif. Une fiche complète avec photo est beaucoup plus réservée.',
  },
  '/dashboard/formations': {
    titre: 'Formations',
    texte:
      'Les sessions de formation : inscriptions, émargements, attestations. Côté établissement, inscrivez vos salariés ; côté formateur, gérez vos sessions.',
  },
  '/dashboard/devis': {
    titre: 'Devis',
    texte:
      'Les demandes de devis reçues et envoyées. Un devis accepté crée automatiquement la réservation et le contrat — rien à ressaisir.',
    etapes: ['Répondez vite : un devis chiffré sous 48 h convertit bien mieux'],
  },
  '/dashboard/renforts': {
    titre: 'SOS Renfort',
    texte:
      'Publiez un besoin de remplacement urgent. La diffusion se fait en cascade : votre équipe d’abord, puis les intervenants déjà venus, puis la marketplace. Le premier profil compatible qui accepte remporte la mission.',
    etapes: ['Décrivez le besoin et les créneaux', 'Choisissez le palier de diffusion', 'Suivez les candidatures en temps réel'],
  },
  '/dashboard/conformite': {
    titre: 'Coffre-fort conformité',
    texte:
      'Les pièces obligatoires des intervenants (CNI, casier, diplômes, URSSAF…) avec leur statut et leurs échéances. Une alerte apparaît avant chaque expiration.',
  },
  '/dashboard/finance': {
    titre: 'Factures & revenus',
    texte:
      'Vos factures, paiements et documents comptables. Chaque facture est téléchargeable en PDF ; le paiement en ligne est disponible sur les factures dues.',
  },
  '/dashboard/adhesion': {
    titre: 'Adhésion',
    texte:
      'L’adhésion mensuelle à l’association débloque LEX, l’assistant IA. Le reste de la plateforme est gratuit, et les prestations se règlent à leur facture — il n’y a rien à recharger à l’avance.',
    etapes: [
      'Choisissez une formule : Essentiel ou Pro.',
      'Le paiement est mensuel et résiliable ; LEX s’active dès la confirmation.',
      'Vos factures de prestations restent dans « Factures & revenus ».',
    ],
  },
  '/dashboard/avis': {
    titre: 'Avis',
    texte:
      'Après chaque mission ou atelier, chacun évalue l’autre. Les avis nourrissent la confiance sur la plateforme — pensez à laisser les vôtres.',
  },
  '/dashboard/actualites': {
    titre: 'Vos publications',
    texte:
      'Écrivez des articles pour l’Édublog (visibles de tous, même sans compte) et partagez-les sur vos réseaux. Un bon article attire des demandes.',
  },
  '/dashboard/account': {
    titre: 'Votre compte',
    texte:
      'Profil, photo, membres de votre structure et paramètres de sécurité. Un profil complet inspire confiance et améliore votre visibilité.',
  },
  '/dashboard/donnees-personnelles': {
    titre: 'Vos données personnelles',
    texte:
      'Conformément au RGPD : exportez l’ensemble de vos données ou demandez leur suppression définitive. La suppression retire aussi vos fichiers déposés.',
  },

  // ---------- Administration ----------
  '/admin': {
    titre: 'Administration de la plateforme',
    texte:
      'Le cockpit : alertes à traiter, activité récente et raccourcis. Le menu de gauche regroupe la modération, les utilisateurs, le centre de formation, le contenu et le pilotage.',
    etapes: ['Traitez les alertes du desk en priorité', '⌘K ouvre la recherche globale', '« Mon espace » vous ramène à votre tableau de bord personnel'],
  },
  '/admin/missions': {
    titre: 'Modération des missions',
    texte:
      'Toutes les missions de renfort publiées : vérifiez, modifiez ou dépubliez. Une mission claire (dates, lieu, profil) trouve preneur plus vite.',
  },
  '/admin/ateliers': {
    titre: 'Modération des ateliers',
    texte:
      'Le catalogue d’ateliers : validez les nouvelles fiches, corrigez les textes, gérez les photos et les villes d’intervention.',
  },
  '/admin/reservations': {
    titre: 'Réservations',
    texte:
      'Le suivi de toutes les réservations : statut, dates, montant. Vous pouvez confirmer, annuler ou relancer depuis chaque ligne.',
  },
  '/admin/educatheures': {
    titre: 'Educat’heures',
    texte:
      'La banque d’heures : heures d’intervention acquises par les établissements et leur consommation au fil des interventions.',
  },
  '/admin/etablissements': {
    titre: 'Comptes & sous-comptes',
    texte:
      'Chaque compte (établissement ou freelance) avec ses membres rattachés et leurs rôles. Dépliez un compte pour voir et gérer ses sous-comptes.',
  },
  '/admin/utilisateurs': {
    titre: 'Utilisateurs',
    texte:
      'Tous les utilisateurs de la plateforme, leurs rattachements et leur statut. Recherchez par nom ou par e-mail.',
  },
  '/admin/conformite': {
    titre: 'Conformité des intervenants',
    texte:
      'La complétude des pièces obligatoires, agrégée par établissement. Rouge = pièce manquante ou expirée : à relancer.',
  },
  '/admin/invitations': {
    titre: 'Invitations',
    texte:
      'Les invitations envoyées et en attente. Vous pouvez renvoyer un e-mail d’invitation ou révoquer une invitation obsolète.',
  },
  '/admin/roles': {
    titre: 'Rôles & droits',
    texte:
      'La matrice des rôles : qui peut faire quoi, espace par espace. Référez-vous-y avant de changer le rôle d’un membre.',
  },
  '/admin/formations': {
    titre: 'Gestion des formations',
    texte:
      'Créez les programmes (certifiants ou internes), ouvrez des sessions, suivez les inscrits et générez les attestations.',
    etapes: ['Créez la formation', 'Ouvrez une session avec dates et places', 'Les inscriptions et émargements se gèrent dans la session'],
  },
  '/admin/qualiopi': {
    titre: 'Conformité Qualiopi',
    texte:
      'La matrice des 7 critères et 32 indicateurs avec vos preuves. Complétez-la au fil de l’eau : l’audit se prépare ici, pas la veille.',
  },
  '/admin/registre': {
    titre: 'Registre & BPF',
    texte:
      'Le registre des formations dispensées et le Bilan Pédagogique et Financier annuel, alimentés automatiquement par les sessions.',
  },
  '/admin/articles': {
    titre: 'Articles de l’Édublog',
    texte:
      'Rédigez et publiez les articles et actualités visibles publiquement sur l’Édublog. Une image de couverture et un chapô soignés font la différence.',
  },
  '/admin/categories': {
    titre: 'Catégories',
    texte:
      'La taxonomie des missions, ateliers et articles. Modifier une catégorie met à jour toutes les fiches qui l’utilisent.',
  },
  '/admin/contacts': {
    titre: 'Demandes de contact',
    texte:
      'Les messages reçus via les formulaires publics (contact, catalogue, devis). Répondez puis archivez pour garder une liste propre.',
  },
  '/admin/factures': {
    titre: 'Facturation plateforme',
    texte:
      'Toutes les factures émises : statut, montant, PDF. Les paiements en ligne remontent automatiquement via Stripe.',
  },
  '/admin/statistiques': {
    titre: 'Statistiques',
    texte:
      'Les KPIs de la plateforme : comptes, réservations, revenus, activité. Les graphiques couvrent les 12 derniers mois.',
  },
  '/admin/tunnel': {
    titre: 'Tunnel d’acquisition',
    texte:
      'Vue → demande → devis → réservation, fiche par fiche. Repérez où les visiteurs décrochent pour savoir quoi améliorer.',
  },
  '/admin/journal': {
    titre: 'Journal d’audit',
    texte:
      'Qui a fait quoi, et quand : validations, modérations, changements de rôle. Consultation seule — rien ne s’y modifie.',
  },
};

/** Retourne l'aide de la page par préfixe le plus long, ou null. */
export function getPageHelp(pathname: string): { key: string; aide: PageHelpEntry } | null {
  let best: string | null = null;
  for (const key of Object.keys(AIDE)) {
    if (pathname === key || pathname.startsWith(key + '/')) {
      if (!best || key.length > best.length) best = key;
    }
  }
  return best ? { key: best, aide: AIDE[best] } : null;
}
