import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetService = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/app/actions/marketplace", () => ({
  getService: (...args: unknown[]) => mockGetService(...args),
}));

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

vi.mock("@/components/marketplace/ServiceDetailActions", () => ({
  ServiceDetailActions: () => <div>CTA Fiche Atelier</div>,
}));

const { default: ServiceDetailPage } = await import("@/app/(dashboard)/marketplace/services/[id]/page");

describe("ServiceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: "est-1", role: "ESTABLISHMENT" },
    });
    mockGetService.mockResolvedValue({
      id: "service-1",
      title: "Atelier prévention de crise",
      description: "Contenu atelier",
      price: 250,
      type: "WORKSHOP",
      capacity: 12,
      pricingType: "SESSION",
      pricePerParticipant: null,
      durationMinutes: 120,
      category: "GESTION_CRISE",
      publicCible: ["adultes"],
      materials: null,
      objectives: null,
      methodology: null,
      evaluation: null,
      slots: [{ date: "2026-05-01", heureDebut: "09:00", heureFin: "11:00" }],
      owner: {
        id: "freelance-1",
        profile: {
          firstName: "Nora",
          lastName: "Bernard",
          avatar: null,
          jobTitle: "Formatrice",
          bio: null,
        },
      },
    });
  });

  it("affiche les informations de la fiche atelier", async () => {
    const ui = await ServiceDetailPage({ params: Promise.resolve({ id: "service-1" }) });
    render(ui);

    expect(screen.getByRole("heading", { name: /atelier prévention de crise/i })).toBeInTheDocument();
    expect(screen.getByText(/contenu atelier/i)).toBeInTheDocument();
    expect(screen.getByText(/cta fiche atelier/i)).toBeInTheDocument();
  });
});
