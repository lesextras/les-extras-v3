// LIRE UN PLANNING EN PDF.
//
// Un PDF ne contient pas de tableau : il contient des morceaux de texte posés
// à des coordonnées. Reconstituer les lignes et les colonnes est donc une
// LECTURE, avec sa part d'interprétation — contrairement au CSV et au tableur,
// où la structure est écrite noir sur blanc.
//
// D'où la règle qu'on s'impose ici : on reconstruit les colonnes à partir des
// POSITIONS DE L'EN-TÊTE, jamais à partir d'un espacement supposé. Chaque
// fragment est rattaché à la colonne dont le titre le surplombe. Ce qui tombe
// entre deux colonnes n'est pas réparti au hasard : il rejoint la plus proche,
// et si la ligne devient illisible, elle est signalée plutôt que comptée.
//
// L'écran, lui, dit clairement qu'un PDF se relit. C'est le seul des trois
// formats où l'on demande une vérification humaine.

import { lireMatrice, normaliser, COLONNES, type Lecture } from './lecture';

/** Tolérance verticale : deux fragments à moins de 3 points sont sur la même ligne. */
const MEME_LIGNE = 3;

interface Fragment {
  texte: string;
  x: number;
  y: number;
}

/**
 * Charge pdf.js à la demande : il ne pèse sur personne tant qu'on n'ouvre pas
 * de PDF.
 *
 * C'est la variante « legacy » qui est importée, et ce n'est pas une frilosité :
 * la build moderne de pdf.js s'appuie sur des nouveautés de syntaxe que le
 * compilateur de Next 14 refuse encore d'analyser, et la compilation échoue
 * pour tout le site. La legacy rend exactement le même service.
 */
async function moteur() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Sans cette ligne, pdf.js va chercher son ouvrier sur un CDN : le document
  // resterait sur le poste, mais on ajouterait une dépendance réseau à une
  // lecture qu'on a promise locale.
  // Servi tel quel depuis `public/` (voir scripts/copier-pdf-worker.mjs) :
  // le faire passer par le bundler fait échouer la compilation du site entier.
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.mjs';
  return pdfjs;
}

/** Extrait les fragments de texte d'un PDF, page après page, avec leurs positions. */
export async function fragmentsPdf(fichier: ArrayBuffer): Promise<Fragment[][]> {
  const pdfjs = await moteur();
  const doc = await pdfjs.getDocument({ data: fichier }).promise;
  const pages: Fragment[][] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const contenu = await page.getTextContent();
    const frags: Fragment[] = [];
    for (const item of contenu.items) {
      const it = item as { str?: string; transform?: number[] };
      const texte = (it.str ?? '').trim();
      if (!texte || !it.transform) continue;
      frags.push({ texte, x: it.transform[4], y: it.transform[5] });
    }
    pages.push(frags);
  }
  return pages;
}

/** Regroupe les fragments d'une page en lignes, de haut en bas. */
export function enLignes(frags: Fragment[]): Fragment[][] {
  const tries = [...frags].sort((a, b) => b.y - a.y || a.x - b.x);
  const lignes: Fragment[][] = [];
  for (const f of tries) {
    const derniere = lignes[lignes.length - 1];
    if (derniere && Math.abs(derniere[0].y - f.y) <= MEME_LIGNE) derniere.push(f);
    else lignes.push([f]);
  }
  return lignes.map((l) => l.sort((a, b) => a.x - b.x));
}

/** La ligne qui nomme à la fois une personne et une date : c'est l'en-tête. */
function indexEntete(lignes: Fragment[][]): number {
  for (let i = 0; i < lignes.length; i++) {
    const mots = lignes[i].map((f) => normaliser(f.texte));
    if (
      mots.some((m) => COLONNES.personne.includes(m)) &&
      mots.some((m) => COLONNES.date.includes(m))
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * Reconstitue une matrice à partir des positions.
 *
 * Chaque fragment rejoint la colonne dont le titre est le plus proche
 * horizontalement. Deux fragments qui tombent dans la même colonne sont
 * recollés avec une espace : un nom de famille coupé en deux morceaux par le
 * PDF redevient un nom.
 */
export function matriceDepuisPage(lignes: Fragment[][]): string[][] | null {
  const iEntete = indexEntete(lignes);
  if (iEntete === -1) return null;

  const colonnes = lignes[iEntete].map((f) => ({ x: f.x, titre: f.texte }));
  const matrice: string[][] = [colonnes.map((c) => c.titre)];

  for (let i = iEntete + 1; i < lignes.length; i++) {
    const cases: string[] = new Array(colonnes.length).fill('');
    for (const f of lignes[i]) {
      let meilleure = 0;
      let ecart = Infinity;
      for (let c = 0; c < colonnes.length; c++) {
        const d = Math.abs(colonnes[c].x - f.x);
        if (d < ecart) {
          ecart = d;
          meilleure = c;
        }
      }
      cases[meilleure] = cases[meilleure] ? `${cases[meilleure]} ${f.texte}` : f.texte;
    }
    if (cases.some((c) => c !== '')) matrice.push(cases);
  }
  return matrice;
}

/**
 * Lit un planning en PDF. Les pages sont empilées : un planning mensuel tient
 * rarement sur une page, et chacune répète son en-tête.
 */
export async function lirePlanningPdf(fichier: ArrayBuffer): Promise<Lecture> {
  const pages = await fragmentsPdf(fichier);
  let matrice: string[][] | null = null;

  for (const frags of pages) {
    const m = matriceDepuisPage(enLignes(frags));
    if (!m) continue;
    if (matrice === null) matrice = m;
    else matrice.push(...m.slice(1)); // l'en-tête de la page suivante ne se relit pas
  }

  if (matrice === null) {
    return { lignes: [], refusees: [], colonnesManquantes: ['personne', 'date'] };
  }
  return lireMatrice(matrice);
}
