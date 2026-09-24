/**
 * Outils de calendrier de « Mon agenda » (24/09/2026) : dates, fenêtres
 * d'affichage et placement des événements qui se chevauchent, comme Outlook.
 * Fichier sans React : il se teste seul (lib/__tests__/agenda-outils.test.ts).
 */

export type Vue = 'jour' | 'semaineTravail' | 'semaine' | 'mois' | 'liste';

export type Niveau = 'DISPONIBILITES' | 'TITRES' | 'DETAILS' | 'MODIFICATION';

export interface EvenementBrut {
  id: string;
  source: string;
  rendezVousId: string | null;
  titre: string;
  detail: string | null;
  lieu: string | null;
  lien: string | null;
  debut: string;
  fin: string | null;
  journeeEntiere: boolean;
  categorie: string | null;
  participants: string[];
  modifiable: boolean;
  href: string | null;
  par: string | null;
}

/** Un événement prêt à dessiner : dates réelles, agenda d'origine, couleur. */
export interface Evenement extends Omit<EvenementBrut, 'debut' | 'fin'> {
  debut: Date;
  fin: Date;
  /** « moi » ou l'identifiant du partage. */
  agenda: string;
  couleur: string;
  nomAgenda: string;
}

export const JOUR_MS = 86_400_000;
export const MIN_MS = 60_000;

