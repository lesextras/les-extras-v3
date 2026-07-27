"use client";

import { BookingLine } from "@/app/actions/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Phone, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBookingStatusLabel, getBookingStatusVariant } from "@/lib/booking-status";

interface UpcomingMissionsWidgetProps {
    bookings: BookingLine[];
}

export function UpcomingMissionsWidget({ bookings }: UpcomingMissionsWidgetProps) {
    if (bookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mb-2 opacity-50" />
                <p>Aucun renfort prévu prochainement.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
                {bookings.map((booking) => (
                    <div
                        key={booking.lineId}
                        className="flex flex-col gap-3 p-3 rounded-md border bg-card text-card-foreground shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{booking.date}</span>
                                {/* We could parse date to check if it is today */}
                            </div>
                            <Badge variant={getBookingStatusVariant(booking.status)} className="text-xs">
                                {getBookingStatusLabel(booking.status)}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{booking.interlocutor}</p>
                                <p className="text-xs text-muted-foreground">{booking.typeLabel}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{booking.address}</span>
                        </div>

                        <Button variant="outline" size="sm" className="w-full mt-1 gap-2 h-8" asChild>
                            <a href={`tel:${booking.contactEmail}`}>
                                <Phone className="h-3 w-3" />
                                Contacter
                            </a>
                        </Button>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
