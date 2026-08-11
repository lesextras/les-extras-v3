/**
 * CONSENTEMENT AUX MESURES PUBLICITAIRES.
 *
 * Tant qu'aucun identifiant Google Ads n'est configuré, la plateforme ne pose
 * strictement aucun traceur et il n'y a rien à consentir : le bandeau reste
 * une information, comme avant. Dès que `NEXT_PUBLIC_GOOGLE_ADS_ID` est
 * renseignée, ce module devient le seul point qui autorise le chargement du
 * tag — et il refuse par défaut.
 *
 * Trois règles, non négociables :
 *
 *  1. RIEN n'est chargé avant un accord explicite. Pas de « consentement
 *     implicite au scroll », pas de script posé « en attendant ».
 *  2. Refuser est aussi facile qu'accepter — même écran, même poids visuel.
 *     Un refus déguisé n'est pas un refus (délibération CNIL n° 2020-091).
 *  3. On peut changer d'avis. Le choix est révocable depuis la politique
 *     cookies, et `oublier()` remet tout à zéro.
 *
 * Le choix est gardé dans `localStorage` et non dans un cookie : un cookie
 * partirait avec CHAQUE requête, y compris avant que la personne ait choisi.
 */

export type Consentement = 'inconnu' | 'accepte' | 'refuse';

const CLE = 'lx.consentement.mesure.v1';
const EVENEMENT = 'lx:consentement';

/** Identifiant Google Ads (`AW-…`). Vide = aucun traceur, aucun consentement à demander. */
export function identifiantAds(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '').trim();
}

/** Étiquette de conversion « inscription » fournie par Google Ads. */
export function etiquetteInscription(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_INSCRIPTION ?? '').trim();
}

/**
 * Vrai quand la mesure est réellement configurée. Tout le reste — bandeau à
 * deux boutons, chargement du tag, envoi de conversion — en dépend, pour que
 * le site ne demande jamais un consentement dont il n'a pas l'usage.
 */
export function mesureConfiguree(): boolean {
  return identifiantAds().length > 0;
}

export function lireConsentement(): Consentement {
  if (typeof window === 'undefined') return 'inconnu';
  try {
    const v = window.localStorage.getItem(CLE);
    return v === 'accepte' || v === 'refuse' ? v : 'inconnu';
  } catch {
    // Navigation privée ou stockage refusé : on considère qu'on n'a pas
    // d'accord. L'absence de réponse n'est pas un oui.
    return 'inconnu';
  }
}

function diffuser(valeur: Consentement) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: valeur }));
}

export function enregistrerConsentement(valeur: Exclude<Consentement, 'inconnu'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLE, valeur);
  } catch {
    /* on diffuse quand même : le choix vaut au moins pour cette visite */
  }
  diffuser(valeur);
}

/** Remet la question à zéro — utilisé par le lien « revenir sur mon choix ». */
export function oublier(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CLE);
  } catch {
    /* rien à faire */
  }
  diffuser('inconnu');
}

/** S'abonne aux changements de choix. Renvoie la fonction de désabonnement. */
export function surChangement(rappel: (v: Consentement) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const h = (e: Event) => rappel((e as CustomEvent<Consentement>).detail);
  window.addEventListener(EVENEMENT, h);
  return () => window.removeEventListener(EVENEMENT, h);
}

/**
 * Vrai seulement si la mesure est configurée ET que la personne a dit oui.
 * C'est la porte unique : aucun appel à Google ne doit exister ailleurs sans
 * passer par cette fonction.
 */
export function mesureAutorisee(): boolean {
  return mesureConfiguree() && lireConsentement() === 'accepte';
}
