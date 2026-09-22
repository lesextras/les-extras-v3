"use client";

// Modale « Poser une question » — le fil s’ouvre directement avec l’intervenant,
// depuis la fiche, sans passer par une demande de devis.
//
// ⚠ POURQUOI CETTE PORTE EXISTE MAINTENANT. Le fil libre depuis le catalogue
// était refusé côté serveur, et la raison tenait : on se fait démarcher, puis on
// réserve dehors. Mais la plupart des gens n’en sont pas à « je prends » — ils
// demandent si ça convient à des 6-8 ans, si le déplacement est possible. Ce qui
// protège le modèle, c’est le masquage des coordonnées, pas l’absence de
// messagerie.
//
// POST /conversations/ouvrir avec serviceId -> fil de type INTERVENANT.
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

export function PoserQuestionModal({
  serviceId,
  serviceTitle,
  trigger,
}: {
  serviceId: string;
  serviceTitle: string;
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
    try {
      await apiRequest("/conversations/ouvrir", {
        method: "POST",
        body: {
          type: "INTERVENANT",
          serviceId,
          body: String(form.get("body") || ""),
        },
      });
      setOpen(false);
      toast({
        title: "Question envoyée",
        description: "La réponse arrivera dans votre messagerie.",
      });
      router.push("/dashboard/inbox");
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
        {trigger ?? <Button variant="outline">Poser une question</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Poser une question</DialogTitle>
          <DialogDescription>
            {serviceTitle} : demandez ce que vous avez besoin de savoir avant
            de vous engager. L&apos;intervenant vous répond directement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Votre question"
            hint="Par exemple : est-ce que ça convient à des 6-8 ans ? Vous déplacez-vous jusqu’à Melun ? La date du 12 tient-elle ?"
          >
            <Textarea
              name="body"
              required
              minLength={1}
              maxLength={4000}
              rows={5}
              placeholder="Bonjour, je suis éducatrice en MECS et je me demande si…"
            />
          </Field>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Les numéros de téléphone et les adresses électroniques sont masqués
            dans la messagerie : échangez ici, le devis suivra.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi…" : "Envoyer ma question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
