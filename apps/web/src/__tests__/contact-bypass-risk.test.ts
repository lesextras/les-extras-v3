import { describe, expect, it } from "vitest";
import {
  getContactBypassReasonLabel,
  getContactBypassRiskLabel,
  getContactBypassRiskScore,
  getContactBypassRiskVariant,
  sortContactBypassEvents,
} from "@/lib/contact-bypass-risk";
import type { ContactBypassEventRow } from "@/app/actions/admin";

function makeEvent(overrides: {
  id?: string;
  blockedReason?: ContactBypassEventRow["blockedReason"];
  senderStatus?: ContactBypassEventRow["sender"]["status"];
  createdAt?: string;
} = {}): ContactBypassEventRow {
  return {
    id: overrides.id ?? "evt-1",
    conversationId: null,
    bookingId: null,
    blockedReason: overrides.blockedReason ?? "EMAIL",
    rawExcerpt: "contenu bloqué",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    sender: {
      id: "user-1",
      email: "user@test.fr",
      name: "Karim Bensalem",
      role: "FREELANCE",
      status: overrides.senderStatus ?? "VERIFIED",
    },
  };
}

// ─── getContactBypassRiskScore ─────────────────────────────────────────────────

describe("getContactBypassRiskScore", () => {
  it("retourne 3 pour PHONE (haut risque)", () => {
    expect(getContactBypassRiskScore(makeEvent({ blockedReason: "PHONE" }))).toBe(3);
  });

  it("retourne 3 pour WHATSAPP (haut risque)", () => {
    expect(getContactBypassRiskScore(makeEvent({ blockedReason: "WHATSAPP" }))).toBe(3);
  });

  it("retourne 3 pour TELEGRAM (haut risque)", () => {
    expect(getContactBypassRiskScore(makeEvent({ blockedReason: "TELEGRAM" }))).toBe(3);
  });

  it("retourne 2 pour EMAIL (risque moyen)", () => {
    expect(getContactBypassRiskScore(makeEvent({ blockedReason: "EMAIL" }))).toBe(2);
  });

  it("retourne 1 pour EXTERNAL_URL (risque moyen bas)", () => {
    expect(getContactBypassRiskScore(makeEvent({ blockedReason: "EXTERNAL_URL" }))).toBe(1);
  });

  it("ajoute 1 pour un utilisateur BANNED", () => {
    expect(
      getContactBypassRiskScore(
        makeEvent({ blockedReason: "EXTERNAL_URL", senderStatus: "BANNED" }),
      ),
    ).toBe(2);
  });

  it("ajoute 1 pour un utilisateur PENDING", () => {
    expect(
      getContactBypassRiskScore(
        makeEvent({ blockedReason: "EMAIL", senderStatus: "PENDING" }),
      ),
    ).toBe(3);
  });

  it("plafonne le score à 4 (PHONE + BANNED)", () => {
    expect(
      getContactBypassRiskScore(makeEvent({ blockedReason: "PHONE", senderStatus: "BANNED" })),
    ).toBe(4);
  });

  it("ne dépasse pas 4 (WHATSAPP + PENDING)", () => {
    expect(
      getContactBypassRiskScore(makeEvent({ blockedReason: "WHATSAPP", senderStatus: "PENDING" })),
    ).toBe(4);
  });
});

// ─── getContactBypassRiskLabel ─────────────────────────────────────────────────

describe("getContactBypassRiskLabel", () => {
  it("retourne 'Haut' pour score 3", () => {
    expect(getContactBypassRiskLabel(3)).toBe("Haut");
  });

  it("retourne 'Haut' pour score 4", () => {
    expect(getContactBypassRiskLabel(4)).toBe("Haut");
  });

  it("retourne 'Moyen' pour score 2", () => {
    expect(getContactBypassRiskLabel(2)).toBe("Moyen");
  });

  it("retourne 'Bas' pour score 1", () => {
    expect(getContactBypassRiskLabel(1)).toBe("Bas");
  });

  it("retourne 'Bas' pour score 0", () => {
    expect(getContactBypassRiskLabel(0)).toBe("Bas");
  });
});

