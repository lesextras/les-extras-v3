import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { DashboardWidget } from "@/app/(dashboard)/dashboard/_components/DashboardWidget";

describe("DashboardWidget", () => {
  it("conserve le texte visible Voir tout et expose un aria-label contextualisé", () => {
    render(
      <DashboardWidget
        icon={Inbox}
        iconColor="teal"
        title="Mes demandes"
        viewAllHref="/dashboard/demandes"
        viewAllLabel="Voir toutes mes demandes"
      >
        <p>Contenu du widget</p>
      </DashboardWidget>,
    );

    const link = screen.getByRole("link", { name: "Voir toutes mes demandes" });

    expect(link).toHaveAttribute("href", "/dashboard/demandes");
    expect(link).toHaveTextContent("Voir tout →");
  });

  it("utilise le titre comme fallback accessible", () => {
    render(
      <DashboardWidget
        icon={Inbox}
        iconColor="coral"
        title="Demandes Desk ouvertes"
        viewAllHref="/dashboard/demandes"
      >
        <p>Contenu du widget</p>
      </DashboardWidget>,
    );

    expect(
      screen.getByRole("link", { name: "Voir tout : Demandes Desk ouvertes" }),
    ).toHaveTextContent("Voir tout →");
  });
});
