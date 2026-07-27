import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockSendOrderMessage = vi.fn();
const mockAcceptQuote = vi.fn();
const mockRejectQuote = vi.fn();
const mockCreateReview = vi.fn();
const mockConfirmBookingLine = vi.fn();
const mockCreateUserDeskRequest = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/app/actions/orders", () => ({
  sendOrderMessage: (...args: unknown[]) => mockSendOrderMessage(...args),
  acceptQuote: (...args: unknown[]) => mockAcceptQuote(...args),
  rejectQuote: (...args: unknown[]) => mockRejectQuote(...args),
}));

vi.mock("@/app/actions/bookings", () => ({
  confirmBookingLine: (...args: unknown[]) => mockConfirmBookingLine(...args),
}));

vi.mock("@/app/actions/reviews", () => ({
  createReview: (...args: unknown[]) => mockCreateReview(...args),
}));

vi.mock("@/app/actions/desk", () => ({
  createUserDeskRequest: (...args: unknown[]) => mockCreateUserDeskRequest(...args),
}));

vi.mock("@/lib/hooks/useOrderSSE", () => ({
  useOrderSSE: () => undefined,
}));

vi.mock("@/components/modals/ReviewModal", () => ({
  ReviewModal: () => null,
}));

vi.mock("@/components/orders/QuoteFormModal", () => ({
  QuoteFormModal: () => null,
}));

const { OrderTrackerClient } = await import("@/components/orders/OrderTrackerClient");

const baseData = {
  booking: {
    id: "booking-1",
    status: "PENDING",
    paymentStatus: "UNPAID",
    scheduledAt: "2026-04-20T10:00:00.000Z",
    createdAt: "2026-04-10T08:00:00.000Z",
  },
  service: {
    id: "service-1",
    title: "Atelier mémoire",
    price: 120,
    durationMinutes: 90,
    pricingType: "QUOTE",
  },
  requester: {
    id: "free-requester",
    email: "requester@test.com",
    role: "FREELANCE",
    firstName: "Samir",
    lastName: "Requester",
  },
  provider: {
    id: "free-provider",
    email: "provider@test.com",
    role: "FREELANCE",
    firstName: "Nora",
    lastName: "Provider",
  },
  establishment: {
    id: "free-requester",
    email: "requester@test.com",
    role: "FREELANCE",
    firstName: "Samir",
    lastName: "Requester",
  },
  freelance: {
    id: "free-provider",
    email: "provider@test.com",
    role: "FREELANCE",
    firstName: "Nora",
    lastName: "Provider",
  },
  quotes: [
    {
      id: "quote-1",
      status: "SENT",
      subtotalHT: 120,
      vatRate: 0,
      vatAmount: 0,
      totalTTC: 120,
      createdAt: "2026-04-10T09:00:00.000Z",
      issuer: { id: "free-provider", name: "Nora Provider" },
      lines: [
        {
          id: "line-1",
          description: "Séance",
          quantity: 1,
          unitPrice: 120,
          unit: "séance",
          totalHT: 120,
        },
      ],
    },
  ],
  timeline: [],
};

describe("OrderTrackerClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendOrderMessage.mockResolvedValue({ success: true });
    mockAcceptQuote.mockResolvedValue({ success: true });
    mockRejectQuote.mockResolvedValue({ success: true });
    mockCreateReview.mockResolvedValue({ ok: true });
    mockConfirmBookingLine.mockResolvedValue({ ok: true });
    mockCreateUserDeskRequest.mockResolvedValue({ ok: true });
  });

  it("montre Accepter / Refuser au freelance demandeur sans afficher Envoyer un devis", () => {
    render(
      <OrderTrackerClient
        data={baseData}
        currentUserId="free-requester"
        apiToken="token"
      />,
    );

    expect(screen.queryAllByRole("button", { name: /envoyer un devis/i })).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: /accepter/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /refuser/i }).length).toBeGreaterThan(0);
  });

  it("montre Envoyer un devis au prestataire sans afficher Accepter / Refuser", () => {
    render(
      <OrderTrackerClient
        data={baseData}
        currentUserId="free-provider"
        apiToken="token"
      />,
    );

    expect(screen.getAllByRole("button", { name: /envoyer un devis/i }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: /accepter/i })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /refuser/i })).toHaveLength(0);
  });

  it("permet au prestataire de valider une réservation après acceptation du devis", async () => {
    render(
      <OrderTrackerClient
        data={{ ...baseData, booking: { ...baseData.booking, status: "QUOTE_ACCEPTED" } }}
        currentUserId="free-provider"
        apiToken="token"
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /valider la réservation/i })[0]!);

    await waitFor(() => {
      expect(mockConfirmBookingLine).toHaveBeenCalledWith({ bookingId: "booking-1" });
    });
  });

  it("permet de créer une demande Desk contextualisée avec le bookingId", async () => {
    render(
      <OrderTrackerClient
        data={baseData}
        currentUserId="free-requester"
        apiToken="token"
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: /signaler un problème au desk/i })[0]!,
    );
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Le suivi de commande est bloqué côté réservation." },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer au desk/i }));

    await waitFor(() => {
      expect(mockCreateUserDeskRequest).toHaveBeenCalledWith(
        "LITIGE",
        "Le suivi de commande est bloqué côté réservation.",
        { bookingId: "booking-1" },
      );
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
