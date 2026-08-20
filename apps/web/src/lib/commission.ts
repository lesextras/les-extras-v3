/**
 * Décomposition du prix — miroir exact de apps/api/src/billing/commission.ts.
 *
 * Ce fichier affirmait le contraire de ce que fait le serveur, et le disait à
 * l'écran : 15 % de « frais de gestion » sur chaque devis, et la consigne
 * « vous facturez l'association, l'association facture l'établissement ».
 * Ni l'un ni l'autre n'est vrai. Le serveur enregistre le tarif brut
 * (COMMISSION_DEFAUT = 0) et la facture d'atelier part de l'intervenant vers
 * l'établissement, en direct : `bookings.service.ts` prend l'émetteur sur la
 * fiche atelier et le payeur sur la réservation. Un intervenant qui aurait
 * suivi la consigne aurait adressé sa facture à une association qui ne
 * l'attend pas, et l'établissement aurait payé 15 % qu'on ne lui demande pas.
 *
 * La mise en relation et l'aide à la contractualisation sont gratuites, des
 * deux côtés. Les deux services payants sont ailleurs : les formations
 * Qualiopi, facturées par l'association, et LEX.
 *
 * La mécanique reste en place (taux par compte via `commissionRate`) : si un
 * accord particulier prévoit un jour des frais, il se règle compte par compte
 * sans réécrire le tunnel de devis.
 */
export const COMMISSION_DEFAUT = 0;

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
