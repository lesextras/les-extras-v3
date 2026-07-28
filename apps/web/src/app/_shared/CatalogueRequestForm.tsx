"use client";

// Formulaire de demande du catalogue. Il retombe sur le même endpoint public
// que le formulaire de contact (avec un type distinct pour le tri côté admin),
// ce qui évite d'ouvrir une deuxième porte à protéger contre les robots.
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sourceAcquisition } from "@/lib/source";
import { useToast } from "@/components/ui/use-toast";

const champ =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function CatalogueRequestForm() {
  const { toast } = useToast();
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnvoi(true);
    try {
      const res = await fetch("/api/proxy/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone") || undefined,
          type: "CATALOGUE",
          content: [
            `Demande du catalogue 2026.`,
            `Structure : ${f.get("organization") || "non précisée"}`,
            `Fonction : ${f.get("role") || "non précisée"}`,
            `Besoin : ${f.get("message") || "non précisé"}`,
          ].join("\n"),
          website: f.get("website") || undefined,
          source: sourceAcquisition(),
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(Array.isArray(d.message) ? d.message[0] : (d.message ?? "Envoi impossible"));
      }
      setEnvoye(true);
    } catch (err) {
      toast({ title: "Envoi impossible", description: (err as Error).message, variant: "error" });
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      <Card>
        <CardContent className="space-y-3 p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <h2 className="text-lg font-semibold text-foreground">Demande enregistrée</h2>
          <p className="text-sm text-muted-foreground">
            Le catalogue part vers votre boîte e-mail sous 48 h. Un coordinateur vous joint si votre
            besoin mérite une réponse sur mesure.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={soumettre} className="relative space-y-3">
          {/* Champ-piège anti-robot : invisible pour un humain. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <label htmlFor="catalogue-website">Ne pas remplir</label>
            <input id="catalogue-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" required minLength={2} placeholder="Nom et prénom *" aria-label="Nom et prénom" className={champ} />
            <input name="email" type="email" required placeholder="E-mail professionnel *" aria-label="E-mail" className={champ} />
            <input name="phone" placeholder="Téléphone" aria-label="Téléphone" className={champ} />
            <input name="organization" placeholder="Structure (MECS, IME, ITEP…)" aria-label="Structure" className={champ} />
          </div>
          <input name="role" placeholder="Votre fonction" aria-label="Fonction" className={champ} />
          <textarea
            name="message"
            rows={4}
            placeholder="Un besoin précis à signaler ? (facultatif)"
            aria-label="Votre besoin"
            className={`${champ} h-auto py-2.5`}
          />
          <Button type="submit" size="lg" disabled={envoi} className="w-full">
            {envoi ? "Envoi…" : "Recevoir le catalogue 2026"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Champs marqués * obligatoires. Réponse sous 48 h ouvrées.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
