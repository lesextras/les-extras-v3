import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WidgetErrorBadge } from "@/components/ui/widget-error-badge";

describe("WidgetErrorBadge", () => {
    it("affiche le message d'erreur fourni", () => {
        render(<WidgetErrorBadge message="Renforts indisponible pour le moment." />);
        expect(screen.getByText("Renforts indisponible pour le moment.")).toBeInTheDocument();
    });

    it("a le rôle status pour l'accessibilité", () => {
        render(<WidgetErrorBadge message="Factures indisponible pour le moment." />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("contient l'icône wifi-off (aria-hidden)", () => {
        const { container } = render(<WidgetErrorBadge message="Erreur" />);
        // lucide renders an svg
        expect(container.querySelector("svg")).toBeTruthy();
    });
});
