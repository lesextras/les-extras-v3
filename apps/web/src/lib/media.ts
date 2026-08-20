/**
 * MÉDIATHÈQUE WORDPRESS — le seul endroit du dépôt qui sait où vivent les images.
 *
 * L'INTÉGRALITÉ des visuels du site public (142 images relevées le 20/08/2026 :
 * fiches ateliers, couvertures d'articles, illustrations de l'accueil) est
 * servie par le WordPress historique. Le SaaS n'héberge presque aucune de ses
 * propres images. Cet hôte a déjà déménagé deux fois, et les deux fois les
 * images du site ont cassé en direct.
 *
 *   les-extras.fr  →  app.les-extras.fr  (10/08/2026, inversion des domaines)
 *   app.les-extras.fr  →  ialexia.fr     (20/08/2026, perte du sous-domaine)
 *
 * D'où ce module : **une constante à changer, et rien d'autre**. Les anciens
 * hôtes restent listés et sont réécrits à l'affichage — une fiche saisie il y a
 * deux ans continue donc de s'afficher sans qu'on touche à la base.
 *
 * ⚠️ TROIS RÈGLES, apprises à la dure :
 *
 * 1. **L'ORDRE COMPTE.** On ne bascule `MEDIATHEQUE` qu'APRÈS avoir vérifié que
 *    le nouvel hôte sert bien `/wp-content/`. L'inverse coupe toutes les images
 *    du site en production, en une seule fois.
 * 2. **Le nouvel hôte doit figurer dans `images.remotePatterns`**
 *    (`next.config.mjs`). Depuis que l'optimiseur d'images fonctionne, un hôte
 *    absent de la liste blanche fait répondre `/_next/image` en 400 : l'image
 *    n'est pas juste non optimisée, elle ne s'affiche pas du tout.
 * 3. **Aucune URL de médiathèque en dur ailleurs.** Elles passent toutes par
 *    `wp()` ou par `visuel()`.
 */

/** Hôtes qui ont servi la médiathèque, et ne la servent plus. */
const HOTES_HERITES = new Set([
  'les-extras.fr',
  'www.les-extras.fr',
  'app.les-extras.fr',
  'www.app.les-extras.fr',
]);

/**
 * Hôte qui la sert AUJOURD'HUI. **C'est la seule ligne à changer pour déménager
 * la médiathèque** — lire les trois règles en tête de fichier avant de le faire.
 */
export const MEDIATHEQUE = 'ialexia.fr';

/**
 * URL d'un média à partir de son chemin de médiathèque.
 * `wp('/wp-content/uploads/2023/02/PSYCHO-BOXE.png')`
 *
 * À utiliser partout où une image de la médiathèque est écrite en dur dans le
 * code : sans cela, ces URL-là survivent au déménagement et cassent seules.
 */
export function wp(chemin: string): string {
  return `https://${MEDIATHEQUE}${chemin.startsWith('/') ? chemin : `/${chemin}`}`;
}

/**
 * Visuels écartés, par chemin de médiathèque.
 *
 * `handicap-psychique.jpg` est le portrait en gros plan d'une enfant, visage
 * entièrement reconnaissable. Sur la carte d'un atelier proposé en MECS ou en
 * IME, il laisse entendre que cette enfant est accueillie dans l'établissement.
 * Rien ne permet d'affirmer qu'un accord a été recueilli pour cet usage, et le
 * doute ne se plaide pas sur l'image d'un mineur : on passe au visuel suivant
 * de la fiche. À remplacer proprement depuis l'administration.
 */
const VISUELS_ECARTES = new Set([
  '/wp-content/uploads/2025/01/handicap-psychique.jpg',
  '/wp-content/uploads/2025/02/handicap-psychique.jpg',
]);

/**
 * Normalise une URL de visuel. Renvoie `null` si le visuel est inutilisable
 * (vide ou écarté). Les chemins relatifs (`/api/files/…`) passent tels quels.
 */
export function visuel(src?: string | null): string | null {
  const valeur = src?.trim();
  if (!valeur) return null;

  if (!/^https?:\/\//i.test(valeur)) {
    return VISUELS_ECARTES.has(valeur) ? null : valeur;
  }

  let url: URL;
  try {
    url = new URL(valeur);
  } catch {
    return valeur;
  }

  if (VISUELS_ECARTES.has(url.pathname)) return null;

  if (HOTES_HERITES.has(url.hostname) && url.pathname.startsWith('/wp-content/')) {
    url.hostname = MEDIATHEQUE;
    return url.toString();
  }

  return valeur;
}

/** Liste de visuels nettoyée, dans l'ordre d'origine. */
export function visuels(images?: readonly (string | null)[] | null): string[] {
  const sortie: string[] = [];
  for (const brut of images ?? []) {
    const propre = visuel(brut);
    if (propre) sortie.push(propre);
  }
  return sortie;
}

/** Premier visuel affichable d'une fiche, ou `null`. */
export function premierVisuel(images?: readonly (string | null)[] | null): string | null {
  return visuels(images)[0] ?? null;
}
