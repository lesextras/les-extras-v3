import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockGetMyDeskRequests = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`);
});

vi.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
  deleteSession: () => mockDeleteSession(),
}));

vi.mock("@/app/actions/desk", () => ({
  getMyDeskRequestsSafe: (token?: string) => mockGetMyDeskRequests(token),
  createUserDeskRequest: vi.fn(),
}));

const { default: MesDemandesPage } = await import("@/app/(dashboard)/dashboard/demandes/page");
const { default: LegacyMesDemandesPage } = await import("@/app/(dashboard)/demandes/page");

describe("MesDemandesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      token: "freelance-token",
      user: {
        id: "free-1",
        role: "FREELANCE",
      },
    });
    mockGetMyDeskRequests.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "desk-1",
          type: "MISSION_INFO_REQUEST",
          status: "ANSWERED",
          message: "Pouvez-vous préciser les horaires ?",
          response: "La mission commence à 8h.",
          createdAt: "2026-04-18T10:00:00.000Z",
          answeredAt: "2026-04-18T11:00:00.000Z",
          mission: {
            id: "mission-1",
            title: "Renfort éducateur",
          },
          booking: null,
          answeredBy: null,
        },
      ],
    });
  });

  it("rend la page canonique /dashboard/demandes pour un freelance", async () => {
    render(await MesDemandesPage());

    expect(screen.getByRole("heading", { name: /mes demandes/i })).toBeInTheDocument();
    expect(screen.getByText("Renfort éducateur")).toBeInTheDocument();
    expect(screen.getByText("La mission commence à 8h.")).toBeInTheDocument();
    expect(mockGetMyDeskRequests).toHaveBeenCalledWith("freelance-token");
  });

  it("rend aussi la page pour un établissement", async () => {
    mockGetSession.mockResolvedValue({
      token: "establishment-token",
      user: {
        id: "est-1",
        role: "ESTABLISHMENT",
      },
    });

    render(await MesDemandesPage());

    expect(screen.getByText("Créer une demande Desk")).toBeInTheDocument();
    expect(mockGetMyDeskRequests).toHaveBeenCalledWith("establishment-token");
  });

  it("affiche un état dégradé quand les demandes sont indisponibles", async () => {
    mockGetMyDeskRequests.mockResolvedValue({
      ok: false,
      error: "Demandes indisponibles pour le moment.",
    });

    render(await MesDemandesPage());

    expect(screen.getByText("Demandes indisponibles pour le moment.")).toBeInTheDocument();
    expect(screen.queryByText(/server components render/i)).not.toBeInTheDocument();
  });

  it("redirige l'ancienne route /demandes vers /dashboard/demandes", () => {
    expect(() => LegacyMesDemandesPage()).toThrow("redirect:/dashboard/demandes");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/demandes");
  });
});
