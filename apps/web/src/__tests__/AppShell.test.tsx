import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRouterPush = vi.fn();
const mockOpenRenfortModal = vi.fn();
const mockCloseRenfortModal = vi.fn();

const store = {
  userRole: "FREELANCE" as "ESTABLISHMENT" | "FREELANCE" | null,
  isRenfortModalOpen: false,
  openRenfortModal: mockOpenRenfortModal,
  closeRenfortModal: mockCloseRenfortModal,
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (state: typeof store) => unknown) => selector(store),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <div data-testid="header" />,
}));

vi.mock("@/components/layout/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

vi.mock("@/components/modals/RenfortModal", () => ({
  RenfortModal: () => <div data-testid="renfort-modal" />,
}));

vi.mock("@/components/modals/PublishModal", () => ({
  PublishModal: () => null,
}));

vi.mock("@/components/modals/BookServiceModal", () => ({
  BookServiceModal: () => null,
}));

vi.mock("@/components/modals/QuoteRequestModal", () => ({
  QuoteRequestModal: () => null,
}));

vi.mock("@/components/modals/QuoteEditorModal", () => ({
  QuoteEditorModal: () => null,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/lib/hooks/useScrollProgress", () => ({
  useScrollProgress: () => ({
    scrollRef: { current: null },
    headerOpacity: undefined,
    borderOpacity: undefined,
  }),
}));

vi.mock("@/components/ui/mobile-bottom-nav", () => ({
  MobileBottomNav: ({
    items,
    onFabClick,
    fabLabel,
  }: {
    items: { id: string; label: string; onClick?: () => void }[];
    onFabClick?: () => void;
    fabLabel?: string;
  }) => (
    <nav aria-label="Navigation mobile">
      {items
        .filter((item) => item.id !== "fab")
        .map((item) => (
          <button key={item.id} type="button" onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      <button type="button" onClick={onFabClick}>
        {fabLabel}
      </button>
    </nav>
  ),
}));

const { AppShell } = await import("@/components/layout/AppShell");

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.userRole = "FREELANCE";
    store.isRenfortModalOpen = false;
  });

  it("redirige le FAB freelance vers /marketplace", async () => {
    const user = userEvent.setup();
    render(<AppShell><div>content</div></AppShell>);

    await user.click(screen.getByRole("button", { name: /chercher des missions/i }));
    expect(mockRouterPush).toHaveBeenCalledWith("/marketplace");
    expect(mockOpenRenfortModal).not.toHaveBeenCalled();
  });

  it("ouvre RenfortModal via FAB pour établissement", async () => {
    const user = userEvent.setup();
    store.userRole = "ESTABLISHMENT";
    render(<AppShell><div>content</div></AppShell>);

    await user.click(screen.getByRole("button", { name: /publier un renfort/i }));
    expect(mockOpenRenfortModal).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("oriente le compte mobile établissement vers Mon Établissement", async () => {
    const user = userEvent.setup();
    store.userRole = "ESTABLISHMENT";
    render(<AppShell><div>content</div></AppShell>);

    expect(screen.queryByRole("button", { name: /^profil$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /établ\./i }));
    expect(mockRouterPush).toHaveBeenCalledWith("/account/establishment");
  });

  it("ferme la modale renfort si le rôle n'est pas établissement", async () => {
    store.userRole = "FREELANCE";
    store.isRenfortModalOpen = true;
    render(<AppShell><div>content</div></AppShell>);

    expect(screen.queryByTestId("renfort-modal")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockCloseRenfortModal).toHaveBeenCalledTimes(1);
    });
  });

  it("FAB affiche le label générique quand userRole est null", () => {
    store.userRole = null;
    render(<AppShell><div>content</div></AppShell>);
    expect(screen.getByRole("button", { name: /action rapide/i })).toBeInTheDocument();
  });

  it("FAB ne déclenche aucune action quand userRole est null", async () => {
    const user = userEvent.setup();
    store.userRole = null;
    render(<AppShell><div>content</div></AppShell>);

    await user.click(screen.getByRole("button", { name: /action rapide/i }));
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockOpenRenfortModal).not.toHaveBeenCalled();
  });

  it("label FAB est 'Chercher des missions' pour un FREELANCE", () => {
    store.userRole = "FREELANCE";
    render(<AppShell><div /></AppShell>);
    expect(screen.getByRole("button", { name: /chercher des missions/i })).toBeInTheDocument();
  });

  it("label FAB est 'Publier un renfort' pour un ESTABLISHMENT", () => {
    store.userRole = "ESTABLISHMENT";
    render(<AppShell><div /></AppShell>);
    expect(screen.getByRole("button", { name: /publier un renfort/i })).toBeInTheDocument();
  });
});
