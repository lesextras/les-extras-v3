"use client";

// Rappel affiché tant que l'adresse n'est pas confirmée.
//
// Volontairement NON bloquant : couper l'accès à quelqu'un qui vient de
// s'inscrire parce qu'un e-mail s'est perdu en spam, c'est le perdre. On
// rappelle, on propose de renvoyer, et on laisse la personne travailler.
import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function RappelVerification({ email }: { email: string }) {
  const { toast } = useToast();
  const [masque, setMasque] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  if (masque) return null;

  async function renvoyer() {
    setEnvoi(true);
    try {
      await fetch("/api/proxy/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast({
        title: "Lien renvoyé",
        description: `Regardez dans ${email} — et dans les indésirables, au cas où.`,
      });
    } catch {
      toast({
        title: "Envoi impossible",
        description: "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
      <MailWarning className="size-5 shrink-0 text-warning" aria-hidden />
      <p className="min-w-0 flex-1 text-sm text-foreground">
        <span className="font-medium">Confirmez votre adresse e-mail.</span>{" "}
        <span className="text-muted-foreground">
          Sans elle, nous ne pouvons pas vous prévenir quand une mission vous correspond ou
          qu&apos;un devis arrive. Le lien est parti sur {email}.
        </span>
      </p>
      <Button type="button" size="sm" variant="outline" disabled={envoi} onClick={renvoyer}>
        {envoi ? "Envoi…" : "Renvoyer le lien"}
      </Button>
      <button
        type="button"
        onClick={() => setMasque(true)}
        aria-label="Masquer ce rappel"
        className="rounded-md p-1 text-muted-foreground transition hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
