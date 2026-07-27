import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Mail } from "lucide-react";
import { getSession, deleteSession } from "@/lib/session";
import {
    getBookingsPageDataSafe,
    getBookingLineDetailsSafe,
    type BookingLine,
    type BookingLineType,
} from "@/app/actions/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContextualDeskRequestButton } from "@/components/dashboard/ContextualDeskRequestButton";
import { getBookingStatusLabel, getBookingStatusVariant } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

const VALID_LINE_TYPES = new Set<string>(["MISSION", "SERVICE_BOOKING"]);

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
});

interface BookingDetailsPageProps {
    params: { lineType: string; lineId: string };
}

function BookingDetailsUnavailable({ message }: { message: string }) {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
                <Link href="/bookings">
                    <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Mes réservations
                </Link>
            </Button>

            <div className="rounded-xl border border-[hsl(var(--color-amber-300))] bg-[hsl(var(--color-amber-50))] p-4 text-sm text-[hsl(var(--color-amber-800))]">
                {message}
            </div>
        </div>
    );
}

function getDeskRequestContext(line: BookingLine) {
    if (line.relatedBookingId) {
        return { bookingId: line.relatedBookingId };
    }

    if (line.lineType === "MISSION") {
        return { missionId: line.lineId };
    }

    return { bookingId: line.lineId };
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
    const { lineType, lineId } = params;

    if (!VALID_LINE_TYPES.has(lineType)) notFound();
    const safeLineType = lineType as BookingLineType;

    const session = await getSession();
    if (!session) redirect("/login");

    const [dataResult, detailsResult] = await Promise.all([
        getBookingsPageDataSafe(session.token),
        getBookingLineDetailsSafe({ lineType: safeLineType, lineId }, session.token),
    ]);

    if (
        (!dataResult.ok && dataResult.unauthorized) ||
        (!detailsResult.ok && detailsResult.unauthorized)
    ) {
        await deleteSession();
        redirect("/login");
    }

    if (!dataResult.ok) {
        return <BookingDetailsUnavailable message={dataResult.error} />;
    }

    const data = dataResult.data;
    const line = data.lines.find(
        (l) => l.lineType === safeLineType && l.lineId === lineId,
    );
    if (!line) notFound();
    const details = detailsResult.ok ? detailsResult.data : null;

    const statusLabel = getBookingStatusLabel(line.status);
    const statusVariant = getBookingStatusVariant(line.status);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
                <Link href="/bookings">
                    <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Mes réservations
                </Link>
            </Button>

            <header className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-display text-heading-xl tracking-tight">
                        {line.typeLabel}
                    </h1>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>
                <p className="text-body-md text-muted-foreground">{line.interlocutor}</p>
            </header>

            <div className="grid gap-4">
                {!detailsResult.ok && (
                    <div className="rounded-xl border border-[hsl(var(--color-amber-300))] bg-[hsl(var(--color-amber-50))] p-4 text-sm text-[hsl(var(--color-amber-800))]">
                        {detailsResult.error}
                    </div>
                )}

                <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
                    <Calendar
                        className="mt-0.5 h-5 w-5 text-[hsl(var(--teal))] shrink-0"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="text-sm font-semibold mb-0.5">Date</p>
                        <p className="text-sm text-muted-foreground">
                            {dateFormatter.format(new Date(line.date))}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
                    <MapPin
                        className="mt-0.5 h-5 w-5 text-[hsl(var(--teal))] shrink-0"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="text-sm font-semibold mb-0.5">Adresse</p>
                        <p className="text-sm text-muted-foreground">
                            {details?.address ?? line.address}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
                    <Mail
                        className="mt-0.5 h-5 w-5 text-[hsl(var(--teal))] shrink-0"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="text-sm font-semibold mb-0.5">Contact</p>
                        <p className="text-sm text-muted-foreground">
                            {details?.contactEmail ?? line.contactEmail}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4">
                    <ContextualDeskRequestButton
                        context={getDeskRequestContext(line)}
                        type={line.lineType === "SERVICE_BOOKING" ? "BOOKING_FAILURE" : "LITIGE"}
                        label="Signaler un problème au Desk"
                    />
                </div>
            </div>
        </div>
    );
}
