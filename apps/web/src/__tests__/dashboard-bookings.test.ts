import { describe, expect, it } from "vitest";
import type { BookingLine } from "@/app/actions/bookings";
import { getNextUpcomingBooking, isUpcomingBooking } from "@/lib/dashboard-bookings";

const baseMission: BookingLine = {
  lineId: "mission-base",
  lineType: "MISSION",
  date: "2026-04-30T10:00:00.000Z",
  typeLabel: "Mission SOS",
  interlocutor: "EHPAD A",
  status: "CONFIRMED",
  address: "Paris",
  contactEmail: "contact@example.com",
};

describe("getNextUpcomingBooking", () => {
  it("retient la mission future la plus proche et ignore les statuts ou dates non valides", () => {
    const now = new Date("2026-04-25T10:00:00.000Z");

    const nextBooking = getNextUpcomingBooking(
      [
        {
          ...baseMission,
          lineId: "past-confirmed",
          date: "2026-04-20T10:00:00.000Z",
        },
        {
          ...baseMission,
          lineId: "invalid-date",
          date: "not-a-date",
        },
        {
          ...baseMission,
          lineId: "cancelled-future",
          date: "2026-04-26T10:00:00.000Z",
          status: "CANCELLED",
        },
        {
          ...baseMission,
          lineId: "future-far",
          date: "2026-05-02T10:00:00.000Z",
        },
        {
          ...baseMission,
          lineId: "future-nearest",
          date: "2026-04-26T10:00:00.000Z",
          status: "ASSIGNED",
        },
      ],
      now,
    );

    expect(nextBooking?.lineId).toBe("future-nearest");
  });

  it("retient aussi une mission prévue exactement maintenant", () => {
    const now = new Date("2026-04-25T10:00:00.000Z");

    const nextBooking = getNextUpcomingBooking(
      [
        {
          ...baseMission,
          lineId: "equal-now",
          date: "2026-04-25T10:00:00.000Z",
        },
        {
          ...baseMission,
          lineId: "future-after",
          date: "2026-04-25T10:30:00.000Z",
        },
      ],
      now,
    );

    expect(nextBooking?.lineId).toBe("equal-now");
  });

  it("retourne undefined quand aucune mission future confirmée ou assignée n'existe", () => {
    const now = new Date("2026-04-25T10:00:00.000Z");

    expect(
      getNextUpcomingBooking(
        [
          {
            ...baseMission,
            lineId: "past-only",
            date: "2026-04-20T10:00:00.000Z",
          },
          {
            ...baseMission,
            lineId: "pending-future",
            date: "2026-04-27T10:00:00.000Z",
            status: "PENDING",
          },
        ],
        now,
      ),
    ).toBeUndefined();
  });

  it("expose le même prédicat pour les compteurs de missions à venir", () => {
    const now = new Date("2026-04-25T10:00:00.000Z");

    expect(isUpcomingBooking({ ...baseMission, date: "2026-04-25T10:00:00.000Z" }, now)).toBe(true);
    expect(isUpcomingBooking({ ...baseMission, date: "2026-04-25T09:59:59.000Z" }, now)).toBe(false);
    expect(isUpcomingBooking({ ...baseMission, status: "PENDING" }, now)).toBe(false);
    expect(isUpcomingBooking({ ...baseMission, date: "not-a-date" }, now)).toBe(false);
  });
});
