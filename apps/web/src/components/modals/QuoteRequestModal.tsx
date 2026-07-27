"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays, Users, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { bookService } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/lib/stores/useUIStore";
import { buildManualServiceDate } from "@/lib/service-booking";
import { normalizeServiceBookingErrorMessage } from "@/lib/service-booking-errors";

type FormErrors = {
  date?: string;
  participants?: string;
  submit?: string;
};

export function QuoteRequestModal() {
  const isOpen = useUIStore((s) => s.isQuoteRequestModalOpen);
  const serviceId = useUIStore((s) => s.quoteRequestServiceId);
  const close = useUIStore((s) => s.closeQuoteRequestModal);
  const router = useRouter();

  const [date, setDate] = useState("");
  const [nbParticipants, setNbParticipants] = useState(1);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    close();
    setTimeout(() => {
      setDate("");
      setNbParticipants(1);
      setMessage("");
      setErrors({});
    }, 300);
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: undefined,
      };
    });
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!date) {
      nextErrors.date = "Veuillez renseigner une date souhaitée.";
    } else if (!buildManualServiceDate(date)) {
      nextErrors.date = "Choisissez une date future pour votre demande.";
    }

    if (!Number.isInteger(nbParticipants) || nbParticipants < 1) {
      nextErrors.participants = "Le nombre de participants estimé doit être supérieur ou égal à 1.";
    }

    setErrors((current) => ({
      ...current,
      date: nextErrors.date,
      participants: nextErrors.participants,
      submit: undefined,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = () => {
    if (!serviceId) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const requestedDate = buildManualServiceDate(date);
    if (!requestedDate) {
      setErrors((current) => ({
        ...current,
        date: "Choisissez une date future pour votre demande.",
      }));
      return;
    }

    startTransition(async () => {
      const result = await bookService(
        serviceId,
        requestedDate,
        message || undefined,
        nbParticipants,
      );

      if ("error" in result) {
        setErrors((current) => ({
          ...current,
          submit: normalizeServiceBookingErrorMessage(result.error),
        }));
        return;
      }

      toast.success("Demande de devis envoyée ! Le freelance vous répondra prochainement.");
      handleClose();
      router.refresh();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demander un devis</DialogTitle>
          <DialogDescription>
            Précisez vos besoins. Le freelance vous enverra un devis personnalisé que vous pourrez accepter ou refuser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="qr-date" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              Date souhaitée
            </Label>
            <Input
              id="qr-date"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                clearError("date");
              }}
            />
            {errors.date && (
              <p className="text-xs text-red-500" role="alert">
                {errors.date}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-nb" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              Nombre de participants estimé
            </Label>
            <Input
              id="qr-nb"
              type="number"
              min={1}
              value={nbParticipants}
              onChange={(event) => {
                setNbParticipants(Number(event.target.value));
                clearError("participants");
              }}
            />
            {errors.participants && (
              <p className="text-xs text-red-500" role="alert">
                {errors.participants}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-msg" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-600" />
              Description de votre besoin
            </Label>
            <Textarea
              id="qr-msg"
              placeholder="Décrivez votre contexte, vos objectifs, vos contraintes…"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Après envoi, le freelance aura accès à votre demande et rédigera un devis directement dans l&apos;application.
          </div>

          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {errors.submit}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Annuler</Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {isPending ? "Envoi…" : "Envoyer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
