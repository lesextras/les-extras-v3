import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MatchingMissionsWidget } from "@/components/dashboard/MatchingMissionsWidget";
import type { MatchingMission } from "@/components/dashboard/MatchingMissionsWidget";

const mockApplyToMission = vi.fn();
const mockRefresh = vi.fn();
let resolveApply: ((value: { ok: boolean; error?: string }) => void) | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/actions/missions", () => ({
  applyToMission: (...args: unknown[]) => mockApplyToMission(...args),
}));

const missions: MatchingMission[] = [
  {
    id: "m-1",
    title: "Aide-soignant(e)",
    establishment: "EHPAD A",
    city: "Paris",
    urgent: false,
    matchReasons: ["Même ville", "Compétence proche", "Disponible ce jour"],
  },
  { id: "m-2", title: "Infirmier(e)", establishment: "Clinique B", city: "Lyon", urgent: true },
  { id: "m-3", title: "ASH", establishment: "MAS C", city: "Bordeaux" },
];

describe("MatchingMissionsWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApplyToMission.mockResolvedValue({ ok: true });
  });

  it("affiche les missions passées en props", () => {
    render(<MatchingMissionsWidget missions={missions} />);
    expect(screen.getByText("Aide-soignant(e)")).toBeInTheDocument();
    expect(screen.getByText("Infirmier(e)")).toBeInTheDocument();
    expect(screen.getByText("ASH")).toBeInTheDocument();
  });

  it("affiche le bouton 'Voir toutes les missions'", () => {
    render(<MatchingMissionsWidget missions={missions} />);
    expect(screen.getByRole("link", { name: /voir toutes les missions/i })).toBeInTheDocument();
  });

  it("les titres de mission sont des liens vers la page de détail", () => {
    render(<MatchingMissionsWidget missions={missions} />);
    const detailLinks = screen.getAllByRole("link").filter((l) =>
      l.getAttribute("href")?.startsWith("/marketplace/missions/"),
    );
    expect(detailLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("affiche l'état vide quand missions=[]", () => {
    render(<MatchingMissionsWidget missions={[]} />);
    expect(screen.getByText(/aucune nouvelle mission/i)).toBeInTheDocument();
  });

  it("candidature directe : postule au clic et bascule le bouton en 'Mission prise'", async () => {
    render(<MatchingMissionsWidget missions={missions} />);
    const buttons = screen.getAllByRole("button", { name: /postuler/i });
    fireEvent.click(buttons[0]!);

    await waitFor(() => {
      expect(mockApplyToMission).toHaveBeenCalledWith("m-1");
      expect(mockRefresh).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /mission prise/i }),
      ).toBeDisabled();
    });
  });

  it("met seulement la carte cliquée en état Envoi", async () => {
    mockApplyToMission.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveApply = resolve;
        }),
    );

    render(<MatchingMissionsWidget missions={missions} />);
    const buttons = screen.getAllByRole("button", { name: /postuler/i });

    fireEvent.click(buttons[0]!);

    expect(await screen.findByRole("button", { name: /envoi/i })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /postuler/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /postuler/i })[0]).not.toBeDisabled();
    expect(screen.getAllByRole("button", { name: /postuler/i })[1]).not.toBeDisabled();

    resolveApply?.({ ok: true });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /mission prise/i })).toBeDisabled();
    });
  });

  it("affiche max 3 cards même avec 5 missions", () => {
    const many = [...missions, { id: "m-4", title: "M4", establishment: "E", city: "C" }, { id: "m-5", title: "M5", establishment: "E", city: "C" }];
    render(<MatchingMissionsWidget missions={many} />);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
  });

  it("affiche au maximum deux raisons de matching par carte", () => {
    render(<MatchingMissionsWidget missions={missions} />);

    expect(screen.getByText("Même ville")).toBeInTheDocument();
    expect(screen.getByText("Compétence proche")).toBeInTheDocument();
    expect(screen.queryByText("Disponible ce jour")).not.toBeInTheDocument();
  });
});
