import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingListWidget } from "@/components/dashboard/BookingListWidget";
import type { BookingLine } from "@/app/actions/bookings";

const booking: BookingLine = {
  lineId: "line-1",
  lineType: "MISSION",
  date: "2026-03-20T09:00:00.000Z",
  typeLabel: "Mission SOS",
  interlocutor: "Clinique A",
  status: "CONFIRMED",
  address: "10 rue de test",
  contactEmail: "contact@test.com",
};

describe("BookingListWidget", () => {
  it("génère un lien détails canonique vers /bookings/[lineType]/[lineId]", () => {
    render(<BookingListWidget bookings={[booking]} />);

    const detailsLink = screen.getByRole("link", { name: /voir le détail : mission sos/i });

    expect(detailsLink).toHaveAttribute("href", "/bookings/MISSION/line-1");
  });

  it("affiche le libellé centralisé du statut", () => {
    render(<BookingListWidget bookings={[{ ...booking, status: "QUOTE_SENT" }]} />);

    expect(screen.getByText("Devis envoyé")).toBeInTheDocument();
    expect(screen.queryByText("En attente")).not.toBeInTheDocument();
  });

  it("affiche PAID comme Payé et non En attente", () => {
    render(<BookingListWidget bookings={[{ ...booking, status: "PAID" }]} />);

    expect(screen.getByText("Payé")).toBeInTheDocument();
    expect(screen.queryByText("En attente")).not.toBeInTheDocument();
  });

  it("expose un libellé accessible contextualisé pour le lien Voir tout", () => {
    render(
      <BookingListWidget
        bookings={[booking]}
        viewAllLink="/bookings"
        viewAllLabel="Voir tout mon agenda"
      />,
    );

    const viewAllLink = screen.getByRole("link", { name: "Voir tout mon agenda" });
    expect(viewAllLink).toHaveAttribute("href", "/bookings");
    expect(viewAllLink).toHaveTextContent("Voir tout");
  });
});
