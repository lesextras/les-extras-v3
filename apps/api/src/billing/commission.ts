/**
 * ═══════════════════════ LE MODÈLE ÉCONOMIQUE ═══════════════════════════════
 *
 * ⚠ DÉCISION DU 01/10/2026 (fondatrice) : 0 % DE COMMISSION SUR RENFORTEAM ET
 * SUR LES ATELIERS. Ce que le client paie revient à l'intervenant, au centime.
 *
 * Historique : du 21/09 au 30/09/2026, RenforTeam ajoutait 15 % de « frais de
 * gestion » au tarif de l'intervenant (justifiés par la vérification des
 * pièces : diplôme, identité, casier B3, assurance, ADELI). Abandonné le
 * 01/10/2026. Les devis émis avant cette date gardent leur montant : on ne
 * réécrit pas un document déjà envoyé ou accepté.
 *
 * Le chemin de code est conservé (`COMMISSION_RENFORT`, `tauxCommission`,
 * `decomposerPrix`) pour qu'un taux puisse revenir par une décision explicite,
 * pas par une réécriture. Côté web, `DecompositionPrix` n'affiche la ligne de
 * frais que si la commission est non nulle : à 0, elle disparaît d'elle-même.
 *
 * ⚠ CE TAUX EST UN PRIX PUBLIÉ. Le modifier ici impose de réécrire le miroir
 * `apps/web/src/lib/commission.ts`, /frais-de-service, l'accueil, les CGU et
 * la page RenforTeam — sinon le site ment.
 *
 * ⚠ UN TAUX NÉGOCIÉ SUR UN COMPTE (`Account.commissionRate`) PRIME TOUJOURS.
 */

/** Le catalogue : ateliers et formations. Rien n'est prélevé. */
export const COMMISSION_DEFAUT = 0;

/**
 * RenforTeam : 0 depuis le 01/10/2026 (était 0,15 du 21/09 au 30/09/2026).
 * Si un taux revient un jour, il s'AJOUTE au tarif, il ne s'y prélève pas.
 */
export const COMMISSION_RENFORT = 0;

/**
 * Le taux applicable à un devis.
 *
 * `tauxCompte` vient d'`Account.commissionRate` : il prime sur tout, y compris
 * à zéro — c'est la porte de sortie pour une convention ou un partenaire
 * historique, et elle doit rester une décision explicite, pas un effet de bord.
 * `estRenfort` se lit sur le devis lui-même : un devis porte soit un
 * `serviceId` (atelier, catalogue), soit un `missionId` (renfort).
 */
export function tauxCommission({
  estRenfort,
  tauxCompte,
}: {
  estRenfort: boolean;
  tauxCompte?: number | null;
}): number {
  if (tauxCompte !== null && tauxCompte !== undefined && Number.isFinite(Number(tauxCompte))) {
    return Number(tauxCompte);
  }
  return estRenfort ? COMMISSION_RENFORT : COMMISSION_DEFAUT;
}

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
