/**
 * LES JOURS FÉRIÉS FRANÇAIS.
 *
 * Onze fêtes légales (article L. 3133-1 du code du travail), dont trois se
 * déplacent chaque année parce qu'elles suivent Pâques. Un logiciel qui
 * chiffre du temps de travail dans le médico-social ne peut pas se contenter
 * d'une table figée : il faut calculer.
 *
 * Deux règles d'ordre public à ne jamais rendre paramétrables :
 *
 *   • Le 1er mai est le SEUL jour férié légalement chômé (L. 3133-4), et le
 *     seul dont la majoration soit fixée par la loi : l'article L. 3133-6
 *     donne au salarié qui le travaille, en plus du salaire correspondant au
 *     travail accompli, « une indemnité égale au montant de ce salaire ».
 *     C'est donc un doublement du coût — mais en deux lignes de paie
 *     distinctes, pas en un taux horaire multiplié par deux.
 *
 *   • Les heures perdues par le chômage d'un jour férié ne donnent pas lieu à
 *     récupération (L. 3133-2).
 *
 * Tout le reste — quels fériés sont chômés dans l'établissement, quelle
 * contrepartie pour un férié travaillé — relève de l'accord collectif
 * (L. 3133-3-1) ou, à défaut, de l'employeur (L. 3133-3-2). Rien de tout cela
 * n'est écrit en dur ici.
 */

export type NomFerie =
  | 'JOUR_AN'
  | 'LUNDI_PAQUES'
  | 'FETE_TRAVAIL'
  | 'VICTOIRE_1945'
  | 'ASCENSION'
  | 'LUNDI_PENTECOTE'
  | 'FETE_NATIONALE'
  | 'ASSOMPTION'
  | 'TOUSSAINT'
  | 'ARMISTICE'
  | 'NOEL'
  | 'VENDREDI_SAINT'
  | 'SAINT_ETIENNE';

export interface Ferie {
  nom: NomFerie;
  libelle: string;
  /** Date au format ISO `AAAA-MM-JJ`, en heure locale française. */
  date: string;
  /**
   * Chômé de plein droit par la loi. Vrai pour le seul 1er mai : les dix
   * autres fêtes légales sont travaillables sauf décision collective.
   */
  chomeParLaLoi: boolean;
  /**
   * Majoration imposée par la loi, en pourcentage du salaire de la journée.
   * Vaut 100 pour le 1er mai (L. 3133-6) et zéro partout ailleurs — car en
   * dehors de ce cas, aucune majoration de férié n'est légale : elle est
   * conventionnelle.
   */
  majorationLegalePct: number;
  /** Ne s'applique qu'en Alsace-Moselle (L. 3134-13). */
  droitLocal: boolean;
}

const LIBELLES: Record<NomFerie, string> = {
  JOUR_AN: "Jour de l'An",
  LUNDI_PAQUES: 'Lundi de Pâques',
  FETE_TRAVAIL: 'Fête du Travail',
  VICTOIRE_1945: 'Victoire 1945',
  ASCENSION: 'Ascension',
  LUNDI_PENTECOTE: 'Lundi de Pentecôte',
  FETE_NATIONALE: 'Fête nationale',
  ASSOMPTION: 'Assomption',
  TOUSSAINT: 'Toussaint',
  ARMISTICE: 'Armistice 1918',
  NOEL: 'Noël',
  VENDREDI_SAINT: 'Vendredi saint',
  SAINT_ETIENNE: 'Saint-Étienne',
};

/** Date au format `AAAA-MM-JJ` à partir d'une date UTC. */
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ajouterJours(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/**
 * DIMANCHE DE PÂQUES — algorithme grégorien anonyme, dit de Meeus.
 *
 * La règle vient du concile de Nicée : Pâques est le dimanche qui suit le
 * quatorzième jour de la lune qui atteint cet âge le 21 mars ou juste après.
 * Mais c'est une lune *ecclésiastique* fictive, calculée par comput, pas la
 * lune astronomique — d'où cet algorithme purement arithmétique, sans table
 * ni exception, valable pour toute année du calendrier grégorien.
 *
 * Trois des onze fêtes légales en dépendent : lundi de Pâques, Ascension et
 * lundi de Pentecôte. Se tromper d'un jour, c'est se tromper sur la paie de
 * tout un établissement.
 */
export function paques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(annee, mois - 1, jour));
}

export interface OptionsFeries {
  /**
   * Applique le droit local d'Alsace-Moselle : Saint-Étienne le 26 décembre,
   * et Vendredi saint.
   *
   * Attention, le Vendredi saint n'est PAS départemental : l'article
   * L. 3134-13 le réserve aux communes disposant d'un temple protestant ou
   * d'une église mixte. Un simple drapeau « Alsace-Moselle » serait faux —
   * d'où le second paramètre, qui se règle au niveau de la commune
   * d'implantation de l'établissement.
   */
  droitLocal?: boolean;
  vendrediSaint?: boolean;
}

