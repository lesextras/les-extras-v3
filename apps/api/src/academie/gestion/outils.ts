import { createHash, randomBytes, randomInt } from 'node:crypto';

/**
 * OUTILS PURS DE L'ADMINISTRATION D'UN ORGANISME DE FORMATION.
 *
 * Rien ici ne lit la base : ce sont les calculs qui décident d'une pièce
 * réglementaire (heures, demi-journées, numéros, montants). Ils sont testés
 * seuls, parce qu'une erreur ici ne se voit pas à l'écran : elle s'imprime sur
 * une attestation, un BPF ou une facture.
 */

export const FUSEAU = 'Europe/Paris';

/** Un lien personnel : 24 octets aléatoires, lisibles dans une adresse. */
export function nouveauJeton(): string {
  return randomBytes(24).toString('base64url');
}

/** Un code à six chiffres, jamais commençant par zéro (il se dicte mieux). */
export function codeSixChiffres(): string {
  return String(randomInt(100000, 1000000));
}

export function empreinte(...parties: (string | number | null | undefined)[]): string {
  return createHash('sha256').update(parties.map((p) => String(p ?? '')).join('␟')).digest('hex');
}

/** Le jour calendaire À PARIS, au format AAAA-MM-JJ. */
export function jourParis(d: Date): string {
  const f = new Intl.DateTimeFormat('fr-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' });
  return f.format(d);
}

/**
 * L'heure (0-23) À PARIS.
 *
 * ⚠ Par `formatToParts`, jamais par `format` : en français, une heure seule
 * s'écrit « 09 h », et `Number('09 h')` vaut NaN. Toutes les séances
 * tombaient alors l'après-midi, sans la moindre erreur.
 */
export function heureParis(d: Date): number {
  const f = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, hour: '2-digit', hourCycle: 'h23' });
  return Number(f.formatToParts(d).find((p) => p.type === 'hour')?.value ?? 0);
}

/**
 * La demi-journée d'un instant : avant 13 h à Paris, le matin.
 *
 * ⚠ 13 h et pas midi : une séance de 11 h à 12 h 30 appartient au matin, et
 * l'émargement se signe par demi-journée (c'est ce que les financeurs lisent).
 */
export function demiJournee(d: Date): 'MORNING' | 'AFTERNOON' {
  return heureParis(d) < 13 ? 'MORNING' : 'AFTERNOON';
}

/** La date d'une demi-journée telle qu'elle est rangée en base : minuit UTC du jour de Paris. */
export function dateDeSlot(d: Date): Date {
  return new Date(`${jourParis(d)}T00:00:00.000Z`);
}

export function heuresEntre(debut: Date, fin: Date): number {
  const h = (fin.getTime() - debut.getTime()) / 3_600_000;
  return h > 0 ? Math.round(h * 100) / 100 : 0;
}

export interface CreneauLite {
  id?: string;
  debut: Date;
  fin: Date;
  formateurId?: string | null;
  salleId?: string | null;
}

/** Deux créneaux se chevauchent-ils ? (bornes exclues : 10-12 et 12-14 ne se gênent pas) */
export function chevauche(a: { debut: Date; fin: Date }, b: { debut: Date; fin: Date }): boolean {
  return a.debut.getTime() < b.fin.getTime() && b.debut.getTime() < a.fin.getTime();
}

/**
 * Les demi-journées d'un planning, avec leurs heures.
 *
 * C'est la table de conversion entre ce qui se SIGNE (une demi-journée) et ce
 * qui se DÉCLARE (des heures) : l'attestation, le certificat de réalisation et
 * le BPF comptent des heures, la feuille d'émargement compte des demi-journées.
 */
export function demiJourneesDuPlanning(creneaux: CreneauLite[]): { cle: string; slotDate: Date; slot: 'MORNING' | 'AFTERNOON'; heures: number }[] {
  const table = new Map<string, { slotDate: Date; slot: 'MORNING' | 'AFTERNOON'; heures: number }>();
  for (const c of creneaux) {
    const slot = demiJournee(c.debut);
    const slotDate = dateDeSlot(c.debut);
    const cle = `${slotDate.toISOString().slice(0, 10)}:${slot}`;
    const ligne = table.get(cle) ?? { slotDate, slot, heures: 0 };
    ligne.heures = Math.round((ligne.heures + heuresEntre(c.debut, c.fin)) * 100) / 100;
    table.set(cle, ligne);
  }
  return [...table.entries()]
    .map(([cle, v]) => ({ cle, ...v }))
    .sort((x, y) => x.cle.localeCompare(y.cle));
}

export function cleSlot(slotDate: Date, slot: string): string {
  return `${slotDate.toISOString().slice(0, 10)}:${slot}`;
}

