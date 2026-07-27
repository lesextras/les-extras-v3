import { describe, expect, it } from "vitest";
import { getMissionDisplayTitle } from "@/lib/mission-display";

describe("getMissionDisplayTitle", () => {
  it("affiche le titre libre pour un métier autre", () => {
    expect(
      getMissionDisplayTitle({
        metier: "autre",
        title: "Médiateur familial",
      }),
    ).toBe("Médiateur familial");
  });

  it("affiche le label métier pour un métier connu", () => {
    expect(
      getMissionDisplayTitle({
        metier: "psychologue",
        title: "Titre technique",
      }),
    ).toBe("Psychologue");
  });

  it("affiche le titre si aucun métier n'est renseigné", () => {
    expect(
      getMissionDisplayTitle({
        title: "Renfort accompagnement",
      }),
    ).toBe("Renfort accompagnement");
  });

  it("garde les anciennes missions legacy lisibles", () => {
    expect(
      getMissionDisplayTitle({
        metier: "AIDE_SOIGNANT",
        title: "Ancien titre",
      }),
    ).toBe("Aide-soignant(e)");
  });

  it("mappe les anciens ids vers les métiers V1 quand une équivalence existe", () => {
    expect(
      getMissionDisplayTitle({
        metier: "VEILLEUR_DE_NUIT",
        title: "Ancien titre",
      }),
    ).toBe("Surveillant de nuit");
  });

  it("garde lisibles les anciens métiers retirés du formulaire", () => {
    expect(
      getMissionDisplayTitle({
        metier: "sophrologue",
        title: "Ancien titre",
      }),
    ).toBe("Sophrologue");
  });

  it("utilise un fallback si aucune donnée exploitable n'est disponible", () => {
    expect(getMissionDisplayTitle({ title: "   " })).toBe("Mission renfort");
  });
});
