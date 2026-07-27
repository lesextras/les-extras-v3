"use client";

import { useState } from "react";
import { MessageCircleQuestion, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
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
import { requestMissionInfo } from "@/app/actions/missions";

interface RequestMissionInfoModalProps {
  missionId: string;
  missionTitle?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 1000;

export function RequestMissionInfoModal({
  missionId,
  missionTitle,
  triggerLabel = "Demander plus d'informations",
  triggerClassName,
}: RequestMissionInfoModalProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = message.trim();
  const isValid = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isValid) {
      setError(
        trimmed.length < MIN_LENGTH
          ? `Votre demande doit faire au moins ${MIN_LENGTH} caractères.`
          : `Maximum ${MAX_LENGTH} caractères.`,
      );
      return;
    }

    setSubmitting(true);
    const result = await requestMissionInfo(missionId, trimmed);
    setSubmitting(false);

    if (result.ok) {
      toast.success("Demande envoyée", {
        description:
          "Votre demande a été transmise à l'équipe. Vous recevrez une réponse dans votre espace Mes demandes.",
      });
      setMessage("");
      setOpen(false);
      return;
    }

    setError(result.error ?? "Impossible d'envoyer la demande.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <MessageCircleQuestion className="h-4 w-4 mr-2" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Demander plus d&apos;informations</DialogTitle>
          <DialogDescription>
            {missionTitle ? (
              <>
                Posez votre question à propos de la mission «&nbsp;{missionTitle}&nbsp;».
                Notre équipe traitera votre demande et vous répondra directement dans votre espace
                Mes demandes.
              </>
            ) : (
              <>
                Posez votre question&nbsp;: notre équipe la traitera et vous répondra directement
                dans votre espace Mes demandes.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="info-request-message">Votre demande</Label>
            <Textarea
              id="info-request-message"
              name="message"
              rows={5}
              placeholder="Ex : Pouvez-vous préciser le public accueilli et les transmissions prévues ?"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                if (error) setError(null);
              }}
              className="resize-none"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "info-request-error" : undefined}
              maxLength={MAX_LENGTH + 50}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {error ? (
                  <span id="info-request-error" className="text-destructive">
                    {error}
                  </span>
                ) : (
                  `Au moins ${MIN_LENGTH} caractères — professionnel et précis.`
                )}
              </span>
              <span>
                {trimmed.length} / {MAX_LENGTH}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !isValid} className="gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {submitting ? "Envoi…" : "Envoyer ma demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
