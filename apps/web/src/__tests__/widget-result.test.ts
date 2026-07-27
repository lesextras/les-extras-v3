import { describe, it, expect, vi } from "vitest";
import { fetchSafe } from "@/lib/widget-result";
import { UnauthorizedError } from "@/lib/api";

describe("fetchSafe", () => {
    it("retourne { data, error: null } quand la promesse réussit", async () => {
        const result = await fetchSafe(() => Promise.resolve([1, 2, 3]), [], "Test");
        expect(result).toEqual({ data: [1, 2, 3], error: null });
    });

    it("retourne { data: fallback, error: message } quand la promesse échoue", async () => {
        const result = await fetchSafe(
            () => Promise.reject(new Error("réseau hors ligne")),
            [],
            "Renforts",
        );
        expect(result.data).toEqual([]);
        expect(result.error).toMatch(/Renforts indisponible/);
    });

    it("logue l'erreur dans la console sans la propager", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        await fetchSafe(() => Promise.reject(new Error("boom")), null, "Widget");
        expect(spy).toHaveBeenCalledWith("[dashboard] Widget:", expect.any(Error));
        spy.mockRestore();
    });

    it("utilise le bon fallback pour les primitives", async () => {
        const result = await fetchSafe(() => Promise.reject(new Error("fail")), 0, "Crédits");
        expect(result.data).toBe(0);
        expect(result.error).not.toBeNull();
    });

    it("propage les 401 pour laisser la page rediriger vers /login", async () => {
        await expect(
            fetchSafe(() => Promise.reject(new UnauthorizedError()), [], "Session"),
        ).rejects.toBeInstanceOf(UnauthorizedError);
    });
});
