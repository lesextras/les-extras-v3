"use client";

// Demande de devis SANS COMPTE. Exiger une inscription avant le premier contact
// fait perdre l'essentiel des demandes : on prend les coordonnées, on qualifie après.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2 } from "lucide-react";

export function PublicQuoteForm({
  serviceId,
  formationSlug,
  titre,
}: {
  serviceId?: string;
  formationSlug?: string;
  titre: string;
}) {
  const { toast } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnvoi(true);
    try {
      const res = await fetch("/api/proxy/public/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          formationSlug,
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone") || undefined,
          organization: f.get("organization") || undefined,
          role: f.get("role") || undefined,
          city: f.get("city") || undefined,
          desiredDate: f.get("desiredDate") || undefined,
          participants: f.get("participants") || undefined,
          message: f.get("message"),
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(
          Array.isArray(d.message) ? d.message[0] : (d.message ?? "Envoi impossible"),
        );
      }
      setEnvoye(true);
    } catch (err) {
      toast({ title: "Envoi impossible", description: (err as Error).message });
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardContent className="space-y-1 p-5 text-center">
          <CheckCircle2 className="mx-auto size-6 text-success" />
          <p className="font-medium text-foreground">Demande envoyée</p>
          <p className="text-sm text-muted-foreground">
            Nous revenons vers vous sous 48 h avec un devis chiffré.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!ouvert) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setOuvert(true)}>
        Demander un devis sans créer de compte
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <p className="mb-3 text-sm font-medium text-foreground">Devis — {titre}</p>
        <form onSubmit={soumettre} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="name" required placeholder="Vos nom et prénom *" />
            <Input name="email" type="email" required placeholder="Votre e-mail *" />
            <Input name="phone" placeholder="Téléphone" />
            <Input name="organization" placeholder="Structure (MECS, IME…)" />
            <Input name="role" placeholder="Votre fonction" />
            <Input name="city" placeholder="Ville" />
            <Input name="desiredDate" placeholder="Période souhaitée" />
            <Input name="participants" placeholder="Nombre de participants" />
          </div>
          <Textarea
            name="message"
            required
            rows={4}
            placeholder="Votre besoin, le public concerné, vos contraintes… *"
          />
          <p className="text-xs text-muted-foreground">
            Vos coordonnées servent uniquement à traiter cette demande. Aucun compte
            n’est créé, aucune donnée n’est transmise à un tiers.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={envoi}>
              {envoi ? "Envoi…" : "Envoyer ma demande"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
