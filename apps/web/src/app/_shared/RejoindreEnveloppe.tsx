"use client";

// L'invitation se LIT avant de s'accepter : qui paie, combien par mois, et ce
// que le payeur verra (des nombres, jamais les écrits). L'acceptation est un
// clic explicite, pas un effet du chargement de la page.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, LogIn, PenLine, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";

interface Apercu {
  compte: string;
  qui: string;
  plafondMensuel: number;
  partageTrames: boolean;
  emailMasque: string;
  expireLe: string;
}

type Etat = "chargement" | "apercu" | "envoi" | "ok" | "connexion" | "echec";

function lireMessage(data: unknown): string {
  const brut = (data as { message?: string | string[] } | null)?.message;
  return Array.isArray(brut) ? String(brut[0]) : typeof brut === "string" ? brut : "";
}

export function RejoindreEnveloppe({ jeton }: { jeton?: string }) {
  const [etat, setEtat] = useState<Etat>(jeton ? "chargement" : "echec");
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!jeton) return;
    fetch(`/api/proxy/lex/enveloppes/apercu/${encodeURIComponent(jeton)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          setMessage(lireMessage(data));
          setEtat("echec");
          return;
        }
        setApercu(data as Apercu);
        setEtat("apercu");
      })
      .catch(() => setEtat("echec"));
  }, [jeton]);

  const accepter = async () => {
    setEtat("envoi");
    const r = await fetch("/api/proxy/lex/enveloppes/accepter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jeton }),
    }).catch(() => null);
    if (!r) return setEtat("echec");
    if (r.ok) return setEtat("ok");
    if (r.status === 401) return setEtat("connexion");
    setMessage(lireMessage(await r.json().catch(() => null)));
    setEtat("echec");
  };

  const retour = `/lex/rejoindre?jeton=${encodeURIComponent(jeton ?? "")}`;

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-5 p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>

        {etat === "chargement" && <Loader2 className="mx-auto size-8 animate-spin text-primary" />}

        {(etat === "apercu" || etat === "envoi") && apercu && (
          <>
            <PenLine className="mx-auto size-10 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">{apercu.compte} prend en charge vos générations LEX</h1>
            <p className="text-sm text-muted-foreground">
              {apercu.qui} vous offre jusqu’à <strong className="text-foreground">{apercu.plafondMensuel} générations par mois</strong> avec LEX,
              l’assistant d’écriture de Les Extras
              {apercu.partageTrames ? ", avec les trames maison de l’établissement" : ""}.
            </p>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-left text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>
                Vous gardez votre propre compte. {apercu.compte} voit seulement combien de générations vous utilisez,
                jamais ce que vous écrivez.
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Invitation envoyée à {apercu.emailMasque}.</p>
            <Button className="w-full" loading={etat === "envoi"} onClick={() => void accepter()}>
              Accepter
            </Button>
          </>
        )}

        {etat === "ok" && (
          <>
            <CheckCircle2 className="mx-auto size-12 text-success" />
            <h1 className="text-xl font-bold tracking-tight">C’est fait</h1>
            <p className="text-sm text-muted-foreground">
              Vos prochaines générations LEX sont prises en charge, dans la limite du mois. Vos quinze générations
              gratuites restent à vous.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/assistant">Écrire avec LEX</Link>
            </Button>
          </>
        )}

        {etat === "connexion" && (
          <>
            <LogIn className="mx-auto size-10 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Connectez-vous pour accepter</h1>
            <p className="text-sm text-muted-foreground">
              Avec l’adresse qui a reçu l’invitation, ou créez votre compte avec cette même adresse. Nous vous ramenons
              ici juste après.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/login?next=${encodeURIComponent(retour)}`}>Me connecter</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/register?next=${encodeURIComponent(retour)}`}>Créer mon compte</Link>
              </Button>
            </div>
          </>
        )}

        {etat === "echec" && (
          <>
            <XCircle className="mx-auto size-12 text-destructive" />
            <h1 className="text-xl font-bold tracking-tight">Invitation non valable</h1>
            <p className="text-sm text-muted-foreground">
              {message || "Ce lien est incomplet, a expiré ou a déjà servi. Demandez-en un nouveau à la personne qui vous l’a envoyé."}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Aller à mon espace</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
