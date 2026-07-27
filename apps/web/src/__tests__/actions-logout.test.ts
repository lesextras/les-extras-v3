// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockDeleteSession = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@/lib/session", () => ({ deleteSession: () => mockDeleteSession() }));
vi.mock("next/navigation", () => ({ redirect: (...args: unknown[]) => { mockRedirect(...args); throw new Error("NEXT_REDIRECT"); } }));

const { logout } = await import("@/app/actions/logout");

// ── Tests ────────────────────────────────────────────────────────────────────
describe("logout action", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime la session et redirige vers /login", async () => {
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockDeleteSession).toHaveBeenCalledOnce();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("appelle deleteSession avant redirect", async () => {
    const callOrder: string[] = [];
    mockDeleteSession.mockImplementation(() => { callOrder.push("delete"); });
    mockRedirect.mockImplementation(() => { callOrder.push("redirect"); throw new Error("NEXT_REDIRECT"); });

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT");
    expect(callOrder).toEqual(["delete", "redirect"]);
  });
});
