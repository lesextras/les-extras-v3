import { describe, expect, it } from "vitest";
import type { MissionStatus } from "@/app/actions/marketplace";
import {
  getMissionStatusLabel,
  getMissionStatusVariant,
  isMissionAssigned,
  isMissionClosed,
  isMissionOpen,
} from "@/lib/mission-status";

const expectedStatuses: Array<{
  status: MissionStatus;
  label: string;
  variant: string;
  open: boolean;
  assigned: boolean;
  closed: boolean;
}> = [
  { status: "OPEN", label: "Ouverte", variant: "amber", open: true, assigned: false, closed: false },
  { status: "ASSIGNED", label: "Assignée", variant: "teal", open: false, assigned: true, closed: false },
  { status: "COMPLETED", label: "Terminée", variant: "emerald", open: false, assigned: false, closed: true },
  { status: "CANCELLED", label: "Annulée", variant: "red", open: false, assigned: false, closed: true },
];

const validBadgeVariants = new Set(["amber", "teal", "emerald", "red", "info", "outline", "quiet"]);

describe("mission-status", () => {
  it("centralise les labels et variants des statuts mission connus", () => {
    for (const expected of expectedStatuses) {
      expect(getMissionStatusLabel(expected.status)).toBe(expected.label);
      expect(getMissionStatusVariant(expected.status)).toBe(expected.variant);
      expect(validBadgeVariants.has(getMissionStatusVariant(expected.status))).toBe(true);
    }
  });

  it("centralise les predicates mission", () => {
    for (const expected of expectedStatuses) {
      expect(isMissionOpen(expected.status)).toBe(expected.open);
      expect(isMissionAssigned(expected.status)).toBe(expected.assigned);
      expect(isMissionClosed(expected.status)).toBe(expected.closed);
    }
  });

  it("garde un fallback lisible pour un statut inconnu", () => {
    expect(getMissionStatusLabel("UNKNOWN_STATUS")).toBe("UNKNOWN STATUS");
    expect(getMissionStatusVariant("UNKNOWN_STATUS")).toBe("quiet");
    expect(isMissionOpen("UNKNOWN_STATUS")).toBe(false);
    expect(isMissionAssigned("UNKNOWN_STATUS")).toBe(false);
    expect(isMissionClosed("UNKNOWN_STATUS")).toBe(false);
  });
});
