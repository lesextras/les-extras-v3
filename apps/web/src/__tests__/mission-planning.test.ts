import { describe, expect, it } from "vitest";
import { getMissionPlanning, validateMissionPlanning } from "@/lib/mission-planning";

describe("mission-planning", () => {
  it("selects the first future slot instead of the mission envelope", () => {
    const planning = getMissionPlanning(
      {
        dateStart: "2026-05-05T08:00:00.000Z",
        dateEnd: "2026-05-07T18:00:00.000Z",
        planning: [
          {
            dateStart: "2026-05-05",
            heureDebut: "08:00",
            dateEnd: "2026-05-05",
            heureFin: "12:00",
          },
          {
            dateStart: "2026-05-07",
            heureDebut: "14:00",
            dateEnd: "2026-05-07",
            heureFin: "18:00",
          },
        ],
      },
      new Date("2026-05-06T09:00:00.000Z"),
    );

    expect(planning.nextSlot?.dateStart).toBe("2026-05-07");
    expect(planning.firstSlot?.dateStart).toBe("2026-05-05");
  });

  it("reports duplicates and overlaps", () => {
    const issues = validateMissionPlanning(
      [
        {
          dateStart: "2026-05-10",
          heureDebut: "08:00",
          dateEnd: "2026-05-10",
          heureFin: "12:00",
        },
        {
          dateStart: "2026-05-10",
          heureDebut: "08:00",
          dateEnd: "2026-05-10",
          heureFin: "12:00",
        },
        {
          dateStart: "2026-05-10",
          heureDebut: "11:00",
          dateEnd: "2026-05-10",
          heureFin: "13:00",
        },
      ],
      new Date("2026-05-01T09:00:00.000Z"),
    );

    expect(issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Cette plage fait doublon avec une autre.",
        "Cette plage chevauche une autre plage.",
      ]),
    );
  });
});
