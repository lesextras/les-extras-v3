import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * UN COMPTE = UNE PERSONNE (24/09/2026, décision de Siham).
 *
 * Sur Les Extras, un compte appartient à une seule personne. L'organigramme,
 * l'équipe rattachée, les demandes de rattachement, le module d'organisation
 * et le palier « mes salariés d'abord » de la cascade ont été retirés, côté
 * API comme côté web. Ce test échoue si l'un d'eux revient dans le code
 * exécuté du site.
 *
 * ⚠ PILOTER GARDE SES MEMBRES. `app/association`, `app/academie` et
 * `app/ecole` invitent et gèrent des accès (`/invitations`, `/memberships`) :
 * ils sont hors périmètre, et c'est voulu.
 *
 * ⚠ LES COMMENTAIRES SONT HORS PÉRIMÈTRE, comme dans `tirets-interdits` : ils
 * ont le droit de raconter pourquoi ces écrans ont disparu.
 */

const RACINE = join(__dirname, "..", "..");

const DOSSIERS_PILOTER = ["app/association", "app/academie", "app/ecole"];
const DOSSIERS_IGNORES = new Set(["__tests__", "node_modules"]);

const INTERDITS = [
  "/dashboard/organigramme",
  "/dashboard/equipe",
  "attachment-requests",
  "enAttenteRattachement",
  "/organisation/",
  "Mes salariés d'abord",
  "Mes salariés d’abord",
];

function sources(dossier: string, trouvees: string[] = []): string[] {
  for (const entree of readdirSync(dossier)) {
    if (DOSSIERS_IGNORES.has(entree)) continue;
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) sources(chemin, trouvees);
    else if (/\.(ts|tsx)$/.test(entree)) trouvees.push(chemin);
  }
  return trouvees;
}

function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (bloc) => "\n".repeat((bloc.match(/\n/g) ?? []).length))
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("Un compte = une personne", () => {
  const fichiers = sources(RACINE)
    .map((f) => ({ f, relatif: f.slice(RACINE.length + 1).replace(/\\/g, "/") }))
    .filter(({ relatif }) => !DOSSIERS_PILOTER.some((d) => relatif.startsWith(`${d}/`)));

  it("trouve bien les sources à mesurer", () => {
    // Un chemin cassé rendrait le test vert sans rien avoir lu.
    expect(fichiers.length).toBeGreaterThan(150);
  });

  it("ne ramène ni organigramme, ni équipe, ni rattachement, ni palier salariés", () => {
    const fautifs: string[] = [];
    for (const { f, relatif } of fichiers) {
      const lignes = sansCommentaires(readFileSync(f, "utf8")).split("\n");
      lignes.forEach((ligne, i) => {
        for (const mot of INTERDITS) {
          if (ligne.includes(mot)) {
            fautifs.push(`${relatif}:${i + 1} « ${mot} » : ${ligne.trim().slice(0, 90)}`);
          }
        }
      });
    }
    expect(fautifs).toEqual([]);
  });

  /**
   * ⚠ LE PÉRIMÈTRE PILOTER N'EST PAS UNE EXCEPTION VIDE. S'il ne contenait
   * plus rien de ce qui gère des membres, l'exclusion couvrirait du code mort
   * et masquerait un retour du modèle ailleurs sous ce nom.
   */
  it("laisse à Piloter sa gestion des accès", () => {
    const piloter = sources(join(RACINE, "app", "association"))
      .concat(sources(join(RACINE, "app", "academie")))
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    expect(piloter).toContain("/invitations");
    expect(piloter).toContain("/memberships");
  });
});
