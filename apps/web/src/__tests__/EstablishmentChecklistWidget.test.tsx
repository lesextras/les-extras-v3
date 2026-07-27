import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EstablishmentChecklistWidget } from "@/components/dashboard/establishment/EstablishmentChecklistWidget";
import type { EstablishmentTrustProfile } from "@/lib/establishment-trust";

const trustProfile: EstablishmentTrustProfile = {
  progress: 33,
  completedCount: 2,
  totalCount: 6,
  steps: [
    { id: "companyName", label: "Nom de l'établissement renseigné", status: "COMPLETED" },
    { id: "bio", label: "Description de la structure renseignée", status: "COMPLETED" },
    { id: "contact", label: "Coordonnées complètes", status: "PENDING", actionLabel: "Compléter", href: "/account/establishment" },
    { id: "siret", label: "SIRET renseigné", status: "MISSING", actionLabel: "Compléter", href: "/account/establishment" },
    { id: "firstRenfort", label: "Premier renfort publié", status: "MISSING", actionLabel: "Publier", href: "/dashboard/renforts" },
    { id: "credits", label: "Crédits disponibles", status: "MISSING", actionLabel: "Ajouter", href: "/dashboard/packs" },
  ],
};

describe("EstablishmentChecklistWidget", () => {
  it("affiche les étapes dynamiques et le CTA vers la fiche établissement", () => {
    render(<EstablishmentChecklistWidget trustProfile={trustProfile} />);

    expect(screen.getByText("2/6 éléments complétés")).toBeInTheDocument();
    expect(screen.getByText("SIRET renseigné")).toBeInTheDocument();
    expect(screen.queryByText(/SIRET vérifié/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /compléter ma fiche/i })).toHaveAttribute(
      "href",
      "/account/establishment",
    );
  });
});
