import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AdminUserRow, DeskRequestRow } from "@/app/actions/admin";

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockCreateFinanceIncident = vi.fn().mockResolvedValue({ id: "new-id" });
const mockUpdateDeskRequestStatus = vi.fn().mockResolvedValue({ ok: true });
const mockRespondToDeskRequest = vi.fn().mockResolvedValue({ ok: true });
const mockAssignDeskRequest = vi.fn().mockResolvedValue({ ok: true });

// Minimal mock: only runtime values are needed (types are erased)
vi.mock("@/app/actions/admin", () => ({
  createFinanceIncident: (...args: unknown[]) => mockCreateFinanceIncident(...args),
  updateDeskRequestStatus: (...args: unknown[]) => mockUpdateDeskRequestStatus(...args),
  respondToDeskRequest: (...args: unknown[]) => mockRespondToDeskRequest(...args),
  assignDeskRequest: (...args: unknown[]) => mockAssignDeskRequest(...args),
}));

const { FinanceIncidentsTable } = await import("@/components/admin/FinanceIncidentsTable");

function makeRequest(overrides: Partial<DeskRequestRow> = {}): DeskRequestRow {
  return {
    id: "dr-1",
    type: "PAYMENT_ISSUE",
    priority: "NORMAL",
    status: "OPEN",
    assignedToAdminId: null,
    message: "Paiement bloqué depuis 3 jours",
    response: null,
    answeredAt: null,
    createdAt: "2026-04-18T10:00:00.000Z",
    mission: null,
    booking: null,
    requester: {
      id: "u-1",
      email: "user@test.fr",
      profile: { firstName: "Karim", lastName: "Bensalem" },
    },
    assignedToAdmin: null,
    answeredBy: null,
    ...overrides,
  };
}

