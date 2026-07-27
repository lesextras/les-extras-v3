"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookingLine } from "@/app/actions/bookings";
import { QuoteCreationModal } from "@/components/dashboard/QuoteCreationModal";
import { Calendar, ChevronRight, MapPin, Download, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EASE_PREMIUM, STAGGER_DEFAULT } from "@/lib/motion";
import {
    getBookingStatusLabel,
    getBookingStatusVariant,
    isBookingAwaitingPayment,
    isBookingCompleted,
} from "@/lib/booking-status";
import type { Variants } from "framer-motion";

const listContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: STAGGER_DEFAULT },
    },
};

const listItem: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: EASE_PREMIUM },
    },
};

type BookingListWidgetProps = {
    bookings: BookingLine[];
    emptyMessage?: string;
    viewAllLink?: string;
    viewAllLabel?: string;
    className?: string;
    error?: string | null;
};

export function BookingListWidget({
    bookings,
    emptyMessage = "Aucune donnée disponible.",
    viewAllLink = "/bookings",
    viewAllLabel = "Voir toutes les réservations",
    className,
    error,
}: BookingListWidgetProps) {
    return (
        <div className={cn("flex flex-col h-full", className)}>
            <ScrollArea className="flex-1 -mx-6 px-6">
                <motion.div
                    className="space-y-4 pb-4"
                    variants={listContainer}
                    initial="hidden"
                    animate="visible"
                >
                    {bookings.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-sm text-muted-foreground">
                            {error ?? emptyMessage}
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <motion.div
                                key={booking.lineId}
                                variants={listItem}
                                className="flex items-center justify-between rounded-xl border border-border bg-card card-shadow p-4 transition-colors hover:bg-muted/50"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {booking.typeLabel === "Mission SOS" ? "Renfort" : booking.typeLabel}
                                        </span>
                                        <Badge variant={getBookingStatusVariant(booking.status)}>
                                            {getBookingStatusLabel(booking.status)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {booking.date}
                                        </div>
                                        {booking.address && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate max-w-[150px]">{booking.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {booking.invoiceUrl && (
                                        <Button variant="outline" size="icon" asChild title="Télécharger la facture">
                                            <a href={booking.invoiceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Télécharger la facture">
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">Télécharger la facture</span>
                                            </a>
                                        </Button>
                                    )}
                                    {/* Renewal Action for Completed Missions */}
                                    {isBookingCompleted(booking.status) && !isBookingAwaitingPayment(booking.status) && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <QuoteCreationModal
                                                initialData={{
                                                    establishmentId: booking.relatedBookingId,
                                                    description: `Renouvellement: ${booking.typeLabel} - ${booking.address}`,
                                                }}
                                                trigger={
                                                    <Button variant="outline" size="sm" className="gap-1 h-9">
                                                        <RefreshCcw className="h-3 w-3" />
                                                        <span className="sr-only sm:not-sr-only">Renouveler</span>
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    )}
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link
                                            href={`/bookings/${booking.lineType}/${booking.lineId}`}
                                            aria-label={`Voir le détail : ${booking.typeLabel}`}
                                        >
                                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                        </Link>
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </ScrollArea>
            {bookings.length > 0 && (
                <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button variant="link" size="sm" asChild className="px-0">
                        <Link href={viewAllLink} aria-label={viewAllLabel}>
                            Voir tout <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
