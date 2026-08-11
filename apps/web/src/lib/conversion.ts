/**
 * REMONTÉE DES CONVERSIONS À GOOGLE ADS.
 *
 * Une seule conversion est déclarée aujourd'hui : la création de compte. C'est
 * elle que la campagne cherche à produire, et c'est le seul signal dont
 * l'algorithme a besoin pour apprendre.
 *
 * Ce qui part chez Google : le fait qu'une inscription a eu lieu, et le type de
 * compte (établissement ou intervenant), parce que les deux n'ont pas la même
 * valeur pour l'association. Ne partent PAS : l'adresse e-mail, le nom, le nom
 * de la structure. L'appel est silencieusement ignoré si la personne n'a pas
 * consenti, ou si aucun identifiant Ads n'est configuré.
 */

import { etiquetteInscription, identifiantAds, mesureAutorisee } from './consentement';

type Gtag = (...args: unknown[]) => void;

/**
 * Signale une inscription réussie. Ne lève jamais : une erreur de mesure ne
 * doit pas empêcher quelqu'un d'entrer dans le produit.
 */
export function signalerInscription(typeCompte?: string): void {
  try {
    if (typeof window === 'undefined') return;
    if (!mesureAutorisee()) return;

    const etiquette = etiquetteInscription();
    if (!etiquette) return; // conversion non déclarée côté Google : rien à envoyer

    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    if (typeof gtag !== 'function') return;

    gtag('event', 'conversion', {
      send_to: `${identifiantAds()}/${etiquette}`,
      // Pas de valeur monétaire : la mise en relation est gratuite. Annoncer
      // un chiffre d'affaires fictif fausserait les enchères automatiques.
      type_compte: typeCompte ?? 'inconnu',
    });
  } catch {
    /* la mesure n'est jamais un motif d'échec */
  }
}
