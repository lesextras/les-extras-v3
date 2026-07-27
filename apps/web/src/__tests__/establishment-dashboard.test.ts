import { describe, expect, it } from "vitest";
import type { EstablishmentMission } from "@/app/actions/missions";
import { getNextAssignedMission } from "@/lib/establishment-dashboard";

const baseMission: EstablishmentMission = {
  id: "mission-base",
  title: "Renfort éducateur",
  dateStart: "2099-04-12T10:00:00.000Z",
  dateEnd: "2099-04-12T18:00:00.000Z",
  address: "Lyon",
  hourlyRate: 28,
  status: "OPEN",
  isRenfort: true,
  city: "Lyon",
  bookings: [],
};

describe("getNextAssignedMission", () => {
  it("ignore une mission OPEN sans freelance assigné", () => {
    const nextMission = getNextAssignedMission(
      [
        {
          ...baseMission,
          id: "open-future",
          status: "OPEN",
        },
      ],
      new Date("2099-04-10T10:00:00.000Z"),
    );

    expect(nextMission).toBeNull();
  });

  it("retient une mission ASSIGNED future ou égale à maintenant", () => {
    const nextMission = getNextAssignedMission(
      [
        {
          ...baseMission,
          id: "assigned-now",
          status: "ASSIGNED",
          dateStart: "2099-04-12T10:00:00.000Z",
          dateEnd: "2099-04-12T18:00:00.000Z",
        },
      ],
      new Date("2099-04-12T10:00:00.000Z"),
    );

    expect(nextMission?.id).toBe("assigned-now");
  });

  it("retient une mission OPEN si un booking est confirmé ou assigné", () => {
    const nextMission = getNextAssignedMission(
      [
        {
          ...baseMission,
          id: "open-with-confirmed-booking",
          status: "OPEN",
          bookings: [{ id: "booking-1", status: "CONFIRMED", freelanceId: "free-1" }],
        },
      ],
      new Date("2099-04-10T10:00:00.000Z"),
    );

    expect(nextMission?.id).toBe("open-with-confirmed-booking");
  });

  it("ignore les dates invalides, les missions passées et les missions annulées", () => {
    const nextMission = getNextAssignedMission(
      [
        {
          ...baseMission,
          id: "invalid-date",
          status: "ASSIGNED",
          dateStart: "not-a-date",
          dateEnd: "2099-04-12T18:00:00.000Z",
        },
        {
          ...baseMission,
          id: "past-assigned",
          status: "ASSIGNED",
          dateStart: "2099-04-09T10:00:00.000Z",
          dateEnd: "2099-04-09T18:00:00.000Z",
        },
        {
          ...baseMission,
          id: "cancelled-future",
          status: "CANCELLED",
          dateStart: "2099-04-11T10:00:00.000Z",
          dateEnd: "2099-04-11T18:00:00.000Z",
          bookings: [{ id: "booking-cancelled", status: "CONFIRMED" }],
        },
        {
          ...baseMission,
          id: "future-assigned",
          status: "ASSIGNED",
          dateStart: "2099-04-13T10:00:00.000Z",
          dateEnd: "2099-04-13T18:00:00.000Z",
        },
      ],
      new Date("2099-04-10T10:00:00.000Z"),
    );

    expect(nextMission?.id).toBe("future-assigned");
  });

  it("retourne l'intervention assignée future la plus proche", () => {
    const nextMission = getNextAssignedMission(
      [
        {
          ...baseMission,
          id: "future-late",
          status: "ASSIGNED",
          dateStart: "2099-04-20T10:00:00.000Z",
          dateEnd: "2099-04-20T18:00:00.000Z",
        },
        {
          ...baseMission,
          id: "future-nearest",
          status: "ASSIGNED",
          dateStart: "2099-04-12T10:00:00.000Z",
          dateEnd: "2099-04-12T18:00:00.000Z",
        },
      ],
      new Date("2099-04-10T10:00:00.000Z"),
    );

    expect(nextMission?.id).toBe("future-nearest");
  });
});
