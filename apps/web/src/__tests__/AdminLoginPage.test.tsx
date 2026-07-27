import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const adminLoginMock = vi.hoisted(() => vi.fn());
const replaceMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/actions/admin-auth", () => ({
  adminLogin: adminLoginMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

const { default: AdminLoginPage } = await import("@/app/(admin-auth)/admin/login/page");

describe("AdminLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminLoginMock.mockResolvedValue({ ok: true });
  });

  it("affiche le formulaire de connexion Desk", () => {
    render(<AdminLoginPage />);

    expect(screen.getByRole("heading", { name: "Connexion Desk" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
  });

  it("appelle adminLogin puis redirige vers /admin après succès", async () => {
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ADMIN@TEST.FR" },
    });
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(adminLoginMock).toHaveBeenCalledWith({
        email: "ADMIN@TEST.FR",
        password: "secret",
      });
      expect(replaceMock).toHaveBeenCalledWith("/admin");
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("affiche une erreur propre si la connexion échoue", async () => {
    adminLoginMock.mockRejectedValueOnce(new Error("Accès admin refusé."));
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@test.fr" },
    });
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Accès admin refusé.")).toBeInTheDocument();
  });
});
