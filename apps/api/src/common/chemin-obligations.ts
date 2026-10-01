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
