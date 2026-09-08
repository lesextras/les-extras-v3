/**
 * L'ÉCOLE EN LIGNE — les types partagés par les écrans de l'académie.
 *
 * Copie fidèle de ce que l'API renvoie (apps/api/src/ecole/). Ce fichier est
 * importé par du code client : rien que des types, des constantes et des
 * fonctions pures.
 */

export type StatutCours = 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
export type NiveauCours = 'TOUS' | 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
export type TypeLecon = 'TEXTE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'QUIZ' | 'DEVOIR' | 'LIVE';
export type TypeQuestion = 'CHOIX_UNIQUE' | 'CHOIX_MULTIPLE' | 'VRAI_FAUX';
export type StatutVente = 'EN_ATTENTE' | 'PAYEE' | 'REMBOURSEE' | 'ANNULEE';
export type TypeRemise = 'POURCENTAGE' | 'MONTANT';

export interface QuestionQuiz {
  id: string;
  enonce: string;
  type: TypeQuestion;
  options: string[];
  bonnes: number[];
  explication?: string;
  points: number;
}

export interface Quiz {
  noteMinimale: number;
  questions: QuestionQuiz[];
}

export interface Lecon {
  id: string;
  titre: string;
  type: TypeLecon;
  contenu: string | null;
  videoUrl: string | null;
  fichierUrl: string | null;
  dureeMinutes: number;
  apercu: boolean;
  quiz: Quiz | null;
  ordre: number;
}

export interface Chapitre {
  id: string;
  titre: string;
  resume: string | null;
  ordre: number;
  lecons: Lecon[];
}

export interface CoursComplet {
  id: string;
  titre: string;
  slug: string;
  sousTitre: string | null;
  description: string | null;
  imageUrl: string | null;
  bandeAnnonceUrl: string | null;
  niveau: NiveauCours;
  categorie: string | null;
  objectifs: string[];
  prerequis: string | null;
  pourQui: string | null;
  dureeMinutes: number;
  dureeCalculee: number;
  prixCents: number;
  prixBarreCents: number | null;
  gratuit: boolean;
  certificat: boolean;
  statut: StatutCours;
  publieLe: string | null;
  modifieLe: string;
  adresse: string;
  chapitres: Chapitre[];
}

export interface CoursResume {
  id: string;
  titre: string;
  slug: string;
  sousTitre: string | null;
  imageUrl: string | null;
  statut: StatutCours;
  gratuit: boolean;
  prixCents: number;
  nbChapitres: number;
  nbLecons: number;
  nbApprenants: number;
  dureeMinutes: number;
  modifieLe: string;
}

export interface Apprenant {
  id: string;
  email: string;
  nom: string | null;
  cours: { id: string; titre: string };
  statut: 'ACTIVE' | 'SUSPENDUE' | 'TERMINEE';
  progression: number;
  termineLe: string | null;
  certificatEmisLe: string | null;
  derniereVisite: string | null;
  inscritLe: string;
  lien: string;
}

export interface Vente {
  id: string;
  email: string;
  nom: string | null;
  cours: { id: string; titre: string } | null;
  packId: string | null;
  montantCents: number;
  codePromo: string | null;
  affiliation: string | null;
  statut: StatutVente;
  moyen: string | null;
  le: string;
}

export interface Pack {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  prixCents: number;
  coursIds: string[];
  statut: StatutCours;
}

export interface Promo {
  id: string;
  code: string;
  type: TypeRemise;
  valeur: number;
  coursIds: string[];
  debuteLe: string | null;
  expireLe: string | null;
  usageMax: number | null;
  usages: number;
  actif: boolean;
}

export interface Classe {
  id: string;
  titre: string;
  description: string | null;
  debut: string;
  fin: string | null;
  lien: string | null;
  placesMax: number | null;
  coursId: string | null;
  cours?: { id: string; titre: string } | null;
}

export interface Vitrine {
  id: string;
  nom: string;
  slug: string;
  sousTitre: string | null;
  presentation: string | null;
  logoUrl: string | null;
  banniereUrl: string | null;
  couleur: string;
  contactEmail: string | null;
  cgv: string | null;
  mentions: string | null;
  publiee: boolean;
}

export interface Affilie {
  id: string;
  nom: string;
  email: string;
  code: string;
  commissionPourcent: number;
  ventes: number;
  gainsCents: number;
  actif: boolean;
}

export interface Statistiques {
  coursPublies: number;
  coursTotal: number;
  apprenants: number;
  apprenantsRecents: number;
  termines: number;
  progressionMoyenne: number;
  ventes: number;
  chiffreCents: number;
  chiffreMoisCents: number;
  classesAVenir: number;
  parCours: {
    id: string;
    titre: string;
    statut: StatutCours;
    apprenants: number;
    termines: number;
    progressionMoyenne: number;
    chiffreCents: number;
  }[];
  mois: { mois: string; chiffreCents: number; ventes: number }[];
}

/* ------------------------------------------------------------------ libellés */

export const NOM_TYPE_LECON: Record<TypeLecon, string> = {
  TEXTE: 'Texte',
  VIDEO: 'Vidéo',
  AUDIO: 'Audio',
  DOCUMENT: 'Document',
  QUIZ: 'Quiz',
  DEVOIR: 'Devoir',
  LIVE: 'Classe en direct',
};

export const NOM_NIVEAU: Record<NiveauCours, string> = {
  TOUS: 'Tous niveaux',
  DEBUTANT: 'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE: 'Avancé',
};

export const NOM_STATUT_COURS: Record<StatutCours, string> = {
  BROUILLON: 'Brouillon',
  PUBLIE: 'Publié',
  ARCHIVE: 'Archivé',
};

export const NOM_STATUT_VENTE: Record<StatutVente, string> = {
  EN_ATTENTE: 'En attente',
  PAYEE: 'Payée',
  REMBOURSEE: 'Remboursée',
  ANNULEE: 'Annulée',
};

/* -------------------------------------------------------------------- outils */

export function euros(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

export function duree(minutes: number) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}

export function dateCourte(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateEtHeure(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Un identifiant court pour une nouvelle question de quiz. */
export function nouvelIdentifiant() {
  return `q${Math.random().toString(36).slice(2, 9)}`;
}

/** Les couleurs de l'académie, utilisées en style en ligne. */
export const VERT = {
  encre: '#12312A',
  texte: '#334A42',
  sourdine: '#5E7A6E',
  bord: '#DDEBE4',
  fond: '#F2F7F5',
  clair: '#E3F5EC',
  plein: '#1E9E6A',
  fonce: '#0F5F3E',
  fonceSurvol: '#0B4A30',
};
