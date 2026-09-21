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

/**
 * Les littéraux de chaîne d'une propriété `description`, gabarits exclus.
 *
 * ⚠⚠ LES DEUX BRANCHES D'UN TERNAIRE COMPTENT, ET C'EST LA RAISON DE CE
 * DEUXIÈME PASSAGE (21/09/2026). L'ancienne version exigeait un guillemet
 * immédiatement après `description:` : elle ne voyait donc RIEN d'un
 * `description: CONDITION ? "…" : "…"`. C'est exactement la forme de
 * `legal/cookies/page.tsx`, dont la branche servie en production faisait 163
 * caractères — Google la coupait sur « aucune mesure d'aud… » — sans que ce
 * test, vert, n'ait rien à dire. Un garde-fou qui ne mesure qu'une des deux
 * branches est pire que pas de garde-fou : il rassure.
 *
 * On lit donc la tranche qui suit `description:` jusqu'à la prochaine clé de
 * métadonnées, et on mesure TOUTES les chaînes qu'elle contient.
 */
const CLES_SUIVANTES =
  /\n\s{0,6}(alternates|openGraph|keywords|robots|title|icons|metadataBase|twitter|other|path|authors|category):/;

function descriptions(source: string): string[] {
  const trouvees: string[] = [];
  const motif = /\bdescription:\s*/g;
  let m: RegExpExecArray | null;
  while ((m = motif.exec(source)) !== null) {
    const depuis = source.slice(m.index + m[0].length, m.index + m[0].length + 900);
    const fin = depuis.match(CLES_SUIVANTES);
    const tranche = fin ? depuis.slice(0, fin.index) : depuis;
    // Les chaînes de la tranche. Un gabarit `${…}` dépend d'une fiche : il
    // n'est pas mesurable ici, et les apostrophes inverses ne sont pas lues.
    const chaines = /(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;
    let c: RegExpExecArray | null;
    while ((c = chaines.exec(tranche)) !== null) {
      // Une chaîne courte dans cette tranche est presque toujours une clé ou un
      // chemin (« /legal/cookies »), pas une description : on ne mesure que ce
      // qui pourrait dépasser.
      if (c[2].length > 40) trouvees.push(c[2]);
    }
  }
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
