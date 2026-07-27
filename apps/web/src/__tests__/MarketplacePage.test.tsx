import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnauthorizedError } from "@/lib/api";

const mockGetSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockGetAvailableMissionsStrict = vi.fn();
const mockGetServicesCatalogue = vi.fn();
const mockGetFreelancesStrict = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
}));

vi.mock("@/lib/session", () => ({
  deleteSession: () => mockDeleteSession(),
  getSession: () => mockGetSession(),
}));

vi.mock("@/app/actions/marketplace", () => ({
  getAvailableMissionsStrict: (...args: unknown[]) => mockGetAvailableMissionsStrict(...args),
  getServicesCatalogue: (...args: unknown[]) => mockGetServicesCatalogue(...args),
  getFreelancesStrict: (...args: unknown[]) => mockGetFreelancesStrict(...args),
}));

vi.mock("@/components/marketplace/FreelanceMarketplace", () => ({
  FreelanceMarketplace: ({ missionsError, servicesError }: {
    missionsError?: string | null;
    servicesError?: string | null;
  }) => (
    <div>
      <p>Freelance Marketplace</p>
      {missionsError && <p>{missionsError}</p>}
      {servicesError && <p>{servicesError}</p>}
    </div>
  ),
}));

vi.mock("@/components/marketplace/EstablishmentCatalogue", () => ({
  EstablishmentCatalogue: ({ services, freelances, initialTab, servicesError, freelancesError }: {
    services: unknown[];
    freelances: unknown[];
    initialTab?: string;
    servicesError?: string | null;
    freelancesError?: string | null;
  }) => (
    <div>
      <p>Establishment Catalogue</p>
      <p>services:{services.length}</p>
      <p>freelances:{freelances.length}</p>
      {initialTab && <p>tab:{initialTab}</p>}
      {servicesError && <p>{servicesError}</p>}
      {freelancesError && <p>{freelancesError}</p>}
    </div>
  ),
}));

const { default: MarketplacePage } = await import("@/app/(dashboard)/marketplace/page");

describe("MarketplacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      token: "token-1",
      user: { id: "u-1", role: "ESTABLISHMENT" },
    });
    mockGetAvailableMissionsStrict.mockResolvedValue([]);
    mockGetServicesCatalogue.mockResolvedValue([]);
    mockGetFreelancesStrict.mockResolvedValue([]);
  });

  it("garde le catalogue établissement accessible si les services échouent", async () => {
    mockGetServicesCatalogue.mockRejectedValue(new Error("API request failed (503)"));
    mockGetFreelancesStrict.mockResolvedValue([{ id: "free-1" }]);

    render(await MarketplacePage({}));

    expect(screen.getByText("Establishment Catalogue")).toBeInTheDocument();
    expect(screen.getByText("services:0")).toBeInTheDocument();
    expect(screen.getByText("freelances:1")).toBeInTheDocument();
    expect(
      screen.getByText(/impossible de charger les ateliers et formations pour le moment/i),
    ).toBeInTheDocument();
    expect(mockGetServicesCatalogue).toHaveBeenCalledWith(
      "token-1",
      "marketplace.establishment.services",
    );
  });

  it("garde le catalogue établissement accessible si les freelances échouent", async () => {
    mockGetServicesCatalogue.mockResolvedValue([{ id: "service-1" }]);
    mockGetFreelancesStrict.mockRejectedValue(new Error("API request failed (502)"));

    render(await MarketplacePage({}));

    expect(screen.getByText("services:1")).toBeInTheDocument();
    expect(screen.getByText("freelances:0")).toBeInTheDocument();
    expect(
      screen.getByText(/impossible de charger les profils extras vérifiés pour le moment/i),
    ).toBeInTheDocument();
    expect(mockGetFreelancesStrict).toHaveBeenCalledWith(
      "token-1",
      "marketplace.establishment.freelances",
    );
  });

  it("redirige l'établissement vers le login si la session API est expirée", async () => {
    mockGetServicesCatalogue.mockRejectedValue(new UnauthorizedError());

    await expect(MarketplacePage({})).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirige le freelance vers le login si la session API est expirée", async () => {
    mockGetSession.mockResolvedValue({
      token: "token-1",
      user: { id: "u-1", role: "FREELANCE" },
    });
    mockGetAvailableMissionsStrict.mockRejectedValue(new UnauthorizedError());

    await expect(MarketplacePage({})).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("passe l'onglet Formations au catalogue établissement", async () => {
    render(await MarketplacePage({ searchParams: { tab: "trainings" } }));

    expect(screen.getByText("tab:trainings")).toBeInTheDocument();
  });
});
