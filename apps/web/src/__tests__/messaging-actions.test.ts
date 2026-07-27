import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApiRequest = vi.fn();
const mockGetSession = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  toUserFacingApiError: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
}));

vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const {
  getNotifications,
  markNotificationAsRead,
  sendMessage,
} = await import("@/actions/messaging");
const { sendOrderMessage } = await import("@/app/actions/orders");

describe("messaging actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ token: "user-token" });
  });

  it("renvoie le message backend réel pour sendMessage", async () => {
    mockApiRequest.mockRejectedValue(
      new Error("Le partage d'adresse email n'est pas autorisé dans la messagerie."),
    );

    await expect(sendMessage({ receiverId: "user-2", content: "jo@example.com" })).resolves.toEqual({
      error: "Le partage d'adresse email n'est pas autorisé dans la messagerie.",
    });
  });

  it("renvoie le message backend réel pour sendOrderMessage", async () => {
    mockApiRequest.mockRejectedValue(
      new Error("Le partage de lien externe n'est pas autorisé dans la messagerie."),
    );

    await expect(sendOrderMessage("user-2", "https://example.com", "booking-1")).resolves.toEqual({
      error: "Le partage de lien externe n'est pas autorisé dans la messagerie.",
    });
  });

  it("charge les notifications réelles via GET /notifications", async () => {
    mockApiRequest.mockResolvedValue([{ id: "notif-1", message: "Desk", type: "INFO" }]);

    await expect(getNotifications()).resolves.toEqual([
      { id: "notif-1", message: "Desk", type: "INFO" },
    ]);

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/notifications",
      expect.objectContaining({ method: "GET", token: "user-token" }),
    );
  });

  it("marque une notification comme lue et revalide l'inbox", async () => {
    mockApiRequest.mockResolvedValue({ ok: true });

    await expect(markNotificationAsRead("notif-1")).resolves.toEqual({ success: true });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/notifications/notif-1/read",
      expect.objectContaining({ method: "PATCH", token: "user-token" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/inbox");
  });
});
