/**
 * Modèle économique : la mise en relation et l'aide à la contractualisation
 * (renforts, ateliers) sont GRATUITES, pour l'établissement comme pour
 * l'intervenant. La commission par défaut est donc de ZÉRO : l'établissement
 * paie exactement le tarif chiffré par l'intervenant, rien de plus, et
 * l'intervenant le touche intégralement.
 *
 * Les deux seuls services payants de la plateforme sont ailleurs : les
 * formations Qualiopi (facturées au devis par l'association, qui fait appel
 * aux formateurs du réseau) et LEX, l'assistant IA à crédits.
 *
 * La mécanique est CONSERVÉE (taux par compte via `commissionRate`) : si un
 * jour un accord particulier prévoit des frais de gestion, ils se règlent
 * compte par compte, sans réécrire le tunnel de devis.
 */
export const COMMISSION_DEFAUT = 0;

/** Décompose un prix intervenant en prix client, transparent pour les deux. */
export function decomposerPrix(tarifIntervenant: number, taux = COMMISSION_DEFAUT) {
  const net = Math.round(tarifIntervenant * 100) / 100;
  const commission = Math.round(net * taux * 100) / 100;
  return {
    tarifIntervenant: net,
    commission,
    tauxCommission: taux,
    prixClientHt: Math.round((net + commission) * 100) / 100,
  };
}
