import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetApiBaseUrl = vi.fn();

vi.mock("@/lib/api", () => ({
  getApiBaseUrl: () => mockGetApiBaseUrl(),
}));

const { GET } = await import("@/app/api/runtime-health/route");

describe("runtime health route", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiBaseUrl.mockReturnValue("http://api:3001/api");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("retourne l'état de santé API sans exposer l'URL complète", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api:3001/api/health",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(payload).toMatchObject({
      ok: true,
      api: {
        host: "api:3001",
        pathname: "/api",
      },
      status: 200,
    });
    expect(JSON.stringify(payload)).not.toContain("http://api:3001/api");
  });

  it("retourne 503 avec un message générique si l'API est indisponible", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      ok: false,
      error: "API health check failed",
      status: null,
    });
  });
});
