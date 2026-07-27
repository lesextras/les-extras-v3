import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { RequiredActions } from "@/components/admin/RequiredActions";
import type { AdminUserRow, DeskRequestRow } from "@/app/actions/admin";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

function makeDeskRequest(overrides: Partial<DeskRequestRow>): DeskRequestRow {
  return {
    id: "desk-1",
    type: "TECHNICAL_ISSUE",
    priority: "NORMAL",
    status: "OPEN",
    assignedToAdminId: null,
    message: "Message",
    response: null,
    answeredAt: null,
    createdAt: "2026-04-20T10:00:00.000Z",
    mission: { id: "mission-1", title: "Ticket normal" },
    booking: null,
    requester: {
      id: "user-1",
      email: "user@test.fr",
      profile: null,
    },
    assignedToAdmin: null,
    answeredBy: null,
    ...overrides,
  };
}

function makeUser(overrides: Partial<AdminUserRow>): AdminUserRow {
  return {
    id: "user-1",
    name: "Utilisateur",
    email: "user@test.fr",
    role: "FREELANCE",
    status: "PENDING",
    createdAt: "2026-04-20T10:00:00.000Z",
    ...overrides,
  };
}

function expectBefore(firstText: string, secondText: string) {
  const first = screen.getByText(firstText);
  const second = screen.getByText(secondText);
  expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
}

describe("RequiredActions", () => {
  it("affiche les tickets urgents avant les autres", () => {
    render(
      <RequiredActions
        pendingUsers={[]}
        openDeskRequests={[
          makeDeskRequest({
            id: "normal",
            priority: "NORMAL",
            mission: { id: "mission-normal", title: "Ticket normal" },
          }),
          makeDeskRequest({
            id: "urgent",
            priority: "URGENT",
            mission: { id: "mission-urgent", title: "Ticket urgent" },
          }),
        ]}
      />,
    );

    expectBefore("Ticket urgent", "Ticket normal");
  });

  it("affiche les utilisateurs anciens avant les récents", () => {
    render(
      <RequiredActions
        pendingUsers={[
          makeUser({ id: "recent", name: "Compte récent", createdAt: "2026-04-22T10:00:00.000Z" }),
          makeUser({ id: "old", name: "Compte ancien", createdAt: "2026-04-18T10:00:00.000Z" }),
        ]}
        openDeskRequests={[]}
      />,
    );

    expectBefore("Compte ancien", "Compte récent");
  });

  it("affiche des états vides propres", () => {
    render(<RequiredActions pendingUsers={[]} openDeskRequests={[]} />);

    expect(screen.getByText("Aucun utilisateur en attente de validation.")).toBeInTheDocument();
    expect(screen.getByText("Aucun ticket Desk ouvert.")).toBeInTheDocument();
    expect(screen.getByText("Aucun incident finance ouvert.")).toBeInTheDocument();
    expect(screen.getByText("Aucune mission urgente ouverte.")).toBeInTheDocument();
  });

  it("expose les liens Voir tout vers les bonnes pages", () => {
    render(<RequiredActions pendingUsers={[]} openDeskRequests={[]} />);

    const links = screen.getAllByRole("link", { name: "Voir tout" });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin/users",
      "/admin/demandes",
      "/admin/incidents",
      "/admin/missions",
    ]);
  });
});
