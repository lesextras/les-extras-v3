import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockGetEstablishmentMissions = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
}));

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
  deleteSession: () => mockDeleteSession(),
}));

vi.mock("@/app/actions/missions", () => ({
  getEstablishmentMissions: (...args: unknown[]) => mockGetEstablishmentMissions(...args),
}));

vi.mock("@/components/dashboard/establishment/CandidateCard", () => ({
  CandidateCard: () => <div>CandidateCard</div>,
}));

vi.mock("@/components/dashboard/establishment/PublishRenfortButton", () => ({
  PublishRenfortButton: () => <button type="button">Nouveau renfort</button>,
}));

vi.mock("@/components/dashboard/establishment/RenfortsEmptyState", () => ({
  RenfortsEmptyState: () => <div>Aucune mission en cours</div>,
}));

const { default: RenfortsPage } = await import("@/app/(dashboard)/dashboard/renforts/page");
const { UnauthorizedError } = await import("@/lib/api");

describe("RenfortsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      token: "est-token",
      user: { id: "est-1", role: "ESTABLISHMENT" },
    });
    mockGetEstablishmentMissions.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rend un état vide sans erreur quand aucune mission n'est disponible", async () => {
    render(await RenfortsPage());

    expect(screen.getByRole("heading", { name: /missions de renfort/i })).toBeInTheDocument();
    expect(screen.getByText(/aucune mission en cours/i)).toBeInTheDocument();
    expect(mockGetEstablishmentMissions).toHaveBeenCalledWith("est-token");
  });

  it("affiche un bandeau non bloquant si les missions établissement échouent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetEstablishmentMissions.mockRejectedValue(new Error("API request failed (503)"));

    render(await RenfortsPage());

    expect(
      screen.getByText(/impossible de charger vos missions de renfort pour le moment/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/aucune mission en cours/i)).toBeInTheDocument();
    expect(screen.queryByText(/server components render/i)).not.toBeInTheDocument();
  });

  it("redirige vers /login si l'API renvoie une session expirée", async () => {
    mockGetEstablishmentMissions.mockRejectedValue(new UnauthorizedError());

    await expect(RenfortsPage()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockDeleteSession).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
