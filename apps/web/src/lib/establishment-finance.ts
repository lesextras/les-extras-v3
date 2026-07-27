import type { BookingLine } from "@/app/actions/bookings";

// Cycle actuel côté établissement :
// COMPLETED_AWAITING_PAYMENT = mission terminée, heures à valider ;
// AWAITING_PAYMENT = heures validées, paiement à autoriser ;
// PAID = paiement autorisé, facture disponible si l'API expose une URL.
export function getBookingActionId(booking: Pick<BookingLine, "lineId" | "relatedBookingId">) {
    return booking.relatedBookingId ?? booking.lineId;
}

export function formatFinanceDate(value: string | null | undefined) {
    if (!value) return "Date à confirmer";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Date à confirmer";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}
