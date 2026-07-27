import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingLine } from "@/app/actions/bookings";

const completeBookingLineMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/actions/bookings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/actions/bookings")>();
  return {
    ...actual,
    completeBookingLine: (...args: unknown[]) => completeBookingLineMock(...args),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const { MissionsToValidateWidget } = await import(
  "@/components/dashboard/establishment/MissionsToValidateWidget"
);

const booking: BookingLine = {
  lineId: "line-hours",
  lineType: "MISSION",
  date: "2099-04-12T10:00:00.000Z",
  typeLabel: "Mission SOS",
  interlocutor: "Nora Martin",
  status: "COMPLETED_AWAITING_PAYMENT",
  address: "Lyon",
  contactEmail: "contact@example.com",
  relatedBookingId: "booking-hours",
};

describe("MissionsToValidateWidget", () => {
  beforeEach(() => {
    completeBookingLineMock.mockReset();
    refreshMock.mockClear();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it("ne crash pas avec une date invalide", () => {
    render(<MissionsToValidateWidget bookings={[{ ...booking, date: "not-a-date" }]} />);

    expect(screen.getByText("Date à confirmer")).toBeInTheDocument();
  });

  it("appelle completeBookingLine avec relatedBookingId si présent", async () => {
    completeBookingLineMock.mockResolvedValue({ ok: true });
    render(<MissionsToValidateWidget bookings={[booking]} />);

    fireEvent.click(screen.getByRole("button", { name: /valider les heures/i }));

    await waitFor(() => {
      expect(completeBookingLineMock).toHaveBeenCalledWith({ bookingId: "booking-hours" });
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Heures validées.");
  });
});