export function debutDuJour(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function ajouterJours(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Lundi de la semaine (la semaine française commence le lundi). */
export function lundi(d: Date): Date {
  const x = debutDuJour(d);
  const j = x.getDay();
  return ajouterJours(x, j === 0 ? -6 : 1 - j);
}

export function memeJour(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Les jours affichés et la fenêtre à demander à l'API. */
export function fenetre(vue: Vue, ref: Date): { jours: Date[]; du: Date; au: Date } {
  if (vue === 'jour') {
    const d = debutDuJour(ref);
    return { jours: [d], du: d, au: ajouterJours(d, 1) };
  }
  if (vue === 'semaine' || vue === 'semaineTravail') {
    const l = lundi(ref);
    const n = vue === 'semaine' ? 7 : 5;
    return { jours: Array.from({ length: n }, (_, i) => ajouterJours(l, i)), du: l, au: ajouterJours(l, 7) };
  }
  if (vue === 'mois') {
    const premier = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const debut = lundi(premier);
    const jours = Array.from({ length: 42 }, (_, i) => ajouterJours(debut, i));
    return { jours, du: debut, au: ajouterJours(debut, 42) };
  }
  const d = debutDuJour(ref);
  return { jours: Array.from({ length: 31 }, (_, i) => ajouterJours(d, i)), du: d, au: ajouterJours(d, 31) };
}

/** Le pas des flèches « précédent / suivant ». */
export function decaler(vue: Vue, ref: Date, sens: 1 | -1): Date {
  if (vue === 'jour') return ajouterJours(ref, sens);
  if (vue === 'semaine' || vue === 'semaineTravail') return ajouterJours(ref, 7 * sens);
  if (vue === 'mois') return new Date(ref.getFullYear(), ref.getMonth() + sens, 1);
  return ajouterJours(ref, 31 * sens);
}

const F_JOUR = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const F_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const F_COURT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
export const F_HEURE = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
export const F_JOUR_COURT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' });
export const F_JOUR_LONG = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export function titrePeriode(vue: Vue, ref: Date): string {
  const { jours } = fenetre(vue, ref);
  if (vue === 'jour') return majuscule(F_JOUR.format(ref));
  if (vue === 'mois') return majuscule(F_MOIS.format(ref));
  const a = jours[0];
  const b = jours[jours.length - 1];
  return `${F_COURT.format(a)} au ${F_COURT.format(b)} ${b.getFullYear()}`;
}

export function majuscule(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** « 9 h 30 – 10 h 30 », ou « Toute la journée ». */
export function plage(e: Pick<Evenement, 'debut' | 'fin' | 'journeeEntiere'>): string {
  if (e.journeeEntiere) {
    const jours = Math.round((debutDuJour(e.fin).getTime() - debutDuJour(e.debut).getTime()) / JOUR_MS);
    return jours > 1 ? `Du ${F_COURT.format(e.debut)} au ${F_COURT.format(ajouterJours(e.fin, -1))}` : 'Toute la journée';
  }
  return `${F_HEURE.format(e.debut)} à ${F_HEURE.format(e.fin)}`;
}

/**
 * Transforme un événement de l'API en événement dessinable. Sans fin, un
 * rendez-vous dure une heure ; une journée entière sans fin couvre sa journée.
 */
export function preparer(b: EvenementBrut, agenda: string, couleur: string, nomAgenda: string): Evenement {
  const debut = new Date(b.debut);
  let fin = b.fin ? new Date(b.fin) : null;
  if (b.journeeEntiere) {
    const d = debutDuJour(debut);
    const f = fin ? debutDuJour(fin) : d;
    return { ...b, debut: d, fin: ajouterJours(f, 1), agenda, couleur, nomAgenda };
  }
  if (!fin || fin <= debut) fin = new Date(debut.getTime() + 60 * MIN_MS);
  return { ...b, debut, fin, agenda, couleur, nomAgenda };
}

/** L'événement touche-t-il ce jour ? */
export function toucheLeJour(e: Pick<Evenement, 'debut' | 'fin'>, jour: Date): boolean {
  const d = debutDuJour(jour).getTime();
  return e.debut.getTime() < d + JOUR_MS && e.fin.getTime() > d;
}

/** Sur plusieurs jours ou journée entière : va dans la bande du haut. */
export function dansLaBande(e: Pick<Evenement, 'debut' | 'fin' | 'journeeEntiere'>): boolean {
  return e.journeeEntiere || e.fin.getTime() - e.debut.getTime() >= JOUR_MS;
}

export interface Place {
  e: Evenement;
  /** Minutes depuis minuit, bornées au jour. */
  haut: number;
  bas: number;
  colonne: number;
  colonnes: number;
}

/**
 * LE PLACEMENT DES CHEVAUCHEMENTS, COMME OUTLOOK.
 * Les événements qui se touchent forment un groupe ; dans un groupe, chacun
 * prend la première colonne libre, et tout le groupe se partage la largeur.
 */
export function placer(evenements: Evenement[], jour: Date): Place[] {
  const d0 = debutDuJour(jour).getTime();
  const places: Place[] = evenements
    .filter((e) => !dansLaBande(e) && toucheLeJour(e, jour))
    .map((e) => ({
      e,
      haut: Math.max(0, (e.debut.getTime() - d0) / MIN_MS),
      bas: Math.min(1440, (e.fin.getTime() - d0) / MIN_MS),
      colonne: 0,
      colonnes: 1,
    }))
    .sort((a, b) => a.haut - b.haut || b.bas - a.bas);

  let groupe: Place[] = [];
  let finGroupe = -1;
  const fermer = () => {
    const n = Math.max(1, ...groupe.map((p) => p.colonne + 1));
    for (const p of groupe) p.colonnes = n;
    groupe = [];
  };
  for (const p of places) {
    if (groupe.length && p.haut >= finGroupe) fermer();
    const prises = new Set(groupe.filter((q) => q.bas > p.haut).map((q) => q.colonne));
    let c = 0;
    while (prises.has(c)) c++;
    p.colonne = c;
    groupe.push(p);
    finGroupe = Math.max(finGroupe, p.bas);
  }
  if (groupe.length) fermer();
  return places;
}

/** Arrondit une durée en minutes au pas de la grille. */
export function arrondir(minutes: number, pas = 15): number {
  return Math.round(minutes / pas) * pas;
}

export function hexAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/** Pour les champs `<input type="date">` et `type="time"`, en heure locale. */
export function versDateLocale(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function versHeureLocale(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function depuisLocal(date: string, heure: string): Date {
  const [a, m, j] = date.split('-').map(Number);
  const [h, mi] = (heure || '00:00').split(':').map(Number);
  return new Date(a, (m || 1) - 1, j || 1, h || 0, mi || 0, 0, 0);
}

export const LIBELLE_SOURCE: Record<string, string> = {
  RENDEZ_VOUS: 'Rendez-vous',
  RESERVATION: 'Réservation',
  RESERVATION_EN_LIGNE: 'Réservation en ligne',
  VISIO: 'Visio',
  MISSION: 'Mission de renfort',
  CRENEAU: 'Créneau du planning',
  OCCUPE: 'Occupé',
  SESSION: 'Session de formation',
  CLASSE_VIRTUELLE: 'Classe virtuelle',
  FORMULAIRE: 'Formulaire',
  REPONSE_FORMULAIRE: 'Réponse à un formulaire',
  DOSSIER: 'Dossier',
  PIECE: 'Pièce à renouveler',
  ACTION: 'Action',
};

export const LIBELLE_CATEGORIE: Record<string, string> = {
  RENDEZ_VOUS: 'Rendez-vous',
  REUNION: 'Réunion',
  APPEL: 'Appel',
  VISITE: 'Visite',
  ECHEANCE: 'Échéance',
  AUTRE: 'Autre',
};

export const NIVEAUX: { valeur: Niveau; titre: string; aide: string }[] = [
  { valeur: 'DISPONIBILITES', titre: 'Disponibilités', aide: 'Libre ou occupé, sans aucun détail.' },
  { valeur: 'TITRES', titre: 'Titres et lieux', aide: 'Le titre, l’horaire et le lieu de chaque événement.' },
  { valeur: 'DETAILS', titre: 'Tous les détails', aide: 'Descriptions, participants, réservations détaillées.' },
  { valeur: 'MODIFICATION', titre: 'Détails et modification', aide: 'Tout voir, et ajouter, déplacer ou supprimer des rendez-vous.' },
];

export const LIBELLE_NIVEAU: Record<Niveau, string> = {
  DISPONIBILITES: 'Disponibilités',
  TITRES: 'Titres et lieux',
  DETAILS: 'Tous les détails',
  MODIFICATION: 'Modification',
};

export const COULEURS = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#475569'];
