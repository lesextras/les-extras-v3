"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { bookService } from "@/app/actions/marketplace";
import { Calendar } from "@/components/ui/calendar"; // Ensure Calendar component exists or use input date
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { normalizeServiceBookingErrorMessage } from "@/lib/service-booking-errors";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

interface BookingModalProps {
    serviceId: string;
    serviceTitle: string;
    trigger?: React.ReactNode;
}

export function BookingModal({ serviceId, serviceTitle, trigger }: BookingModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>();
    const [message, setMessage] = useState("");

    const handleBooking = async () => {
        if (!date) {
            toast.error("Veuillez sélectionner une date.");
            return;
        }

        setLoading(true);
        try {
            const result = await bookService(serviceId, date, message);
            if ('error' in result) {
                toast.error(normalizeServiceBookingErrorMessage(result.error));
            } else {
                toast.success("Votre demande a été envoyée au freelance.");
                setOpen(false);
                // Reset form
                setDate(undefined);
                setMessage("");
            }
        } catch (error) {
            toast.error("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="lg" className="w-full">Demander une réservation</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Réserver : {serviceTitle}</DialogTitle>
                    <DialogDescription>
                        Proposez une date au freelance. Il devra confirmer votre demande.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Date souhaitée</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="message">Message d'accompagnement (Optionnel)</Label>
                        <Textarea
                            id="message"
                            placeholder="Précisez votre besoin ou vos attentes..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Annuler</Button>
                    <Button onClick={handleBooking} disabled={loading || !date}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Envoyer la demande
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
