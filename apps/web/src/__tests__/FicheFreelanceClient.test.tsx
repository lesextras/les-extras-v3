import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FicheFreelanceClient } from "@/app/freelances/[id]/FicheFreelanceClient";

const mockOpenRenfortModal = vi.hoisted(() => vi.fn());

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (s: { openRenfortModal: () => void }) => unknown) =>
    selector({ openRenfortModal: mockOpenRenfortModal }),
}));

const freelance = {
  id: "freelance-1",
  email: "freelance@example.com",
  isAvailable: true,
  profile: {
    firstName: "Nora",
    lastName: "Martin",
    avatar: null,
    jobTitle: "Éducatrice spécialisée",
    bio: "Accompagnement TSA",
    city: "Lyon",
    skills: ["TSA", "Communication"],
    siret: "12345678900011",
  },
  reviewsReceived: [
    {
      id: "r-1",
      rating: 5,
      comment: "Très professionnelle",
      createdAt: "2026-03-10T10:00:00.000Z",
      author: {
        id: "est-1",
        profile: {
          firstName: "Camille",
          lastName: "Durand",
          avatar: null,
          companyName: "ESTABLISHMENT Saint-Paul",
        },
      },
    },
  ],
  ownerServices: [
    {
      id: "s-1",
      title: "Atelier régulation émotionnelle",
      description: "Atelier pratique",
      price: 420,
      type: "WORKSHOP",
      capacity: 10,
      pricingType: "SESSION",
      pricePerParticipant: null,
      durationMinutes: 180,
      category: "TSA",
      publicCible: ["Adolescents"],
      materials: null,
      objectives: null,
      methodology: null,
      evaluation: null,
      slots: null,
      owner: {
        id: "freelance-1",
        profile: {
          firstName: "Nora",
          lastName: "Martin",
          avatar: null,
          jobTitle: "Éducatrice spécialisée",
          bio: "Accompagnement TSA",
        },
      },
    },
  ],
};

describe("FicheFreelanceClient", () => {
  beforeEach(() => {
    mockOpenRenfortModal.mockClear();
  });

  it("affiche les informations publiques utiles", () => {
    render(
      <FicheFreelanceClient
        freelance={freelance as never}
        fullName="Nora Martin"
        initials="NM"
        rating={5}
        reviewCount={1}
      />,
    );

    expect(screen.getByText("Nora Martin")).toBeInTheDocument();
    expect(screen.getByText(/Éducatrice spécialisée/i)).toBeInTheDocument();
    expect(screen.getByText(/TSA/i)).toBeInTheDocument();
    expect(screen.getByText(/Atelier régulation émotionnelle/i)).toBeInTheDocument();
    expect(screen.getByText(/Très professionnelle/i)).toBeInTheDocument();
  });

  it("ouvre la modale de mission au clic sur Proposer une mission", () => {
    render(
      <FicheFreelanceClient
        freelance={freelance as never}
        fullName="Nora Martin"
        initials="NM"
        rating={5}
        reviewCount={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Proposer une mission/i }));
    expect(mockOpenRenfortModal).toHaveBeenCalledTimes(1);
  });
});
