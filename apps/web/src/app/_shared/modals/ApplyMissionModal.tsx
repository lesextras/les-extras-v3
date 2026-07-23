"use client";

// Modale « Candidater » (FREELANCE) — flow SOS Renfort, étape 2.
// POST /missions/:id/apply  -> crée un Booking (status REQUESTED) rattaché au
// compte freelance actif + ouvre/relie une conversation avec l'établissement.
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
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "../form-fields";

export function ApplyMissionModal({
  missionId,
  missionTitle,
  accountId,
  trigger,
}: {
  missionId: string;
  missionTitle: string;
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
      await apiRequest(`/missions/${missionId}/apply`, {
        method: "POST",
        body: { message: String(fd.get("message") || "") || undefined },
        accountId,
      });
      toast({
        title: "Candidature envoyée",
        description: "L'établissement va étudier votre profil. Suivez la conversation dans l'inbox.",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Candidature impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Candidater</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Candidater à ce renfort</DialogTitle>
          <DialogDescription className="line-clamp-2">{missionTitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Message de motivation" htmlFor="message" hint="Optionnel — présentez votre disponibilité et votre expérience.">
            <Textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Disponible sur toute la période, expérience en internat MECS…"
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi…" : "Envoyer ma candidature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