/**
 * LES HEURES RÉALISÉES D'UN STAGIAIRE.
 *
 * On part des demi-journées où il est présent (signées ou déclarées) et on
 * leur donne les heures du planning. Sans planning, chaque demi-journée vaut
 * la durée prévue divisée par le nombre de demi-journées émargées au total,
 * faute de mieux, et le résultat est marqué ESTIMÉ.
 */
export function heuresRealisees(
  presences: { slotDate: Date; slot: string; present: boolean }[],
  planning: { cle: string; heures: number }[],
  dureePrevue: number | null,
  /** Nombre de demi-journées émargées sur la session (tous stagiaires confondus), faute de planning. */
  demiJourneesSession = 0,
): { heures: number; estime: boolean } {
  const presentes = presences.filter((p) => p.present);
  if (!presentes.length) return { heures: 0, estime: false };
  if (planning.length) {
    const table = new Map(planning.map((p) => [p.cle, p.heures]));
    let total = 0;
    let manquantes = 0;
    for (const p of presentes) {
      const h = table.get(cleSlot(p.slotDate, p.slot));
      if (h === undefined) manquantes++;
      else total += h;
    }
    if (!manquantes) return { heures: arrondi2(total), estime: false };
    const moyenne = planning.reduce((t, p) => t + p.heures, 0) / planning.length;
    return { heures: arrondi2(total + manquantes * moyenne), estime: true };
  }
  if (!dureePrevue) return { heures: 0, estime: true };
  const base = Math.max(presentes.length, demiJourneesSession);
  return { heures: arrondi2(dureePrevue * Math.min(1, presentes.length / base)), estime: true };
}

export function arrondi2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* --------------------------------------------------------------- facturation */

export interface LigneFacture {
  libelle: string;
  quantite: number;
  prixUnitaireHt: number;
  tauxTva: number;
}

/** Totaux d'une facture, arrondis ligne par ligne comme sur le document. */
export function totaux(lignes: LigneFacture[]): { totalHt: number; totalTva: number; totalTtc: number } {
  let ht = 0;
  let tva = 0;
  for (const l of lignes) {
    const montant = arrondi2(l.quantite * l.prixUnitaireHt);
    ht += montant;
    tva += arrondi2((montant * l.tauxTva) / 100);
  }
  ht = arrondi2(ht);
  tva = arrondi2(tva);
  return { totalHt: ht, totalTva: tva, totalTtc: arrondi2(ht + tva) };
}

/** Le préfixe d'une série de numérotation. */
export function prefixeSerie(type: 'FACTURE' | 'AVOIR' | 'DEVIS', annee: number): string {
  return `${type === 'FACTURE' ? 'F' : type === 'AVOIR' ? 'AV' : 'D'}${annee}`;
}

/** « F2026-00012 » : cinq chiffres, sans trou (le compteur ne rend jamais un numéro). */
export function numero(type: 'FACTURE' | 'AVOIR' | 'DEVIS', annee: number, rang: number): string {
  return `${prefixeSerie(type, annee)}-${String(rang).padStart(5, '0')}`;
}

export const MENTION_EXONERATION = 'Exonération de TVA, article 261-4-4° a du CGI';

/* -------------------------------------------------------- positionnement */

/** Les objectifs d'une formation, un par ligne, sans puces ni numéros. */
export function objectifsEnListe(texte: string | null | undefined): string[] {
  if (!texte) return [];
  return texte
    .split(/\r?\n|;/)
    .map((l) => l.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, '').trim())
    .filter((l) => l.length > 2)
    .slice(0, 12);
}

/** Moyenne d'un positionnement { objectif: note 0-4 }, ou null. */
export function moyennePositionnement(p: unknown): number | null {
  if (!p || typeof p !== 'object') return null;
  const notes = Object.values(p as Record<string, unknown>).filter((v): v is number => typeof v === 'number' && v >= 0 && v <= 4);
  if (!notes.length) return null;
  return arrondi2(notes.reduce((t, n) => t + n, 0) / notes.length);
}

/** Échappe une chaîne pour un fichier CSV séparé par des points-virgules. */
export function csv(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * UN TRACÉ DE SIGNATURE ACCEPTABLE.
 *
 * Le navigateur envoie un chemin SVG normalisé dans une boîte de 300 × 100 :
 * seulement des commandes M et L suivies de nombres. On refuse tout le reste —
 * ce texte finit dessiné dans un PDF, il ne doit rien pouvoir y porter
 * d'autre qu'un trait — et un tracé vide ou minuscule (un clic n'est pas une
 * signature).
 */
export function traceValide(trace: unknown): string | null {
  if (typeof trace !== 'string') return null;
  const t = trace.trim();
  if (t.length < 20 || t.length > 20_000) return null;
  if (!/^[ML0-9.\s-]+$/.test(t)) return null;
  const points = t.match(/-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g) ?? [];
  if (points.length < 6) return null;
  return t;
}
