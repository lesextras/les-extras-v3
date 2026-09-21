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
  alt: 'LES EXTRAS, ateliers éducatifs, formations Qualiopi et renfort d’équipe pour le médico-social',
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

/**
 * TITRE CALIBRÉ POUR LE MOTEUR DE RECHERCHE.
 *
 * Google n'affiche qu'environ 65 caractères de la balise `<title>` ; au-delà,
 * il coupe au milieu d'un mot ou RÉÉCRIT le titre lui-même — et ce qu'il
 * invente est rarement ce qu'on aurait choisi. Seize articles de l'Édublog et
 * quatre missions dépassaient, certains à 103 caractères : sur la page de
 * résultats, leur promesse était tronquée exactement là où elle devenait
 * intéressante.
 *
 * Les titres ÉDITORIAUX ne sont pas touchés : le H1 de la page garde le titre
 * complet, seule la balise est calibrée. Par étapes, de la moins destructrice
 * à la plus destructrice :
 *
 *  1. Le titre + « · LES EXTRAS » tient en 65 → on ne change rien.
 *  2. Beaucoup de titres suivent le motif « Sujet : développement ». Le sujet
 *     seul, s'il est assez consistant (≥ 25 caractères), fait un excellent
 *     titre court — et il garde la marque.
 *  3. Le titre seul tient en 65 → on sacrifie le suffixe de marque, pas le
 *     propos. La marque reste dans l'URL et dans le nom du site.
 *  4. En dernier recours : coupe au dernier mot entier, avec une ellipse —
 *     jamais au milieu d'un mot.
 */
const LIMITE_TITRE = 65;
const SUFFIXE_MARQUE = 13; // « · LES EXTRAS » ajouté par le template du layout.

export function titreSeo(titre: string): Metadata['title'] {
  const plein = titre.trim().replace(/\s+/g, ' ');
  if (plein.length + SUFFIXE_MARQUE <= LIMITE_TITRE) return plein;

  const deuxPoints = plein.indexOf(' : ');
  if (deuxPoints >= 25 && deuxPoints + SUFFIXE_MARQUE <= LIMITE_TITRE) {
    return plein.slice(0, deuxPoints);
  }

  if (plein.length <= LIMITE_TITRE) return { absolute: plein };

  const coupe = plein.slice(0, LIMITE_TITRE - 1);
  const dernierEspace = coupe.lastIndexOf(' ');
  return { absolute: `${coupe.slice(0, dernierEspace > 20 ? dernierEspace : coupe.length)}…` };
}

/**
 * DESCRIPTION CALIBRÉE POUR LA PAGE DE RÉSULTATS.
 *
 * ⚠⚠ AJOUTÉ LE 21/09/2026, APRÈS AVOIR MESURÉ LES 114 PAGES EN LIGNE : SEIZE
 * DESCRIPTIONS DÉPASSAIENT 160 CARACTÈRES, dont plusieurs à plus de 210 —
 * `ateliers-pour/*`, cinq guides, trois pages d'atterrissage, et les fiches
 * construites depuis la base (ateliers, articles, intervenants). Google les
 * coupait en plein milieu d'une phrase.
 *
 * ⚠ ET LE GARDE-FOU NE LES VOYAIT PAS. `lib/__tests__/meta-descriptions.test.ts`
 * lit le SOURCE des pages et ne mesure donc que les descriptions écrites
 * littéralement dans un `.tsx`. Toutes celles qui viennent d'un fichier de
 * données (`donnees.ts`, `contenu.ts`) ou de la base lui échappaient. Un test
 * vert sur la moitié du sujet rassure — c'est pire que pas de test.
 *
 * La réponse n'est donc pas de corriger seize phrases : c'est de borner À LA
 * PORTE, une fois, pour tout le monde, y compris pour la fiche qu'un
 * intervenant écrira demain.
 *
 * ⚠ SEULE LA BALISE `description` EST BORNÉE. Les descriptions de partage
 * (openGraph, Twitter) gardent le texte entier : LinkedIn et Facebook en
 * affichent nettement plus, et les tronquer appauvrirait l'aperçu qui reçoit
 * le clic payant. Même partage des rôles que `titreSeo`.
 */
const LIMITE_DESCRIPTION = 160;

export function descriptionSeo(description: string): string {
  const plein = description.trim().replace(/\s+/g, ' ');
  if (plein.length <= LIMITE_DESCRIPTION) return plein;

  /*
   * ⚠ ON COUPE AU DERNIER MOT ENTIER, ET ON RETIRE LA PONCTUATION PENDANTE.
   * Sans ça on obtient « … pour les équipes, » ou « … le projet : », qui se
   * lit comme une phrase interrompue plutôt que comme un résumé.
   */
  const coupe = plein.slice(0, LIMITE_DESCRIPTION - 1);
  const dernierEspace = coupe.lastIndexOf(' ');
  const base = dernierEspace > 80 ? coupe.slice(0, dernierEspace) : coupe;
  return `${base.replace(/[\s,;:.–—-]+$/, '')}…`;
}

/** Le texte du titre, quel que soit le mode retenu par `titreSeo`. */
export function texteDuTitre(t: Metadata['title']): string {
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object' && 'absolute' in t && t.absolute) return t.absolute;
  return '';
}

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
    // La balise est calibrée pour la page de résultats ; le titre de partage,
    // lui, reste entier — les réseaux sociaux affichent plus long que Google.
    title: titreSeo(p.title),
    // ⚠ Bornée ici, et nulle part ailleurs : c'est la porte par laquelle
    // passent les 114 pages publiques. Voir `descriptionSeo`.
    description: descriptionSeo(p.description),
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
