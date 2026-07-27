import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetSession = vi.fn();
const mockGetAvailableMission = vi.fn();

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

vi.mock("@/app/actions/marketplace", () => ({
  getAvailableMission: (...args: unknown[]) => mockGetAvailableMission(...args),
}));

const { default: MissionDetailPage } = await import(
  "@/app/(dashboard)/marketplace/missions/[id]/page"
);

describe("MissionDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      token: "token",
      user: { role: "FREELANCE" },
    });
  });

  it("affiche une mission déjà prise avec le bouton Postuler désactivé", async () => {
    mockGetAvailableMission.mockResolvedValue({
      id: "mission-1",
      title: "Renfort éducatif",
      status: "ASSIGNED",
      dateStart: "2099-03-20T08:00:00.000Z",
      dateEnd: "2099-03-20T16:00:00.000Z",
      hourlyRate: 25,
      address: "Paris",
      city: "Paris",
      zipCode: "75001",
      isRenfort: true,
      isUrgent: false,
      shift: "JOUR",
      metier: null,
      planning: null,
      slots: null,
      description: null,
      requiredSkills: [],
      diplomaRequired: false,
      hasTransmissions: false,
      perks: [],
      establishment: {
        profile: {
          companyName: "Clinique Test",
          city: "Paris",
          avatar: null,
        },
      },
    });

    render(await MissionDetailPage({ params: { id: "mission-1" } }));

    expect(screen.getByText("Cette mission est déjà prise.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /postuler à cette mission/i }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /demander plus d'informations/i }),
    ).not.toBeInTheDocument();
    expect(mockGetAvailableMission).toHaveBeenCalledWith("mission-1", "token");
  });
});
