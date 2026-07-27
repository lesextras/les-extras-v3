import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FreelanceMarketplace } from "@/components/marketplace/FreelanceMarketplace";
import type { SerializedMission, SerializedService } from "@/app/actions/marketplace";

const mission: SerializedMission = {
  id: "mission-1",
  title: "Renfort éducateur spécialisé",
  dateStart: "2026-04-22T08:00:00.000Z",
  dateEnd: "2026-04-22T18:00:00.000Z",
  address: "12 rue des Lilas",
  hourlyRate: 30,
  status: "OPEN",
  isRenfort: true,
  city: "Lyon",
};

const workshop: SerializedService = {
  id: "service-1",
  title: "Atelier mémoire",
  description: "Atelier collectif",
  price: 150,
  type: "WORKSHOP",
  capacity: 8,
  pricingType: "SESSION",
  pricePerParticipant: null,
  durationMinutes: 90,
  category: null,
  publicCible: [],
  materials: null,
  objectives: null,
  methodology: null,
  evaluation: null,
  slots: null,
};

const training: SerializedService = {
  ...workshop,
  id: "service-2",
  title: "Formation Snoezelen",
  type: "TRAINING",
};

describe("FreelanceMarketplace", () => {
  it("affiche les missions, ateliers et formations disponibles", async () => {
    const user = userEvent.setup();

    render(
      <FreelanceMarketplace
        missions={[mission]}
        services={[workshop, training]}
      />,
    );

    expect(screen.getByRole("tab", { name: /missions de renfort/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /ateliers/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /formations/i })).toBeInTheDocument();
    expect(screen.getByText("Renfort éducateur spécialisé")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /ateliers/i }));
    expect(screen.getByText("Atelier mémoire")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /formations/i }));
    expect(screen.getByText("Formation Snoezelen")).toBeInTheDocument();
  });

  it("distingue une source indisponible d'un catalogue réellement vide", () => {
    render(
      <FreelanceMarketplace
        missions={[]}
        services={[]}
        missionsError="Impossible de charger les missions de renfort pour le moment."
        servicesError="Impossible de charger les ateliers et formations pour le moment."
      />,
    );

    expect(
      screen.getByText("Impossible de charger les missions de renfort pour le moment."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Impossible de charger les ateliers et formations pour le moment."),
    ).toBeInTheDocument();
  });
});
