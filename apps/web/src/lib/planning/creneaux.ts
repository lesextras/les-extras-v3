// De la lecture d'un planning aux créneaux d'un agenda.
//
// `lib/planning/lecture` sait déjà lire un document : il en sort des lignes
// « personne / date / début / fin ». Pour qu'une ligne devienne un créneau
// d'agenda, il manque un instant. « 01/09/2026 » et « 9h » n'en sont pas un
// tant qu'on n'a pas dit dans quel fuseau ces heures ont été écrites — et un
// planning d'établissement français est écrit à l'heure de Paris, pas à celle
// du navigateur qui le relit. Un poste de nuit, lui, finit le lendemain.
//
// C'est tout ce que fait ce fichier. Il ne parle à personne, ne rend rien à
// l'écran, et c'est pour cela qu'il se teste.

import { enMinutes, normaliser, type LignePlanning } from './lecture';

export interface CreneauImportable {
  /** Nom lu dans le document — sert à trier, jamais envoyé à l'API. */
  personne: string;
  titre: string;
  /** Instant ISO, décalage de Paris compris. */
  debut: string;
  fin: string;
  /** Ce que la personne relit avant de valider : « lun. 1 sept. · 9h00 → 17h00 ». */
  lisible: string;
  note?: string;
}

export interface LigneIgnoree {
  personne: string;
  date: string;
  raison: string;
}

export interface Conversion {
  creneaux: CreneauImportable[];
  ignorees: LigneIgnoree[];
}

/** Jour ISO (AAAA-MM-JJ) à partir des écritures courantes d'un planning. */
export function jourIso(brut: string): string | null {
  const t = String(brut ?? '').trim();
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }
  const fr = t.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (fr) {
    const annee = fr[3].length === 2 ? 2000 + Number(fr[3]) : Number(fr[3]);
    const mois = Number(fr[2]);
    const jour = Number(fr[1]);
    if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
    return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
  }
  return null;
}

/** Le lendemain d'un jour ISO. */
export function jourSuivant(jour: string): string {
  const [a, m, j] = jour.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1, j + 1));
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

/**
 * Décalage de Paris (« +02:00 » l'été, « +01:00 » l'hiver) pour un jour donné.
 *
 * On ne peut pas coder « +01:00 » en dur : un planning de juillet importé en
 * décembre serait décalé d'une heure, et une heure d'écart sur un poste de
 * nuit, c'est un dépassement de plafond qui apparaît ou qui disparaît.
 *
 * L'instant servant à interroger le fuseau est construit en UTC à partir de
 * l'heure locale : à moins d'une heure près des deux dimanches de bascule,
 * c'est exact, et ces deux nuits-là un planning est de toute façon relu.
 */
export function decalageParis(jour: string, minutes: number): string {
  const [a, m, j] = jour.split('-').map(Number);
  const approx = new Date(Date.UTC(a, m - 1, j, Math.floor(minutes / 60), minutes % 60));
  if (Number.isNaN(approx.getTime())) return '+01:00';
  let nom = 'GMT+01:00';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Paris',
      timeZoneName: 'longOffset',
    }).formatToParts(approx);
    nom = parts.find((p) => p.type === 'timeZoneName')?.value ?? nom;
  } catch {
    // Environnement sans données de fuseau : l'heure d'hiver est le défaut.
  }
  const trouve = nom.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
  if (!trouve) return '+01:00';
  const signe = trouve[1];
  const heures = trouve[2].padStart(2, '0');
  const mins = (trouve[3] ?? '00').padStart(2, '0');
  return `${signe}${heures}:${mins}`;
}

/** Minutes depuis minuit → « 09:30 ». */
function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const JOUR_LISIBLE = { weekday: 'short', day: 'numeric', month: 'short' } as const;

/** Les personnes nommées dans un document, dans l'ordre alphabétique. */
export function personnes(lignes: LignePlanning[]): string[] {
  const vues = new Map<string, string>();
  for (const l of lignes) {
    const cle = normaliser(l.personne);
    if (cle && !vues.has(cle)) vues.set(cle, l.personne);
  }
  return [...vues.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}

/**
 * Les lignes d'une personne deviennent des créneaux datés.
 *
 * Rien n'est deviné : une ligne sans horaire lisible n'est pas transformée en
 * journée de sept heures, elle est écartée et dite. Les absences non plus ne
 * deviennent pas des créneaux — un congé n'est pas une intervention.
 */
export function enCreneaux(lignes: LignePlanning[], personne?: string): Conversion {
  const cible = personne ? normaliser(personne) : null;
  const creneaux: CreneauImportable[] = [];
  const ignorees: LigneIgnoree[] = [];

  for (const l of lignes) {
    if (cible && normaliser(l.personne) !== cible) continue;

    if (l.estAbsence) {
      ignorees.push({
        personne: l.personne,
        date: l.date,
        raison: l.type ? `absence, ${l.type}` : 'absence',
      });
      continue;
    }

    const jour = jourIso(l.date);
    if (!jour) {
      ignorees.push({ personne: l.personne, date: l.date, raison: 'date illisible' });
      continue;
    }

    const d = l.debut ? enMinutes(l.debut) : null;
    const f = l.fin ? enMinutes(l.fin) : null;
    if (d === null || f === null) {
      ignorees.push({
        personne: l.personne,
        date: l.date,
        raison: 'pas d’heure de début et de fin',
      });
      continue;
    }

    // Un poste de nuit finit le lendemain : 21 h → 7 h dure dix heures.
    const jourFin = f <= d ? jourSuivant(jour) : jour;
    const debut = `${jour}T${hhmm(d)}:00${decalageParis(jour, d)}`;
    const fin = `${jourFin}T${hhmm(f)}:00${decalageParis(jourFin, f)}`;

    let quand = `${jour} ${hhmm(d)}`;
    try {
      quand = new Intl.DateTimeFormat('fr-FR', {
        ...JOUR_LISIBLE,
        timeZone: 'Europe/Paris',
      }).format(new Date(debut));
    } catch {
      // On garde la forme brute plutôt que de perdre la ligne.
    }

    creneaux.push({
      personne: l.personne,
      titre: l.type?.trim() || 'Créneau',
      debut,
      fin,
      lisible: `${quand} · ${hhmm(d).replace(':', 'h')} → ${hhmm(f).replace(':', 'h')}`,
      note: `Importé depuis un planning${l.type ? `, ${l.type}` : ''}`,
    });
  }

  return { creneaux, ignorees };
}
