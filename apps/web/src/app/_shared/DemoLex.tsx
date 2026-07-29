"use client";

// Essai public de LEX — le générateur d'activités. C'est le produit qui
// démontre le mieux la valeur en trente secondes : on décrit un public et ce
// qu'on veut travailler, on obtient une séance structurée, utilisable telle
// quelle après validation en équipe. La sortie est tronquée volontairement.
import { useState } from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Field } from "./form-fields";

const MAX = 400;

const EXEMPLES = [
  {
    label: "Ados, gestion de la colère",
    publicCible: "Adolescents 13-16 ans accompagnés en MECS",
    besoins:
      "Gestion de la colère et des passages à l'acte, difficulté à mettre des mots sur ce qu'ils ressentent",
    duree: "1h30",
    effectif: "6 jeunes",
  },
  {
    label: "Adultes handicap, estime de soi",
    publicCible: "Adultes en situation de handicap psychique, foyer de vie",
    besoins:
      "Estime de soi très basse, repli, peu d'initiative dans les activités proposées",
    duree: "1h",
    effectif: "8 personnes",
  },
  {
    label: "Enfants TSA, sensoriel",
    publicCible: "Enfants 6-10 ans avec troubles du spectre autistique, IME",
    besoins:
      "Hypersensibilité sensorielle, difficultés de transition entre deux activités",
    duree: "45 min",
    effectif: "4 enfants",
  },
];

interface Resultat {
  activite?: string;
  tronque?: boolean;
  protection?: { personnes: number; dates: number; contacts: number };
  erreur?: string;
}

export function DemoLex() {
  const [publicCible, setPublicCible] = useState("");
  const [besoins, setBesoins] = useState("");
  const [duree, setDuree] = useState("");
  const [effectif, setEffectif] = useState("");
  const [piege, setPiege] = useState("");
  const [chargement, setChargement] = useState(false);
  const [res, setRes] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function lancer(exemple?: (typeof EXEMPLES)[number]) {
    const p = exemple?.publicCible ?? publicCible;
    const b = exemple?.besoins ?? besoins;
    if (p.trim().length < 3 || b.trim().length < 10) {
      setErreur("Indiquez le public accompagné et ce que vous voulez travailler.");
      return;
    }
    if (exemple) {
      setPublicCible(exemple.publicCible);
      setBesoins(exemple.besoins);
      setDuree(exemple.duree);
      setEffectif(exemple.effectif);
    }
    setErreur(null);
    setChargement(true);
    setRes(null);
    try {
      const r = await fetch("/api/proxy/public/lex-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicCible: p.trim(),
          besoins: b.trim(),
          duree: (exemple?.duree ?? duree) || undefined,
          effectif: (exemple?.effectif ?? effectif) || undefined,
          website: piege || undefined,
        }),
      });
      const data = (await r.json()) as Resultat & { message?: string | string[] };
      if (!r.ok) {
        setErreur(
          r.status === 429
            ? "Vous avez atteint la limite d'essais gratuits pour cette heure. Adhérez pour utiliser LEX sans compteur."
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
          <Lightbulb className="size-4" />
          Votre public, et ce que vous voulez travailler
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Pas de diagnostic, pas de jargon : décrivez la situation comme vous la diriez à un
          collègue.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXEMPLES.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => lancer(e)}
              disabled={chargement}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {e.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Public accompagné" htmlFor="lex-public">
            <Input
              id="lex-public"
              value={publicCible}
              maxLength={120}
              onChange={(e) => setPublicCible(e.target.value)}
              placeholder="Adolescents 13-16 ans en MECS"
            />
          </Field>
          <Field label="Ce que vous voulez travailler" htmlFor="lex-besoins">
            <Textarea
              id="lex-besoins"
              rows={4}
              value={besoins}
              maxLength={MAX}
              onChange={(e) => setBesoins(e.target.value)}
              placeholder="Difficulté à coopérer en groupe, tensions récurrentes au moment des repas…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Durée" htmlFor="lex-duree">
              <Input
                id="lex-duree"
                value={duree}
                maxLength={40}
                onChange={(e) => setDuree(e.target.value)}
                placeholder="1h30"
              />
            </Field>
            <Field label="Effectif" htmlFor="lex-effectif">
              <Input
                id="lex-effectif"
                value={effectif}
                maxLength={40}
                onChange={(e) => setEffectif(e.target.value)}
                placeholder="6 jeunes"
              />
            </Field>
          </div>
        </div>

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

        <div className="mt-3 text-right text-xs text-muted-foreground">
          3 essais par heure, sans compte
        </div>

        <Button onClick={() => lancer()} disabled={chargement} className="mt-3 w-full">
          {chargement ? "LEX construit la séance…" : "Générer une activité"}
          {!chargement ? <Sparkles /> : null}
        </Button>

        {erreur ? <p className="mt-3 text-sm text-destructive">{erreur}</p> : null}

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
          Les noms et coordonnées que vous citez sont remplacés par des jetons <em>avant</em>
          l&apos;envoi au modèle, puis restaurés sur votre écran. Rien n&apos;est enregistré.
        </p>
      </div>

      {/* Sortie */}
      <div className="bloc-nuit rounded-3xl border border-primary/25 bg-[hsl(222,22%,13%)] p-7 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="size-4" />
          La séance proposée par LEX
        </div>

        {!res && !chargement ? (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Choisissez un exemple ou décrivez votre situation : LEX construit une séance complète —
            objectifs observables, matériel, déroulé en quatre temps, points de vigilance, et ce
            qu&apos;il faudra noter dans le compte rendu.
            <br />
            <br />
            LEX ne pose aucun diagnostic et n&apos;interprète rien. Il propose une activité, à
            valider en équipe pluridisciplinaire avant mise en œuvre.
          </p>
        ) : null}

        {chargement ? (
          <div className="mt-6 space-y-3" aria-live="polite">
            <div className="h-3 w-10/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
            <p className="pt-2 text-xs text-muted-foreground">Comptez une quinzaine de secondes.</p>
          </div>
        ) : null}

        {res?.erreur ? <p className="mt-6 text-sm text-destructive">{res.erreur}</p> : null}

        {res?.activite ? (
          <div className="mt-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {res.activite}
            </p>
            {res.tronque ? (
              <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                Aperçu volontairement tronqué. Dans votre espace, la séance est complète — avec la
                variante simplifiée, l&apos;alternative et les indicateurs d&apos;observation.
              </p>
            ) : null}
            {protege > 0 ? (
              <p className="mt-3 flex items-center gap-2 text-xs text-success">
                <ShieldCheck className="size-3.5" aria-hidden />
                {protege} élément{protege > 1 ? "s" : ""} masqué{protege > 1 ? "s" : ""} avant
                l&apos;envoi
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
