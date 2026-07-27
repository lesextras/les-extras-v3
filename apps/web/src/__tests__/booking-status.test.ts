import { describe, expect, it } from "vitest";
import type { BookingLineStatus } from "@/app/actions/bookings";
import {
  getBookingStatusLabel,
  getBookingStatusVariant,
  isBookingActive,
  isBookingAwaitingPayment,
  isBookingCancellable,
  isBookingCompleted,
  isBookingPendingDecision,
} from "@/lib/booking-status";

const expectedStatuses: Array<{
  status: BookingLineStatus;
  label: string;
  variant: string;
  active: boolean;
  cancellable: boolean;
  awaitingPayment: boolean;
  completed: boolean;
  pendingDecision: boolean;
}> = [
  { status: "PENDING", label: "En attente", variant: "amber", active: false, cancellable: true, awaitingPayment: false, completed: false, pendingDecision: true },
  { status: "QUOTE_SENT", label: "Devis envoyé", variant: "teal", active: false, cancellable: true, awaitingPayment: false, completed: false, pendingDecision: false },
  { status: "QUOTE_ACCEPTED", label: "Devis accepté", variant: "emerald", active: true, cancellable: true, awaitingPayment: false, completed: false, pendingDecision: false },
  { status: "CONFIRMED", label: "Confirmé", variant: "teal", active: true, cancellable: true, awaitingPayment: false, completed: false, pendingDecision: false },
  { status: "ASSIGNED", label: "Assigné", variant: "teal", active: true, cancellable: true, awaitingPayment: false, completed: false, pendingDecision: false },
  { status: "IN_PROGRESS", label: "En cours", variant: "info", active: true, cancellable: false, awaitingPayment: false, completed: false, pendingDecision: false },
  { status: "COMPLETED", label: "Terminé", variant: "quiet", active: false, cancellable: false, awaitingPayment: false, completed: true, pendingDecision: false },
  { status: "COMPLETED_AWAITING_PAYMENT", label: "Terminé, paiement attendu", variant: "amber", active: false, cancellable: false, awaitingPayment: true, completed: true, pendingDecision: false },
  { status: "AWAITING_PAYMENT", label: "Paiement attendu", variant: "amber", active: false, cancellable: false, awaitingPayment: true, completed: true, pendingDecision: false },
  { status: "PAID", label: "Payé", variant: "emerald", active: false, cancellable: false, awaitingPayment: false, completed: true, pendingDecision: false },
  { status: "CANCELLED", label: "Annulé", variant: "red", active: false, cancellable: false, awaitingPayment: false, completed: false, pendingDecision: false },
];

const validBadgeVariants = new Set(["amber", "teal", "emerald", "red", "info", "outline", "quiet"]);

describe("booking-status", () => {
  it("centralise les labels et variants des statuts connus", () => {
    for (const expected of expectedStatuses) {
      expect(getBookingStatusLabel(expected.status)).toBe(expected.label);
      expect(getBookingStatusVariant(expected.status)).toBe(expected.variant);
    }
  });

  it("retourne un label français pour chaque statut connu", () => {
    for (const expected of expectedStatuses) {
      const label = getBookingStatusLabel(expected.status);

      expect(label).toBe(expected.label);
      expect(label).not.toBe(expected.status);
      expect(label).not.toMatch(/_/);
    }
  });

  it("retourne un variant Badge valide pour chaque statut connu", () => {
    for (const expected of expectedStatuses) {
      expect(validBadgeVariants.has(getBookingStatusVariant(expected.status))).toBe(true);
    }
  });

  it("centralise les statuts actifs et annulables", () => {
    for (const expected of expectedStatuses) {
      expect(isBookingActive(expected.status)).toBe(expected.active);
      expect(isBookingCancellable(expected.status)).toBe(expected.cancellable);
    }
  });

  it("centralise les statuts de paiement, de complétion et de décision", () => {
    for (const expected of expectedStatuses) {
      expect(isBookingAwaitingPayment(expected.status)).toBe(expected.awaitingPayment);
      expect(isBookingCompleted(expected.status)).toBe(expected.completed);
      expect(isBookingPendingDecision(expected.status)).toBe(expected.pendingDecision);
    }
  });

  it("garde un fallback lisible pour un statut inconnu", () => {
    expect(getBookingStatusLabel("UNKNOWN_STATUS")).toBe("UNKNOWN STATUS");
    expect(getBookingStatusVariant("UNKNOWN_STATUS")).toBe("quiet");
    expect(isBookingActive("UNKNOWN_STATUS")).toBe(false);
    expect(isBookingCancellable("UNKNOWN_STATUS")).toBe(false);
    expect(isBookingAwaitingPayment("UNKNOWN_STATUS")).toBe(false);
    expect(isBookingCompleted("UNKNOWN_STATUS")).toBe(false);
    expect(isBookingPendingDecision("UNKNOWN_STATUS")).toBe(false);
  });
});
