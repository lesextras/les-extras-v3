import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

const store = {
  userRole: "ESTABLISHMENT" as "ESTABLISHMENT" | "FREELANCE" | null,
  pathname: "/account/establishment",
};

vi.mock("next/navigation", () => ({
  usePathname: () => store.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (state: typeof store) => unknown) => selector(store),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({
    open,
    children,
  }: {
    open: boolean;
    children: ReactNode;
  }) => <>{open ? children : null}</>,
  SheetContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SheetHeader: ({ children }: { children: ReactNode }) => <>{children}</>,
  SheetTitle: ({ children }: { children: ReactNode }) => <>{children}</>,
  SheetDescription: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const { Sidebar } = await import("@/components/layout/Sidebar");

function getMainNavigation() {
  return screen.getByRole("navigation", { name: /navigation principale/i });
}

function getAccountSection() {
  const accountLabel = screen.getByText("Compte");
  const accountSection = accountLabel.parentElement;
  expect(accountSection).not.toBeNull();
  return accountSection as HTMLElement;
}

describe("Sidebar", () => {
  beforeEach(() => {
    store.userRole = "ESTABLISHMENT";
    store.pathname = "/account/establishment";
  });

  it("n'affiche qu'un seul lien actif sur /account/establishment", () => {
    render(<Sidebar isMobileOpen={false} onMobileOpenChange={() => undefined} />);

    const activeLinks = screen.getAllByRole("link", { current: "page" });
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveTextContent(/mon établissement/i);
  });

  it("centre le compte établissement sur Mon Établissement et Paramètres", () => {
    render(<Sidebar isMobileOpen={false} onMobileOpenChange={() => undefined} />);

    const accountSection = getAccountSection();

    expect(screen.queryByRole("link", { name: /mon profil/i })).not.toBeInTheDocument();
    expect(within(accountSection).getByRole("link", { name: /mes demandes/i })).toHaveAttribute(
      "href",
      "/dashboard/demandes",
    );
    expect(within(accountSection).getByRole("link", { name: /mon établissement/i })).toHaveAttribute(
      "href",
      "/account/establishment",
    );
    expect(within(accountSection).getByRole("link", { name: /paramètres/i })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("déplace Mes demandes hors de la navigation principale pour les deux rôles", () => {
    for (const userRole of ["ESTABLISHMENT", "FREELANCE"] as const) {
      store.userRole = userRole;
      store.pathname = "/dashboard";

      const { unmount } = render(
        <Sidebar isMobileOpen={false} onMobileOpenChange={() => undefined} />,
      );

      expect(
        within(getMainNavigation()).queryByRole("link", { name: /mes demandes/i }),
      ).not.toBeInTheDocument();

      unmount();
    }
  });

  it("affiche Mes demandes dans le compte freelance", () => {
    store.userRole = "FREELANCE";
    store.pathname = "/dashboard/demandes";

    render(<Sidebar isMobileOpen={false} onMobileOpenChange={() => undefined} />);

    expect(within(getAccountSection()).getByRole("link", { name: /mes demandes/i })).toHaveAttribute(
      "href",
      "/dashboard/demandes",
    );
    expect(screen.queryByRole("link", { name: /crédits/i })).not.toBeInTheDocument();
  });

  it("affiche Mes demandes dans le compte établissement", () => {
    store.userRole = "ESTABLISHMENT";
    store.pathname = "/dashboard/demandes";

    render(<Sidebar isMobileOpen={false} onMobileOpenChange={() => undefined} />);

    expect(within(getAccountSection()).getByRole("link", { name: /mes demandes/i })).toHaveAttribute(
      "href",
      "/dashboard/demandes",
    );
  });

  it("marque Mes demandes comme seul lien actif sur /dashboard/demandes pour les deux rôles", () => {
    for (const userRole of ["ESTABLISHMENT", "FREELANCE"] as const) {
      store.userRole = userRole;
      store.pathname = "/dashboard/demandes";

      const { unmount } = render(
        <Sidebar isMobileOpen={false} onMobileOpenChange={() => undefined} />,
      );

      const activeLinks = screen.getAllByRole("link", { current: "page" });
      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0]).toHaveTextContent(/mes demandes/i);
      expect(activeLinks[0]).toHaveAttribute("href", "/dashboard/demandes");

      unmount();
    }
  });

  it("conserve le lien Crédits pour un établissement", () => {
    store.userRole = "ESTABLISHMENT";
    store.pathname = "/dashboard/packs";

    render(<Sidebar isMobileOpen={false} onMobileOpenChange={() => undefined} />);

    expect(screen.getByRole("link", { name: /crédits/i })).toHaveAttribute(
      "href",
      "/dashboard/packs",
    );
  });
});
