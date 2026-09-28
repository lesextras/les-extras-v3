/**
 * LE PAIEMENT EN LIGNE EST-IL ACTIF SUR CETTE FICHE ? La règle, écrite une fois.
 *
 * Audit du 28/09/2026, point 3 (décision de Siham) : tant que le paiement en
 * ligne n'est pas actif POUR UNE FICHE, la fiche publique ne propose que le
 * devis sans compte. « Réserver » ouvrait un choix de paiement à une seule
 * option (« facture par virement »), qui menait à /marketplace, donc à la
 * connexion. Mesuré le même jour : le paiement en ligne n'était actif sur
 * aucune des dix-sept fiches. Le bouton promettait donc, à chaque visiteur,
 * un chemin qui finissait sur un mur de connexion.
 *
 * Dès que la règle rend `true`, la fiche propose « Réserver et payer en
 * ligne » (`PaiementAtelier`), qui se paie SANS compte et ouvre le compte au
 * paiement confirmé. Le devis reste proposé à côté, dans tous les cas.
 *
 * LA CONDITION REPREND CELLE DU SERVEUR (`AteliersService.payer`, qui refuse
 * sinon) :
 *   1. `paiementEnLigne` vrai : l'intervenant l'a allumé depuis son espace
 *      (`reglerPaiement`), ce qui n'est possible qu'une fois son compte
 *      d'encaissement relié, son SIRET déclaré et un tarif posé ;
 *   2. un tarif strictement positif : on n'encaisse pas « sur devis » ;
 *   3. la catégorie ATELIER : une prestation au temps passé ne se règle pas
 *      d'avance, le serveur la refuse même quand l'interrupteur est allumé.
 *
 * ⚠ CE QUE LA FICHE PUBLIQUE NE SAIT PAS, et que le serveur vérifie encore au
 * clic : le type du compte (intervenant seulement) et l'état de son compte
 * d'encaissement ce jour-là. Si l'un des deux manque, le serveur répond par un
 * message qui renvoie au devis, qui reste affiché juste en dessous.
 *
 * ⚠ NE PAS RÉÉCRIRE CETTE CONDITION DANS UNE PAGE. Deux copies finissent par
 * diverger, et la fiche afficherait un bouton que le serveur refuse, ou
 * masquerait un paiement pourtant ouvert. `lib/__tests__/paiement-en-ligne.test.ts`
 * vérifie aussi que la fiche publique passe par ici.
 */
export interface FichePayable {
  paiementEnLigne?: boolean | null;
  price?: string | number | null;
  category?: string | null;
}

export function paiementEnLigneActif(fiche: FichePayable | null | undefined): boolean {
  if (!fiche) return false;
  if (fiche.paiementEnLigne !== true) return false;
  if (fiche.category !== 'ATELIER') return false;
  const prix = Number(fiche.price);
  return Number.isFinite(prix) && prix > 0;
}
