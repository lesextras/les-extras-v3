import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminStats } from "@/components/admin/AdminStats";
import type { AdminOverviewData } from "@/app/actions/admin";

const data: AdminOverviewData = {
  pendingUsersCount: 1,
  openDeskRequestsCount: 2,
  urgentOpenMissionsCount: 3,
  featuredServicesCount: 4,
  hiddenServicesCount: 5,
  awaitingPaymentCount: 6,
};

describe("AdminStats", () => {
  it("rend chaque KPI comme lien vers la bonne file Desk", () => {
    render(<AdminStats data={data} />);

    expect(screen.getByRole("link", { name: /Utilisateurs à valider/i })).toHaveAttribute(
      "href",
      "/admin/users",
    );
    expect(screen.getByRole("link", { name: /Demandes Desk ouvertes/i })).toHaveAttribute(
      "href",
      "/admin/demandes",
    );
    expect(screen.getByRole("link", { name: /Missions urgentes 48h/i })).toHaveAttribute(
      "href",
      "/admin/missions",
    );
    expect(screen.getByRole("link", { name: /Services mis en avant/i })).toHaveAttribute(
      "href",
      "/admin/services",
    );
    expect(screen.getByRole("link", { name: /Services masqués/i })).toHaveAttribute(
      "href",
      "/admin/services",
    );
    expect(screen.getByRole("link", { name: /Paiements en attente/i })).toHaveAttribute(
      "href",
      "/admin/finance",
    );
  });
});
