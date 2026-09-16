import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { INSCRIPTION } from '../inscription-liens';

/**
 * UN LIBELLÉ PAR DESTINATION — le garde-fou.
 *
 * ⚠⚠ CE TEST N'EST PAS DU CONFORT. La règle a été posée le 12/08/2026, défaite
 * le 03/09, et un audit en a trouvé NEUF libellés pour `/register` le 16/09 :
 * « Créer un compte gratuit », « Créez un compte », « Rejoindre le réseau »,
 * « Essayer LEX gratuitement », « Utiliser LEX sans limite »… Elle ne se tient
 * pas à la relecture, parce que chaque nouvelle page a une bonne raison locale
 * d'avoir son verbe à elle. Seul un test qui échoue la tient.
 *
 * Ce que le test vérifie : tout lien vers `/register…` du code source porte
 * EXACTEMENT le libellé que `lib/inscription-liens.ts` associe à cette
 * destination. Ajouter une destination se fait donc là-bas, en décidant de son
 * libellé une fois — ce qui est précisément le geste qu'on veut rendre
 * obligatoire.
 */

const RACINE = join(__dirname, '..', '..');

function fichiersTsx(dossier: string): string[] {
  const sortie: string[] = [];
  for (const entree of readdirSync(dossier)) {
    if (entree === 'node_modules' || entree === '.next' || entree === '__tests__') continue;
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) sortie.push(...fichiersTsx(chemin));
    else if (entree.endsWith('.tsx')) sortie.push(chemin);
  }
  return sortie;
}

/**
 * Extrait les couples (destination, libellé) de tous les `<Link href="/register…">`.
 *
 * ⚠ Le libellé est nettoyé de ses balises JSX (`<ArrowRight />` et consorts) et
 * de ses espaces : c'est le TEXTE QUE LE VISITEUR LIT qu'on compare, pas la
 * mise en forme. Sans ce nettoyage, « Publier un besoin <ArrowRight /> » et
 * « Publier un besoin » passeraient pour deux libellés différents.
 */
function liensInscription(source: string): { href: string; libelle: string }[] {
  const trouves: { href: string; libelle: string }[] = [];
  const motif = /<Link\s+href="(\/register[^"]*)"[^>]*>([\s\S]*?)<\/Link>/g;
  for (const m of source.matchAll(motif)) {
    const libelle = m[2]
      .replace(/<[^>]*>/g, ' ')
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (libelle) trouves.push({ href: m[1], libelle });
  }
  // La forme éclatée : `href` sur sa propre ligne, dans un `<Link>` multiligne.
  const motifEclate = /<Link\s*\n\s*href="(\/register[^"]*)"[\s\S]*?>([\s\S]*?)<\/Link>/g;
  for (const m of source.matchAll(motifEclate)) {
    const libelle = m[2]
      .replace(/<[^>]*>/g, ' ')
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (libelle) trouves.push({ href: m[1], libelle });
  }
  return trouves;
}

describe('Les liens d’inscription', () => {
  const sources = fichiersTsx(RACINE).map((f) => ({ f, texte: readFileSync(f, 'utf8') }));

  it('trouve bien des liens à vérifier (sinon le test ne prouve rien)', () => {
    const total = sources.flatMap((s) => liensInscription(s.texte));
    expect(total.length).toBeGreaterThan(10);
  });

  /**
   * ⚠ LE TEST CENTRAL. Le message d'échec nomme le fichier ET le libellé
   * attendu : sans ça, on sait qu'on a fauté sans savoir où ni par quoi
   * remplacer.
   */
  it('porte, pour chaque destination, le libellé décidé une seule fois', () => {
    // `as string` : `INSCRIPTION` est `as const`, donc ses `href` sont des
    // types littéraux. On compare ici des chaînes lues dans des fichiers, qui
    // n'en sont pas — la Map doit accepter n'importe quelle chaîne en clé.
    const attendu = new Map<string, string>(
      Object.values(INSCRIPTION).map((d) => [d.href as string, d.libelle as string]),
    );
    const fautes: string[] = [];

    for (const { f, texte } of sources) {
      for (const lien of liensInscription(texte)) {
        const court = f.replace(RACINE, '').replace(/^\//, '');
        const libelleAttendu = attendu.get(lien.href);
        if (!libelleAttendu) {
          fautes.push(
            `${court} : destination « ${lien.href} » inconnue de lib/inscription-liens.ts — ` +
              `déclarez-la là-bas avec son libellé, ou réutilisez une destination existante.`,
          );
        } else if (lien.libelle !== libelleAttendu) {
          fautes.push(
            `${court} : « ${lien.libelle} » pour ${lien.href} — attendu « ${libelleAttendu} ».`,
          );
        }
      }
    }

    expect(fautes).toEqual([]);
  });

  /**
   * ⚠ Deux destinations ne peuvent pas partager un libellé non plus : ce serait
   * le défaut inverse, deux portes différentes derrière le même mot.
   */
  it('n’emploie jamais le même libellé pour deux destinations', () => {
    const libelles = Object.values(INSCRIPTION).map((d) => d.libelle);
    expect(new Set(libelles).size).toBe(libelles.length);
  });
});
