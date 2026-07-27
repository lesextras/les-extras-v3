"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { authorizePayment } from "@/actions/payments";
import type { BookingLine } from "@/app/actions/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatFinanceDate, getBookingActionId } from "@/lib/establishment-finance";
import { getBookingStatusLabel, getBookingStatusVariant } from "@/lib/booking-status";

interface PaymentValidationWidgetProps {
    bookings: BookingLine[];
}

export function PaymentValidationWidget({ bookings }: PaymentValidationWidgetProps) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    async function handlePayment(booking: BookingLine) {
        const bookingId = getBookingActionId(booking);
        setLoadingId(bookingId);

        try {
            const result = await authorizePayment(bookingId);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Paiement autorisé.");
            router.refresh();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Impossible d'autoriser le paiement.",
            );
        } finally {
            setLoadingId(null);
        }
    }

    if (bookings.length === 0) {
        return (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                Aucun paiement à autoriser.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {bookings.map((booking) => {
                const bookingId = getBookingActionId(booking);
                const isLoading = loadingId === bookingId;

                return (
                    <article
                        key={booking.lineId}
                        className="rounded-xl border border-[hsl(var(--teal)/0.25)] bg-white/5 p-4"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold">Paiement à autoriser</h4>
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
                            </div>
                            <Button
                                variant="teal"
                                className="w-full sm:w-auto"
                                onClick={() => handlePayment(booking)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCard className="h-4 w-4" />
                                )}
                                Autoriser le paiement
                            </Button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
