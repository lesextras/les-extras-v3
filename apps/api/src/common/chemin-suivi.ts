/**
 * LE SUIVI DES ÉTAPES DU CHEMIN (association et académie), 01/10/2026.
 *
 * Les deux chemins gardent leurs étapes cochées dans `etapesFaites` (liste de
 * slugs). Les étapes ajoutées le 01/10/2026 ont besoin de plus, rangé dans la
 * colonne JSON `etapesSuivi` (nullable, additive), une entrée par slug :
 *  - `le` : la DATE où l'étape a été cochée ;
 *  - `pasConcerne` : l'étape est écartée. Elle compte alors comme faite, avec
 *    son badge, et le reste d'une année sur l'autre ;
 *  - `cycle` : pour une étape « chaque année », l'année pour laquelle elle a
 *    été faite (« 2026 ») ;
 *  - `date` : pour une étape annuelle dont la structure choisit la date (la
 *    date de l'AG fixée par les statuts), cette date au format AAAA-MM-JJ.
 *    Elle reste quand on décoche l'étape.
 *
 * LE CYCLE D'UNE ÉTAPE ANNUELLE. Son cycle, c'est l'année de sa prochaine
 * échéance (la date choisie, sinon la date fixe de la loi). Une fois cette
 * date passée ET l'étape faite pour ce cycle, elle passe d'elle-même au cycle
 * suivant (« 2027 ») et revient dans « À faire ». Sans date, le cycle est
 * l'année civile (heure de Paris) : l'étape revient au 1er janvier.
 *
 * Une étape ancienne cochée avant cette date n'a pas d'entrée dans le suivi :
 * elle reste faite, rien ne change pour elle. Une entrée sans `cycle` compte
 * pour l'année civile où elle a été cochée.
 */

export interface SuiviEtape {
  /** Date ISO où l'étape a été cochée. */
  le?: string;
  pasConcerne?: boolean;
  /** Étape annuelle : l'année pour laquelle elle a été faite. */
  cycle?: number;
  /** Étape annuelle à date choisie : AAAA-MM-JJ. */
  date?: string;
}

export type SuiviEtapes = Record<string, SuiviEtape>;

export interface RegleEtape {
  slug: string;
  chaqueAnnee?: boolean;
  peutNePasConcerner?: boolean;
  echeance?: { dateFixe?: string };
  dateChoisie?: { libelle: string };
}

export interface EtatEtape {
  faite: boolean;
  pasConcerne: boolean;
  /** Date ISO de la coche, si on la connaît. */
  faiteLe: string | null;
  /** Étape annuelle : l'année du cycle en cours. Sinon null. */
  cycle: number | null;
  /** Étape annuelle datée : l'échéance du cycle en cours, AAAA-MM-JJ. */
  echeanceLe: string | null;
  /** La date choisie par la structure, AAAA-MM-JJ, si elle en a choisi une. */
  dateChoisie: string | null;
}

