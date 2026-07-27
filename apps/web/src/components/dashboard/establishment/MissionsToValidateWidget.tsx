"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { completeBookingLine, type BookingLine } from "@/app/actions/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatFinanceDate, getBookingActionId } from "@/lib/establishment-finance";
import { getBookingStatusLabel, getBookingStatusVariant } from "@/lib/booking-status";

interface MissionsToValidateWidgetProps {
    bookings: BookingLine[];
}

export function MissionsToValidateWidget({ bookings }: MissionsToValidateWidgetProps) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleValidate = async (booking: BookingLine) => {
        const bookingId = getBookingActionId(booking);
        setLoadingId(bookingId);

        try {
            const result = await completeBookingLine({ bookingId });
            if (result.ok) {
                toast.success("Heures validées.");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la validation des heures.",
            );
        } finally {
            setLoadingId(null);
        }
    };

    if (bookings.length === 0) return null;

    return (
        <div className="space-y-3">
            {bookings.map((booking) => {
                const bookingId = getBookingActionId(booking);
                const isLoading = loadingId === bookingId;

                return (
                    <article
                        key={booking.lineId}
                        className="rounded-xl border border-[hsl(var(--amber)/0.35)] bg-[hsl(var(--amber)/0.08)] p-4"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 hidden rounded-full border border-[hsl(var(--amber)/0.35)] bg-[hsl(var(--amber)/0.12)] p-2 text-[hsl(var(--amber))] sm:block">
                                    <Clock className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-semibold">Mission terminée à valider</h4>
                                        <Badge variant={getBookingStatusVariant(booking.status)}>
                                            {getBookingStatusLabel(booking.status)}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {booking.typeLabel} avec {booking.interlocutor}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFinanceDate(booking.date)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Confirmez les heures avant le passage au paiement.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="warm"
                                className="w-full sm:w-auto"
                                onClick={() => handleValidate(booking)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="h-4 w-4" />
                                )}
                                Valider les heures
                            </Button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
