/**
 * SUPPRIMER UN COMPTE, C'EST L'ARCHIVER TROIS MOIS.
 *
 * Décision de Siham, 16/09/2026. Tout ce que le délai et son échéance ont de
 * commun entre la route d'administration et le planificateur est écrit ici, une
 * seule fois : deux endroits qui calculeraient chacun leur date finiraient par
 * ne plus dire la même chose à trois jours près, et personne ne le verrait.
 */

/** Le délai, en mois pleins. Un seul endroit pour le changer. */
export const MOIS_AVANT_SUPPRESSION = 3;

/**
 * La même date, N mois plus tard — en jours de calendrier, pas en 90 jours.
 *
 * ⚠ `setMonth` DÉBORDE, ET IL FAUT LE RATTRAPER. Le 31 mai plus trois mois
 * donnerait le 31 août : correct. Mais le 31 novembre n'existe pas, et
 * JavaScript le fait glisser au 1er décembre — l'échéance tomberait alors un
 * jour APRÈS le mois annoncé, ce qui se voit et se discute quand on l'affiche à
 * l'écran. On ramène donc au dernier jour du mois visé.
 *
 * ⚠ ON NE COMPTE PAS EN 90 JOURS. « Trois mois » veut dire, pour la personne
 * qui lit l'écran, la même date trois mois plus tard. 90 jours donneraient
 * tantôt le 14, tantôt le 16 — une imprécision gratuite sur la seule
 * information qui compte ici : jusqu'à quand peut-on revenir en arrière.
 */
export function dansNMois(depuis: Date, mois: number): Date {
  const cible = new Date(depuis.getTime());
  const jour = cible.getDate();
  cible.setDate(1);
  cible.setMonth(cible.getMonth() + mois);
  const dernierJourDuMois = new Date(
    cible.getFullYear(),
    cible.getMonth() + 1,
    0,
  ).getDate();
  cible.setDate(Math.min(jour, dernierJourDuMois));
  return cible;
}

/**
 * CE QUI INTERDIT DE SUPPRIMER UN COMPTE — et aucun délai n'y change rien.
 *
 * ⚠⚠ `Invoice` ET `ContratCDD` SONT EN `onDelete: Cascade` SUR `Account`.
 * Détruire le compte détruirait donc les documents eux-mêmes. Or :
 *   — une facture émise se conserve dix ans (art. L123-22 du code de commerce),
 *     et sa séquence de numérotation doit rester continue (art. 242 nonies A,
 *     ann. II du CGI) : un numéro qui disparaît fait un trou dans la série ;
 *   — un contrat de travail et ce qui s'y rattache se conservent cinq ans
 *     (art. L3243-4 du code du travail pour les bulletins).
 *
 * Le planificateur ne force jamais. Il écrit ce qui l'a arrêté, en toutes
 * lettres, et l'écran d'administration l'affiche — sans cette phrase, le compte
 * resterait indéfiniment « à supprimer » sans que personne ne sache pourquoi,
 * et quelqu'un finirait par contourner.
 *
 * Renvoie `null` quand rien ne s'oppose à la suppression.
 */
export function motifDeBlocage(compteurs: {
  factures: number;
  facturesAPayer: number;
  contrats: number;
}): string | null {
  const raisons: string[] = [];
  if (compteurs.factures > 0) {
    raisons.push(
      `${compteurs.factures} facture(s) émise(s) — une facture émise se conserve dix ans et son numéro ne peut pas disparaître de la série`,
    );
  }
  if (compteurs.facturesAPayer > 0) {
    raisons.push(
      `${compteurs.facturesAPayer} facture(s) reçue(s) à son nom — les supprimer laisserait des montants sans interlocuteur chez l'émetteur`,
    );
  }
  if (compteurs.contrats > 0) {
    raisons.push(
      `${compteurs.contrats} contrat(s) de travail édité(s) ici — ils se conservent cinq ans`,
    );
  }
  if (raisons.length === 0) return null;
  return `Suppression impossible : ${raisons.join(' ; ')}. Le compte reste archivé, donc invisible partout.`;
}
