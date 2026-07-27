import { describe, expect, it } from "vitest";
import {
  getDeskPriorityLabel,
  getDeskPriorityVariant,
  getDeskStatusLabel,
  getDeskStatusVariant,
  isDeskRequestLate,
  isDeskRequestOpen,
  sortDeskRequestsByPriority,
} from "@/lib/desk-status";
import type { DeskRequestRow } from "@/app/actions/admin";

function makeRequest(overrides: Partial<DeskRequestRow> = {}): DeskRequestRow {
  return {
    id: "dr-1",
    type: "TECHNICAL_ISSUE",
    priority: "NORMAL",
    status: "OPEN",
    assignedToAdminId: null,
    message: "Test message",
    response: null,
    answeredAt: null,
    createdAt: new Date().toISOString(),
    mission: null,
    booking: null,
    requester: { id: "u-1", email: "user@test.fr", profile: null },
    assignedToAdmin: null,
    answeredBy: null,
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// getDeskStatusLabel
// ─────────────────────────────────────────────

describe("getDeskStatusLabel", () => {
  it.each([
    ["OPEN", "Ouverte"],
    ["IN_PROGRESS", "En cours"],
    ["ANSWERED", "Répondue"],
    ["CLOSED", "Clôturée"],
  ] as const)("retourne '%s' pour le statut %s", (status, expected) => {
    expect(getDeskStatusLabel(status)).toBe(expected);
  });
});

// ─────────────────────────────────────────────
// getDeskStatusVariant
// ─────────────────────────────────────────────

describe("getDeskStatusVariant", () => {
  it("retourne 'default' pour OPEN", () => {
    expect(getDeskStatusVariant("OPEN")).toBe("default");
  });

  it("retourne 'secondary' pour IN_PROGRESS", () => {
    expect(getDeskStatusVariant("IN_PROGRESS")).toBe("secondary");
  });

  it("retourne 'outline' pour ANSWERED", () => {
    expect(getDeskStatusVariant("ANSWERED")).toBe("outline");
  });

  it("retourne 'outline' pour CLOSED", () => {
    expect(getDeskStatusVariant("CLOSED")).toBe("outline");
  });
});

// ─────────────────────────────────────────────
// getDeskPriorityLabel
// ─────────────────────────────────────────────

describe("getDeskPriorityLabel", () => {
  it.each([
    ["LOW", "Basse"],
    ["NORMAL", "Normale"],
    ["HIGH", "Haute"],
    ["URGENT", "Urgente"],
  ] as const)("retourne '%s' pour la priorité %s", (priority, expected) => {
    expect(getDeskPriorityLabel(priority)).toBe(expected);
  });
});

// ─────────────────────────────────────────────
// getDeskPriorityVariant
// ─────────────────────────────────────────────

describe("getDeskPriorityVariant", () => {
  it("retourne 'quiet' pour LOW", () => {
    expect(getDeskPriorityVariant("LOW")).toBe("quiet");
  });

  it("retourne 'default' pour NORMAL", () => {
    expect(getDeskPriorityVariant("NORMAL")).toBe("default");
  });

  it("retourne 'amber' pour HIGH", () => {
    expect(getDeskPriorityVariant("HIGH")).toBe("amber");
  });

  it("retourne 'coral' pour URGENT", () => {
    expect(getDeskPriorityVariant("URGENT")).toBe("coral");
  });
});

// ─────────────────────────────────────────────
// isDeskRequestOpen
// ─────────────────────────────────────────────

describe("isDeskRequestOpen", () => {
  it("retourne true pour OPEN", () => {
    expect(isDeskRequestOpen("OPEN")).toBe(true);
  });

  it("retourne true pour IN_PROGRESS", () => {
    expect(isDeskRequestOpen("IN_PROGRESS")).toBe(true);
  });

  it("retourne false pour ANSWERED", () => {
    expect(isDeskRequestOpen("ANSWERED")).toBe(false);
  });

  it("retourne false pour CLOSED", () => {
    expect(isDeskRequestOpen("CLOSED")).toBe(false);
  });
});

// ─────────────────────────────────────────────
// isDeskRequestLate
// ─────────────────────────────────────────────

describe("isDeskRequestLate", () => {
  it("retourne false pour une demande clôturée même très ancienne", () => {
    const now = new Date();
    const veryOld = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      isDeskRequestLate(makeRequest({ status: "CLOSED", priority: "URGENT", createdAt: veryOld }), now),
    ).toBe(false);
  });

  it("retourne false pour une demande ANSWERED", () => {
    const now = new Date();
    const old = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      isDeskRequestLate(makeRequest({ status: "ANSWERED", priority: "URGENT", createdAt: old }), now),
    ).toBe(false);
  });

  it("retourne true pour une demande URGENT ouverte de plus de 2h", () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(
      isDeskRequestLate(makeRequest({ status: "OPEN", priority: "URGENT", createdAt: threeHoursAgo }), now),
    ).toBe(true);
  });

  it("retourne false pour une demande URGENT ouverte de moins de 2h", () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    expect(
      isDeskRequestLate(makeRequest({ status: "OPEN", priority: "URGENT", createdAt: oneHourAgo }), now),
    ).toBe(false);
  });

  it("retourne true pour une demande HIGH ouverte de plus de 24h", () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      isDeskRequestLate(makeRequest({ status: "IN_PROGRESS", priority: "HIGH", createdAt: twoDaysAgo }), now),
    ).toBe(true);
  });

  it("retourne false pour une date invalide (ne plante pas)", () => {
    const now = new Date();
    expect(
      isDeskRequestLate(makeRequest({ status: "OPEN", priority: "HIGH", createdAt: "invalid-date" }), now),
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────
// sortDeskRequestsByPriority
// ─────────────────────────────────────────────

describe("sortDeskRequestsByPriority", () => {
  it("trie URGENT avant NORMAL", () => {
    const now = new Date();
    const requests = [
      makeRequest({ id: "r1", priority: "NORMAL", createdAt: new Date(Date.now() - 10000).toISOString() }),
      makeRequest({ id: "r2", priority: "URGENT", createdAt: new Date(Date.now() - 5000).toISOString() }),
    ];
    const sorted = sortDeskRequestsByPriority(requests, now);
    expect(sorted[0]!.id).toBe("r2");
    expect(sorted[1]!.id).toBe("r1");
  });

  it("trie par ancienneté (plus ancien en premier) à priorité égale", () => {
    const now = new Date();
    const older = new Date(Date.now() - 20000).toISOString();
    const newer = new Date(Date.now() - 5000).toISOString();
    const requests = [
      makeRequest({ id: "r1", priority: "NORMAL", createdAt: newer }),
      makeRequest({ id: "r2", priority: "NORMAL", createdAt: older }),
    ];
    const sorted = sortDeskRequestsByPriority(requests, now);
    expect(sorted[0]!.id).toBe("r2");
    expect(sorted[1]!.id).toBe("r1");
  });

  it("trie dans l'ordre URGENT → HIGH → NORMAL → LOW", () => {
    const now = new Date();
    const ts = new Date(Date.now()).toISOString();
    const requests = [
      makeRequest({ id: "low", priority: "LOW", createdAt: ts }),
      makeRequest({ id: "urgent", priority: "URGENT", createdAt: ts }),
      makeRequest({ id: "normal", priority: "NORMAL", createdAt: ts }),
      makeRequest({ id: "high", priority: "HIGH", createdAt: ts }),
    ];
    const sorted = sortDeskRequestsByPriority(requests, now);
    expect(sorted.map((r) => r.id)).toEqual(["urgent", "high", "normal", "low"]);
  });

  it("ne modifie pas le tableau original", () => {
    const now = new Date();
    const requests = [
      makeRequest({ id: "r1", priority: "LOW" }),
      makeRequest({ id: "r2", priority: "URGENT" }),
    ];
    sortDeskRequestsByPriority(requests, now);
    expect(requests[0]!.id).toBe("r1");
    expect(requests[1]!.id).toBe("r2");
  });

  it("gère un tableau vide sans erreur", () => {
    expect(sortDeskRequestsByPriority([], new Date())).toEqual([]);
  });
});
