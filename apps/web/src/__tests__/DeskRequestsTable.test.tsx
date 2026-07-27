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

const mockRefresh = vi.fn();
const mockUpdateDeskRequestStatus = vi.fn().mockResolvedValue({ ok: true });
const mockRespondToDeskRequest = vi.fn().mockResolvedValue({ ok: true });
const mockAssignDeskRequest = vi.fn().mockResolvedValue({ ok: true });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/actions/admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/actions/admin")>();
  return {
    ...actual,
    updateDeskRequestStatus: (...args: unknown[]) => mockUpdateDeskRequestStatus(...args),
    respondToDeskRequest: (...args: unknown[]) => mockRespondToDeskRequest(...args),
    assignDeskRequest: (...args: unknown[]) => mockAssignDeskRequest(...args),
  };
});

const { DeskRequestsTable } = await import("@/components/admin/DeskRequestsTable");

function makeRequest(overrides: Partial<DeskRequestRow> = {}): DeskRequestRow {
  return {
    id: "dr-1",
    type: "TECHNICAL_ISSUE",
    priority: "NORMAL",
    status: "OPEN",
    assignedToAdminId: null,
    message: "Problème de chargement",
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

describe("DeskRequestsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le label de statut centralisé", () => {
    render(<DeskRequestsTable requests={[makeRequest({ status: "IN_PROGRESS" })]} admins={admins} />);
    expect(screen.getByText("En cours")).toBeInTheDocument();
  });

  it("affiche le label de priorité centralisé", () => {
    render(<DeskRequestsTable requests={[makeRequest({ priority: "URGENT" })]} admins={admins} />);
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("trie les demandes URGENT avant NORMAL", () => {
    const requests = [
      makeRequest({
        id: "normal-1",
        priority: "NORMAL",
        message: "Demande normale",
        createdAt: "2026-04-18T10:00:00.000Z",
      }),
      makeRequest({
        id: "urgent-1",
        priority: "URGENT",
        message: "Demande urgente",
        createdAt: "2026-04-18T11:00:00.000Z",
      }),
    ];
    render(<DeskRequestsTable requests={requests} admins={admins} />);
    const rows = screen.getAllByRole("row");
    // row[0] = header, row[1] = first data row (should be urgent)
    expect(rows[1]).toHaveTextContent("Demande urgente");
    expect(rows[2]).toHaveTextContent("Demande normale");
  });

  it("affiche les deux demandes quand aucun filtre statut n'est actif", () => {
    const requests = [
      makeRequest({ id: "open-1", status: "OPEN", message: "Ticket ouvert" }),
      makeRequest({ id: "closed-1", status: "CLOSED", message: "Ticket clôturé" }),
    ];
    render(<DeskRequestsTable requests={requests} admins={admins} />);
    expect(screen.getByText("Ticket ouvert")).toBeInTheDocument();
    expect(screen.getByText("Ticket clôturé")).toBeInTheDocument();
  });

  it("affiche les deux demandes (assignée et non assignée) par défaut", () => {
    const requests = [
      makeRequest({ id: "unassigned", assignedToAdminId: null, message: "Ticket sans responsable" }),
      makeRequest({ id: "assigned", assignedToAdminId: "admin-1", message: "Ticket avec responsable" }),
    ];
    render(<DeskRequestsTable requests={requests} admins={admins} />);
    expect(screen.getByText("Ticket sans responsable")).toBeInTheDocument();
    expect(screen.getByText("Ticket avec responsable")).toBeInTheDocument();
  });

  it("désactive le bouton d'envoi quand la réponse est vide", () => {
    render(<DeskRequestsTable requests={[makeRequest()]} admins={admins} />);
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    const sendButton = screen.getByRole("button", { name: /envoyer la réponse/i });
    expect(sendButton).toBeDisabled();
  });

  it("désactive le bouton d'envoi si le texte est inférieur à 5 caractères", () => {
    render(<DeskRequestsTable requests={[makeRequest()]} admins={admins} />);
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    const textarea = screen.getByPlaceholderText(/rédigez votre réponse/i);
    fireEvent.change(textarea, { target: { value: "abc" } });
    const sendButton = screen.getByRole("button", { name: /envoyer la réponse/i });
    expect(sendButton).toBeDisabled();
  });

  it("active le bouton d'envoi avec un texte d'au moins 5 caractères", () => {
    render(<DeskRequestsTable requests={[makeRequest()]} admins={admins} />);
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    const textarea = screen.getByPlaceholderText(/rédigez votre réponse/i);
    fireEvent.change(textarea, { target: { value: "Réponse suffisamment longue" } });
    const sendButton = screen.getByRole("button", { name: /envoyer la réponse/i });
    expect(sendButton).not.toBeDisabled();
  });

  it("appelle updateDeskRequestStatus avec CLOSED quand on clique sur Clôturer", async () => {
    render(<DeskRequestsTable requests={[makeRequest({ status: "OPEN" })]} admins={admins} />);
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    fireEvent.click(screen.getByRole("button", { name: /^clôturer$/i }));
    await waitFor(() => {
      expect(mockUpdateDeskRequestStatus).toHaveBeenCalledWith("dr-1", "CLOSED");
    });
  });

  it("appelle updateDeskRequestStatus avec IN_PROGRESS quand on clique sur Marquer en cours", async () => {
    render(<DeskRequestsTable requests={[makeRequest({ status: "OPEN" })]} admins={admins} />);
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    fireEvent.click(screen.getByRole("button", { name: /marquer en cours/i }));
    await waitFor(() => {
      expect(mockUpdateDeskRequestStatus).toHaveBeenCalledWith("dr-1", "IN_PROGRESS");
    });
  });

  it("affiche 'Date à confirmer' pour une date invalide", () => {
    render(
      <DeskRequestsTable
        requests={[makeRequest({ createdAt: "not-a-date" })]}
        admins={admins}
      />,
    );
    expect(screen.getByText("Date à confirmer")).toBeInTheDocument();
  });

  it("affiche un message vide quand la liste est vide", () => {
    render(<DeskRequestsTable requests={[]} admins={admins} />);
    expect(screen.getByText("Aucun ticket Desk pour le moment.")).toBeInTheDocument();
  });

  it("affiche le rôle de l'utilisateur quand il est disponible", () => {
    render(
      <DeskRequestsTable
        requests={[
          makeRequest({
            requester: { id: "u-1", email: "user@test.fr", role: "FREELANCE", profile: null },
          }),
        ]}
        admins={admins}
      />,
    );
    expect(screen.getAllByText("Freelance")).toHaveLength(1);
  });

  it("affiche le bouton 'Me l'assigner' quand currentAdminId est fourni et demande non assignée", () => {
    render(
      <DeskRequestsTable
        requests={[makeRequest({ assignedToAdminId: null })]}
        admins={admins}
        currentAdminId="admin-1"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    expect(screen.getByRole("button", { name: /me l'assigner/i })).toBeInTheDocument();
  });

  it("n'affiche pas le bouton 'Me l'assigner' quand la demande est déjà assignée à l'admin courant", () => {
    render(
      <DeskRequestsTable
        requests={[makeRequest({ assignedToAdminId: "admin-1" })]}
        admins={admins}
        currentAdminId="admin-1"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    expect(screen.queryByRole("button", { name: /me l'assigner/i })).not.toBeInTheDocument();
  });

  it("prérempli la réponse avec le template 'Problème technique' sans envoyer", () => {
    render(<DeskRequestsTable requests={[makeRequest()]} admins={admins} />);
    fireEvent.click(screen.getByRole("button", { name: /traiter/i }));
    fireEvent.click(screen.getByRole("button", { name: /problème technique/i }));
    const textarea = screen.getByPlaceholderText(/rédigez votre réponse/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Notre équipe technique");
    expect(mockRespondToDeskRequest).not.toHaveBeenCalled();
  });
});
