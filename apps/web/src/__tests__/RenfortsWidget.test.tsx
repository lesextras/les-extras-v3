import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenfortsWidget } from "@/components/dashboard/establishment/RenfortsWidget";
import type { EstablishmentMission } from "@/app/actions/missions";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const makeMission = (overrides?: Partial<EstablishmentMission>): EstablishmentMission => ({
  id: "mission-1",
  title: "Infirmier de nuit",
  dateStart: "2026-05-01T00:00:00.000Z",
  dateEnd: "2026-05-01T08:00:00.000Z",
  address: "1 rue Test, 75001 Paris",
  hourlyRate: 30,
  status: "OPEN",
  isRenfort: true,
  metier: "INFIRMIER",
  shift: "NUIT",
  city: "Paris",
  bookings: [],
  planning: [
    { dateStart: "2026-05-01", heureDebut: "08:00", dateEnd: "2026-05-01", heureFin: "12:00" },
    { dateStart: "2026-05-03", heureDebut: "14:00", dateEnd: "2026-05-03", heureFin: "18:00" },
    { dateStart: "2026-05-04", heureDebut: "09:00", dateEnd: "2026-05-04", heureFin: "11:00" },
  ],
  ...overrides,
});

describe("RenfortsWidget", () => {
  it("affiche 'Ouverte' pour le statut OPEN", () => {
    render(<RenfortsWidget missions={[makeMission({ status: "OPEN" })]} />);
    expect(screen.getByText("Ouverte")).toBeInTheDocument();
  });

  it("affiche un état vide quand aucune mission n'est passée", () => {
    render(<RenfortsWidget missions={[]} />);
    expect(screen.getByText(/aucun renfort actif/i)).toBeInTheDocument();
  });

  it("affiche le titre de la mission", () => {
    render(<RenfortsWidget missions={[makeMission({ title: "Aide-soignant jour", metier: null })]} />);
    expect(screen.getByText(/aide-soignant jour/i)).toBeInTheDocument();
  });

  it("affiche le titre libre si le métier est autre", () => {
    render(
      <RenfortsWidget
        missions={[makeMission({ title: "Médiateur familial", metier: "autre" })]}
      />,
    );
    expect(screen.getByText("Médiateur familial")).toBeInTheDocument();
  });

  it("affiche le label métier si le métier est connu", () => {
    render(
      <RenfortsWidget
        missions={[makeMission({ title: "Titre technique", metier: "psychologue" })]}
      />,
    );
    expect(screen.getByText("Psychologue")).toBeInTheDocument();
  });

  it("affiche le badge de statut OPEN comme 'Ouverte'", () => {
    render(<RenfortsWidget missions={[makeMission({ status: "OPEN" })]} />);
    expect(screen.getByText("Ouverte")).toBeInTheDocument();
  });

  it("affiche le badge de statut ASSIGNED comme 'Assignée'", () => {
    render(<RenfortsWidget missions={[makeMission({ status: "ASSIGNED" })]} />);
    expect(screen.getByText("Assignée")).toBeInTheDocument();
  });

  it("distingue les statuts terminés et annulés", () => {
    render(
      <RenfortsWidget
        missions={[
          makeMission({ id: "completed", title: "Mission terminée", status: "COMPLETED" }),
          makeMission({ id: "cancelled", title: "Mission annulée", status: "CANCELLED" }),
        ]}
      />,
    );

    expect(screen.getByText("Terminée")).toBeInTheDocument();
    expect(screen.getByText("Annulée")).toBeInTheDocument();
  });

  it("affiche toutes les missions jusqu'à 5", () => {
    const missions = Array.from({ length: 5 }, (_, i) =>
      makeMission({ id: `mission-${i}`, title: `Mission ${i + 1}`, metier: null }),
    );
    render(<RenfortsWidget missions={missions} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Mission ${i}`)).toBeInTheDocument();
    }
  });

  it("affiche le lien 'Voir tous' quand plus de 5 missions", () => {
    const missions = Array.from({ length: 6 }, (_, i) =>
      makeMission({ id: `mission-${i}`, title: `Mission ${i + 1}` }),
    );
    render(<RenfortsWidget missions={missions} />);
    expect(screen.getByText(/voir tous les renforts/i)).toBeInTheDocument();
  });

  it("affiche les deux premiers créneaux puis le surplus", () => {
    render(<RenfortsWidget missions={[makeMission()]} />);
    expect(screen.getByText(/01 mai/i)).toBeInTheDocument();
    expect(screen.getByText(/03 mai/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1 plage\(s\)/i)).toBeInTheDocument();
  });

  it("affiche un libellé neutre quand la date est invalide", () => {
    render(
      <RenfortsWidget
        missions={[
          makeMission({
            id: "invalid-date",
            title: "Mission sans date fiable",
            dateStart: "not-a-date",
            planning: null,
          }),
        ]}
      />,
    );

    expect(screen.getByText("Date à confirmer")).toBeInTheDocument();
  });
});
