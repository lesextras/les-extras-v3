// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────
const jwtVerifyMock = vi.hoisted(() => vi.fn());

vi.mock("jose", () => ({
  jwtVerify: jwtVerifyMock,
}));

// Mock env
vi.stubEnv("APP_RUNTIME", "front");
vi.stubEnv("SESSION_SECRET", "test-secret");

const { middleware } = await import("@/middleware");

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = new URL(pathname, "http://localhost:3000");
  const req = new NextRequest(url);
  for (const [k, v] of Object.entries(cookies)) {
    req.cookies.set(k, v);
  }
  return req;
}

// ── Front runtime tests ─────────────────────────────────────────────────────
describe("middleware — front runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APP_RUNTIME", "front");
    vi.stubEnv("SESSION_SECRET", "test-secret");
    jwtVerifyMock.mockResolvedValue({ payload: { role: "FREELANCE" } });
  });

  it("/health passe toujours", async () => {
    const res = await middleware(makeRequest("/health"));
    expect(res.status).toBe(200);
  });

  it("/api/runtime-health passe toujours", async () => {
    const res = await middleware(makeRequest("/api/runtime-health"));
    expect(res.status).toBe(200);
  });

  it("redirige /admin vers /marketplace sur le front", async () => {
    const res = await middleware(makeRequest("/admin"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/marketplace");
  });

  // ── Protected routes without session ──
  for (const route of ["/dashboard", "/wizard", "/settings", "/marketplace", "/missions", "/bookings", "/account", "/messages"]) {
    it(`redirige ${route} vers /login si pas de session`, async () => {
      const res = await middleware(makeRequest(route));
      expect(res.status).toBe(307);
      const loc = new URL(res.headers.get("location")!);
      expect(loc.pathname).toBe("/login");
      expect(loc.searchParams.get("redirect")).toBe(route);
    });
  }

  it("redirige /dashboard/sub vers /login si pas de session", async () => {
    const res = await middleware(makeRequest("/dashboard/sub"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
  });

  // ── Protected routes with session ──
  it("laisse passer /dashboard si session présente", async () => {
    const res = await middleware(makeRequest("/dashboard", { lesextras_session: "jwt" }));
    expect(res.status).toBe(200);
  });

  // ── Auth pages with session ──
  for (const page of ["/login", "/register", "/auth/forgot-password", "/auth/reset-password"]) {
    it(`redirige ${page} vers /dashboard si session présente`, async () => {
      const res = await middleware(makeRequest(page, { lesextras_session: "jwt" }));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/dashboard");
    });
  }

  // ── Auth pages without session ──
  it("laisse passer /login sans session", async () => {
    const res = await middleware(makeRequest("/login"));
    expect(res.status).toBe(200);
  });

  it("laisse passer /register sans session", async () => {
    const res = await middleware(makeRequest("/register"));
    expect(res.status).toBe(200);
  });

  // ── Public routes ──
  it("laisse passer / sans redirection", async () => {
    const res = await middleware(makeRequest("/"));
    expect(res.status).toBe(200);
  });
});

describe("middleware — desk runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APP_RUNTIME", "desk");
    vi.stubEnv("JWT_SECRET", "test-secret");
    jwtVerifyMock.mockResolvedValue({ payload: { role: "ADMIN" } });
  });

  it("redirige / vers /admin", async () => {
    const res = await middleware(makeRequest("/"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin");
  });

  it("/api/runtime-health passe sans session admin", async () => {
    const res = await middleware(makeRequest("/api/runtime-health"));
    expect(res.status).toBe(200);
  });

  it("redirige /admin vers /admin/login sans session admin", async () => {
    const res = await middleware(makeRequest("/admin"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("laisse passer /admin/login sans session admin", async () => {
    const res = await middleware(makeRequest("/admin/login"));
    expect(res.status).toBe(200);
  });

  it("redirige /admin/login vers /admin si la session admin est valide", async () => {
    const res = await middleware(makeRequest("/admin/login", { lesextras_admin_token: "jwt" }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin");
  });
});
