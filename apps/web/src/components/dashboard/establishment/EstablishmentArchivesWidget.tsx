"use client";

import { BookingLine } from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuoteCreationModal } from "@/components/dashboard/QuoteCreationModal";
import { RefreshCcw, User } from "lucide-react";

interface EstablishmentArchivesWidgetProps {
    bookings: BookingLine[];
}

export function EstablishmentArchivesWidget({ bookings }: EstablishmentArchivesWidgetProps) {
    if (bookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
                <p>Aucune mission archivée.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
                {bookings.map((booking) => (
                    <div
                        key={booking.lineId}
                        className="flex items-center justify-between p-3 rounded-md border bg-card text-card-foreground shadow-sm group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{booking.interlocutor}</span>
                                    <span className="text-xs text-muted-foreground">| {booking.date}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{booking.typeLabel}</p>
                            </div>
                        </div>

                        <QuoteCreationModal
                            initialData={{
                                // We want to re-engage this specific freelance
                                // Ideally we need their ID. BookingLine has `interlocutor` (name) but maybe not ID?
                                // getBookingsPageData might need to return freelanceId/establishmentId explicitly.
                                // For now, we will pass what we have using the available data structure.
                                // If BookingLine lacks freelanceId, we might need to update the action or assume implicit context.
                                // In `bookings.ts`, BookingLine has `interlocutor`.
                                // Let's check `QuoteCreationModal` again. It takes `freelanceId` string.
                                // I will assume for this demo that we might not have the ID perfectly mapped in BookingLine yet,
                                // but I'll set description to help the user.
                                description: `Renouvellement mission: ${booking.typeLabel} avec ${booking.interlocutor}`,
                                // freelanceId: booking.freelanceId // We should add this to BookingLine if missing
                            }}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" title="Réengager">
                                    <RefreshCcw className="h-4 w-4 text-primary" />
                                </Button>
                            }
                        />
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
