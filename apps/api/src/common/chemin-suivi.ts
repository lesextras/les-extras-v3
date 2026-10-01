/**
 * LE SUIVI DES ÉTAPES DU CHEMIN (association et académie), 01/10/2026.
 *
 * Les deux chemins gardent leurs étapes cochées dans `etapesFaites` (liste de
 * slugs). Les étapes ajoutées le 01/10/2026 ont besoin de deux choses de plus,
 * rangées dans la colonne JSON `etapesSuivi` (nullable, additive) :
 *  - la DATE où l'étape a été cochée : une étape « chaque année » ne compte
 *    comme faite que si elle a été cochée pendant l'année civile en cours
 *    (heure de Paris). Au 1er janvier, elle repasse d'elle-même dans « À faire ».
 *  - le drapeau « pas concerné » : une étape « selon ton activité » peut être
 *    écartée. Elle compte alors comme faite, avec son badge.
 *
 * Une étape ancienne cochée avant cette date n'a pas d'entrée dans le suivi :
 * elle reste faite, rien ne change pour elle.
 */

export interface SuiviEtape {
  /** Date ISO où l'étape a été cochée. */
  le: string;
  pasConcerne?: boolean;
}

export type SuiviEtapes = Record<string, SuiviEtape>;

export interface RegleEtape {
  slug: string;
  chaqueAnnee?: boolean;
  peutNePasConcerner?: boolean;
}

export interface EtatEtape {
  faite: boolean;
  pasConcerne: boolean;
  /** Date ISO de la coche, si on la connaît. */
  faiteLe: string | null;
}

/** Lit la colonne JSON telle que Prisma la rend, sans jamais lever. */
export function lireSuivi(brut: unknown): SuiviEtapes {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return {};
  const suivi: SuiviEtapes = {};
  for (const [slug, valeur] of Object.entries(brut as Record<string, unknown>)) {
    if (!valeur || typeof valeur !== 'object') continue;
    const v = valeur as { le?: unknown; pasConcerne?: unknown };
    if (typeof v.le !== 'string' || Number.isNaN(Date.parse(v.le))) continue;
    suivi[slug] = v.pasConcerne === true ? { le: v.le, pasConcerne: true } : { le: v.le };
  }
  return suivi;
}

/** L'année civile à Paris : une coche du 31 décembre à 23 h 30 compte pour cette année-là. */
export function anneeParis(d: Date): number {
  return Number(new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric' }).format(d));
}

export function etatEtape(regle: RegleEtape, faites: readonly string[], suivi: SuiviEtapes, maintenant: Date = new Date()): EtatEtape {
  if (!faites.includes(regle.slug)) return { faite: false, pasConcerne: false, faiteLe: null };
  const s = suivi[regle.slug];
  if (regle.chaqueAnnee) {
    // Sans date, ou cochée une autre année : à refaire.
    if (!s || anneeParis(new Date(s.le)) !== anneeParis(maintenant)) return { faite: false, pasConcerne: false, faiteLe: s?.le ?? null };
  }
  return { faite: true, pasConcerne: Boolean(regle.peutNePasConcerner && s?.pasConcerne), faiteLe: s?.le ?? null };
}

/**
 * Coche ou décoche une étape. `pasConcerne` n'a de sens qu'avec `faite` et
 * pour une étape qui l'autorise : l'appelant le vérifie avant.
 */
export function marquerSuivi(
  faites: readonly string[],
  suivi: SuiviEtapes,
  slug: string,
  faite: boolean,
  pasConcerne: boolean,
  maintenant: Date = new Date(),
): { faites: string[]; suivi: SuiviEtapes } {
  const ensemble = new Set(faites);
  const suite: SuiviEtapes = { ...suivi };
  if (faite) {
    ensemble.add(slug);
    suite[slug] = pasConcerne ? { le: maintenant.toISOString(), pasConcerne: true } : { le: maintenant.toISOString() };
  } else {
    ensemble.delete(slug);
    delete suite[slug];
  }
  return { faites: [...ensemble], suivi: suite };
}
