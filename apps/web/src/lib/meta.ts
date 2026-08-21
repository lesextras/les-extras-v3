import type { Metadata } from 'next';

/**
 * MÉTADONNÉES D'UNE PAGE PUBLIQUE.
 *
 * Trois pièges que ce fichier existe pour éviter.
 *
 * 1. `openGraph.title` ne descend PAS de `title`. Next reprend celui du
 *    layout racine tant qu'une page n'en pose pas un à elle. Résultat : un
 *    lien vers /renforteam partagé sur LinkedIn s'affichait « LES EXTRAS —
 *    Ateliers et formations », c'est-à-dire à côté du sujet — et c'est
 *    précisément l'aperçu que voit quelqu'un qui clique sur une publicité.
 *
 * 2. Sans `alternates.canonical`, chaque combinaison de filtres du catalogue
 *    (?search=, ?category=, ?city=…) s'indexe comme une page distincte et
 *    dilue celle qui compte.
 *
 * 3. La fusion des métadonnées se fait EN SURFACE, clé par clé du premier
 *    niveau. Déclarer un objet `openGraph` ne complète donc pas celui du
 *    layout racine : il le REMPLACE en entier. Une page qui n'y posait qu'un
 *    titre et une URL perdait du même coup l'image de partage, le `siteName`,
 *    la locale et le `type` — et s'affichait en rectangle gris sur LinkedIn ou
 *    dans un aperçu de lien, c'est-à-dire là où arrive le clic payant. Même
 *    règle pour `twitter`, qui emportait `card` et `images` avec lui. D'où
 *    `SOCLE_OG` et `SOCLE_TWITTER` ci-dessous, réémis par ce helper et par les
 *    pages qui déclarent leurs métadonnées sans passer par lui.
 */

/**
 * La carte de partage du site : `public/images/partage-les-extras.jpg`, au
 * format 1200×630 attendu par LinkedIn, Facebook et X. Valeurs reprises du
 * layout racine ; le jour où l'image change, elle ne change qu'ici.
 */
export const CARTE_PARTAGE = {
  url: '/images/partage-les-extras.jpg',
  width: 1200,
  height: 630,
  alt: 'LES EXTRAS — ateliers éducatifs, formations Qualiopi et renfort d’équipe pour le médico-social',
};

/** Ce qu'un objet `openGraph` de page doit réémettre pour ne rien perdre. */
export const SOCLE_OG = {
  type: 'website' as const,
  locale: 'fr_FR',
  siteName: 'LES EXTRAS',
  images: [CARTE_PARTAGE],
};

/**
 * Idem côté Twitter/X. `summary` afficherait une vignette minuscule ; le grand
 * format double la surface cliquable dans un fil.
 */
export const SOCLE_TWITTER = {
  card: 'summary_large_image' as const,
  images: [CARTE_PARTAGE.url],
};

export function metaPublique(p: {
  /** Titre de la page, sans le suffixe « · LES EXTRAS » (Next l'ajoute). */
  title: string;
  description: string;
  /** Chemin absolu depuis la racine, ex. « /renforteam ». */
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
      ...SOCLE_OG,
      title: partage,
      description: p.description,
      url: p.path,
    },
    twitter: {
      ...SOCLE_TWITTER,
      title: partage,
      description: p.description,
    },
  };
}
