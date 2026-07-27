import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: any }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: any }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: any }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: any }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: any }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: any }) => <p>{children}</p>,
}));

const { MissionDetailSheet } = await import("@/components/admin/MissionDetailSheet");
const { ServiceDetailSheet } = await import("@/components/admin/ServiceDetailSheet");

describe("MissionDetailSheet", () => {
  it("affiche la vue mission 360 et déclenche les actions Desk utiles", () => {
    const onDelete = vi.fn();
    const onReassign = vi.fn();
    const onNotifyStakeholder = vi.fn();

    render(
      <MissionDetailSheet
        open
        onOpenChange={() => undefined}
        isLoading={false}
        isPending={false}
        onDelete={onDelete}
        onReassign={onReassign}
        onNotifyStakeholder={onNotifyStakeholder}
        mission={{
          id: "mission-1",
          title: "Mission de nuit",
          status: "OPEN",
          createdAt: "2026-04-18T08:00:00.000Z",
          updatedAt: "2026-04-18T08:00:00.000Z",
          establishmentName: "Luc Martin",
          establishmentEmail: "est@test.fr",
          establishmentId: "est-1",
          address: "12 rue des Lilas",
          city: "Paris",
          shift: "NUIT",
          dateStart: "2026-04-20T08:00:00.000Z",
          dateEnd: "2026-04-20T16:00:00.000Z",
          hourlyRate: 28,
          proposedTotalTTC: null,
          candidatesCount: 2,
          attentionItems: ["2 candidature(s) en attente d'arbitrage avant attribution."],
          assignedFreelance: null,
          linkedBooking: null,
          candidates: [
            {
              bookingId: "booking-1",
              status: "PENDING",
              paymentStatus: "PENDING",
              createdAt: "2026-04-18T10:00:00.000Z",
              proposedRate: 30,
              freelanceAcknowledged: false,
              canAssign: true,
              freelance: {
                id: "free-1",
                name: "Aya Benali",
                email: "aya@test.fr",
              },
              latestQuote: null,
            },
          ],
          timeline: [
            {
              id: "tl-1",
              type: "MISSION_CREATED",
              label: "Mission créée",
              timestamp: "2026-04-18T08:00:00.000Z",
            },
          ],
          linkedDeskRequests: [
            {
              id: "desk-1",
              type: "MISSION_INFO_REQUEST",
              status: "OPEN",
              priority: "HIGH",
              createdAt: "2026-04-18T10:00:00.000Z",
              messageExcerpt: "Question sur les transmissions.",
              requester: {
                id: "free-1",
                name: "Aya Benali",
                email: "aya@test.fr",
              },
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Mission de nuit")).toBeInTheDocument();
    expect(screen.getByText("Question sur les transmissions.")).toBeInTheDocument();
    expect(screen.getByText("Aya Benali")).toBeInTheDocument();
    expect(screen.getByText("Mission créée")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /voir les tickets/i })).toHaveAttribute(
      "href",
      "/admin/demandes",
    );

    fireEvent.click(screen.getByRole("button", { name: /attribuer cette candidature/i }));
    expect(onReassign).toHaveBeenCalledWith("mission-1", "booking-1");

    fireEvent.click(screen.getByRole("button", { name: /relancer l'établissement/i }));
    fireEvent.click(screen.getByRole("button", { name: /notifier l'acteur/i }));
    expect(onNotifyStakeholder).toHaveBeenCalledWith(
      "est-1",
      "mission-1",
      expect.stringContaining("Mission de nuit"),
    );

    fireEvent.click(screen.getByRole("button", { name: /annuler proprement/i }));
    expect(onDelete).toHaveBeenCalledWith("mission-1");
  });
});

describe("ServiceDetailSheet", () => {
  it("affiche le détail du service et déclenche les actions rapides", () => {
    const onToggleFeature = vi.fn();
    const onToggleHide = vi.fn();

    render(
      <ServiceDetailSheet
        open
        onOpenChange={() => undefined}
        isLoading={false}
        isPending={false}
        onToggleFeature={onToggleFeature}
        onToggleHide={onToggleHide}
        service={{
          id: "service-1",
          title: "Atelier mémoire",
          type: "WORKSHOP",
          price: 140,
          freelanceName: "Nora Diallo",
          freelanceEmail: "nora@test.fr",
          isFeatured: false,
          isHidden: true,
          description: "Travail en petit groupe.",
          createdAt: "2026-04-10T08:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Atelier mémoire")).toBeInTheDocument();
    expect(screen.getByText("Travail en petit groupe.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mettre en avant/i }));
    fireEvent.click(screen.getByRole("button", { name: /afficher/i }));

    expect(onToggleFeature).toHaveBeenCalledWith("service-1");
    expect(onToggleHide).toHaveBeenCalledWith("service-1");
  });
});
