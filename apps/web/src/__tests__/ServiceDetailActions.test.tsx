import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServiceDetailActions } from "@/components/marketplace/ServiceDetailActions";

const mockOpenBookServiceModal = vi.fn();
const mockOpenQuoteRequestModal = vi.fn();

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (s: {
    openBookServiceModal: (id: string) => void;
    openQuoteRequestModal: (id: string) => void;
  }) => unknown) =>
    selector({
      openBookServiceModal: mockOpenBookServiceModal,
      openQuoteRequestModal: mockOpenQuoteRequestModal,
    }),
}));

describe("ServiceDetailActions", () => {
  it("pour ESTABLISHMENT + QUOTE ouvre la demande de devis", () => {
    render(
      <ServiceDetailActions
        serviceId="s-1"
        pricingType="QUOTE"
        viewerRole="ESTABLISHMENT"
        isOwner={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /demander un devis/i }));
    expect(mockOpenQuoteRequestModal).toHaveBeenCalledWith("s-1");
  });

  it("pour ESTABLISHMENT + SESSION ouvre la réservation", () => {
    render(
      <ServiceDetailActions
        serviceId="s-2"
        pricingType="SESSION"
        viewerRole="ESTABLISHMENT"
        isOwner={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /demander une réservation/i }));
    expect(mockOpenBookServiceModal).toHaveBeenCalledWith("s-2");
  });

  it("pour FREELANCE propriétaire affiche le lien de gestion", () => {
    render(
      <ServiceDetailActions
        serviceId="s-3"
        pricingType="SESSION"
        viewerRole="FREELANCE"
        isOwner
      />,
    );

    const link = screen.getByRole("link", { name: /gérer ce service/i });
    expect(link).toHaveAttribute("href", "/dashboard/ateliers");
  });

  it("pour FREELANCE non propriétaire ouvre aussi la réservation", () => {
    render(
      <ServiceDetailActions
        serviceId="s-4"
        pricingType="SESSION"
        viewerRole="FREELANCE"
        isOwner={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /demander une réservation/i }));
    expect(mockOpenBookServiceModal).toHaveBeenCalledWith("s-4");
  });

  it("pour FREELANCE non propriétaire + QUOTE ouvre aussi la demande de devis", () => {
    render(
      <ServiceDetailActions
        serviceId="s-5"
        pricingType="QUOTE"
        viewerRole="FREELANCE"
        isOwner={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /demander un devis/i }));
    expect(mockOpenQuoteRequestModal).toHaveBeenCalledWith("s-5");
  });
});
