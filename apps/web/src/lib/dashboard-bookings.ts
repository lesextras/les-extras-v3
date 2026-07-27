import type { BookingLine } from "@/app/actions/bookings";

const UPCOMING_BOOKING_STATUSES = new Set<BookingLine["status"]>([
    "CONFIRMED",
    "ASSIGNED",
]);

export function getNextUpcomingBooking(
    bookings: BookingLine[],
    now = new Date(),
): BookingLine | undefined {
    return bookings
        .filter((booking) => isUpcomingBooking(booking, now))
        .sort((left, right) => {
            return new Date(left.date).getTime() - new Date(right.date).getTime();
        })[0];
}

export function isUpcomingBooking(booking: BookingLine, now = new Date()): boolean {
    if (!UPCOMING_BOOKING_STATUSES.has(booking.status)) return false;

    const date = new Date(booking.date);
    if (Number.isNaN(date.getTime())) return false;

    return date.getTime() >= now.getTime();
}
