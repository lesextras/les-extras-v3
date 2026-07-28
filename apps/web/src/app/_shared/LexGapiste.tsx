"use client";

// LEX LE GAPISTE — l'animateur IA du groupe d'analyse de pratique.
//
// DEUX PRINCIPES TENUS PAR CE COMPOSANT :
//
// 1. IL N'INTERVIENT QUE SUR SOLLICITATION. Aucun appel n'est déclenché au
//    montage : le seul point d'entrée est le bouton « Solliciter LEX ». Tant
//    qu'on ne clique pas, il n'existe pas. Le GAP est d'abord un espace entre
//    humains ; l'IA n'y prend jamais la parole d'elle-même.
// 2. LE DIALOGUE EST PRIVÉ. Rien de ce qui se dit ici n'est publié dans le fil
//    de la situation : les autres professionnels ne voient pas cet échange, et
//    LEX ne dépose aucune réponse à leur place.
//
// Sa méthode : il commence par questionner — contexte, faits, ressentis,
// enjeux, ce qui a déjà été tenté — puis il prend position.
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
                faits, ce que vous ressentez et ce qui se joue. Puis il donne son avis, une posture
                à tenir et des activités à essayer. Le GAP entre pairs, lui, reste gratuit avec
                votre compte.
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
              <p className="font-semibold">Solliciter LEX le GAPiste</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Il commence par vous poser quelques questions — le contexte, les faits, ce que ça
                vous fait, ce qui se joue. Puis il vous donne son analyse, la posture qu&apos;il
                vous conseille, des activités à essayer et ce qu&apos;il ferait dès lundi.
                Comptez cinq minutes.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Il n&apos;intervient <strong>que si vous le sollicitez</strong>, jamais de
                lui-même, et cet échange reste <strong>entre vous et lui</strong> : il ne publie
                rien dans le fil et ne répond à la place de personne.
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
            Solliciter LEX
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
          <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            Échange privé
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
              Prénoms masqués avant l&apos;envoi · dialogue non enregistré · rien n&apos;est publié
              dans le fil
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
