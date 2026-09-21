/**
 * Décomposition du prix — MIROIR EXACT de apps/api/src/billing/commission.ts.
 *
 * ⚠ Les deux fichiers doivent rester identiques sous cet en-tête : c'est le
 * serveur qui facture, l'écran ne fait que montrer le même calcul. Ce fichier
 * a déjà affirmé le contraire du serveur une fois — 15 % de « frais de
 * gestion » affichés quand le serveur n'en prélevait aucun — et un intervenant
 * qui aurait suivi la consigne aurait facturé une association qui ne
 * l'attendait pas.
 *
 *
 * ⚠⚠ IL N'Y A PLUS UNE RÈGLE TARIFAIRE, IL Y EN A DEUX DEPUIS LE 21/09/2026.
 *
 *  1. LE CATALOGUE — ateliers et formations. GRATUIT, des deux côtés.
 *     L'établissement réserve, l'intervenant facture en direct, l'association
 *     ne s'interpose pas et ne prélève rien. Inchangé depuis l'origine.
 *
 *  2. RENFORTEAM — les renforts. COMMISSIONNÉ.
 *     Décision de Siham. RenforTeam n'est pas un annuaire ouvert : ce sont des
 *     professionnels de l'éducation spécialisée et de la rééducation que
 *     l'association VÉRIFIE un par un avant de les envoyer chez quelqu'un —
 *     diplôme, pièce d'identité, bulletin n° 3 du casier judiciaire, assurance,
 *     numéro ADELI quand la profession en a un. C'est ce travail de sélection
 *     que paie la commission, pas la mise en relation.
 *
 * ⚠ LA COMMISSION S'AJOUTE AU TARIF, ELLE NE S'Y PRÉLÈVE PAS. `decomposerPrix`
 * calcule `prixClientHt = tarif + commission` : l'intervenant perçoit
 * exactement ce qu'il a chiffré, et le demandeur voit la ligne de frais sur le
 * devis AVANT de l'accepter (`DecompositionPrix` côté web l'affiche dès que la
 * commission est non nulle). C'est ce qui permet au site de continuer à
 * écrire, sans mentir, que l'intervenant touche son tarif en entier.
 *
 * ─────────────────────────── POURQUOI 15 % ───────────────────────────────────
 *
 * Taux arrêté le 21/09/2026 par Siham, avec pour consigne de s'aligner sur la
 * concurrence. Relevé ce jour-là sur les grilles publiques :
 *
 *  • Brigad (indépendants, dont la santé) : 10 % HT facturés à l'entreprise
 *    ET 15 % TTC prélevés sur l'indépendant — 9,9 % TTC pour les infirmiers.
 *    Soit environ 25 % de prélèvement cumulé sur une mission.
 *  • Malt (freelances, toutes professions) : 10 % HT sur le freelance, ramenés
 *    à 5 % après six mois avec le même client. Mais Malt ne vérifie ni
 *    diplôme, ni casier, ni assurance : ce n'est pas la même prestation.
 *  • Intérim médico-social : coefficient de facturation de 1,9 à 2,2 sur le
 *    salaire, soit 90 à 120 % — le chiffre que porte déjà le calculateur de
 *    coût du dépôt.
 *
 * 15 % sur UN SEUL côté place donc Les Extras nettement sous le prélèvement
 * cumulé de Brigad, très loin sous l'intérim, et au-dessus de Malt — l'écart
 * avec Malt étant exactement ce que couvre la vérification des pièces.
 *
 * ⚠ CE TAUX EST UN PRIX PUBLIÉ. Il ne se change pas en passant : il est écrit
 * en toutes lettres sur /frais-de-service, sur l'accueil, dans les CGU et sur
 * la page RenforTeam. Le modifier ici sans réécrire ces quatre endroits fait
 * mentir le site, et c'est la page que ressort une direction en cas de litige.
 *
 * ⚠ UN TAUX NÉGOCIÉ SUR UN COMPTE (`Account.commissionRate`) PRIME TOUJOURS —
 * y compris à zéro, pour un partenaire historique ou une convention.
 */

/** Le catalogue : ateliers et formations. Rien n'est prélevé. */
export const COMMISSION_DEFAUT = 0;

/** RenforTeam : frais de gestion de l'association, ajoutés au tarif. */
export const COMMISSION_RENFORT = 0.15;

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
