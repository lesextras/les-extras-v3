import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const buyPackMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/actions/credits", () => ({
  buyPack: (...args: unknown[]) => buyPackMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/components/ui/animated-number", () => ({
  AnimatedNumber: ({ value, className }: { value: number; className?: string }) => (
    <span className={className}>{value}</span>
  ),
}));

const { CreditsWidget } = await import("@/components/dashboard/CreditsWidget");

describe("CreditsWidget", () => {
  beforeEach(() => {
    buyPackMock.mockReset();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it("affiche une alerte si crédits = 0", () => {
    render(<CreditsWidget credits={0} />);

    expect(screen.getByText("Solde épuisé")).toBeInTheDocument();
  });

  it("affiche un état Solde indisponible si credits = null", () => {
    render(<CreditsWidget credits={null} />);

    expect(screen.getByText("Solde indisponible")).toBeInTheDocument();
  });

  it("n'utilise plus window.confirm pour choisir un pack", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CreditsWidget credits={3} />);

    fireEvent.click(screen.getByRole("button", { name: /acheter des crédits/i }));
    const firstChoiceButton = screen.getAllByRole("button", { name: "Choisir" })[0];
    expect(firstChoiceButton).toBeDefined();
    fireEvent.click(firstChoiceButton!);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: /confirmer l'achat/i })).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("met à jour le solde affiché après achat d'un pack", async () => {
    buyPackMock.mockResolvedValue({ ok: true, availableCredits: 7 });
    render(<CreditsWidget credits={1} />);

    fireEvent.click(screen.getByRole("button", { name: /acheter des crédits/i }));
    const firstChoiceButton = screen.getAllByRole("button", { name: "Choisir" })[0];
    expect(firstChoiceButton).toBeDefined();
    fireEvent.click(firstChoiceButton!);
    fireEvent.click(screen.getByRole("button", { name: /confirmer l'achat/i }));

    await waitFor(() => {
      expect(buyPackMock).toHaveBeenCalledWith("STARTER");
    });
    await waitFor(() => {
      expect(screen.getByText("7")).toBeInTheDocument();
    });
    expect(toastSuccessMock).toHaveBeenCalledWith("Pack Starter ajouté au solde.");
  });

  it("normalise une erreur technique d'achat avant le toast", async () => {
    buyPackMock.mockResolvedValue({ error: "FAIL" });
    render(<CreditsWidget credits={1} />);

    fireEvent.click(screen.getByRole("button", { name: /acheter des crédits/i }));
    const firstChoiceButton = screen.getAllByRole("button", { name: "Choisir" })[0];
    expect(firstChoiceButton).toBeDefined();
    fireEvent.click(firstChoiceButton!);
    fireEvent.click(screen.getByRole("button", { name: /confirmer l'achat/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Impossible d'ajouter ce pack pour le moment.",
      );
    });
    expect(toastErrorMock).not.toHaveBeenCalledWith(expect.stringContaining("FAIL"));
  });
});
