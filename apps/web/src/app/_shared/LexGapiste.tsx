"use client";

// LEX LE GAPISTE — l'animateur IA du groupe d'analyse de pratique.
//
// Le point qui fait toute la différence avec un chatbot ordinaire : il ne
// répond pas tout de suite. Il commence par questionner — contexte, faits,
// ressentis, enjeux, ce qui a déjà été tenté — comme un animateur de GAP qui
// refuse de donner une solution à la place du professionnel.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";

interface Tour {
  role: "user" | "assistant";
  content: string;
}

export function LexGapiste({
  accountId,
  estAdherent,
  contexte,
}: {
  accountId: string;
  estAdherent: boolean;
  contexte: {
    titre?: string;
    situation?: string;
    tente?: string | null;
    metier?: string;
    publicVise?: string;
  };
}) {
  const [ouvert, setOuvert] = useState(false);
  const [fil, setFil] = useState<Tour[]>([]);
  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [fil, chargement]);

  async function envoyer(texte: string, premierTour = false) {
    setErreur(null);
    setChargement(true);
    const nouveauFil: Tour[] = premierTour ? [] : [...fil, { role: "user", content: texte }];
    if (!premierTour) setFil(nouveauFil);
    try {
      const r = await apiRequest<{ reponse: string }>("/assistant/gapiste", {
        method: "POST",
        body: {
          message: texte,
          historique: nouveauFil.slice(-8),
          // Le contexte n'est envoyé qu'au premier tour : ensuite il est dans le fil.
          ...(premierTour ? { contexte } : {}),
        },
        accountId,
      });
      setFil([...nouveauFil, { role: "assistant", content: r.reponse }]);
      setMessage("");
    } catch (err) {
      setErreur(
        err instanceof Error ? err.message : "LEX n'a pas pu répondre. Réessayez dans un instant.",
      );
    } finally {
      setChargement(false);
    }
  }

  // ── Non-adhérent : on explique, on ne fait pas semblant ──────────────────
  if (!estAdherent) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="max-w-2xl">
              <p className="font-semibold">LEX le GAPiste — réservé aux adhérents</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                L&apos;animateur IA du GAP, avec la posture d&apos;un psychologue clinicien et
                d&apos;un éducateur spécialisé senior. Il questionne d&apos;abord le contexte, les
                faits, ce que vous ressentez et ce qui se joue — puis il élabore avec vous. Le GAP
                entre pairs, lui, reste gratuit avec votre compte.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/dashboard/adhesion">Découvrir l&apos;adhésion</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Adhérent : le dialogue ───────────────────────────────────────────────
  if (!ouvert) {
    return (
      <Card className="border-primary/30 bg-primary-soft/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div className="max-w-2xl">
              <p className="font-semibold">Demander à LEX le GAPiste</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Il va d&apos;abord vous poser quelques questions pour comprendre la situation —
                le contexte, les faits, ce que ça vous fait, ce qui se joue. Ce n&apos;est
                qu&apos;ensuite qu&apos;il élabore avec vous. Comptez cinq minutes.
              </p>
            </div>
          </div>
          <Button
            className="shrink-0"
            onClick={() => {
              setOuvert(true);
              void envoyer(
                "Je dépose cette situation dans le GAP. Commence par m'aider à la préciser.",
                true,
              );
            }}
          >
            Ouvrir la table ronde
            <Sparkles />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <h2 className="font-semibold">LEX le GAPiste</h2>
          <span className="text-xs text-muted-foreground">
            psychologue clinicien · éducateur spécialisé senior
          </span>
        </div>

        <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4">
          {fil.map((t, i) => (
            <div
              key={i}
              className={
                t.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground"
                  : "max-w-[92%] rounded-2xl rounded-bl-sm bg-card px-4 py-3 text-sm leading-relaxed shadow-soft"
              }
            >
              <p className="whitespace-pre-line">{t.content}</p>
            </div>
          ))}
          {chargement ? (
            <div className="max-w-[60%] space-y-2 rounded-2xl bg-card px-4 py-3" aria-live="polite">
              <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
            </div>
          ) : null}
          <div ref={finRef} />
        </div>

        {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim().length >= 2 && !chargement) void envoyer(message.trim());
          }}
          className="space-y-3"
        >
          <Textarea
            rows={3}
            value={message}
            maxLength={3000}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Répondez à ce qui vous parle — on avance à votre rythme."
            aria-label="Votre réponse à LEX"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (message.trim().length >= 2 && !chargement) void envoyer(message.trim());
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              Les prénoms sont masqués avant l&apos;envoi. Ce dialogue n&apos;est pas enregistré.
            </span>
            <Button type="submit" disabled={chargement || message.trim().length < 2}>
              Envoyer
              <Send />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
