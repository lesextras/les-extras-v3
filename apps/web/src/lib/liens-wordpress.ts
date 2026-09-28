/**
 * LES LIENS DES ARTICLES VERS L'ANCIEN WORDPRESS (audit du 28/09/2026).
 *
 * Les articles de l'Édublog, importés de WordPress, pointent encore vers
 * `app.les-extras.fr` : les fiches d'atelier (`/listing/<slug>/`) et quelques
 * pages. Ce site-là doit pouvoir fermer ; ses liens sont donc réécrits À LA
 * LECTURE, par `RichText`, vers l'équivalent sur le site. Rien n'est écrit en
 * base : l'article reste tel qu'il a été importé.
 *
 * ⚠ ON NE RÉÉCRIT QUE CE QUI A UN ÉQUIVALENT ÉVIDENT. Une fiche WordPress
 * devient la fiche du même slug si le catalogue la connaît, sinon le catalogue
 * entier : on ne devine pas qu'un ancien « theatre » est l'actuel
 * « atelier-theatre ». Une page sans équivalent garde son adresse d'origine.
 */
import { cheminRapatrie } from './media';
import { SLUGS_CATALOGUE } from './wp-rapatrie';

/** Les hôtes qui servent l'ancien WordPress. `les-extras.fr` sert le site. */
const HOTES_WORDPRESS = new Set([
  'app.les-extras.fr',
  'www.app.les-extras.fr',
  'ialexia.fr',
  'www.ialexia.fr',
]);

const CATALOGUE = new Set(SLUGS_CATALOGUE);

/**
 * Les pages WordPress qui ont un équivalent évident sur le site. Même table
 * que `PAGES_WORDPRESS` dans `next.config.mjs`, qui redirige ces adresses
 * quand elles arrivent sur le domaine du site.
 */
const PAGES: Record<string, string> = {
  '/': '/',
  '/blog': '/edublog',
  '/services': '/ateliers',
  '/mentions-legales': '/legal',
  '/privacy-policy': '/legal',
  '/demander-votre-catalogue-2026': '/catalogue',
  '/demande-de-devis': '/contact',
  '/devenir-freelance': '/intervenant-independant',
  '/les-extras': '/',
};

/**
 * L'adresse d'un lien d'article, réécrite vers le site quand elle vise
 * l'ancien WordPress et qu'un équivalent existe. Toute autre adresse revient
 * telle quelle.
 */
export function lienSite(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (!HOTES_WORDPRESS.has(url.hostname.toLowerCase())) return href;

  const chemin = url.pathname.replace(/\/+$/, '') || '/';

  const fiche = /^\/listing\/([^/]+)$/i.exec(chemin);
  if (fiche) {
    let slug = fiche[1].toLowerCase();
    try {
      slug = decodeURIComponent(slug);
    } catch {
      /* un % isolé : le slug ne correspondra à aucune fiche, on va au catalogue */
    }
    return CATALOGUE.has(slug) ? `/ateliers/${slug}` : '/ateliers';
  }
  if (/^\/listing-category\/[^/]+$/i.test(chemin)) return '/ateliers';

  const image = cheminRapatrie(url.pathname);
  if (image) return image;

  return PAGES[chemin.toLowerCase()] ?? href;
}
