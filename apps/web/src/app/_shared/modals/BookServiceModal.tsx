"use client";

// Modale « Réserver un atelier » (ESTABLISHMENT réserve un Service FREELANCE).
// POST /services/:id/book -> crée un Booking (status REQUESTED) sur le service.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "../form-fields";
import { formatMoney } from "../format";

export function BookServiceModal({
  serviceId,
  serviceTitle,
  price,
  accountId,
  trigger,
}: {
  serviceId: string;
  serviceTitle: string;
  price?: string | number | null;
  accountId: string;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await apiRequest(`/services/${serviceId}/book`, {
        method: "POST",
        body: {
          scheduledAt: String(fd.get("scheduledAt") || "") || undefined,
          participants: fd.get("participants") ? Number(fd.get("participants")) : undefined,
          message: String(fd.get("message") || "") || undefined,
        },
        accountId,
      });
      toast({
        title: "Demande de réservation envoyée",
        description: "L'intervenant vous répondra rapidement pour confirmer.",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réservation impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Réserver</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Réserver un atelier</DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-2">
            <span className="line-clamp-1">{serviceTitle}</span>
            <span className="shrink-0 font-medium text-foreground">{formatMoney(price)}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date souhaitée" htmlFor="scheduledAt">
              <Input id="scheduledAt" name="scheduledAt" type="date" />
            </Field>
            <Field label="Participants" htmlFor="participants">
              <Input id="participants" name="participants" type="number" min={1} placeholder="8" />
            </Field>
          </div>
          <Field label="Précisions" htmlFor="message" hint="Public accueilli, objectifs, contraintes…">
            <Textarea id="message" name="message" rows={3} />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi…" : "Demander la réservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
