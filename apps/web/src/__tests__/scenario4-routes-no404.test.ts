/**
 * Scenario 4 — Aucun bouton dashboard ne mène à une 404
 *
 * Ce test statique vérifie que chaque route référencée dans la sidebar
 * et les composants du dashboard correspond à un fichier page.tsx existant.
 * Il constitue un filet de sécurité contre les regressions de navigation.
 */
import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";

// apps/web/src/__tests__/ → apps/web/src/app/
const APP_DIR = path.resolve(__dirname, "../app");

/**
 * Résout un chemin d'URL en chemin de fichier page.tsx.
 * Essaie d'abord le route group (dashboard), ensuite le chemin direct.
 */
function pageExists(urlPath: string): boolean {
  const relative = urlPath.replace(/^\//, "");
  const candidates = [
    path.join(APP_DIR, "(dashboard)", relative, "page.tsx"),
    path.join(APP_DIR, relative, "page.tsx"),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

// ─── Sidebar ESTABLISHMENT_LINKS ─────────────────────────────────────────────
const ESTABLISHMENT_LINKS = [
  "/dashboard",
  "/marketplace",
  "/dashboard/packs",
  "/dashboard/renforts",
  "/dashboard/inbox",
];

// ─── Sidebar FREELANCE_LINKS ──────────────────────────────────────────────────
const FREELANCE_LINKS = [
  "/dashboard",
  "/marketplace",
  "/bookings",
  "/dashboard/inbox",
];

// ─── ACCOUNT_LINKS (communs) ─────────────────────────────────────────────────
const ACCOUNT_LINKS = ["/dashboard/demandes", "/account", "/settings"];

// ─── ESTABLISHMENT_BOTTOM_LINKS supplémentaires ───────────────────────────────
const ESTABLISHMENT_BOTTOM_LINKS = ["/account/establishment"];

// ─── Routes référencées dans les widgets du dashboard ─────────────────────────
const WIDGET_ROUTES = [
  "/finance",
  "/dashboard/ateliers",          // lien depuis MesAteliersClient et atelierInvalidationPaths
  "/bookings/[lineType]/[lineId]", // lien depuis dashboard/page.tsx
];

// ─── Routes dynamiques référencées dans CandidateCard ─────────────────────────
const CANDIDATECARD_DYNAMIC_ROUTES = [
  "/freelances/[id]",             // href="/freelances/${freelance.id}"
  "/dashboard/inbox",             // href="/dashboard/inbox?counterpartId=..."
];

describe("Scenario 4 — Aucun lien dashboard ne mène à une 404", () => {
  describe("Sidebar ESTABLISHMENT_LINKS", () => {
    for (const route of ESTABLISHMENT_LINKS) {
      it(`route ${route} a un fichier page.tsx`, () => {
        expect(pageExists(route)).toBe(true);
      });
    }
  });

  describe("Sidebar FREELANCE_LINKS", () => {
    for (const route of FREELANCE_LINKS) {
      it(`route ${route} a un fichier page.tsx`, () => {
        expect(pageExists(route)).toBe(true);
      });
    }
  });

  describe("Bottom navigation links", () => {
    for (const route of [...ACCOUNT_LINKS, ...ESTABLISHMENT_BOTTOM_LINKS]) {
      it(`route ${route} a un fichier page.tsx`, () => {
        expect(pageExists(route)).toBe(true);
      });
    }
  });

  describe("Widget routes (dashboard/page.tsx + MesAteliersClient)", () => {
    for (const route of WIDGET_ROUTES) {
      it(`route ${route} a un fichier page.tsx`, () => {
        expect(pageExists(route)).toBe(true);
      });
    }
  });

  describe("CandidateCard dynamic routes", () => {
    for (const route of CANDIDATECARD_DYNAMIC_ROUTES) {
      it(`route ${route} a un fichier page.tsx`, () => {
        expect(pageExists(route)).toBe(true);
      });
    }
  });
});
