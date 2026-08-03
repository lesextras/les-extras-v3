"use client";

// Modale « Demander un devis » — l'établissement décrit son besoin, l'intervenant
// chiffrera ensuite. POST /quotes -> Quote en statut REQUESTED. Le compte
// demandeur est celui du garde, il n'est plus transmis par le client.
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

export function RequestQuoteModal({
  serviceId,
  serviceTitle,
  accountId,
  trigger,
}: {
  serviceId: string;
  serviceTitle: string;
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
    const form = new FormData(e.currentTarget);
    const scheduledAt = String(form.get("scheduledAt") || "");
    try {
      const quote = await apiRequest<{ id: string }>(
        "/quotes",
        {
          method: "POST",
          body: {
            serviceId,
            title: serviceTitle,
            request: String(form.get("request") || "") || undefined,
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          },
        },
      );
      setOpen(false);
      toast({
        title: "Demande envoyée",
        description: "L'intervenant va vous adresser un devis chiffré.",
      });
      router.push(`/dashboard/devis/${quote.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Demander un devis</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demander un devis</DialogTitle>
          <DialogDescription>
            {serviceTitle} — décrivez votre besoin, l&apos;intervenant vous
            répond avec un chiffrage détaillé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Date souhaitée" htmlFor="scheduledAt">
            <Input id="scheduledAt" name="scheduledAt" type="date" />
          </Field>
          <Field
            label="Votre besoin"
            htmlFor="request"
            hint="Public concerné, effectif, durée, contraintes particulières…"
          >
            <Textarea
              id="request"
              name="request"
              rows={5}
              placeholder="Ex. : groupe de 8 adolescents en MECS, séance de 2 h le mercredi après-midi, sur site."
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi…" : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
