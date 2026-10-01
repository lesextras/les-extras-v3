import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { RESSOURCES, CATEGORIES_RESSOURCES, PUBLICS_RESSOURCES } from "../ressources";
import { OUTILS_LEX, lienLex } from "../lex-taches";

const PUBLIC = join(__dirname, "..", "..", "..", "public");

describe("La banque de ressources", () => {
  it("ne promet aucun fichier absent", () => {
    const absents = RESSOURCES.flatMap((r) => [r.fichier, r.apercu, ...r.modifiables.map((m) => m.fichier)]).filter((f) => !existsSync(join(PUBLIC, f)));
    expect(absents).toEqual([]);
  });

  it("range chaque ressource dans une catégorie connue, sans doublon", () => {
    const ids = RESSOURCES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RESSOURCES) expect(CATEGORIES_RESSOURCES.some((c) => c.id === r.categorie)).toBe(true);
  });

  it("tient la promesse de plus de cent outils, chacun avec un public connu", () => {
    expect(RESSOURCES.length).toBeGreaterThanOrEqual(100);
    for (const r of RESSOURCES) {
      expect(r.publics.length).toBeGreaterThan(0);
      for (const p of r.publics) expect(PUBLICS_RESSOURCES.some((x) => x.id === p)).toBe(true);
    }
  });

  it("propose une version modifiable pour la majorité des outils", () => {
    const avec = RESSOURCES.filter((r) => r.modifiables.length > 0).length;
    expect(avec).toBeGreaterThanOrEqual(80);
  });

  it("n'ouvre LEX que sur un outil qui existe", () => {
    for (const r of RESSOURCES) if (r.lex) expect(OUTILS_LEX.some((o) => o.id === r.lex!.outil)).toBe(true);
  });

  it("ne met dans l'adresse que des réglages génériques", () => {
    const url = lienLex("adapter", { objectif: "coopérer", public: "8 ados" });
    expect(url.startsWith("/dashboard/assistant?outil=adapter")).toBe(true);
    expect(url).not.toContain("notes");
  });
});