// ─── getContactBypassRiskVariant ──────────────────────────────────────────────

describe("getContactBypassRiskVariant", () => {
  it("retourne 'coral' pour score >= 3", () => {
    expect(getContactBypassRiskVariant(3)).toBe("coral");
    expect(getContactBypassRiskVariant(4)).toBe("coral");
  });

  it("retourne 'amber' pour score 2", () => {
    expect(getContactBypassRiskVariant(2)).toBe("amber");
  });

  it("retourne 'quiet' pour score <= 1", () => {
    expect(getContactBypassRiskVariant(0)).toBe("quiet");
    expect(getContactBypassRiskVariant(1)).toBe("quiet");
  });
});

// ─── getContactBypassReasonLabel ──────────────────────────────────────────────

describe("getContactBypassReasonLabel", () => {
  it.each([
    ["PHONE", "Téléphone"],
    ["WHATSAPP", "WhatsApp"],
    ["TELEGRAM", "Telegram"],
    ["EMAIL", "Email"],
    ["EXTERNAL_URL", "URL externe"],
  ] as const)("retourne '%s' pour la raison %s", (reason, expected) => {
    expect(getContactBypassReasonLabel(reason)).toBe(expected);
  });
});

// ─── sortContactBypassEvents ──────────────────────────────────────────────────

describe("sortContactBypassEvents", () => {
  it("trie PHONE (score 3) avant EXTERNAL_URL (score 1)", () => {
    const events = [
      makeEvent({ id: "url", blockedReason: "EXTERNAL_URL" }),
      makeEvent({ id: "phone", blockedReason: "PHONE" }),
    ];
    const sorted = sortContactBypassEvents(events);
    expect(sorted[0]!.id).toBe("phone");
    expect(sorted[1]!.id).toBe("url");
  });

  it("trie WHATSAPP avant EMAIL à score différent", () => {
    const events = [
      makeEvent({ id: "email", blockedReason: "EMAIL" }),
      makeEvent({ id: "wa", blockedReason: "WHATSAPP" }),
    ];
    const sorted = sortContactBypassEvents(events);
    expect(sorted[0]!.id).toBe("wa");
  });

  it("trie par date décroissante à score égal (plus récent en premier)", () => {
    const older = new Date(Date.now() - 30000).toISOString();
    const newer = new Date(Date.now() - 5000).toISOString();
    const events = [
      makeEvent({ id: "older", blockedReason: "PHONE", createdAt: older }),
      makeEvent({ id: "newer", blockedReason: "PHONE", createdAt: newer }),
    ];
    const sorted = sortContactBypassEvents(events);
    expect(sorted[0]!.id).toBe("newer");
    expect(sorted[1]!.id).toBe("older");
  });

  it("tient compte du bonus statut dans le tri", () => {
    const events = [
      makeEvent({ id: "banned-url", blockedReason: "EXTERNAL_URL", senderStatus: "BANNED" }), // score 2
      makeEvent({ id: "verified-email", blockedReason: "EMAIL", senderStatus: "VERIFIED" }),  // score 2
      makeEvent({ id: "phone", blockedReason: "PHONE", senderStatus: "VERIFIED" }),           // score 3
    ];
    const sorted = sortContactBypassEvents(events);
    expect(sorted[0]!.id).toBe("phone");
  });

  it("ne modifie pas le tableau original", () => {
    const events = [
      makeEvent({ id: "1", blockedReason: "EMAIL" }),
      makeEvent({ id: "2", blockedReason: "PHONE" }),
    ];
    sortContactBypassEvents(events);
    expect(events[0]!.id).toBe("1");
    expect(events[1]!.id).toBe("2");
  });

  it("gère un tableau vide sans erreur", () => {
    expect(sortContactBypassEvents([])).toEqual([]);
  });
});
