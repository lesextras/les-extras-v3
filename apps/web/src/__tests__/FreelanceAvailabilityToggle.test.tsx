import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUpdateAvailabilityAction = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/app/actions/user", () => ({
  updateAvailabilityAction: (...args: unknown[]) => mockUpdateAvailabilityAction(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

const { FreelanceAvailabilityToggle } = await import(
  "@/app/(dashboard)/dashboard/_components/FreelanceAvailabilityToggle"
);

describe("FreelanceAvailabilityToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateAvailabilityAction.mockResolvedValue({ ok: true });
  });

  it("met à jour la disponibilité immédiatement et confirme le succès", async () => {
    render(<FreelanceAvailabilityToggle initialIsAvailable={false} />);

    const toggle = screen.getByRole("switch", { name: /modifier ma disponibilité/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Indisponible")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Disponible")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockUpdateAvailabilityAction).toHaveBeenCalledWith(true);
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Vous êtes visible pour les nouvelles missions.",
    );
  });

  it("revient à l'état précédent quand l'action échoue", async () => {
    mockUpdateAvailabilityAction.mockResolvedValueOnce({
      ok: false,
      error: "Mise à jour impossible.",
    });

    render(<FreelanceAvailabilityToggle initialIsAvailable />);

    const toggle = screen.getByRole("switch", { name: /modifier ma disponibilité/i });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Mise à jour impossible.");
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });
});
