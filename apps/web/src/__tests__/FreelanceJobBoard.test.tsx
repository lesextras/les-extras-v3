import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FreelanceJobBoard } from "@/components/marketplace/FreelanceJobBoard";
import type { SerializedMission } from "@/app/actions/marketplace";

const mockApplyToMission = vi.fn(async (_missionId: string) => ({ ok: true }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/actions/missions", () => ({
  applyToMission: (missionId: string) => mockApplyToMission(missionId),
}));

const missions: SerializedMission[] = [
  {
    id: "m-1",
    title: "Aide-soignant(e) de nuit",
    dateStart: "2026-04-01T21:00:00.000Z",
    dateEnd: "2026-04-02T07:00:00.000Z",
    address: "Paris",
    hourlyRate: 28,
    status: "OPEN",
    isRenfort: true,
    metier: "AIDE_SOIGNANT",
    shift: "NUIT",
    city: "Paris",
    zipCode: "75001",
    isUrgent: false,
    establishment: { profile: { companyName: "EHPAD A", city: "Paris", avatar: null } },
  },
  {
    id: "m-2",
    title: "Infirmier(e) jour",
    dateStart: "2026-04-05T07:00:00.000Z",
    dateEnd: "2026-04-05T19:00:00.000Z",
    address: "Lyon",
    hourlyRate: 32,
    status: "OPEN",
    isRenfort: false,
    metier: "INFIRMIER",
    shift: "JOUR",
    city: "Lyon",
    zipCode: "69001",
    isUrgent: true,
    establishment: { profile: { companyName: "Clinique B", city: "Lyon", avatar: null } },
  },
];

describe("FreelanceJobBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApplyToMission.mockResolvedValue({ ok: true });
  });

  it("affiche le titre de la page", () => {
    render(<FreelanceJobBoard missions={missions} />);
    expect(screen.getByRole("heading", { name: /missions de renfort/i })).toBeInTheDocument();
  });

  it("affiche le nombre de missions disponibles", () => {
    render(<FreelanceJobBoard missions={missions} />);
    expect(screen.getByText(/2 missions disponibles/i)).toBeInTheDocument();
  });

  it("rend une card par mission", () => {
    render(<FreelanceJobBoard missions={missions} />);
    expect(screen.getAllByRole("link").filter((l) =>
      l.getAttribute("href")?.startsWith("/marketplace/missions/"),
    )).toHaveLength(missions.length);
  });

  it("filtre les missions par recherche textuelle", () => {
    render(<FreelanceJobBoard missions={missions} />);
    const searchInput = screen.getByPlaceholderText(/ville, métier/i);
    fireEvent.change(searchInput, { target: { value: "Lyon" } });
    // Only Lyon mission should show
    expect(screen.getByText("Clinique B")).toBeInTheDocument();
    expect(screen.queryByText("EHPAD A")).not.toBeInTheDocument();
  });

  it("affiche l'état vide quand aucune mission ne correspond au filtre", () => {
    render(<FreelanceJobBoard missions={missions} />);
    const searchInput = screen.getByPlaceholderText(/ville, métier/i);
    fireEvent.change(searchInput, { target: { value: "Marseille" } });
    expect(screen.getByText(/aucune mission/i)).toBeInTheDocument();
  });

  it("filtre les missions avec un ancien id métier mappé vers la V1", () => {
    const missionsWithLegacyMetier: SerializedMission[] = [
      {
        ...missions[0]!,
        id: "legacy-night",
        title: "Ancien veilleur de nuit",
        metier: "VEILLEUR_DE_NUIT",
        establishment: { profile: { companyName: "Foyer legacy", city: "Paris", avatar: null } },
      },
      {
        ...missions[1]!,
        id: "psychologue-day",
        title: "Psychologue jour",
        metier: "psychologue",
        establishment: { profile: { companyName: "MAS psy", city: "Lyon", avatar: null } },
      },
    ];

    render(<FreelanceJobBoard missions={missionsWithLegacyMetier} />);
    fireEvent.click(screen.getByRole("button", { name: /surveillant de nuit/i }));

    expect(screen.getByText("Foyer legacy")).toBeInTheDocument();
    expect(screen.queryByText("MAS psy")).not.toBeInTheDocument();
  });

  it("affiche l'état vide quand missions=[]", () => {
    render(<FreelanceJobBoard missions={[]} />);
    expect(screen.getByText(/aucune mission/i)).toBeInTheDocument();
  });

  it("postule directement depuis une carte sans ouvrir de popup", async () => {
    render(<FreelanceJobBoard missions={missions} />);

    fireEvent.click(screen.getAllByRole("button", { name: /^postuler$/i })[0]!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockApplyToMission).toHaveBeenCalledWith("m-1");
    });
  });
});
