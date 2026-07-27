import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingLine } from "@/app/actions/bookings";

const authorizePaymentMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/actions/payments", () => ({
  authorizePayment: (...args: unknown[]) => authorizePaymentMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const { PaymentValidationWidget } = await import("@/components/dashboard/PaymentValidationWidget");

const booking: BookingLine = {
  lineId: "line-payment",
  lineType: "MISSION",
  date: "2099-04-12T10:00:00.000Z",
  typeLabel: "Mission SOS",
  interlocutor: "Nora Martin",
  status: "AWAITING_PAYMENT",
  address: "Lyon",
  contactEmail: "contact@example.com",
  relatedBookingId: "booking-payment",
};

describe("PaymentValidationWidget", () => {
  beforeEach(() => {
    authorizePaymentMock.mockReset();
    refreshMock.mockClear();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it("affiche un état vide", () => {
    render(<PaymentValidationWidget bookings={[]} />);

    expect(screen.getByText("Aucun paiement à autoriser.")).toBeInTheDocument();
  });

  it("ne crash pas avec une date invalide", () => {
    render(<PaymentValidationWidget bookings={[{ ...booking, date: "not-a-date" }]} />);

    expect(screen.getByText("Date à confirmer")).toBeInTheDocument();
  });

  it("appelle authorizePayment avec relatedBookingId si présent", async () => {
    authorizePaymentMock.mockResolvedValue({ success: true });
    render(<PaymentValidationWidget bookings={[booking]} />);

    fireEvent.click(screen.getByRole("button", { name: /autoriser le paiement/i }));

    await waitFor(() => {
      expect(authorizePaymentMock).toHaveBeenCalledWith("booking-payment");
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Paiement autorisé.");
  });
});
