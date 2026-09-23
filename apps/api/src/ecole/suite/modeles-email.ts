import { TypeEmailEcole } from '@prisma/client';

/**
 * LES QUATORZE COURRIELS AUTOMATIQUES D'UNE ÉCOLE, TELS QU'ILS PARTENT PAR DÉFAUT.
 *
 * Même liste, même ordre que chez Teachizy. Chaque académie peut réécrire le
 * sujet, le texte et le délai ; sans réécriture, c'est ce texte-ci qui part.
 *
 * Les mots entre accolades sont remplacés à l'envoi :
 *   {prenom}     le prénom de l'apprenant (vide s'il ne l'a pas donné)
 *   {formation}  le titre de la formation
 *   {lecon}      le titre de la leçon (leçon nouvellement accessible)
 *   {ecole}      le nom de l'école
 *   {lien}       l'adresse que le bouton ouvre
 *   {date}       une date utile (fin d'accès, nouvelle date…)
 *   {liste}      la liste des formations en cours (récapitulatif)
 */

export interface ModeleParDefaut {
  type: TypeEmailEcole;
  /** Le nom de l'onglet, comme chez Teachizy. */
  libelle: string;
  /** Ce qui déclenche l'envoi, en une phrase. */
  declencheur: string;
  sujet: string;
  corps: string;
  /** Le libellé du bouton du message. */
  bouton: string;
  /** En minutes. Pour les relances, c'est l'attente avant la relance. */
  delaiMinutes: number;
  /** Faux : le délai n'a pas de sens pour ce message (il part à l'action). */
  delaiReglable: boolean;
}

const JOUR = 24 * 60;

