"use client";

// Quatre issues possibles, et chacune doit dire quoi faire ensuite :
//   - acceptée : on entre dans l'espace ;
//   - non connecté : on se connecte, puis on revient ICI (le jeton est
//     conservé dans l'URL de retour, sinon l'invitation serait perdue) ;
//   - mauvaise adresse : l'invitation vise quelqu'un d'autre, on le dit ;
//   - expirée ou déjà utilisée : on propose de redemander une invitation.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, LogIn, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";

type Etat = "encours" | "ok" | "connexion" | "echec" | "sansjeton";

export function AccepterInvitation({ token }: { token?: string }) {
  const [etat, setEtat] = useState<Etat>(token ? "encours" : "sansjeton");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    let annule = false;
    (async () => {
      try {
        const r = await fetch("/api/proxy/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (annule) return;
        if (r.ok) {
          setEtat("ok");
          return;
        }
        // 401 : la personne n'est pas encore connectée. Ce n'est pas un échec,
        // c'est une étape — on l'envoie se connecter et on la ramène ici.
        if (r.status === 401) {
          setEtat("connexion");
          return;
        }
        const data = (await r.json().catch(() => null)) as { message?: string | string[] } | null;
        const brut = data?.message;
        setMessage(
          Array.isArray(brut) ? String(brut[0]) : typeof brut === "string" ? brut : "",
        );
        setEtat("echec");
      } catch {
        if (!annule) setEtat("echec");
      }
    })();
    return () => {
      annule = true;
    };
  }, [token]);

  const retour = `/invitations/accept?token=${encodeURIComponent(token ?? "")}`;

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-5 p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>

        {etat === "encours" && (
          <>
            <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Validation de votre invitation…</p>
          </>
        )}

        {etat === "ok" && (
          <>
            <CheckCircle2 className="mx-auto size-12 text-success" />
            <h1 className="text-xl font-bold tracking-tight">Vous faites partie de l’équipe</h1>
            <p className="text-sm text-muted-foreground">
              Votre accès est actif. Vous retrouverez le compte dans le sélecteur, en haut de votre
              espace.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Ouvrir mon espace
                <ArrowRight />
              </Link>
            </Button>
          </>
        )}

        {etat === "connexion" && (
          <>
            <Users className="mx-auto size-12 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Une invitation vous attend</h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous avec l’adresse à laquelle l’invitation a été envoyée, ou créez votre
              compte avec cette même adresse. Nous vous ramenons ici juste après.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/login?next=${encodeURIComponent(retour)}`}>
                  <LogIn />
                  Me connecter
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/register?next=${encodeURIComponent(retour)}`}>
                  Créer mon compte
                </Link>
              </Button>
            </div>
          </>
        )}

        {(etat === "echec" || etat === "sansjeton") && (
          <>
            <XCircle className="mx-auto size-12 text-destructive" />
            <h1 className="text-xl font-bold tracking-tight">Invitation non valide</h1>
            <p className="text-sm text-muted-foreground">
              {message ||
                "Ce lien est incomplet, a expiré, ou a déjà été utilisé. Demandez à la personne qui vous a invité·e de vous en renvoyer un."}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">Aller à mon espace</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/">Retour à l’accueil</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
