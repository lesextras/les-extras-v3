"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays, Users, MessageSquare, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { bookService } from "@/app/actions/marketplace";
import { getService, type SerializedService } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/lib/stores/useUIStore";
import { formatDuration, type ServiceSlot } from "@/lib/atelier-config";
import { buildManualServiceDate, getServiceSlotStart } from "@/lib/service-booking";
import { normalizeServiceBookingErrorMessage } from "@/lib/service-booking-errors";

type Step = 0 | 1 | 2;

type FormErrors = {
  date?: string;
  participants?: string;
  submit?: string;
};

export function BookServiceModal() {
  const isOpen = useUIStore((s) => s.isBookServiceModalOpen);
  const serviceId = useUIStore((s) => s.bookServiceModalId);
  const close = useUIStore((s) => s.closeBookServiceModal);
  const router = useRouter();

  const [service, setService] = useState<SerializedService | null>(null);
  const [isLoadingService, setIsLoadingService] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [selectedSlot, setSelectedSlot] = useState<ServiceSlot | null>(null);
  const [manualDate, setManualDate] = useState("");
  const [nbParticipants, setNbParticipants] = useState(1);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && serviceId) {
      let cancelled = false;
      setIsLoadingService(true);
      setService(null);
      setErrors({});

      getService(serviceId)
        .then((nextService) => {
          if (cancelled) {
            return;
          }

          setService(nextService);
          if (!nextService) {
            setErrors({
              submit: "Ce service n'est plus accessible.",
            });
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : "Impossible de charger ce service.";
          setErrors({ submit: message });
          toast.error(message);
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingService(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }
  }, [isOpen, serviceId]);

  const handleClose = () => {
    close();
    setTimeout(() => {
      setService(null);
      setStep(0);
      setIsLoadingService(false);
      setSelectedSlot(null);
      setManualDate("");
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

  const validateDateStep = () => {
    const computedDate = selectedSlot
      ? getServiceSlotStart(selectedSlot)
      : buildManualServiceDate(manualDate);

    if (!selectedSlot && !manualDate) {
      setErrors((current) => ({
        ...current,
        date: "Sélectionnez un créneau futur ou renseignez une date souhaitée.",
      }));
      return false;
    }

    if (!computedDate || computedDate <= new Date()) {
      setErrors((current) => ({
        ...current,
        date: "Choisissez une date future pour votre demande.",
      }));
      return false;
    }

    clearError("date");
    clearError("submit");
    return true;
  };

  const validateParticipants = () => {
    if (!Number.isInteger(nbParticipants) || nbParticipants < 1) {
      setErrors((current) => ({
        ...current,
        participants: "Le nombre de participants doit être supérieur ou égal à 1.",
      }));
      return false;
    }

    if (service?.capacity && nbParticipants > service.capacity) {
      setErrors((current) => ({
        ...current,
        participants: `La capacité maximale de ce service est de ${service.capacity} participants.`,
      }));
      return false;
    }

    clearError("participants");
    clearError("submit");
    return true;
  };

  const goNext = () => {
    if (step === 0 && !validateDateStep()) {
      return;
    }

    if (step === 1 && !validateParticipants()) {
      return;
    }

    setStep((currentStep) => (Math.min(currentStep + 1, 2) as Step));
  };

  const onSubmit = () => {
    if (!serviceId) {
      return;
    }

    const isDateValid = validateDateStep();
    const areParticipantsValid = validateParticipants();
    if (!isDateValid || !areParticipantsValid) {
      return;
    }

    const computedDate = selectedSlot
      ? getServiceSlotStart(selectedSlot)
      : buildManualServiceDate(manualDate);

    if (!computedDate) {
      setErrors((current) => ({
        ...current,
        date: "Choisissez une date future pour votre demande.",
      }));
      return;
    }

    startTransition(async () => {
      const result = await bookService(
        serviceId,
        computedDate,
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

      toast.success("Demande envoyée au prestataire !");
      handleClose();
      router.refresh();
    });
  };

  const slots = Array.isArray(service?.slots) ? (service.slots as ServiceSlot[]) : [];
  const availableSlots = slots.filter((slot) => {
    const start = getServiceSlotStart(slot);
    return start !== null && start.getTime() > Date.now();
  });
  const hasOnlyPastSlots = slots.length > 0 && availableSlots.length === 0;
  const serviceLabelWithArticle =
    service?.type === "TRAINING" ? "la formation" : service ? "l'atelier" : "le service";
  const serviceLabelCapitalized =
    service?.type === "TRAINING" ? "Formation" : service ? "Atelier" : "Service";
  const totalPrice =
    service?.pricingType === "PER_PARTICIPANT" && service.pricePerParticipant
      ? service.pricePerParticipant * nbParticipants
      : service?.price ?? 0;
  const isServiceUnavailable = !isLoadingService && !service;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Réserver {serviceLabelWithArticle}</DialogTitle>
          <DialogDescription>{service?.title ?? "Chargement…"}</DialogDescription>
        </DialogHeader>

        {!isServiceUnavailable && (
          <div className="mb-2 flex items-center gap-2">
            {(["Créneau", "Participants", "Récap"] as const).map((label, index) => (
              <div key={label} className="flex flex-1 items-center">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    index < step
                      ? "bg-primary text-primary-foreground"
                      : index === step
                      ? "border-2 border-primary bg-[hsl(var(--color-teal-100))] text-[hsl(var(--color-teal-700))]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < step ? <Check className="h-3 w-3" /> : index + 1}
                </div>
                {index < 2 && <div className={`mx-1 h-0.5 flex-1 ${index < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="min-h-[180px] space-y-4 py-2">
          {isLoadingService && (
            <div className="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">
              Chargement du service…
            </div>
          )}

          {isServiceUnavailable && errors.submit && (
            <div className="flex min-h-[180px] items-center justify-center">
              <div
                className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
                role="alert"
              >
                {errors.submit}
              </div>
            </div>
          )}

          {!isLoadingService && !isServiceUnavailable && step === 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Choisissez un créneau disponible
              </Label>

              {slots.length === 0 || hasOnlyPastSlots ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {hasOnlyPastSlots
                      ? "Les créneaux renseignés sont déjà passés. Proposez une autre date."
                      : "Aucun créneau renseigné par le freelance. Proposez une date."}
                  </p>
                  <Input
                    id="book-manual-date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={manualDate}
                    onChange={(event) => {
                      setManualDate(event.target.value);
                      setSelectedSlot(null);
                      clearError("date");
                    }}
                  />
                </div>
              ) : (
                <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto pr-1">
                  {availableSlots.map((slot, index) => {
                    const active =
                      selectedSlot?.date === slot.date &&
                      selectedSlot?.heureDebut === slot.heureDebut;
                    const dateLabel = new Date(slot.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    });

                    return (
                      <button
                        key={`${slot.date}-${slot.heureDebut}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setManualDate("");
                          clearError("date");
                        }}
                        className={`flex items-center justify-between rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                          active
                            ? "border-primary bg-[hsl(var(--color-teal-50))]"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div>
                          <p className="font-medium capitalize">{dateLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {slot.heureDebut} – {slot.heureFin}
                            {service?.durationMinutes && ` (${formatDuration(service.durationMinutes)})`}
                          </p>
                        </div>
                        {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {errors.date && (
                <p className="text-xs text-red-500" role="alert">
                  {errors.date}
                </p>
              )}
            </div>
          )}

          {!isLoadingService && !isServiceUnavailable && step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nb-part" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Nombre de participants
                </Label>
                <Input
                  id="nb-part"
                  type="number"
                  min={1}
                  max={service?.capacity ?? 100}
                  value={nbParticipants}
                  onChange={(event) => {
                    setNbParticipants(Number(event.target.value));
                    clearError("participants");
                  }}
                />
                {service?.capacity && (
                  <p className="text-xs text-muted-foreground">
                    Capacité max : {service.capacity} participants
                  </p>
                )}
                {errors.participants && (
                  <p className="text-xs text-red-500" role="alert">
                    {errors.participants}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="book-msg" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Message (optionnel)
                </Label>
                <Textarea
                  id="book-msg"
                  placeholder="Précisez vos besoins, attentes ou contraintes…"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
            </div>
          )}

          {!isLoadingService && !isServiceUnavailable && step === 2 && (selectedSlot || manualDate) && (
            <div className="space-y-3 rounded-xl border bg-[hsl(var(--surface-2))] p-4 text-sm">
              <p className="font-semibold text-foreground">Récapitulatif de votre demande</p>
              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{serviceLabelCapitalized}</span>
                  <span className="max-w-[60%] truncate text-right font-medium">{service?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>
                    {selectedSlot ? (
                      <>
                        {new Date(selectedSlot.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                        })}{" "}
                        {selectedSlot.heureDebut} – {selectedSlot.heureFin}
                      </>
                    ) : (
                      buildManualServiceDate(manualDate)?.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants</span>
                  <span>{nbParticipants}</span>
                </div>
                {service?.pricingType !== "QUOTE" && (
                  <div className="flex justify-between border-t pt-1 text-base font-semibold">
                    <span>Total estimé</span>
                    <span className="text-[hsl(var(--teal-text))]">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(totalPrice)}
                    </span>
                  </div>
                )}
              </div>

              {message && (
                <p className="border-t pt-2 text-xs text-muted-foreground">
                  Message : {message}
                </p>
              )}
            </div>
          )}

          {!isServiceUnavailable && errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {errors.submit}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-2">
          {isServiceUnavailable ? (
            <Button onClick={handleClose}>Fermer</Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep((currentStep) => (Math.max(currentStep - 1, 0) as Step))}
                disabled={step === 0 || isLoadingService}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </Button>

              {step < 2 ? (
                <Button onClick={goNext} className="gap-1" disabled={isLoadingService}>
                  Suivant <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={onSubmit} disabled={isPending || isLoadingService}>
                  {isPending ? "Envoi…" : "Envoyer la demande"}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
