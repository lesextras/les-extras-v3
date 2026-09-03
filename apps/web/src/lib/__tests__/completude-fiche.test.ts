import { describe, expect, it } from "vitest";
import { completude } from "../completude-fiche";

/**
 * L'indicateur décide de ce qu'on reproche à l'auteur d'une fiche. Deux erreurs
 * coûtent cher, et ce sont elles qui sont testées :
 *   - réclamer un champ qui est en fait rempli (on envoie quelqu'un chercher ce
 *     qu'il a déjà écrit) ;
 *   - annoncer une fiche complète alors qu'il manque une durée ou un prix.
 */

const VIDE = {};

const PSYCHO_BOXE = {
  description: "L'Extra Atelier psycho-boxe…",
  objectives: "Renforcer ses connaissances…",
  methodology: "Approche théorique et pratique…",
  evaluation: "Mises en situation devant le groupe…",
  price: "120",
  city: "Île-de-France",
  publicTargets: ["Adolescent", "Enfant"],
  images: ["a.png"],
};

const COMPLETE = {
  ...PSYCHO_BOXE,
  duration: "2H",
  maxParticipants: 8,
  material: "Tables, chaises…",
  prerequisites: "Aucun",
  timeSlots: ["9h-12h"],
};

describe("completude", () => {
  it("une fiche vide ne réclame pas deux fois le même champ", () => {
    const c = completude(VIDE);
    const champs = c.points.map((p) => p.champ);
    expect(new Set(champs).size).toBe(champs.length);
    expect(c.remplis).toBe(0);
    expect(c.pourcentage).toBe(0);
  });

  it("la fiche modèle du catalogue est incomplète, et le dit", () => {
    const c = completude(PSYCHO_BOXE);
    expect(c.socleComplet).toBe(false);
    const manque = c.manquants.map((m) => m.champ);
    expect(manque).toContain("duration");
    expect(manque).toContain("maxParticipants");
    expect(manque).toContain("material");
    expect(manque).toContain("prerequisites");
    expect(manque).toContain("timeSlots");
    // …mais on ne lui réclame pas ce qu'elle a.
    expect(manque).not.toContain("objectives");
    expect(manque).not.toContain("methodology");
    expect(manque).not.toContain("evaluation");
  });

  it("une durée en minutes vaut une durée écrite à la main", () => {
    // « 2H » et 120 minutes disent la même chose au lecteur : réclamer les deux
    // ferait passer une fiche complète pour incomplète.
    const ecrite = completude({ ...COMPLETE, duration: "2H", durationMinutes: null });
    const normalisee = completude({ ...COMPLETE, duration: null, durationMinutes: 120 });
    expect(ecrite.manquants.map((m) => m.champ)).not.toContain("duration");
    expect(normalisee.manquants.map((m) => m.champ)).not.toContain("duration");
  });

  it("une fiche entièrement remplie est à 100 % et son socle est complet", () => {
    const c = completude(COMPLETE);
    expect(c.manquants).toHaveLength(0);
    expect(c.pourcentage).toBe(100);
    expect(c.socleComplet).toBe(true);
  });

  it("un tableau vide ou une chaîne d'espaces comptent comme vides", () => {
    const c = completude({ ...COMPLETE, timeSlots: [], prerequisites: "   " });
    const manque = c.manquants.map((m) => m.champ);
    expect(manque).toContain("timeSlots");
    expect(manque).toContain("prerequisites");
  });

  it("un prix à zéro reste un prix renseigné", () => {
    // Un atelier gratuit existe. Le traiter comme « prix manquant » enverrait
    // son auteur remplir un champ qu'il a rempli exprès.
    const c = completude({ ...COMPLETE, price: 0 });
    expect(c.manquants.map((m) => m.champ)).not.toContain("price");
  });

  it("les photos sont un confort, pas un socle", () => {
    const c = completude({ ...COMPLETE, images: [] });
    expect(c.socleComplet).toBe(true);
    expect(c.manquants.map((m) => m.champ)).toContain("images");
  });
});
