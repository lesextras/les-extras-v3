import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserDeskRequestForm } from "@/components/dashboard/UserDeskRequestForm";

const mockCreateUserDeskRequest = vi.fn();
const mockRefresh = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/app/actions/desk", () => ({
  createUserDeskRequest: (...args: unknown[]) => mockCreateUserDeskRequest(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

describe("UserDeskRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateUserDeskRequest.mockResolvedValue({ ok: true });
  });

  it("crée une demande Desk puis rafraîchit la page pour afficher la nouvelle demande", async () => {
    render(<UserDeskRequestForm />);

    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: "USER_REPORT" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Je souhaite signaler un blocage côté réservation." },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer au desk/i }));

    await waitFor(() => {
      expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
        "USER_REPORT",
        "Je souhaite signaler un blocage côté réservation.",
      );
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Votre demande a été transmise au Desk.");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("affiche une erreur sans rafraîchir quand l'envoi échoue", async () => {
    mockCreateUserDeskRequest.mockResolvedValueOnce({
      ok: false,
      error: "Envoi impossible.",
    });

    render(<UserDeskRequestForm />);

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Le formulaire renvoie une erreur." },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer au desk/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Envoi impossible.");
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("n'affiche pas FAIL quand l'action retourne une erreur technique", async () => {
    mockCreateUserDeskRequest.mockResolvedValueOnce({
      ok: false,
      error: "FAIL",
    });

    render(<UserDeskRequestForm />);

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Le formulaire renvoie une erreur technique." },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer au desk/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Impossible d'envoyer votre demande pour le moment.",
      );
    });

    expect(mockToastError).not.toHaveBeenCalledWith("FAIL");
  });
});
