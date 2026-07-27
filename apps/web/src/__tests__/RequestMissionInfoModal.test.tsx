import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestMissionInfoModal } from "@/components/modals/RequestMissionInfoModal";

const mockRequestMissionInfo = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: vi.fn(),
  },
}));

vi.mock("@/app/actions/missions", () => ({
  requestMissionInfo: (...args: unknown[]) => mockRequestMissionInfo(...args),
}));

describe("RequestMissionInfoModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestMissionInfo.mockResolvedValue({ ok: true });
  });

  it("ouvre la modale au clic sur le bouton déclencheur", () => {
    render(<RequestMissionInfoModal missionId="m-1" missionTitle="Mission A" />);

    fireEvent.click(screen.getByRole("button", { name: /demander plus d'informations/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Mission A/)).toBeInTheDocument();
  });

  it("bloque l'envoi si le message est trop court et affiche un message lisible", async () => {
    render(<RequestMissionInfoModal missionId="m-1" />);

    fireEvent.click(screen.getByRole("button", { name: /demander plus d'informations/i }));
    fireEvent.change(screen.getByLabelText(/votre demande/i), {
      target: { value: "trop" },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer ma demande/i }));

    await waitFor(() => {
      expect(screen.getByText(/au moins 10 caractères/i)).toBeInTheDocument();
    });
    expect(mockRequestMissionInfo).not.toHaveBeenCalled();
  });

  it("envoie la demande et ferme la modale en cas de succès", async () => {
    render(<RequestMissionInfoModal missionId="m-99" missionTitle="Mission Z" />);

    fireEvent.click(screen.getByRole("button", { name: /demander plus d'informations/i }));
    fireEvent.change(screen.getByLabelText(/votre demande/i), {
      target: { value: "Pouvez-vous préciser le planning exact ?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer ma demande/i }));

    await waitFor(() => {
      expect(mockRequestMissionInfo).toHaveBeenCalledWith(
        "m-99",
        "Pouvez-vous préciser le planning exact ?",
      );
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Demande envoyée",
      expect.objectContaining({
        description: expect.stringContaining("transmise à l'équipe"),
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("affiche un wording centré équipe plateforme et pas établissement", () => {
    render(<RequestMissionInfoModal missionId="m-1" missionTitle="Mission A" />);

    fireEvent.click(screen.getByRole("button", { name: /demander plus d'informations/i }));

    expect(screen.getByText(/Notre équipe traitera votre demande/i)).toBeInTheDocument();
    expect(screen.getByText(/Mes demandes/i)).toBeInTheDocument();
    expect(screen.queryByText(/établissement sera notifié/i)).not.toBeInTheDocument();
  });

  it("affiche l'erreur API sans fermer la modale", async () => {
    mockRequestMissionInfo.mockResolvedValue({
      ok: false,
      error: "Mission not found",
    });
    render(<RequestMissionInfoModal missionId="m-ghost" />);

    fireEvent.click(screen.getByRole("button", { name: /demander plus d'informations/i }));
    fireEvent.change(screen.getByLabelText(/votre demande/i), {
      target: { value: "Question bien formée ?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer ma demande/i }));

    await waitFor(() => {
      expect(screen.getByText("Mission not found")).toBeInTheDocument();
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