/** Les jours fériés d'une année civile, triés par date. */
export function feriesDeLAnnee(annee: number, options: OptionsFeries = {}): Ferie[] {
  const p = paques(annee);

  const fixe = (mois: number, jour: number): string => iso(new Date(Date.UTC(annee, mois - 1, jour)));

  const liste: Ferie[] = [
    { nom: 'JOUR_AN', date: fixe(1, 1) },
    { nom: 'LUNDI_PAQUES', date: iso(ajouterJours(p, 1)) },
    { nom: 'FETE_TRAVAIL', date: fixe(5, 1) },
    { nom: 'VICTOIRE_1945', date: fixe(5, 8) },
    { nom: 'ASCENSION', date: iso(ajouterJours(p, 39)) },
    { nom: 'LUNDI_PENTECOTE', date: iso(ajouterJours(p, 50)) },
    { nom: 'FETE_NATIONALE', date: fixe(7, 14) },
    { nom: 'ASSOMPTION', date: fixe(8, 15) },
    { nom: 'TOUSSAINT', date: fixe(11, 1) },
    { nom: 'ARMISTICE', date: fixe(11, 11) },
    { nom: 'NOEL', date: fixe(12, 25) },
  ].map((f) => ({
    nom: f.nom as NomFerie,
    libelle: LIBELLES[f.nom as NomFerie],
    date: f.date,
    // Le 1er mai est le seul jour férié chômé par la loi (L. 3133-4) et le
    // seul dont la majoration soit légale (L. 3133-6). Tous les autres sont
    // travaillables, et leur contrepartie est conventionnelle.
    chomeParLaLoi: f.nom === 'FETE_TRAVAIL',
    majorationLegalePct: f.nom === 'FETE_TRAVAIL' ? 100 : 0,
    droitLocal: false,
  }));

  if (options.droitLocal) {
    liste.push({
      nom: 'SAINT_ETIENNE',
      libelle: LIBELLES.SAINT_ETIENNE,
      date: fixe(12, 26),
      chomeParLaLoi: true,
      majorationLegalePct: 0,
      droitLocal: true,
    });
    if (options.vendrediSaint) {
      liste.push({
        nom: 'VENDREDI_SAINT',
        libelle: LIBELLES.VENDREDI_SAINT,
        date: iso(ajouterJours(p, -2)),
        chomeParLaLoi: true,
        majorationLegalePct: 0,
        droitLocal: true,
      });
    }
  }

  return liste.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Les jours fériés couvrant une plage de dates, bornes comprises.
 * On balaie les années concernées : une période qui enjambe le 31 décembre
 * doit voir les fériés des deux années.
 */
export function feriesEntre(debut: Date, fin: Date, options: OptionsFeries = {}): Ferie[] {
  const a1 = debut.getUTCFullYear();
  const a2 = fin.getUTCFullYear();
  const d = iso(debut);
  const f = iso(fin);
  const tous: Ferie[] = [];
  for (let a = a1; a <= a2; a++) tous.push(...feriesDeLAnnee(a, options));
  return tous.filter((x) => x.date >= d && x.date <= f);
}

/** Le jour donné est-il férié ? Renvoie le férié, ou null. */
export function ferieDuJour(date: Date, options: OptionsFeries = {}): Ferie | null {
  const jour = iso(date);
  return feriesDeLAnnee(date.getUTCFullYear(), options).find((f) => f.date === jour) ?? null;
}

/**
 * LA JOURNÉE DE SOLIDARITÉ.
 *
 * Contrairement à une idée tenace, le lundi de Pentecôte n'est plus la date
 * par défaut depuis la loi du 16 avril 2008. Il reste un jour férié, mais la
 * date de la journée de solidarité se fixe par accord (L. 3133-11) ou, à
 * défaut, par l'employeur après consultation du comité social et économique
 * (L. 3133-12). Elle vaut sept heures, réduites au prorata pour un temps
 * partiel (L. 3133-8), et n'est pas rémunérée.
 *
 * Cette fonction ne fait que vérifier qu'une date proposée est légale.
 */
export function dateSolidariteValide(
  date: Date,
  options: OptionsFeries = {},
): { valide: boolean; motif?: string } {
  const f = ferieDuJour(date, options);
  if (f?.nom === 'FETE_TRAVAIL') {
    return {
      valide: false,
      motif:
        "La journée de solidarité ne peut pas être fixée au 1er mai : c'est le seul jour férié légalement chômé (article L. 3133-4).",
    };
  }
  // En Alsace-Moselle, l'article L. 3134-16 interdit en outre les deux jours
  // de Noël et le Vendredi saint.
  if (f && (f.nom === 'NOEL' || f.nom === 'SAINT_ETIENNE' || f.nom === 'VENDREDI_SAINT')) {
    return {
      valide: false,
      motif: `En Alsace-Moselle, la journée de solidarité ne peut pas être fixée au ${f.libelle} (article L. 3134-16).`,
    };
  }
  return { valide: true };
}
