import { describe, expect, it } from "vitest";
import type { EstablishmentMission } from "@/app/actions/missions";
import {
    getAssignedUpcomingMissions,
    getMissionsWithPendingCandidates,
    getRenfortPriority,
    getRenfortsToFill,
} from "@/lib/establishment-renforts";

const now = new Date("2099-01-01T10:00:00.000Z");

function mission(overrides: Partial<EstablishmentMission> = {}): EstablishmentMission {
    return {
        id: "mission-base",
        title: "Renfort éducateur",
        dateStart: "2099-01-02T10:00:00.000Z",
        dateEnd: "2099-01-02T18:00:00.000Z",
        address: "Lyon",
        hourlyRate: 28,
        status: "OPEN",
        isRenfort: true,
        city: "Lyon",
        bookings: [],
        ...overrides,
    };
}

describe("establishment-renforts helpers", () => {
    it("retourne seulement les missions OPEN futures sans booking assigné", () => {
        const result = getRenfortsToFill(
            [
                mission({ id: "open-future" }),
                mission({ id: "assigned", status: "ASSIGNED" }),
                mission({
                    id: "past-open",
                    dateStart: "2098-12-31T10:00:00.000Z",
                    dateEnd: "2098-12-31T18:00:00.000Z",
                }),
                mission({
                    id: "open-confirmed",
                    bookings: [{ id: "booking-confirmed", status: "CONFIRMED" }],
                }),
            ],
            now,
        );

        expect(result.map((item) => item.id)).toEqual(["open-future"]);
    });

    it("accepte une mission qui démarre exactement maintenant", () => {
        const result = getRenfortsToFill(
            [
                mission({
                    id: "open-now",
                    dateStart: "2099-01-01T10:00:00.000Z",
                    dateEnd: "2099-01-01T18:00:00.000Z",
                }),
            ],
            now,
        );

        expect(result.map((item) => item.id)).toEqual(["open-now"]);
    });

    it("trie les missions avec candidatures par urgence puis date proche", () => {
        const result = getMissionsWithPendingCandidates(
            [
                mission({
                    id: "normal-close",
                    dateStart: "2099-01-01T12:00:00.000Z",
                    dateEnd: "2099-01-01T18:00:00.000Z",
                    bookings: [{ id: "pending-normal", status: "PENDING" }],
                }),
                mission({
                    id: "urgent-far",
                    isUrgent: true,
                    dateStart: "2099-01-04T10:00:00.000Z",
                    dateEnd: "2099-01-04T18:00:00.000Z",
                    bookings: [{ id: "pending-far", status: "PENDING" }],
                }),
                mission({
                    id: "urgent-close",
                    isUrgent: true,
                    dateStart: "2099-01-02T10:00:00.000Z",
                    dateEnd: "2099-01-02T18:00:00.000Z",
                    bookings: [{ id: "pending-close", status: "PENDING" }],
                }),
            ],
            now,
        );

        expect(result.map((item) => item.id)).toEqual([
            "urgent-close",
            "urgent-far",
            "normal-close",
        ]);
    });

    it("retourne les interventions assignées futures uniquement", () => {
        const result = getAssignedUpcomingMissions(
            [
                mission({ id: "assigned-status", status: "ASSIGNED" }),
                mission({
                    id: "open-confirmed-booking",
                    bookings: [{ id: "confirmed", status: "CONFIRMED" }],
                }),
                mission({ id: "open-without-freelance" }),
                mission({
                    id: "cancelled-confirmed",
                    status: "CANCELLED",
                    bookings: [{ id: "cancelled-confirmed-booking", status: "CONFIRMED" }],
                }),
            ],
            now,
        );

        expect(result.map((item) => item.id)).toEqual([
            "assigned-status",
            "open-confirmed-booking",
        ]);
    });

    it("priorise une mission urgente proche avec candidature et sans freelance", () => {
        const urgentClose = mission({
            id: "urgent-close",
            isUrgent: true,
            dateStart: "2099-01-02T08:00:00.000Z",
            dateEnd: "2099-01-02T12:00:00.000Z",
            bookings: [{ id: "pending", status: "PENDING" }],
        });
        const normalFar = mission({
            id: "normal-far",
            dateStart: "2099-01-10T10:00:00.000Z",
            dateEnd: "2099-01-10T18:00:00.000Z",
        });

        const urgentPriority = getRenfortPriority(urgentClose, now);
        const normalPriority = getRenfortPriority(normalFar, now);

        expect(urgentPriority.score).toBeGreaterThan(normalPriority.score);
        expect(urgentPriority.isUrgent).toBe(true);
        expect(urgentPriority.isWithin48h).toBe(true);
        expect(urgentPriority.pendingCandidates).toBe(1);
        expect(urgentPriority.hasAssignedFreelance).toBe(false);
    });

    it("ignore les dates invalides", () => {
        const result = getRenfortsToFill(
            [
                mission({
                    id: "invalid-date",
                    dateStart: "not-a-date",
                    dateEnd: "2099-01-02T18:00:00.000Z",
                }),
            ],
            now,
        );

        expect(result).toEqual([]);
    });
});