export const MODELES_PAR_DEFAUT: ModeleParDefaut[] = [
  {
    type: 'BIENVENUE',
    libelle: 'Email de bienvenue',
    declencheur: "Part quand une personne s'inscrit ou achète une formation. Il porte son lien d'accès.",
    sujet: 'Bienvenue dans « {formation} »',
    corps:
      'Bonjour {prenom},\n\nVotre inscription à « {formation} » est confirmée. Le bouton ci-dessous ouvre votre formation.\n\nGardez ce message : c’est votre accès, et il reste valable. Vous pouvez aussi créer votre espace apprenant pour retrouver toutes vos formations au même endroit.\n\nÀ très vite,\n{ecole}',
    bouton: 'Ouvrir ma formation',
    delaiMinutes: 0,
    delaiReglable: true,
  },
  {
    type: 'FIN_FORMATION',
    libelle: 'Email de fin de formation',
    declencheur: 'Part quand toutes les leçons de la formation sont terminées.',
    sujet: 'Bravo, vous avez terminé « {formation} »',
    corps:
      'Bonjour {prenom},\n\nVous avez terminé toutes les leçons de « {formation} ». Félicitations pour ce parcours.\n\nVotre formation reste ouverte : vous pouvez y revenir quand vous voulez pour relire une leçon.\n\n{ecole}',
    bouton: 'Revoir ma formation',
    delaiMinutes: 0,
    delaiReglable: true,
  },
  {
    type: 'DESINSCRIPTION',
    libelle: 'Email de désinscription',
    declencheur: "Part quand l'académie suspend l'accès d'une personne à une formation.",
    sujet: 'Votre accès à « {formation} » est suspendu',
    corps:
      'Bonjour {prenom},\n\nVotre accès à « {formation} » est suspendu. Votre progression est conservée : si l’accès est rouvert, vous reprendrez là où vous en étiez.\n\nPour toute question, répondez simplement à ce message.\n\n{ecole}',
    bouton: '',
    delaiMinutes: 0,
    delaiReglable: false,
  },
  {
    type: 'SUPPRESSION',
    libelle: "Email de suppression d'un apprenant",
    declencheur: "Part quand l'académie retire une personne d'une formation.",
    sujet: 'Vous n’êtes plus inscrit à « {formation} »',
    corps:
      'Bonjour {prenom},\n\nVotre inscription à « {formation} » a été retirée par {ecole}. Le lien d’accès que vous aviez reçu ne fonctionne plus.\n\nSi c’est une erreur, répondez simplement à ce message.\n\n{ecole}',
    bouton: '',
    delaiMinutes: 0,
    delaiReglable: false,
  },
  {
    type: 'ABANDON_1',
    libelle: "1ère relance après un abandon d'achat",
    declencheur: "Part quand une personne a ouvert le paiement d'une formation sans le terminer.",
    sujet: 'Votre inscription à « {formation} » n’est pas terminée',
    corps:
      'Bonjour {prenom},\n\nVous avez commencé votre inscription à « {formation} » sans aller jusqu’au paiement. Si quelque chose vous a arrêté, répondez à ce message : on vous aide.\n\nLe bouton ci-dessous vous ramène à la formation.\n\n{ecole}',
    bouton: 'Reprendre mon inscription',
    delaiMinutes: 60,
    delaiReglable: true,
  },
  {
    type: 'ABANDON_2',
    libelle: "2ème relance après un abandon d'achat",
    declencheur: 'Part si le paiement n’est toujours pas fait après la première relance.',
    sujet: '« {formation} » vous attend toujours',
    corps:
      'Bonjour {prenom},\n\nVotre place dans « {formation} » vous attend toujours. Il suffit de reprendre votre inscription là où vous l’avez laissée.\n\n{ecole}',
    bouton: 'Voir la formation',
    delaiMinutes: JOUR,
    delaiReglable: true,
  },
  {
    type: 'INVITATION_NOUVEL',
    libelle: "Email d'invitation d'un nouvel apprenant",
    declencheur: "Part quand l'académie inscrit une personne qui n'a pas encore d'espace apprenant.",
    sujet: '{ecole} vous invite à suivre « {formation} »',
    corps:
      'Bonjour {prenom},\n\n{ecole} vous a inscrit à la formation « {formation} ». Le bouton ci-dessous l’ouvre directement.\n\nVous pourrez ensuite créer votre espace apprenant avec un mot de passe, pour retrouver toutes vos formations au même endroit.\n\n{ecole}',
    bouton: 'Ouvrir ma formation',
    delaiMinutes: 0,
    delaiReglable: true,
  },
  {
    type: 'INVITATION_EXISTANT',
    libelle: "Email d'invitation d'un apprenant existant",
    declencheur: "Part quand l'académie inscrit une personne qui a déjà son espace apprenant.",
    sujet: 'Une nouvelle formation vous attend : « {formation} »',
    corps:
      'Bonjour {prenom},\n\n{ecole} vient de vous ouvrir la formation « {formation} ». Elle apparaît déjà dans votre espace apprenant.\n\n{ecole}',
    bouton: 'Ouvrir ma formation',
    delaiMinutes: 0,
    delaiReglable: true,
  },
  {
    type: 'LECON_ACCESSIBLE',
    libelle: 'Email de leçon nouvellement accessible',
    declencheur: 'Part quand une leçon à ouverture différée devient accessible.',
    sujet: 'Nouvelle leçon ouverte : « {lecon} »',
    corps:
      'Bonjour {prenom},\n\nUne nouvelle leçon de « {formation} » vient de s’ouvrir : « {lecon} ».\n\nBonne lecture,\n{ecole}',
    bouton: 'Ouvrir la leçon',
    delaiMinutes: 0,
    delaiReglable: true,
  },
  {
    type: 'RECAPITULATIF',
    libelle: 'Email récapitulatif des formations en cours',
    declencheur: 'Part chaque lundi matin aux personnes qui ont une formation en cours.',
    sujet: 'Où en êtes-vous de vos formations ?',
    corps:
      'Bonjour {prenom},\n\nVoici où vous en êtes :\n\n{liste}\n\nUn quart d’heure cette semaine suffit pour avancer d’une leçon.\n\n{ecole}',
    bouton: 'Reprendre',
    delaiMinutes: 0,
    delaiReglable: false,
  },
  {
    type: 'MODIFICATION_ACCES',
    libelle: "Email de modification des accès à une formation",
    declencheur: "Part quand l'académie rouvre un accès ou change sa durée.",
    sujet: 'Votre accès à « {formation} » a changé',
    corps:
      'Bonjour {prenom},\n\nVotre accès à « {formation} » a été modifié. {date}\n\nLe bouton ci-dessous ouvre votre formation.\n\n{ecole}',
    bouton: 'Ouvrir ma formation',
    delaiMinutes: 0,
    delaiReglable: false,
  },
  {
    type: 'EXPIRATION_ACCES',
    libelle: "Email d'expiration des accès à une formation",
    declencheur: "Part le jour où l'accès à une formation à durée limitée prend fin.",
    sujet: 'Votre accès à « {formation} » a pris fin',
    corps:
      'Bonjour {prenom},\n\nVotre accès à « {formation} » a pris fin le {date}. Merci d’avoir suivi cette formation avec nous.\n\nPour prolonger votre accès, répondez simplement à ce message.\n\n{ecole}',
    bouton: '',
    delaiMinutes: 0,
    delaiReglable: true,
  },
  {
    type: 'DECROCHAGE_1',
    libelle: "1ère relance après le décrochage d'un apprenant",
    declencheur: "Part quand une personne n'a pas ouvert sa formation depuis le délai choisi.",
    sujet: '« {formation} » vous attend',
    corps:
      'Bonjour {prenom},\n\nCela fait quelques jours que vous n’avez pas ouvert « {formation} ». Votre progression est gardée : vous reprenez exactement où vous en étiez.\n\n{ecole}',
    bouton: 'Reprendre ma formation',
    delaiMinutes: 7 * JOUR,
    delaiReglable: true,
  },
  {
    type: 'DECROCHAGE_2',
    libelle: "2ème relance après le décrochage d'un apprenant",
    declencheur: "Part si la personne n'a toujours pas repris après la première relance.",
    sujet: 'On reprend « {formation} » ensemble ?',
    corps:
      'Bonjour {prenom},\n\nVous n’avez pas repris « {formation} » depuis un moment. Si quelque chose vous bloque, un contenu, le temps, une question, répondez à ce message : on trouve une solution avec vous.\n\n{ecole}',
    bouton: 'Reprendre ma formation',
    delaiMinutes: 14 * JOUR,
    delaiReglable: true,
  },
];

export const MODELE_PAR_TYPE = new Map(MODELES_PAR_DEFAUT.map((m) => [m.type, m]));

export interface DonneesEmail {
  prenom?: string | null;
  formation?: string | null;
  lecon?: string | null;
  ecole?: string | null;
  lien?: string | null;
  date?: string | null;
  liste?: string | null;
}

/** Remplace les mots entre accolades. Un prénom absent ne laisse pas « Bonjour , ». */
export function remplir(gabarit: string, d: DonneesEmail): string {
  const valeurs: Record<string, string> = {
    prenom: (d.prenom ?? '').trim(),
    formation: (d.formation ?? '').trim(),
    lecon: (d.lecon ?? '').trim(),
    ecole: (d.ecole ?? '').trim(),
    lien: (d.lien ?? '').trim(),
    date: (d.date ?? '').trim(),
    liste: (d.liste ?? '').trim(),
  };
  return gabarit
    .replace(/\{(prenom|formation|lecon|ecole|lien|date|liste)\}/g, (_, k: string) => valeurs[k] ?? '')
    .replace(/ +,/g, ',')
    .replace(/[ \t]+\n/g, '\n');
}

/** Une date lisible, en français, sans l'heure. */
export function dateFr(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
}
