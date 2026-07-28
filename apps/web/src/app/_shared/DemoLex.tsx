"use client";

// Essai public de LEX, sans compte. Objectif : rendre tangible en trente
// secondes ce que fait l'assistant d'écriture — le produit le plus désirable
// de la plateforme était jusqu'ici invisible avant inscription.
// La sortie est volontairement tronquée : on montre le geste, pas l'outil.
import { useState } from "react";
import Link from "next/link";
import { PenLine, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX = 400;

const EXEMPLES = [
  {
    label: "Un refus en atelier",
    notes:
      "Mercredi, Léa 14 ans a refusé de venir à l'atelier cuisine. Elle est restée dans sa chambre, a dit qu'elle en avait marre. Je suis allé la voir, elle a fini par sortir au bout de 20 min et a participé à la fin. Elle m'a dit qu'elle avait mal dormi.",
  },
  {
    label: "Une progression",
    notes:
      "Karim, 9 ans, arrive à rester assis pendant tout le temps du repas depuis 2 semaines. Avant il se levait 5 ou 6 fois. Il demande maintenant s'il peut sortir de table. On a mis en place le sablier depuis début du mois.",
  },
  {
    label: "Un incident à tracer",
    notes:
      "Ce matin dispute entre deux jeunes dans le couloir, ton qui monte, l'un a poussé l'autre. Séparés tout de suite par moi et ma collègue. Chacun a été vu séparément après. Pas de blessure. Ils se sont reparlé au goûter.",
  },
];

interface Resultat {
  brouillon?: string;
  tronque?: boolean;
  protection?: { personnes: number; dates: number; contacts: number };
  erreur?: string;
}

export function DemoLex() {
  const [notes, setNotes] = useState("");
  const [piege, setPiege] = useState("");
  const [chargement, setChargement] = useState(false);
  const [res, setRes] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function lancer(texte?: string) {
    const contenu = (texte ?? notes).trim();
    if (contenu.length < 20) {
      setErreur("Décrivez la situation en quelques lignes — 20 caractères minimum.");
      return;
    }
    if (texte) setNotes(texte);
    setErreur(null);
    setChargement(true);
    setRes(null);
    try {
      const r = await fetch("/api/proxy/public/lex-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: contenu, website: piege || undefined }),
      });
      const data = (await r.json()) as Resultat & { message?: string | string[] };
      if (!r.ok) {
        setErreur(
          r.status === 429
            ? "Vous avez atteint la limite d'essais gratuits pour cette heure. Créez un compte pour utiliser LEX sans compteur."
            : Array.isArray(data.message)
              ? data.message[0]
              : (data.message ?? "L'essai n'a pas abouti. Réessayez dans un instant."),
        );
        return;
      }
      setRes(data);
    } catch {
      setErreur("Connexion impossible. Réessayez dans un instant.");
    } finally {
      setChargement(false);
    }
  }

  const p = res?.protection;
  const protege = p ? p.personnes + p.dates + p.contacts : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Entrée */}
      <div className="rounded-3xl border border-border bg-card p-7 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <PenLine className="size-4" />
          Vos notes, telles que vous les prenez
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Écrivez comme sur un carnet : bouts de phrases, abréviations, désordre. C&apos;est
          exactement ce que LEX attend.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXEMPLES.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => lancer(e.notes)}
              disabled={chargement}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {e.label}
            </button>
          ))}
        </div>

        <Textarea
          rows={7}
          value={notes}
          maxLength={MAX}
          onChange={(ev) => setNotes(ev.target.value)}
          placeholder="Ex. Mardi, refus d'aller en cours le matin, a fini par y aller après discussion…"
          aria-label="Vos notes brutes"
          className="mt-4"
        />
        {/* Champ-piège : invisible pour un humain, rempli par les robots. */}
        <input
          type="text"
          value={piege}
          onChange={(ev) => setPiege(ev.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {notes.length} / {MAX} caractères
          </span>
          <span>3 essais par heure, sans compte</span>
        </div>

        <Button onClick={() => lancer()} disabled={chargement} className="mt-4 w-full">
          {chargement ? "LEX rédige…" : "Transformer mes notes"}
          {!chargement ? <Sparkles /> : null}
        </Button>

        {erreur ? <p className="mt-3 text-sm text-destructive">{erreur}</p> : null}

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
          Les noms, dates et coordonnées sont remplacés par des jetons <em>avant</em> l&apos;envoi au
          modèle, puis restaurés sur votre écran. Rien n&apos;est enregistré, ici comme dans
          l&apos;espace connecté.
        </p>
      </div>

      {/* Sortie */}
      <div className="rounded-3xl border border-primary/25 bg-[hsl(222,22%,13%)] p-7 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="size-4" />
          Le brouillon de LEX
        </div>

        {!res && !chargement ? (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Choisissez une situation d&apos;exemple ou écrivez la vôtre : le brouillon apparaît
            ici, structuré en contexte et faits observés, prêt à être relu et corrigé.
            <br />
            <br />
            LEX ne décide rien et n&apos;interprète pas : il met en forme ce que vous avez écrit.
            La responsabilité de l&apos;écrit reste la vôtre.
          </p>
        ) : null}

        {chargement ? (
          <div className="mt-6 space-y-3" aria-live="polite">
            <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-10/12 animate-pulse rounded bg-muted" />
            <p className="pt-2 text-xs text-muted-foreground">
              Comptez une quinzaine de secondes.
            </p>
          </div>
        ) : null}

        {res?.erreur ? <p className="mt-6 text-sm text-destructive">{res.erreur}</p> : null}

        {res?.brouillon ? (
          <div className="mt-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {res.brouillon}
            </p>
            {res.tronque ? (
              <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                Aperçu volontairement tronqué. Dans votre espace, le brouillon est complet, sur
                cinq trames différentes (note d&apos;observation, synthèse, rapport, transmission,
                projet personnalisé).
              </p>
            ) : null}
            {protege > 0 ? (
              <p className="mt-3 flex items-center gap-2 text-xs text-success">
                <ShieldCheck className="size-3.5" aria-hidden />
                {protege} élément{protege > 1 ? "s" : ""} masqué{protege > 1 ? "s" : ""} avant
                l&apos;envoi (
                {[
                  p!.personnes ? `${p!.personnes} nom${p!.personnes > 1 ? "s" : ""}` : null,
                  p!.dates ? `${p!.dates} date${p!.dates > 1 ? "s" : ""}` : null,
                  p!.contacts ? `${p!.contacts} contact${p!.contacts > 1 ? "s" : ""}` : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                )
              </p>
            ) : null}
            <Button asChild className="mt-5">
              <Link href="/register">
                Utiliser LEX sans limite
                <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