const JOUR = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Une date AAAA-MM-JJ qui existe vraiment (pas de 31 février). */
export function dateValide(texte: unknown): texte is string {
  if (typeof texte !== 'string') return false;
  const m = JOUR.exec(texte);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/** Lit la colonne JSON telle que Prisma la rend, sans jamais lever. */
export function lireSuivi(brut: unknown): SuiviEtapes {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return {};
  const suivi: SuiviEtapes = {};
  for (const [slug, valeur] of Object.entries(brut as Record<string, unknown>)) {
    if (!valeur || typeof valeur !== 'object') continue;
    const v = valeur as { le?: unknown; pasConcerne?: unknown; cycle?: unknown; date?: unknown };
    const le = typeof v.le === 'string' && !Number.isNaN(Date.parse(v.le)) ? v.le : null;
    const date = dateValide(v.date) ? v.date : null;
    if (!le && !date) continue;
    const s: SuiviEtape = {};
    if (le) {
      s.le = le;
      if (v.pasConcerne === true) s.pasConcerne = true;
      if (typeof v.cycle === 'number' && Number.isInteger(v.cycle) && v.cycle >= 2000 && v.cycle <= 2200) s.cycle = v.cycle;
    }
    if (date) s.date = date;
    suivi[slug] = s;
  }
  return suivi;
}

/** L'année civile à Paris : une coche du 31 décembre à 23 h 30 compte pour cette année-là. */
export function anneeParis(d: Date): number {
  return Number(new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric' }).format(d));
}

/** Aujourd'hui à Paris, à minuit UTC, pour comparer des jours entiers. */
function jourParis(d: Date): Date {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d);
  const lire = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return new Date(Date.UTC(lire('year'), lire('month') - 1, lire('day')));
}

const enJour = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Le cycle en cours d'une étape annuelle. `mmjj` : « MM-JJ » de l'échéance
 * qui revient chaque année ; `dateChoisie` : la date que la structure a
 * choisie (AAAA-MM-JJ) ; `cycleFait` : l'année pour laquelle elle est faite.
 */
export function cycleAnnuel(
  mmjj: string | null,
  dateChoisie: string | null,
  cycleFait: number | null,
  maintenant: Date = new Date(),
): { cycle: number; echeance: Date | null } {
  const aujourdhui = jourParis(maintenant);
  const annee = aujourdhui.getUTCFullYear();
  if (dateChoisie && dateValide(dateChoisie)) {
    const choisie = new Date(`${dateChoisie}T00:00:00Z`);
    // Une date choisie à venir fixe le cycle : c'est l'année de cette date.
    if (choisie >= aujourdhui) return { cycle: choisie.getUTCFullYear(), echeance: choisie };
    mmjj = dateChoisie.slice(5);
  }
  const m = mmjj ? /^(\d{2})-(\d{2})$/.exec(mmjj) : null;
  if (!m) return { cycle: annee, echeance: null };
  const le = (a: number) => new Date(Date.UTC(a, Number(m[1]) - 1, Number(m[2])));
  if (aujourdhui > le(annee) && cycleFait !== null && cycleFait >= annee) return { cycle: annee + 1, echeance: le(annee + 1) };
  return { cycle: annee, echeance: le(annee) };
}

/** L'année pour laquelle une étape annuelle a été faite. */
function cycleDe(s: SuiviEtape | undefined): number | null {
  if (!s?.le) return null;
  return s.cycle ?? anneeParis(new Date(s.le));
}

export function etatEtape(regle: RegleEtape, faites: readonly string[], suivi: SuiviEtapes, maintenant: Date = new Date()): EtatEtape {
  const s = suivi[regle.slug];
  const cochee = faites.includes(regle.slug);
  const dateChoisie = regle.dateChoisie && s?.date ? s.date : null;
  let cycle: number | null = null;
  let echeanceLe: string | null = null;
  let faiteCeCycle = true;
  if (regle.chaqueAnnee) {
    const cycleFait = cochee ? cycleDe(s) : null;
    const c = cycleAnnuel(regle.echeance?.dateFixe ?? null, dateChoisie, cycleFait, maintenant);
    cycle = c.cycle;
    echeanceLe = c.echeance ? enJour(c.echeance) : null;
    // Sans date de coche, ou cochée pour un cycle passé : à refaire.
    faiteCeCycle = cycleFait !== null && cycleFait >= c.cycle;
  }
  const base = { faiteLe: s?.le ?? null, cycle, echeanceLe, dateChoisie };
  if (!cochee) return { faite: false, pasConcerne: false, ...base };
  // « Pas concerné » tient d'une année sur l'autre.
  if (regle.peutNePasConcerner && s?.pasConcerne) return { faite: true, pasConcerne: true, ...base };
  if (!faiteCeCycle) return { faite: false, pasConcerne: false, ...base };
  return { faite: true, pasConcerne: false, ...base };
}

/**
 * Coche ou décoche une étape. `pasConcerne` n'a de sens qu'avec `faite` et
 * pour une étape qui l'autorise : l'appelant le vérifie avant. `cycle` : pour
 * une étape annuelle, le cycle en cours (voir `etatEtape`). La date choisie
 * reste, quoi qu'on coche.
 */
export function marquerSuivi(
  faites: readonly string[],
  suivi: SuiviEtapes,
  slug: string,
  faite: boolean,
  pasConcerne: boolean,
  maintenant: Date = new Date(),
  cycle?: number | null,
): { faites: string[]; suivi: SuiviEtapes } {
  const ensemble = new Set(faites);
  const suite: SuiviEtapes = { ...suivi };
  const date = suivi[slug]?.date;
  if (faite) {
    ensemble.add(slug);
    const entree: SuiviEtape = { le: maintenant.toISOString() };
    if (pasConcerne) entree.pasConcerne = true;
    if (typeof cycle === 'number') entree.cycle = cycle;
    if (date) entree.date = date;
    suite[slug] = entree;
  } else {
    ensemble.delete(slug);
    if (date) suite[slug] = { date };
    else delete suite[slug];
  }
  return { faites: [...ensemble], suivi: suite };
}

/** Règle (ou efface, avec null) la date choisie d'une étape, sans toucher au reste. */
export function choisirDate(suivi: SuiviEtapes, slug: string, date: string | null): SuiviEtapes {
  const suite: SuiviEtapes = { ...suivi };
  const entree: SuiviEtape = { ...(suivi[slug] ?? {}) };
  if (date) entree.date = date;
  else delete entree.date;
  if (Object.keys(entree).length) suite[slug] = entree;
  else delete suite[slug];
  return suite;
}
