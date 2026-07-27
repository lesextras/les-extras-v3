import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { EstablishmentCatalogue } from "@/components/marketplace/EstablishmentCatalogue";
import type { SerializedService } from "@/app/actions/marketplace";

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

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

const workshopService: SerializedService = {
  id: "service-1",
  title: "Atelier gestion des émotions",
  description: "Atelier de 2h",
  price: 250,
  type: "WORKSHOP",
  capacity: 12,
  pricingType: "SESSION",
  pricePerParticipant: null,
  durationMinutes: 120,
  category: "GESTION_EMOTIONS",
  publicCible: ["enfants"],
  materials: null,
  objectives: null,
  methodology: null,
  evaluation: null,
  slots: [{ date: "2026-04-01", heureDebut: "09:00", heureFin: "11:00" }],
  owner: {
    id: "freelance-1",
    profile: {
      firstName: "Sarah",
      lastName: "Martin",
      avatar: null,
      jobTitle: "Éducatrice",
      bio: null,
    },
  },
};

const services: SerializedService[] = [workshopService];

const servicesWithTraining: SerializedService[] = [
  ...services,
  {
    ...workshopService,
    id: "service-2",
    title: "Formation posture professionnelle",
    description: "Formation d'une journée",
    type: "TRAINING",
    category: "COMMUNICATION",
  },
];

describe("EstablishmentCatalogue - ateliers", () => {
  it("sépare les entrées Ateliers, Formations et Annuaire des Extras", () => {
    render(<EstablishmentCatalogue services={servicesWithTraining} freelances={[]} />);

    expect(screen.getByRole("tab", { name: /ateliers/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /formations/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /annuaire des extras/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /ateliers & formations/i })).not.toBeInTheDocument();
  });

  it("affiche le catalogue et les cartes ateliers", () => {
    render(<EstablishmentCatalogue services={services} freelances={[]} />);
    expect(screen.getByRole("heading", { name: /catalogue & annuaire/i })).toBeInTheDocument();
    expect(screen.getByText(/atelier gestion des émotions/i)).toBeInTheDocument();
  });

  it("affiche les formations dans leur onglet dédié", async () => {
    const user = userEvent.setup();
    render(<EstablishmentCatalogue services={servicesWithTraining} freelances={[]} />);

    await user.click(screen.getByRole("tab", { name: /formations/i }));
    expect(screen.getByText(/formation posture professionnelle/i)).toBeInTheDocument();
  });

  it("peut ouvrir directement l'onglet Formations", () => {
    render(
      <EstablishmentCatalogue
        services={servicesWithTraining}
        freelances={[]}
        initialTab="trainings"
      />,
    );

    expect(screen.getByText(/formation posture professionnelle/i)).toBeInTheDocument();
  });

  it("affiche un état vide quand aucun atelier n'est disponible", () => {
    render(<EstablishmentCatalogue services={[]} freelances={[]} />);
    expect(screen.getByText(/aucun atelier disponible/i)).toBeInTheDocument();
    expect(screen.queryByText(/aucune offre disponible/i)).not.toBeInTheDocument();
  });

  it("affiche un message d'erreur dégradé si catalogueError est fourni", () => {
    render(
      <EstablishmentCatalogue
        services={services}
        freelances={[]}
        catalogueError="Impossible de charger certaines données du catalogue."
      />,
    );
    expect(screen.getByText(/impossible de charger certaines données du catalogue/i)).toBeInTheDocument();
  });

  it("distingue une source ateliers/formations indisponible d'un catalogue vide", () => {
    render(
      <EstablishmentCatalogue
        services={[]}
        freelances={[]}
        servicesError="Impossible de charger les ateliers et formations pour le moment."
      />,
    );

    expect(
      screen.getByText(/impossible de charger les ateliers et formations pour le moment/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/ateliers indisponibles/i)).toBeInTheDocument();
    expect(screen.queryByText(/aucun atelier disponible/i)).not.toBeInTheDocument();
  });

  it("distingue une source annuaire indisponible d'un annuaire vide", async () => {
    const user = userEvent.setup();
    render(
      <EstablishmentCatalogue
        services={[]}
        freelances={[]}
        freelancesError="Impossible de charger les profils Extras vérifiés pour le moment."
      />,
    );

    await user.click(screen.getByRole("tab", { name: /annuaire des extras/i }));

    expect(screen.getByText(/annuaire indisponible/i)).toBeInTheDocument();
    expect(screen.queryByText(/aucun freelance disponible/i)).not.toBeInTheDocument();
  });
});
