/**
 * NUMÉROTATION DES FACTURES.
 *
 * L'article 242 nonies A de l'annexe II au code général des impôts impose un
 * numéro « basé sur une séquence chronologique continue, sans rupture ». Une
 * facture annulée garde son numéro : le sien est consommé, pas rendu.
 *
 * L'implémentation précédente comptait les factures de l'année et ajoutait un.
 * Deux conséquences : après une annulation, le numéro suivant retombait sur un
 * numéro déjà attribué — collision avec la contrainte d'unicité, et surtout
 * rupture de la séquence ; et deux émissions simultanées produisaient le même
 * numéro. On repart donc du DERNIER numéro attribué, jamais du compte.
 *
 * Module pur : la lecture du dernier numéro est passée en paramètre, ce qui
 * rend la règle testable sans base de données.
 */

export const PREFIXE = 'INV';

/** Le préfixe d'une année : « INV-2026- ». */
export function prefixeAnnee(annee: number): string {
  return `${PREFIXE}-${annee}-`;
}

/**
 * Le numéro qui suit `dernier`, pour l'année donnée.
 * `dernier` est le plus grand numéro déjà attribué cette année, ou null la
 * première fois. Un numéro d'une autre année, ou illisible, repart de 1 —
 * la séquence est annuelle.
 */
export function numeroSuivant(annee: number, dernier: string | null | undefined): string {
  const prefixe = prefixeAnnee(annee);
  let rang = 0;
  if (dernier && dernier.startsWith(prefixe)) {
    const n = Number.parseInt(dernier.slice(prefixe.length), 10);
    if (Number.isFinite(n) && n > 0) rang = n;
  }
  return `${prefixe}${String(rang + 1).padStart(5, '0')}`;
}
