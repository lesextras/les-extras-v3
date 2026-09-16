import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * AUCUNE META DESCRIPTION NE DÉPASSE CE QUE GOOGLE AFFICHE.
 *
 * ⚠⚠ CE TEST EXISTE PARCE QUE `metaPublique()` NE BORNE QUE LE TITRE.
 * `titreSeo()` calibre la balise `<title>` à 65 caractères, avec quatre
 * stratégies successives et un commentaire de vingt lignes qui explique
 * pourquoi. La `description`, elle, passe telle quelle — et personne ne compte
 * les caractères d'une phrase en l'écrivant.
 *
 * Relevé du 16/09/2026 : huit pages dépassaient, dont deux largement — 201
 * caractères sur /guides et 195 sur /comparatif-plateformes-remplacement.
 * Google coupe autour de 155-160 : ces deux-là étaient tronquées en plein
 * milieu de phrase sur la page de résultats, c'est-à-dire à l'endroit exact où
 * se décide le clic.
 *
 * ⚠ ON NE TRONQUE PAS AUTOMATIQUEMENT, ET C'EST UN CHOIX. Une description
 * coupée par le code se termine par une demi-phrase ; une description écrite
 * courte dit quelque chose. Le test signale, il ne répare pas — c'est l'auteur
 * de la page qui réécrit.
 *
 * Les descriptions calculées à l'exécution (gabarits `${…}`) ne sont pas
 * mesurables ici : elles dépendent d'une fiche. Elles sont donc ignorées, et
 * c'est la limite connue de ce test.
 */

const RACINE = join(__dirname, "..", "..", "app");
const LIMITE = 160;

function pagesPubliques(dossier: string, trouvees: string[] = []): string[] {
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      if (entree === "node_modules" || entree === "__tests__") continue;
      pagesPubliques(chemin, trouvees);
    } else if (entree === "page.tsx" || entree === "layout.tsx") {
      trouvees.push(chemin);
    }
  }
  return trouvees;
}

/** Les littéraux `description: "…"` d'un fichier, gabarits exclus. */
function descriptions(source: string): string[] {
  const trouvees: string[] = [];
  const motif = /\bdescription:\s*\n?\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m: RegExpExecArray | null;
  while ((m = motif.exec(source)) !== null) trouvees.push(m[2]);
  return trouvees;
}

describe("Les meta descriptions", () => {
  const fichiers = pagesPubliques(RACINE);

  it("trouve bien les pages à mesurer", () => {
    // Un chemin cassé rendrait le test vert sans rien avoir mesuré : c'est le
    // pire résultat possible pour un garde-fou.
    expect(fichiers.length).toBeGreaterThan(40);
  });

  it(`ne dépasse jamais ${LIMITE} caractères`, () => {
    const trop: string[] = [];
    for (const fichier of fichiers) {
      const source = readFileSync(fichier, "utf8");
      for (const d of descriptions(source)) {
        if (d.length > LIMITE) {
          const court = fichier.slice(fichier.indexOf("/app/") + 5);
          trop.push(`${court} — ${d.length} caractères : « ${d.slice(0, 60)}… »`);
        }
      }
    }
    expect(trop).toEqual([]);
  });
});
