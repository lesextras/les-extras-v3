import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * CE QUE LE SITE N'A PAS LE DROIT DE PROMETTRE.
 *
 * ⚠⚠ CE TEST EXISTE PARCE QUE TROIS PHRASES SONT REVENUES APRÈS AVOIR ÉTÉ
 * RETIRÉES, ET QU'AUCUNE RELECTURE NE LES ATTRAPE.
 *
 * Le 4/09/2026, « intervenants vérifiés » a été retiré de la fiche atelier :
 * c'est une promesse de SÉCURITÉ faite à quelqu'un qui va confier des enfants,
 * et elle est fausse — aucune vérification d'identité, de diplôme ou de casier
 * n'existe dans ce produit ; c'est l'établissement qui contrôle à l'embauche,
 * et Les Extras ne peut pas prendre à sa place une obligation qui ne se délègue
 * pas. Le 16/09, la même phrase a été retirée de `(auth)/layout.tsx`, sous la
 * forme « Profils et documents vérifiés ». Le 21/09, elle était toujours dans
 * la description du LAYOUT RACINE, c'est-à-dire dans le repli de toutes les
 * pages qui n'en posent pas — dont `/verify-email` et `/invitations/accept`,
 * mesurées en production.
 *
 * Même histoire pour « freelance », banni le 16/09 des mots-clés et des pages
 * renfort : c'est le vocabulaire écarté par le Conseil d'État le 11/02/2025
 * (n° 491128), et il survivait dans un menu déroulant du formulaire de contact,
 * à l'endroit exact où quelqu'un se déclare.
 *
 * Et « certificat », que les CGV, le gabarit des formations et un test de l'API
 * interdisent déjà : Qualiopi certifie un PROCESSUS et n'autorise à délivrer
 * aucun titre. Ce qui est délivré est une ATTESTATION DE SUIVI.
 *
 * ⚠ CE TEST NE LIT QUE LES TEXTES DESTINÉS AU PUBLIC. Les commentaires de code
 * sont retirés avant l'analyse : ils DOIVENT pouvoir nommer la phrase interdite
 * pour expliquer pourquoi elle l'est — c'est précisément ce que font les
 * commentaires de `layout.tsx` et de `ContactForm.tsx`.
 */

const RACINE = join(__dirname, "..", "..");

/**
 * ⚠ LES AUTRES PRODUITS DE L'ASSOCIATION NE SONT PAS DANS LE PÉRIMÈTRE.
 * `app/academie`, `app/association` et leurs pages publiques servent
 * « Piloter mon académie » et « Piloter mon association », sur d'autres
 * domaines et pour d'autres organismes. Leur vocabulaire est le leur : un
 * organisme qui vend ses propres cours en ligne peut nommer « certificat de
 * réussite » ce qu'il délivre lui-même, et ce n'est pas ce que la règle
 * d'ADéPA interdit. Les mélanger ferait tomber ce test sur un sujet qui n'est
 * pas le sien, et on finirait par le désactiver.
 */
const HORS_PERIMETRE = new Set([
  "academie",
  "association",
  "apprendre",
  "boutique",
  "cours",
  "ecole",
  "f",
]);

/** Les sources du site public et des composants partagés. */
function sources(dossier: string, trouvees: string[] = [], racine = true): string[] {
  for (const entree of readdirSync(dossier)) {
    if (racine && HORS_PERIMETRE.has(entree)) continue;
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      if (entree === "node_modules" || entree === "__tests__") continue;
      sources(chemin, trouvees, false);
    } else if (/\.tsx?$/.test(entree) && !/\.(test|spec)\.tsx?$/.test(entree)) {
      trouvees.push(chemin);
    }
  }
  return trouvees;
}

/**
 * Le fichier sans ses commentaires.
 *
 * ⚠ ON RETIRE AUSSI LES CHAÎNES DE GABARIT ? NON. Une phrase interdite écrite
 * dans un gabarit est servie comme les autres. Seuls les commentaires sortent.
 */
function sansCommentaires(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|\s)\/\/[^\n]*/g, " ");
}

const INTERDITS: { nom: string; motif: RegExp; pourquoi: string }[] = [
  {
    nom: "intervenants vérifiés",
    motif: /(intervenants?|profils?|professionnels?|documents?)\s+(et\s+\w+\s+)?v[ée]rifi[ée]s?\b/i,
    pourquoi:
      "promesse de sécurité fausse : aucune vérification d'identité, de diplôme ou de casier n'existe dans le produit",
  },
  {
    /*
      ⚠ ON NE TRAQUE QUE LA PROSE, PAS L'IDENTIFIANT. `AccountType.FREELANCE`
      est une valeur d'énumération qui traverse tout le dépôt — la renommer
      demanderait une migration, pour un mot que personne ne lit. Ce qu'on
      interdit, c'est le mot ÉCRIT À QUELQU'UN.
      La distinction se fait en deux temps : les CAPITALES sont exclues par la
      casse (`FREELANCE` ne correspond pas), et les identifiants techniques le
      sont par la limite de mot (`isFreelance`, `freelanceId` ne
      correspondent pas). Reste le cas d'un libellé isolé entre guillemets
      (`?? "Freelance"`), que la prose environnante ne trahit pas : ceux-là ont
      été repris à la main le 21/09/2026 et ce test ne les rattrapera pas. Il
      garde la prose, c'est-à-dire l'endroit où le mot fait le dégât.
    */
    nom: "freelance",
    motif: /(?:\b(?:les|des|un|une|de|du|par|pour|et|ou|aux|votre|vos)\b[^\n]{0,30})\bfreelances?\b|\bfreelances?\b(?:[^\n]{0,30}\b(?:les|des|un|une|de|du|par|pour|et|ou|aux|votre|vos)\b)/,
    pourquoi:
      "vocabulaire écarté par le Conseil d'État le 11/02/2025 (n° 491128) — on écrit « intervenant », ou « remplaçant en CDD »",
  },
  {
    nom: "certificat",
    motif: /\bcertificats?\s+(de\s+r[ée]ussite|professionnels?)\b/i,
    pourquoi:
      "Qualiopi certifie un processus et n'autorise aucun titre — ce qui est délivré est une attestation de suivi",
  },
];

describe("Les promesses interdites", () => {
  const fichiers = sources(join(RACINE, "app")).concat(sources(join(RACINE, "components")));

  it("trouve bien les fichiers à relire", () => {
    // Un chemin cassé rendrait le test vert sans rien avoir lu : c'est le pire
    // résultat possible pour un garde-fou.
    expect(fichiers.length).toBeGreaterThan(100);
  });

  for (const { nom, motif, pourquoi } of INTERDITS) {
    it(`n’écrit jamais « ${nom} » — ${pourquoi}`, () => {
      const coupables: string[] = [];
      for (const fichier of fichiers) {
        const texte = sansCommentaires(readFileSync(fichier, "utf8"));
        const m = texte.match(motif);
        if (m) {
          const court = fichier.slice(fichier.indexOf("/src/") + 5);
          const autour = texte.slice(Math.max(0, texte.indexOf(m[0]) - 50), texte.indexOf(m[0]) + 60);
          coupables.push(`${court} : « …${autour.replace(/\s+/g, " ").trim()}… »`);
        }
      }
      expect(coupables).toEqual([]);
    });
  }
});