const admins: AdminUserRow[] = [
  {
    id: "admin-1",
    name: "Camille Renaud",
    email: "admin@test.fr",
    role: "ADMIN",
    status: "VERIFIED",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

// ─── Component tests ──────────────────────────────────────────────────────────

describe("FinanceIncidentsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("utilise le label centralisé pour le statut IN_PROGRESS", () => {
    render(
      <FinanceIncidentsTable requests={[makeRequest({ status: "IN_PROGRESS" })]} admins={admins} />,
    );
    expect(screen.getByText("En cours")).toBeInTheDocument();
  });

  it("utilise le label centralisé pour la priorité URGENT", () => {
    render(
      <FinanceIncidentsTable requests={[makeRequest({ priority: "URGENT" })]} admins={admins} />,
    );
    expect(screen.getAllByText("Urgente")[0]).toBeInTheDocument();
  });

  it("affiche le label type finance 'Problème paiement' pour PAYMENT_ISSUE", () => {
    render(
      <FinanceIncidentsTable requests={[makeRequest({ type: "PAYMENT_ISSUE" })]} admins={admins} />,
    );
    // getAllByText handles cases where the label appears in multiple elements (table cell + filter options)
    expect(screen.getAllByText("Problème paiement").length).toBeGreaterThan(0);
  });

  it("affiche le contexte booking avec 'Payé' via getBookingStatusLabel pour PAID", () => {
    const request = makeRequest({
      booking: {
        id: "booking-1",
        status: "PAID",
        paymentStatus: "PAID",
        reliefMission: { title: "Mission de nuit" },
        service: null,
        establishment: null,
      },
    });
    render(<FinanceIncidentsTable requests={[request]} admins={admins} />);
    // The booking context column renders "Mission de nuit — Payé"
    expect(screen.getByText("Mission de nuit — Payé")).toBeInTheDocument();
  });

  it("affiche le paymentStatus dans le détail sheet pour un booking PAID", () => {
    const request = makeRequest({
      booking: {
        id: "booking-42",
        status: "COMPLETED",
        paymentStatus: "PAID",
        reliefMission: { title: "Atelier thérapie" },
        service: null,
        establishment: {
          id: "est-1",
          email: "est@test.fr",
          profile: { firstName: "Sophie", lastName: "Bournet" },
        },
      },
    });
    render(<FinanceIncidentsTable requests={[request]} admins={admins} />);
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    // Payment status badge in detail sheet
    expect(screen.getAllByText("Payé")[0]).toBeInTheDocument();
    // Establishment name appears in the booking context section
    expect(screen.getAllByText(/Sophie Bournet/)[0]).toBeInTheDocument();
  });

  it("désactive le bouton de création si l'email est invalide", () => {
    render(<FinanceIncidentsTable requests={[]} admins={admins} />);
    const submitBtn = screen.getByRole("button", { name: /créer l'incident/i });
    expect(submitBtn).toBeDisabled();

    // Valid message but missing email → still disabled
    const textarea = screen.getByPlaceholderText(/décrivez le problème/i);
    fireEvent.change(textarea, { target: { value: "Problème de paiement constaté" } });
    expect(submitBtn).toBeDisabled();
  });

  it("désactive le bouton de création si le message est inférieur à 5 caractères", () => {
    render(<FinanceIncidentsTable requests={[]} admins={admins} />);
    const submitBtn = screen.getByRole("button", { name: /créer l'incident/i });

    // Valid email, short message
    const emailInput = screen.getByPlaceholderText("utilisateur@domaine.fr");
    fireEvent.change(emailInput, { target: { value: "test@test.fr" } });
    fireEvent.change(screen.getByPlaceholderText(/décrivez le problème/i), {
      target: { value: "abc" },
    });
    expect(submitBtn).toBeDisabled();
  });

  it("active le bouton de création avec email valide et message d'au moins 5 caractères", () => {
    render(<FinanceIncidentsTable requests={[]} admins={admins} />);

    fireEvent.change(screen.getByPlaceholderText("utilisateur@domaine.fr"), {
      target: { value: "test@test.fr" },
    });
    fireEvent.change(screen.getByPlaceholderText(/décrivez le problème/i), {
      target: { value: "Problème de paiement bloqué" },
    });

    expect(screen.getByRole("button", { name: /créer l'incident/i })).not.toBeDisabled();
  });

  it("affiche une alerte si l'email est touché mais invalide", () => {
    render(<FinanceIncidentsTable requests={[]} admins={admins} />);
    const emailInput = screen.getByPlaceholderText("utilisateur@domaine.fr");

    fireEvent.change(emailInput, { target: { value: "pas-un-email" } });
    fireEvent.blur(emailInput);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/adresse email valide/i);
  });

  it("affiche 'Date à confirmer' pour une date invalide", () => {
    render(
      <FinanceIncidentsTable
        requests={[makeRequest({ createdAt: "not-a-date" })]}
        admins={admins}
      />,
    );
    expect(screen.getByText("Date à confirmer")).toBeInTheDocument();
  });

  it("affiche un état vide actionnable avec bouton 'Créer le premier incident'", () => {
    render(<FinanceIncidentsTable requests={[]} admins={admins} />);
    expect(
      screen.getByText("Aucun incident finance / commerce pour le moment."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /créer le premier incident/i }),
    ).toBeInTheDocument();
  });

  it("trie les incidents URGENT avant NORMAL", () => {
    const requests = [
      makeRequest({
        id: "normal-1",
        priority: "NORMAL",
        type: "BOOKING_FAILURE",
        createdAt: "2026-04-18T10:00:00.000Z",
      }),
      makeRequest({
        id: "urgent-1",
        priority: "URGENT",
        type: "PAYMENT_ISSUE",
        createdAt: "2026-04-18T11:00:00.000Z",
      }),
    ];
    render(<FinanceIncidentsTable requests={requests} admins={admins} />);
    const rows = screen.getAllByRole("row");
    // URGENT row first (type = PAYMENT_ISSUE → "Problème paiement")
    expect(rows[1]).toHaveTextContent("Problème paiement");
    // NORMAL row second (type = BOOKING_FAILURE → "Réservation échouée")
    expect(rows[2]).toHaveTextContent("Réservation échouée");
  });

  it("appelle updateDeskRequestStatus avec CLOSED quand on clique 'Clôturer' dans le détail", async () => {
    render(<FinanceIncidentsTable requests={[makeRequest({ status: "OPEN" })]} admins={admins} />);
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    fireEvent.click(screen.getByRole("button", { name: /^clôturer$/i }));
    await waitFor(() => {
      expect(mockUpdateDeskRequestStatus).toHaveBeenCalledWith("dr-1", "CLOSED");
    });
  });
});

// ─── getBookingStatusLabel unit tests ─────────────────────────────────────────

describe("getBookingStatusLabel (booking-status.ts)", () => {
  it("retourne 'Payé' pour PAID", async () => {
    const { getBookingStatusLabel } = await import("@/lib/booking-status");
    expect(getBookingStatusLabel("PAID")).toBe("Payé");
  });

  it("retourne 'Annulé' pour CANCELLED", async () => {
    const { getBookingStatusLabel } = await import("@/lib/booking-status");
    expect(getBookingStatusLabel("CANCELLED")).toBe("Annulé");
  });

  it("retourne 'Paiement attendu' pour AWAITING_PAYMENT", async () => {
    const { getBookingStatusLabel } = await import("@/lib/booking-status");
    expect(getBookingStatusLabel("AWAITING_PAYMENT")).toBe("Paiement attendu");
  });

  it("retourne 'Terminé' pour COMPLETED", async () => {
    const { getBookingStatusLabel } = await import("@/lib/booking-status");
    expect(getBookingStatusLabel("COMPLETED")).toBe("Terminé");
  });
});
