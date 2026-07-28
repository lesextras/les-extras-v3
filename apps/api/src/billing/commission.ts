/**
 * Modèle économique « prestataire » (et non place de marché) :
 *
 *   Intervenant → facture ADéPA (son tarif net, intégralement)
 *   ADéPA       → facture l'établissement (tarif + commission)
 *
 * Conséquence volontaire : la plateforme ne « facilite » aucun paiement entre
 * tiers, il n'y a qu'une seule caisse (celle de l'association). Un seul compte
 * Stripe, une seule comptabilité, aucune obligation déclarative de plateforme.
 * L'intervenant touche 100 % de son tarif : la commission est AJOUTÉE au prix
 * client, jamais prélevée sur lui.
 */
export const COMMISSION_DEFAUT = 0.15;

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
