/**
 * LES TOTAUX D'UN DEVIS.
 *
 * Module pur, sans base de données : il se teste seul, et c'est important
 * pour du code dont dépend un engagement financier.
 *
 * ── Pourquoi arrondir ligne par ligne ─────────────────────────────────────
 *
 * On arrondit chaque ligne au centime AVANT de sommer, plutôt que de sommer
 * puis d'arrondir. Les deux méthodes donnent des résultats qui diffèrent d'un
 * ou deux centimes, et la première est celle qu'attend un comptable : le
 * total doit être la somme exacte des lignes imprimées sur le document. Un
 * client qui rajoute lui-même la colonne doit retrouver le total, sinon c'est
 * le document qui a tort à ses yeux — et il a raison.
 *
 * ── Pourquoi passer par les centimes ──────────────────────────────────────
 *
 * 0,1 + 0,2 ne fait pas 0,3 en virgule flottante. Sur un devis à quelques
 * lignes l'écart reste invisible, sur une facturation annuelle il ne l'est
 * plus. On calcule donc en entiers de centimes et on ne revient aux euros
 * qu'à la fin.
 */

export interface LigneChiffrable {
  quantity: number | string;
  /** Prix unitaire HORS TAXES. */
  unitPrice: number | string;
  /** Taux de TVA en pourcentage. Absent ou nul : opération non soumise. */
  vatRate?: number | string | null;
}

export interface TotauxDevis {
  /** Total hors taxes, en euros. */
  totalHt: number;
  /** Total de la taxe, en euros. */
  totalTva: number;
  /** Total toutes taxes comprises, en euros. */
  totalTtc: number;
  /**
   * Détail par taux, pour la ventilation que doit porter tout document
   * comportant plusieurs taux de TVA (art. 242 nonies A de l'annexe II au
   * CGI). Trié par taux croissant, pour un affichage stable.
   */
  ventilation: { taux: number; baseHt: number; tva: number }[];
}

/** Euros → centimes, arrondi au plus proche. */
function centimes(v: number): number {
  return Math.round(v * 100);
}

/** Centimes → euros. */
function euros(c: number): number {
  return c / 100;
}

/**
 * Calcule les totaux d'un jeu de lignes.
 *
 * Tolérant aux données anciennes : une ligne sans `vatRate` est traitée au
 * taux zéro, ce qui était le cas de toutes celles saisies avant que le champ
 * n'existe.
 */
export function totauxDevis(lignes: LigneChiffrable[]): TotauxDevis {
  const parTaux = new Map<number, { baseHt: number; tva: number }>();
  let htC = 0;
  let tvaC = 0;

  for (const l of lignes) {
    const quantite = Number(l.quantity) || 0;
    const unitaire = Number(l.unitPrice) || 0;
    const taux = Number(l.vatRate ?? 0) || 0;

    const ligneHtC = centimes(quantite * unitaire);
    const ligneTvaC = Math.round((ligneHtC * taux) / 100);

    htC += ligneHtC;
    tvaC += ligneTvaC;

    const cumul = parTaux.get(taux) ?? { baseHt: 0, tva: 0 };
    cumul.baseHt += ligneHtC;
    cumul.tva += ligneTvaC;
    parTaux.set(taux, cumul);
  }

  return {
    totalHt: euros(htC),
    totalTva: euros(tvaC),
    totalTtc: euros(htC + tvaC),
    ventilation: [...parTaux.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([taux, c]) => ({ taux, baseHt: euros(c.baseHt), tva: euros(c.tva) })),
  };
}

/**
 * Total d'une seule ligne, hors taxes — celui qu'on imprime en bout de ligne.
 * Exposé pour que l'affichage et le total ne puissent pas diverger.
 */
export function totalLigneHt(l: LigneChiffrable): number {
  return euros(centimes((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)));
}
