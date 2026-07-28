/**
 * Décomposition du prix — miroir exact de apps/api/src/billing/commission.ts.
 * ADéPA est prestataire, pas place de marché : l'intervenant facture
 * l'association, l'association facture l'établissement. La commission est
 * AJOUTÉE au prix client, jamais prélevée sur l'intervenant.
 */
export const COMMISSION_DEFAUT = 0.15;

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
