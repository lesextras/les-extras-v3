import type { Metadata } from 'next';

/**
 * MÉTADONNÉES D'UNE PAGE PUBLIQUE.
 *
 * Deux pièges que ce fichier existe pour éviter.
 *
 * 1. `openGraph.title` ne descend PAS de `title`. Next reprend celui du
 *    layout racine tant qu'une page n'en pose pas un à elle. Résultat : un
 *    lien vers /sos-renfort partagé sur LinkedIn s'affichait « LES EXTRAS —
 *    Ateliers et formations », c'est-à-dire à côté du sujet — et c'est
 *    précisément l'aperçu que voit quelqu'un qui clique sur une publicité.
 *
 * 2. Sans `alternates.canonical`, chaque combinaison de filtres du catalogue
 *    (?search=, ?category=, ?city=…) s'indexe comme une page distincte et
 *    dilue celle qui compte.
 *
 * L'image de partage, le `siteName`, la locale et la carte Twitter restent
 * hérités du layout racine : rien à répéter ici.
 */
export function metaPublique(p: {
  /** Titre de la page, sans le suffixe « · LES EXTRAS » (Next l'ajoute). */
  title: string;
  description: string;
  /** Chemin absolu depuis la racine, ex. « /sos-renfort ». */
  path: string;
  /** Titre de partage, si l'on veut autre chose que le titre de la page. */
  titrePartage?: string;
}): Metadata {
  const partage = p.titrePartage ?? p.title;
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: {
      title: partage,
      description: p.description,
      url: p.path,
    },
    twitter: {
      title: partage,
      description: p.description,
    },
  };
}
