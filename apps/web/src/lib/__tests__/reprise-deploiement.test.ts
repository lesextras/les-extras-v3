import { describe, it, expect, vi, beforeEach } from "vitest";

import { estErreurDeVersion, rechargerUneFois } from "../reprise-deploiement";
import { lireAvecReprise, _oublierDernieresReponses } from "../lecture-publique";

class ApiError extends Error {
  constructor(readonly status: number) {
    super("panne");
  }
}
const panne = (status: number) => new ApiError(status);
const apiRequest = vi.fn();
const statutDe = (e: unknown) => (e instanceof ApiError ? e.status : 0);
const fetchPublic = (cle: string, _o?: unknown) => lireAvecReprise(cle, () => apiRequest(cle), statutDe, [0, 0]);
const sansAttente = {};

describe("estErreurDeVersion", () => {
  it("reconnaît les erreurs de chargement de fichiers d'une autre version", () => {
    const e = new Error("Loading chunk 4521 failed.");
    e.name = "ChunkLoadError";
    expect(estErreurDeVersion(e)).toBe(true);
    expect(estErreurDeVersion(new TypeError("Failed to fetch dynamically imported module: /x.js"))).toBe(true);
    expect(estErreurDeVersion(new Error("Failed to find Server Action \"abc\"."))).toBe(true);
  });
  it("ne prend pas une vraie erreur pour une erreur de version", () => {
    expect(estErreurDeVersion(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(estErreurDeVersion(null)).toBe(false);
  });
});

describe("rechargerUneFois", () => {
  beforeEach(() => window.sessionStorage.clear());
  it("ne recharge pas deux fois en vingt secondes (pas de boucle)", () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", { value: { ...window.location, reload }, writable: true });
    expect(rechargerUneFois()).toBe(true);
    expect(rechargerUneFois()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("fetchPublic pendant un redéploiement", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    _oublierDernieresReponses();
  });

  it("réessaie une panne passagère et rend la donnée", async () => {
    apiRequest.mockRejectedValueOnce(panne(502)).mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce({ id: "a" });
    const r = await fetchPublic("/public/catalog/a", sansAttente);
    expect(r.data).toEqual({ id: "a" });
    expect(apiRequest).toHaveBeenCalledTimes(3);
  });

  it("ressert la dernière réponse bonne si l'API reste muette", async () => {
    apiRequest.mockResolvedValueOnce({ id: "a", titre: "Théâtre" });
    await fetchPublic("/public/catalog/a", sansAttente);
    apiRequest.mockRejectedValue(panne(503));
    const r = await fetchPublic("/public/catalog/a", sansAttente);
    expect(r.data).toEqual({ id: "a", titre: "Théâtre" });
    expect(r.perimee).toBe(true);
  });

  it("ne ressert JAMAIS une fiche retirée (404), et l'oublie", async () => {
    apiRequest.mockResolvedValueOnce({ id: "a" });
    await fetchPublic("/public/catalog/a", sansAttente);
    apiRequest.mockRejectedValueOnce(panne(404));
    const r = await fetchPublic("/public/catalog/a", sansAttente);
    expect(r.introuvable).toBe(true);
    expect(r.data).toBeUndefined();
    apiRequest.mockRejectedValue(panne(503));
    const apres = await fetchPublic("/public/catalog/a", sansAttente);
    expect(apres.data).toBeUndefined();
  });

  it("ne réessaie pas une erreur qui n'est pas une panne (400, 500)", async () => {
    apiRequest.mockRejectedValue(panne(400));
    await fetchPublic("/public/catalog/b", sansAttente);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    apiRequest.mockReset();
    apiRequest.mockRejectedValue(panne(500));
    const r = await fetchPublic("/public/catalog/b", sansAttente);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(r.introuvable).toBe(false);
  });
});
