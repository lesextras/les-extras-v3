import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * AUCUN TIRET CADRATIN DANS LE TEXTE VISIBLE DU SITE.
 *
 * ⚠⚠ CE TEST EXISTE PARCE QUE LA CONSIGNE A DÛ ÊTRE DONNÉE DEUX FOIS.
 *
 * Le 21/09/2026, Siham a demandé de retirer les « — » d'un bloc de l'accueil.
 * Je l'ai fait dans ce bloc, et elle a rouvert la page une heure plus tard :
 * « ces tirets sont encore partout alors que je t'ai dit de ne jamais utiliser
 * ça ». Il y en avait QUATRE-VINGT-DIX ailleurs. Corriger l'endroit qu'on me
 * montre et laisser les quatre-vingt-neuf autres, c'est faire refaire le tour
 * du site à la personne qui a demandé.
 *
 * ⚠ CE N'EST PAS UNE QUERELLE DE TYPOGRAPHIE. Le tiret cadratin sert à ouvrir
 * une incise, donc à allonger une phrase déjà finie. Il en était arrivé à
 * ponctuer presque tous les paragraphes du site, et c'est ce que Siham lisait
 * comme « trop de texte ». Le retirer force à écrire deux phrases ou à poser
 * des parenthèses, ce qui se lit dans les deux cas plus vite.
 *
 * ⚠ LES COMMENTAIRES SONT HORS PÉRIMÈTRE, et il le faut : ce fichier-ci en
 * contient, et les commentaires de `nav.ts` ou de `QuatreSituations.tsx` ont
 * besoin de pouvoir NOMMER le caractère pour expliquer pourquoi il est
 * interdit. C'est exactement le choix déjà fait par `promesses-interdites`.
 *
 * ⚠⚠ LE PÉRIMÈTRE EST TOUT LE DÉPÔT, PAS SEULEMENT LES EXTRAS. Les produits
 * « Piloter » (académie, association, boutique, cours) en portaient cent
 * trente-six de plus, et Siham a demandé qu'ils y passent aussi : « fait 1 et
 * 2 ». C'est un écart assumé avec `promesses-interdites`, qui les laisse
 * dehors — mais pour une raison qui ne vaut pas ici. Là-bas, la frontière est
 * JURIDIQUE : un organisme qui délivre son propre certificat a le droit de
 * l'appeler ainsi, et Les Extras non. Ici, elle serait seulement esthétique,
 * et une règle de style qui s'arrête à la moitié d'un dépôt ne tient jamais.
 *
 * ⚠ CE QUI RESTE AUTORISÉ, ET POURQUOI : `lib/meta.ts` seulement. Le caractère
 * y figure dans une CLASSE D'EXPRESSION RÉGULIÈRE (`[\s,;:.–—-]+$`) qui sert
 * justement à retirer une ponctuation pendante en fin de description. Ce n'est
 * pas du texte affiché, et le retirer casserait la fonction.
 */

const RACINE = join(__dirname, "..", "..");
const CADRATIN = "—";

/**
 * Dossiers écartés par leur NOM, où qu'ils se trouvent.
 *
 * ⚠ `__tests__` ne s'écrit pas `__tests__` dans un chemin relatif à la racine
 * des sources mais `lib/__tests__` : une liste de préfixes ne l'attrape pas, et
 * le test se met alors à se dénoncer lui-même. Ce sont deux filtres différents,
 * et il faut les deux.
 */
const DOSSIERS_IGNORES = new Set(["__tests__", "node_modules"]);

/**
 * Le seul fichier dont on sait pourquoi il porte encore le caractère.
 *
 * ⚠ UNE LISTE D'EXCEPTIONS EST UNE DETTE : chacune est un endroit où la règle
 * ne s'applique plus, et personne ne relit la liste. Elle en a compté cinq
 * pendant une heure, le temps de décider si les composants de « Piloter »
 * entraient dans le périmètre. Ils y sont entrés, et la liste est retombée à
 * un. Y ajouter une ligne demande une raison qui tienne en une phrase.
 */
const EXCEPTIONS: Record<string, string> = {
  "lib/meta.ts": "classe d’expression régulière, pas du texte affiché",
};

function sources(dossier: string, trouvees: string[] = []): string[] {
  for (const entree of readdirSync(dossier)) {
    if (DOSSIERS_IGNORES.has(entree)) continue;
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) sources(chemin, trouvees);
    else if (/\.(ts|tsx)$/.test(entree)) trouvees.push(chemin);
  }
  return trouvees;
}

/**
 * Le source privé de ses commentaires.
 *
 * ⚠ LES BLOCS SONT REMPLACÉS PAR LEURS SAUTS DE LIGNE, pas supprimés : sans
 * ça, le numéro de ligne rapporté par le test désigne la mauvaise ligne et on
 * cherche le caractère à trente lignes de là.
 */
function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (bloc) => "\n".repeat((bloc.match(/\n/g) ?? []).length))
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("Le tiret cadratin", () => {
  const fichiers = sources(RACINE);

  it("trouve bien les sources à mesurer", () => {
    // Un chemin cassé rendrait le test vert sans rien avoir lu — le pire
    // résultat possible pour un garde-fou (voir meta-descriptions.test.ts).
    expect(fichiers.length).toBeGreaterThan(150);
  });

  it("n’apparaît nulle part dans le texte visible du site", () => {
    const fautifs: string[] = [];
    for (const fichier of fichiers) {
      const relatif = fichier.slice(RACINE.length + 1).replace(/\\/g, "/");
      if (EXCEPTIONS[relatif]) continue;
      const lignes = sansCommentaires(readFileSync(fichier, "utf8")).split("\n");
      lignes.forEach((ligne, i) => {
        if (ligne.includes(CADRATIN)) {
          fautifs.push(`${relatif}:${i + 1} — ${ligne.trim().slice(0, 90)}`);
        }
      });
    }
    expect(fautifs).toEqual([]);
  });

  /**
   * ⚠ LES EXCEPTIONS DOIVENT RESTER VRAIES. Une liste d'exceptions qu'on ne
   * vérifie pas finit par couvrir des fichiers qui n'en ont plus besoin, et
   * c'est par là que le caractère revient.
   */
  it("ne garde que des exceptions qui servent encore", () => {
    for (const relatif of Object.keys(EXCEPTIONS)) {
      const source = readFileSync(join(RACINE, relatif), "utf8");
      expect(sansCommentaires(source).includes(CADRATIN)).toBe(true);
    }
  });
});
