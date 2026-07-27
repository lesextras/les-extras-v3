/**
 * No-crash tests for the 3 Desk-specific admin pages.
 * Each page is tested with:
 *   - empty data (returns []) → component renders, no crash
 *   - API failure              → error alert appears, no crash
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const getDeskRequestsMock = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const getAdminUsersMock = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const getContactBypassEventsMock = vi.hoisted(() => vi.fn().mockResolvedValue([]));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("@/app/actions/admin", () => ({
  getDeskRequests: getDeskRequestsMock,
  getAdminUsers: getAdminUsersMock,
  getContactBypassEvents: getContactBypassEventsMock,
}));

// fetchAdminSafe: lightweight wrapper (no redirect) for test environment
vi.mock("@/lib/admin-safe-fetch", () => ({
  fetchAdminSafe: async (
    fn: () => Promise<unknown>,
    fallback: unknown,
    label: string,
  ) => {
    try {
      return { data: await fn(), error: null };
    } catch {
      return { data: fallback, error: `${label} indisponible pour le moment.` };
    }
  },
}));

vi.mock("@/components/admin/DeskRequestsTable", () => ({
  DeskRequestsTable: ({
    requests,
    admins,
  }: {
    requests: unknown[];
    admins: unknown[];
  }) => (
    <div data-testid="desk-requests-table">
      {requests.length} demandes · {admins.length} admins
    </div>
  ),
}));

vi.mock("@/components/admin/FinanceIncidentsTable", () => ({
  FinanceIncidentsTable: ({
    requests,
    admins,
  }: {
    requests: unknown[];
    admins: unknown[];
  }) => (
    <div data-testid="finance-incidents-table">
      {requests.length} incidents · {admins.length} admins
    </div>
  ),
}));

vi.mock("@/components/admin/ContactBypassEventsTable", () => ({
  ContactBypassEventsTable: ({ events }: { events: unknown[] }) => (
    <div data-testid="bypass-events-table">{events.length} événements</div>
  ),
}));

vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: { children: ReactNode }) => <div role="alert">{children}</div>,
  AlertTitle: ({ children }: { children: ReactNode }) => <strong>{children}</strong>,
  AlertDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

// ─── Page imports ─────────────────────────────────────────────────────────────

const { default: AdminDemandesPage } = await import(
  "@/app/(admin)/admin/demandes/page"
);
const { default: AdminIncidentsPage } = await import(
  "@/app/(admin)/admin/incidents/page"
);
const { default: AdminContactBypassEventsPage } = await import(
  "@/app/(admin)/admin/contournements/page"
);

// ─── /admin/demandes ──────────────────────────────────────────────────────────

describe("AdminDemandesPage (/admin/demandes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    getDeskRequestsMock.mockResolvedValue([]);
    getAdminUsersMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rend le titre 'Inbox Desk' sans crasher avec des données vides", async () => {
    render(await AdminDemandesPage());
    expect(screen.getByText("Inbox Desk")).toBeInTheDocument();
    expect(screen.getByTestId("desk-requests-table")).toBeInTheDocument();
    expect(screen.getByTestId("desk-requests-table")).toHaveTextContent("0 demandes");
  });

  it("affiche l'alerte partielle sans crasher si getDeskRequests échoue", async () => {
    getDeskRequestsMock.mockRejectedValueOnce(new Error("503"));
    render(await AdminDemandesPage());
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Données Desk partiellement indisponibles/)).toBeInTheDocument();
    // Table still renders (with fallback empty array)
    expect(screen.getByTestId("desk-requests-table")).toBeInTheDocument();
  });

  it("affiche l'alerte partielle sans crasher si getAdminUsers échoue", async () => {
    getAdminUsersMock.mockRejectedValueOnce(new Error("503"));
    render(await AdminDemandesPage());
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("desk-requests-table")).toBeInTheDocument();
  });

  it("n'affiche pas d'alerte si toutes les données sont disponibles", async () => {
    render(await AdminDemandesPage());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

// ─── /admin/incidents ─────────────────────────────────────────────────────────

describe("AdminIncidentsPage (/admin/incidents)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    getDeskRequestsMock.mockResolvedValue([]);
    getAdminUsersMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rend le titre 'Incidents Finance / Commerce' sans crasher avec des données vides", async () => {
    render(await AdminIncidentsPage());
    expect(screen.getByText("Incidents Finance / Commerce")).toBeInTheDocument();
    expect(screen.getByTestId("finance-incidents-table")).toBeInTheDocument();
    expect(screen.getByTestId("finance-incidents-table")).toHaveTextContent("0 incidents");
  });

  it("filtre les demandes pour ne garder que les types finance", async () => {
    getDeskRequestsMock.mockResolvedValueOnce([
      { id: "1", type: "PAYMENT_ISSUE", status: "OPEN" },      // finance ✓
      { id: "2", type: "TECHNICAL_ISSUE", status: "OPEN" },    // non-finance ✗
      { id: "3", type: "BOOKING_FAILURE", status: "OPEN" },    // finance ✓
    ]);
    render(await AdminIncidentsPage());
    // Only finance types pass through (2 out of 3)
    expect(screen.getByTestId("finance-incidents-table")).toHaveTextContent("2 incidents");
  });

  it("affiche l'alerte partielle sans crasher si getDeskRequests échoue", async () => {
    getDeskRequestsMock.mockRejectedValueOnce(new Error("503"));
    render(await AdminIncidentsPage());
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("finance-incidents-table")).toBeInTheDocument();
  });

  it("n'affiche pas d'alerte si toutes les données sont disponibles", async () => {
    render(await AdminIncidentsPage());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

// ─── /admin/contournements ────────────────────────────────────────────────────

describe("AdminContactBypassEventsPage (/admin/contournements)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContactBypassEventsMock.mockResolvedValue([]);
  });

  it("rend le titre 'Contournements' sans crasher avec des données vides", async () => {
    render(await AdminContactBypassEventsPage());
    expect(screen.getByText("Contournements")).toBeInTheDocument();
    expect(screen.getByTestId("bypass-events-table")).toBeInTheDocument();
    expect(screen.getByTestId("bypass-events-table")).toHaveTextContent("0 événements");
  });

  it("rend la liste avec des événements présents", async () => {
    getContactBypassEventsMock.mockResolvedValueOnce([
      {
        id: "evt-1",
        conversationId: null,
        bookingId: null,
        blockedReason: "PHONE",
        rawExcerpt: "+33 6 12 34 56 78",
        createdAt: new Date().toISOString(),
        sender: {
          id: "user-1",
          email: "user@test.fr",
          name: "Karim Bensalem",
          role: "FREELANCE",
          status: "VERIFIED",
        },
      },
    ]);
    render(await AdminContactBypassEventsPage());
    expect(screen.getByTestId("bypass-events-table")).toHaveTextContent("1 événements");
  });

  it("ne crashe pas si getContactBypassEvents retourne [] (comportement par défaut en erreur)", async () => {
    // getContactBypassEvents has internal try/catch in admin.ts — returns [] on error
    getContactBypassEventsMock.mockResolvedValueOnce([]);
    render(await AdminContactBypassEventsPage());
    expect(screen.getByText("Contournements")).toBeInTheDocument();
    expect(screen.getByTestId("bypass-events-table")).toBeInTheDocument();
  });
});
