/**
 * CE QUE LA LOI DEMANDE, ÉTAPE PAR ÉTAPE (01/10/2026).
 *
 * Chaque étape des deux chemins (association, académie) dit en plus :
 *  - sa NATURE : obligatoire pour tout le monde, obligatoire seulement dans
 *    certaines situations (« Si concerné »), ou simplement conseillée ;
 *  - son DÉCLENCHEUR : ce qui la rend nécessaire (« Dès le premier salarié ») ;
 *  - son ÉCHÉANCE quand la loi en fixe une (« Dans les 3 mois après le
 *    changement ») et, si c'est une date fixe chaque année, cette date au
 *    format MM-JJ (le web calcule la prochaine) ;
 *  - ses PRÉREQUIS : les slugs des étapes à faire avant (« Il faut d'abord »).
 *
 * Le web (apps/web/src/app/_shared/chemin-obligations.tsx) recopie ces types :
 * les deux bougent ensemble.
 */

export type NatureEtape = 'OBLIGATOIRE' | 'CONSEILLE' | 'SI_CONCERNE';

export interface EcheanceEtape {
  /** La règle, en une phrase courte. */
  texte: string;
  /** Une date fixe chaque année, au format « MM-JJ » (exercice civil). */
  dateFixe?: string;
  /** La date fixe est un repère : elle peut bouger selon l'année ou l'exercice. */
  indicative?: boolean;
}

export interface ObligationEtape {
  nature: NatureEtape;
  /** Ce qui rend l'étape nécessaire, en une phrase courte. */
  declencheur?: string;
  echeance?: EcheanceEtape;
  /** Les slugs des étapes du même chemin à faire avant. */
  prerequis?: string[];
}

/**
 * PRIORITÉ, FINANCEMENTS, DATE CHOISIE (01/10/2026, deuxième passe).
 *
 *  - `priorite` : 1 = à faire d'abord (obligation avec échéance légale, ou
 *    étape qui bloque une subvention), 2 = ensuite, 3 = quand tu as le temps.
 *    Dans chaque partie, les étapes se rangent par priorité puis par ordre
 *    d'origine, sans jamais passer devant une étape à faire avant elles
 *    (`ordonnerEtapes`). « Prochaine étape » suit le même ordre.
 *  - `debloque` : ce que l'étape ouvre comme financements, en quelques mots
 *    (« FDVA », « Dons défiscalisés », « CPF »). Seulement quand c'est exact.
 *  - `dateChoisie` : une étape « chaque année » dont la date est fixée par la
 *    structure (la date de l'AG dans les statuts). La date se règle dans
 *    l'espace et se range dans `etapesSuivi` (common/chemin-suivi.ts).
 */
export type Priorite = 1 | 2 | 3;

export interface DateChoisieEtape {
  /** « Date de l'AG ». */
  libelle: string;
  /** Une phrase d'aide sous le champ. */
  aide?: string;
}

export interface ReperesFinancement {
  priorite: Priorite;
  debloque?: string[];
  dateChoisie?: DateChoisieEtape;
}

/**
 * Range les étapes groupe par groupe (dans l'ordre où les groupes
 * apparaissent), et dans chaque groupe par priorité puis par numéro d'origine,
 * sans placer une étape avant un prérequis du même groupe. Renumérote de 1 à N.
 * Les slugs ne bougent jamais : les coches enregistrées portent les slugs.
 */
export function ordonnerEtapes<T extends { slug: string; numero: number; priorite: Priorite; prerequis?: string[] }>(
  etapes: readonly T[],
  groupe: (e: T) => string | number,
): T[] {
  const groupes: (string | number)[] = [];
  for (const e of etapes) if (!groupes.includes(groupe(e))) groupes.push(groupe(e));
  const rangees: T[] = [];
  for (const g of groupes) {
    const reste = etapes.filter((e) => groupe(e) === g).sort((a, b) => a.priorite - b.priorite || a.numero - b.numero);
    const ici = new Set(reste.map((e) => e.slug));
    const placees = new Set<string>();
    while (reste.length) {
      const i = reste.findIndex((e) => (e.prerequis ?? []).every((p) => !ici.has(p) || placees.has(p)));
      const [e] = reste.splice(i < 0 ? 0 : i, 1);
      placees.add(e.slug);
      rangees.push(e);
    }
  }
  return rangees.map((e, i) => ({ ...e, numero: i + 1 }));
}

/**
 * La prochaine étape : la première pas faite, par priorité puis par numéro,
 * dont les prérequis sont faits ; à défaut, la première pas faite.
 */
export function prochaineEtape<T extends { slug: string; numero: number; priorite?: number; prerequis?: string[] }>(
  etapes: readonly T[],
  estFaite: (slug: string) => boolean,
): T | null {
  const restantes = etapes.filter((e) => !estFaite(e.slug)).sort((a, b) => (a.priorite ?? 2) - (b.priorite ?? 2) || a.numero - b.numero);
  return restantes.find((e) => (e.prerequis ?? []).every((p) => estFaite(p))) ?? restantes[0] ?? null;
}
