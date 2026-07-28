"use client";

// Validation du jeton reçu par e-mail. Trois états seulement : en cours,
// confirmé, échec — et dans le cas d'un échec on propose immédiatement de
// renvoyer un lien plutôt que de laisser la personne dans une impasse.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, MailCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/brand/logo";
import { Field } from "./form-fields";

type Etat = "encours" | "ok" | "deja" | "echec";

export function VerifyEmail({ token }: { token?: string }) {
  const { toast } = useToast();
  const [etat, setEtat] = useState<Etat>(token ? "encours" : "echec");
  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    (async () => {
      try {
        const r = await fetch("/api/proxy/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await r.json()) as { verified?: boolean; dejaVerifie?: boolean };
        if (annule) return;
        setEtat(r.ok && data.verified ? (data.dejaVerifie ? "deja" : "ok") : "echec");
      } catch {
        if (!annule) setEtat("echec");
      }
    })();
    return () => {
      annule = true;
    };
  }, [token]);

  async function renvoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const r = await fetch("/api/proxy/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await r.json()) as { message?: string };
      toast({
        title: "C'est envoyé",
        description:
          data.message ??
          "Si cette adresse correspond à un compte non confirmé, un nouveau lien vient de partir.",
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
    <div className="w-full max-w-md space-y-6">
      <div className="flex justify-center">
        <Logo />
      </div>

      <Card>
        <CardContent className="space-y-5 pt-8 text-center">
          {etat === "encours" ? (
            <>
              <Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden />
              <div>
                <h1 className="text-xl font-semibold">Confirmation en cours…</h1>
                <p className="mt-1 text-sm text-muted-foreground">Quelques secondes.</p>
              </div>
            </>
          ) : null}

          {etat === "ok" || etat === "deja" ? (
            <>
              <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
              <div>
                <h1 className="text-2xl font-semibold">
                  {etat === "deja" ? "Adresse déjà confirmée" : "Votre adresse est confirmée"}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {etat === "deja"
                    ? "Ce lien avait déjà été utilisé — tout est en ordre, vous pouvez vous connecter."
                    : "Bienvenue dans la communauté LES EXTRAS, le dispositif de l’association ADéPA. Un e-mail vient de partir avec vos premiers pas."}
                </p>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href="/dashboard">
                  Ouvrir mon espace
                  <ArrowRight />
                </Link>
              </Button>
            </>
          ) : null}

          {etat === "echec" ? (
            <>
              <XCircle className="mx-auto size-12 text-destructive" aria-hidden />
              <div>
                <h1 className="text-xl font-semibold">Ce lien n’est plus valable</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Les liens de confirmation expirent au bout de 24 heures. Indiquez votre adresse :
                  nous vous en envoyons un nouveau tout de suite.
                </p>
              </div>
              <form onSubmit={renvoyer} className="space-y-3 text-left">
                <Field label="Votre adresse e-mail" htmlFor="renvoi-email">
                  <Input
                    id="renvoi-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@exemple.fr"
                    required
                  />
                </Field>
                <Button type="submit" disabled={envoi} className="w-full">
                  {envoi ? "Envoi…" : "Recevoir un nouveau lien"}
                  {!envoi ? <MailCheck /> : null}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Déjà confirmé ?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
