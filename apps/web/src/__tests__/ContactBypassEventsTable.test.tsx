import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockMonitorContactBypassEvent = vi.fn().mockResolvedValue({ ok: true });
const mockSendAdminOutreach = vi.fn().mockResolvedValue({ ok: true });
const mockBanUser = vi.fn().mockResolvedValue({ ok: true });

vi.mock("@/app/actions/admin", () => ({
  banUser: (...args: unknown[]) => mockBanUser(...args),
  monitorContactBypassEvent: (...args: unknown[]) => mockMonitorContactBypassEvent(...args),
  sendAdminOutreach: (...args: unknown[]) => mockSendAdminOutreach(...args),
}));

vi.mock("@/components/data/FilterBar", () => ({
  FilterBar: ({
    onFilterChange,
    onSearchChange,
    onReset,
  }: {
    onFilterChange?: (key: string, value: string) => void;
    onSearchChange?: (value: string) => void;
    onReset?: () => void;
  }) => (
    <div>
      <input aria-label="sender-search" onChange={(event) => onSearchChange?.(event.target.value)} />
      <button type="button" onClick={() => onFilterChange?.("date", "TODAY")}>Date Today</button>
      <button type="button" onClick={() => onFilterChange?.("date", "7D")}>Date 7D</button>
      <button type="button" onClick={() => onFilterChange?.("blockedReason", "EMAIL")}>Reason Email</button>
      <button type="button" onClick={() => onFilterChange?.("blockedReason", "PHONE")}>Reason Phone</button>
      <button type="button" onClick={() => onReset?.()}>Reset</button>
    </div>
  ),
}));

const { ContactBypassEventsTable } = await import("@/components/admin/ContactBypassEventsTable");

const now = new Date();
const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

const emailEvent = {
  id: "event-1",
  conversationId: "conv-1",
  bookingId: "booking-1",
  blockedReason: "EMAIL" as const,
  rawExcerpt: "jo@example.com",
  createdAt: now.toISOString(),
  sender: {
    id: "user-1",
    name: "Aya Benali",
    email: "aya@test.fr",
    role: "FREELANCE" as const,
    status: "VERIFIED" as const,
  },
};

const phoneEvent = {
  id: "event-2",
  conversationId: null,
  bookingId: null,
  blockedReason: "PHONE" as const,
  rawExcerpt: "+33 6 12 34 56 78",
  createdAt: tenDaysAgo.toISOString(),
  sender: {
    id: "user-2",
    name: "Nora Diallo",
    email: "nora@test.fr",
    role: "ESTABLISHMENT" as const,
    status: "BANNED" as const,
  },
};

describe("ContactBypassEventsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filtre par raison, expéditeur et date", () => {
    render(<ContactBypassEventsTable events={[emailEvent, phoneEvent]} />);

    expect(screen.getByText("jo@example.com")).toBeInTheDocument();
    expect(screen.getByText("+33 6 12 34 56 78")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Reason Email"));
    expect(screen.getByText("jo@example.com")).toBeInTheDocument();
    expect(screen.queryByText("+33 6 12 34 56 78")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Reset"));
    fireEvent.change(screen.getByLabelText("sender-search"), { target: { value: "nora" } });
    expect(screen.getByText("+33 6 12 34 56 78")).toBeInTheDocument();
    expect(screen.queryByText("jo@example.com")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Reset"));
    fireEvent.click(screen.getByText("Date 7D"));
    expect(screen.getByText("jo@example.com")).toBeInTheDocument();
    expect(screen.queryByText("+33 6 12 34 56 78")).not.toBeInTheDocument();
  });

  it("affiche le label de risque centralisé (Haut pour PHONE)", () => {
    render(<ContactBypassEventsTable events={[phoneEvent]} />);
    expect(screen.getAllByText("Haut")[0]).toBeInTheDocument();
  });

  it("affiche le label de risque Moyen pour EMAIL avec utilisateur VERIFIED", () => {
    render(<ContactBypassEventsTable events={[emailEvent]} />);
    expect(screen.getByText("Moyen")).toBeInTheDocument();
  });

  it("affiche le statut utilisateur traduit en français", () => {
    render(<ContactBypassEventsTable events={[phoneEvent]} />);
    expect(screen.getByText("Banni")).toBeInTheDocument();
  });

  it("trie PHONE (risque Haut) avant EMAIL (risque Moyen) sans filtre actif", () => {
    render(
      <ContactBypassEventsTable
        events={[
          { ...emailEvent, createdAt: new Date().toISOString() },
          { ...phoneEvent, createdAt: new Date().toISOString() },
        ]}
      />,
    );
    const rows = screen.getAllByRole("row");
    // PHONE row appears first (higher risk)
    expect(rows[1]).toHaveTextContent("+33 6 12 34 56 78");
    expect(rows[2]).toHaveTextContent("jo@example.com");
  });

  it("appelle monitorContactBypassEvent avec l'id de l'événement au clic sur 'Surveiller'", async () => {
    render(<ContactBypassEventsTable events={[emailEvent]} />);
    fireEvent.click(screen.getByRole("button", { name: /surveiller/i }));
    await waitFor(() => {
      expect(mockMonitorContactBypassEvent).toHaveBeenCalledWith("event-1");
    });
  });

  it("ouvre la sheet de contact au clic sur 'Contacter'", () => {
    render(<ContactBypassEventsTable events={[emailEvent]} />);
    fireEvent.click(screen.getByRole("button", { name: /contacter/i }));
    // The outreach sheet renders with the sender name in the description
    expect(screen.getByText("Aya Benali")).toBeInTheDocument();
  });

  it("désactive l'envoi si le message personnalisé est vide", () => {
    render(<ContactBypassEventsTable events={[emailEvent]} />);
    fireEvent.click(screen.getByRole("button", { name: /contacter/i }));
    const sendBtn = screen.getByRole("button", { name: /envoyer le message/i });
    expect(sendBtn).toBeDisabled();
  });

  it("désactive l'envoi si le message personnalisé est inférieur à 5 caractères", () => {
    render(<ContactBypassEventsTable events={[emailEvent]} />);
    fireEvent.click(screen.getByRole("button", { name: /contacter/i }));
    const textarea = screen.getByPlaceholderText(/5 caractères minimum/i);
    fireEvent.change(textarea, { target: { value: "abc" } });
    expect(screen.getByRole("button", { name: /envoyer le message/i })).toBeDisabled();
  });

  it("active l'envoi avec un message de 5 caractères ou plus", () => {
    render(<ContactBypassEventsTable events={[emailEvent]} />);
    fireEvent.click(screen.getByRole("button", { name: /contacter/i }));
    const textarea = screen.getByPlaceholderText(/5 caractères minimum/i);
    fireEvent.change(textarea, { target: { value: "Message de test suffisant" } });
    expect(screen.getByRole("button", { name: /envoyer le message/i })).not.toBeDisabled();
  });

  it("appelle sendAdminOutreach avec le message personnalisé au clic", async () => {
    render(<ContactBypassEventsTable events={[emailEvent]} />);
    fireEvent.click(screen.getByRole("button", { name: /contacter/i }));
    const textarea = screen.getByPlaceholderText(/5 caractères minimum/i);
    fireEvent.change(textarea, { target: { value: "Message de test suffisant" } });
    fireEvent.click(screen.getByRole("button", { name: /envoyer le message/i }));
    await waitFor(() => {
      expect(mockSendAdminOutreach).toHaveBeenCalledWith(
        "user-1",
        "Message de test suffisant",
        expect.objectContaining({ origin: "CONTACT_BYPASS" }),
      );
    });
  });
});
