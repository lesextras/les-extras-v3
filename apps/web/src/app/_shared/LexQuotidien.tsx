"use client";

/**
 * LEX AU QUOTIDIEN — le premier écran de LEX depuis le 1er octobre 2026.
 *
 * ⚠⚠ DÉCISION DE SIHAM (01/10/2026). LEX devient l'outil du quotidien acheté
 * par la personne elle-même : éducation, animation, protection de l'enfance,
 * handicap, social, associations. Le premier écran pose UNE question, « Que
 * voulez-vous terminer ? », et propose TROIS tâches :
 *   1. préparer ou adapter une activité  → POST /assistant/activite
 *   2. améliorer mon écrit               → POST /assistant/ameliorer
 *   3. transformer mes notes en compte rendu → POST /assistant/generer
 *
 * Le métier choisi change les exemples et les écrits proposés, JAMAIS l'outil :
 * un seul moteur, une seule interface. L'ancien studio complet (trames maison,
 * export Word, mémoire des situations) reste accessible : `?mode=complet`.
 *
 * ⚠ CE QUI NE DOIT PAS BOUGER :
 *   - le coût est affiché AVANT de lancer (« Coût : 1 crédit · solde N ») ;
 *   - l'aperçu de ce qui part vers l'IA est gratuit et se demande d'un clic
 *     (la route est plafonnée à 120 par heure : pas d'appel à chaque frappe) ;
 *   - on ne promet pas l'anonymat : retirer les noms ne rend pas un récit
 *     anonyme (CNIL), la phrase sous l'aperçu le dit ;
 *   - rien de ce qui est saisi ne part dans l'URL ni dans la mesure d'audience.
 *     Les liens des ressources ne préremplissent que des réglages génériques.
 */
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  Eye,
  Loader2,
  NotebookPen,
  PenLine,
  Save,
  Scissors,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  METIERS_LEX,
  OUTILS_LEX,
  TACHES_LEX,
  outilsPour,
  type ChampLex,
  type MetierLex,
  type OutilLex,
  type TacheLex,
} from "@/lib/lex-taches";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    throw new Error(Array.isArray(d.message) ? d.message[0] : (d.message ?? "Erreur inattendue"));
  }
  return (await res.json()) as T;
}

const ICONES: Record<TacheLex, typeof Sparkles> = {
  activite: Sparkles,
  ameliorer: PenLine,
  notes: NotebookPen,
};

const CLE_METIER = "lex-metier";

function lireMetier(): MetierLex | null {
  try {
    const v = localStorage.getItem(CLE_METIER);
    return METIERS_LEX.some((m) => m.id === v) ? (v as MetierLex) : null;
  } catch {
    return null;
  }
}

/** Un rendu de lecture simple : titres, puces, gras. Aucun HTML injecté. */
function Resultat({ texte }: { texte: string }) {
  const blocs: React.ReactNode[] = [];
  let liste: string[] = [];
  const fermer = (cle: number) => {
    if (liste.length) {
      blocs.push(
        <ul key={`l${cle}`} className="mb-3 list-disc space-y-1 pl-5">
          {liste.map((l, i) => (
            <li key={i}>{gras(l)}</li>
          ))}
        </ul>,
      );
      liste = [];
    }
  };
  texte.split("\n").forEach((brute, i) => {
    const l = brute.trim();
    if (!l) return fermer(i);
    const diese = l.match(/^#{1,4}\s+(.*)$/);
    const majuscules = l.length < 80 && /[A-ZÀ-Ý]/.test(l) && l === l.toUpperCase() && !/^[•\-*]/.test(l);
    if (diese || majuscules) {
      fermer(i);
      blocs.push(
        <h4 key={i} className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-secondary first:mt-0">
          {(diese ? diese[1] : l).replace(/\*\*/g, "")}
        </h4>,
      );
      return;
    }
    const puce = l.match(/^(?:[•\-*]|\d+[.)])\s+(.*)$/);
    if (puce) {
      liste.push(puce[1]);
      return;
    }
    fermer(i);
    blocs.push(
      <p key={i} className="mb-2 max-w-[68ch]">
        {gras(l)}
      </p>,
    );
  });
  fermer(-1);
  return <>{blocs}</>;
}

function gras(l: string): React.ReactNode {
  const morceaux = l.split(/\*\*(.+?)\*\*/g);
  return morceaux.map((m, i) => (i % 2 ? <strong key={i}>{m}</strong> : m));
}

function Masque({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\[[A-ZÀ-Ý][A-ZÀ-Ý0-9 .\-]*\])/g);
  return (
    <>
      {morceaux.map((m, i) =>
        /^\[[A-ZÀ-Ý]/.test(m) ? (
          <span key={i} className="rounded bg-primary/10 px-1 font-semibold text-primary">
            {m}
          </span>
        ) : (
          m
        ),
      )}
    </>
  );
}

export interface PreremplissageLex {
  tache?: string;
  outil?: string;
  metier?: string;
  /** Réglages génériques seulement (objectif, public, durée, lieu) : jamais de notes. */
  valeurs?: Record<string, string>;
}

export function LexQuotidien({ prerempli }: { prerempli?: PreremplissageLex }) {
  const { toast } = useToast();
  const outilInitial = OUTILS_LEX.find((o) => o.id === prerempli?.outil);
  const [metier, setMetier] = React.useState<MetierLex>(
    (METIERS_LEX.find((m) => m.id === prerempli?.metier)?.id as MetierLex | undefined) ?? "education",
  );
  const [tache, setTache] = React.useState<TacheLex>(
    outilInitial?.tache ??
      ((TACHES_LEX.find((t) => t.id === prerempli?.tache)?.id as TacheLex | undefined) ?? "activite"),
  );
  const [outilId, setOutilId] = React.useState<string>(outilInitial?.id ?? "");
  const [valeurs, setValeurs] = React.useState<Record<string, string>>(prerempli?.valeurs ?? {});
  const [solde, setSolde] = React.useState<{ credits: number; illimite: boolean } | null>(null);
  const [enCours, setEnCours] = React.useState(false);
  const [resultat, setResultat] = React.useState("");
  const [masque, setMasque] = React.useState<string | null>(null);
  const [masquageEnCours, setMasquageEnCours] = React.useState(false);
  const [garde, setGarde] = React.useState(false);
  const [raccourci, setRaccourci] = React.useState(false);
  const zoneResultat = React.useRef<HTMLDivElement>(null);

  // Le métier choisi la dernière fois, sauf si un lien en impose un.
  React.useEffect(() => {
    if (prerempli?.metier) return;
    const m = lireMetier();
    if (m) setMetier(m);
  }, [prerempli?.metier]);

  const chargerSolde = React.useCallback(() => {
    api<{ credits?: number; illimite?: boolean }>("/billing/utilisation")
      .then((d) => setSolde({ credits: d.credits ?? 0, illimite: Boolean(d.illimite) }))
      .catch(() => setSolde(null));
  }, []);
  React.useEffect(chargerSolde, [chargerSolde]);

  const outils = outilsPour(tache, metier);
  const outil: OutilLex = outils.find((o) => o.id === outilId) ?? outils[0];

  function choisirMetier(m: MetierLex) {
    setMetier(m);
    try {
      localStorage.setItem(CLE_METIER, m);
    } catch {
      /* stockage indisponible : le choix vaut pour la page */
    }
  }

  function changer(champ: string, v: string) {
    setValeurs((prev) => ({ ...prev, [champ]: v }));
    setMasque(null);
  }

  const val = (c: string) => (valeurs[c] ?? "").trim();
  const libelleMetier = METIERS_LEX.find((m) => m.id === metier)?.label ?? "";

  /** Le texte que l'API recevra : c'est aussi celui que l'aperçu montre. */
  function texteEnvoye(): string {
    if (outil.tache === "ameliorer") return val("texte");
    if (outil.tache === "notes") {
      const dest = val("dest");
      return (dest ? `Destinataire du document : ${dest}\n\n` : "") + val("notes");
    }
    return outil.champs
      .map((c) => (val(c.id) ? `${c.label} : ${val(c.id)}` : ""))
      .filter(Boolean)
      .join("\n");
  }

  const manquant = outil.champs.find((c) => c.requis && val(c.id).length < (c.min ?? 3));

  async function voirLeMasquage() {
    const texte = texteEnvoye();
    if (!texte) return;
    setMasquageEnCours(true);
    try {
      const r = await api<{ masque: string }>("/assistant/apercu-masquage", {
        method: "POST",
        body: JSON.stringify({ notes: texte }),
      });
      setMasque(r.masque);
    } catch (err) {
      toast({ title: "Aperçu impossible", description: (err as Error).message, variant: "error" });
    } finally {
      setMasquageEnCours(false);
    }
  }

  async function lancer(e?: React.FormEvent) {
    e?.preventDefault();
    if (manquant) {
      toast({
        title: "Il manque une information",
        description: `Complétez « ${manquant.label} ».`,
        variant: "error",
      });
      return;
    }
    setEnCours(true);
    setGarde(false);
    setRaccourci(false);
    setResultat("");
    try {
      let texte = "";
      if (outil.tache === "activite") {
        const besoins =
          outil.id === "adapter"
            ? val("besoins")
            : `${outil.consigne ?? ""} Objectif : ${val("objectif")}`.trim();
        const r = await api<{ activite: string }>("/assistant/activite", {
          method: "POST",
          body: JSON.stringify({
            publicCible: `${val("public")} (${libelleMetier})`.slice(0, 300),
            besoins: besoins.slice(0, 3000),
            objectifs: val("objectif").slice(0, 300) || undefined,
            duree: val("duree").slice(0, 120) || undefined,
            contraintes: val("options").slice(0, 500) || undefined,
          }),
        });
        texte = r.activite;
      } else if (outil.tache === "ameliorer") {
        const r = await api<{ resultat: string }>("/assistant/ameliorer", {
          method: "POST",
          body: JSON.stringify({ texte: val("texte"), but: outil.but, metier: libelleMetier }),
        });
        texte = r.resultat;
      } else {
        const r = await api<{ brouillon: string }>("/assistant/generer", {
          method: "POST",
          body: JSON.stringify({
            trame: outil.trame,
            notes: texteEnvoye(),
            ...(outil.intitule ? { intitule: outil.intitule } : {}),
          }),
        });
        texte = r.brouillon;
      }
      setResultat(texte);
      requestAnimationFrame(() => zoneResultat.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      toast({
        title: "LEX n’a pas pu terminer",
        description: `${(err as Error).message} Un échec technique ne consomme pas de crédit.`,
        variant: "error",
      });
    } finally {
      setEnCours(false);
      chargerSolde();
    }
  }

  async function plusCourt() {
    if (!resultat) return;
    setEnCours(true);
    try {
      const r = await api<{ resultat: string }>("/assistant/ameliorer", {
        method: "POST",
        body: JSON.stringify({ texte: resultat.slice(0, 8000), but: "court", metier: libelleMetier }),
      });
      setResultat(r.resultat);
      setRaccourci(true);
      setGarde(false);
    } catch (err) {
      toast({ title: "Raccourci impossible", description: (err as Error).message, variant: "error" });
    } finally {
      setEnCours(false);
      chargerSolde();
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(resultat);
      toast({ title: "Copié", variant: "success" });
    } catch {
      toast({ title: "Copie impossible", description: "Sélectionnez le texte à la main.", variant: "error" });
    }
  }

  async function garder() {
    if (resultat.trim().length < 20) return;
    setEnCours(true);
    try {
      const date = new Date().toLocaleDateString("fr-FR");
      await api("/assistant/documents", {
        method: "POST",
        body: JSON.stringify({
          trame: outil.tache === "notes" ? outil.trame : "ECRIT_LIBRE",
          title: `${outil.label} du ${date}`.slice(0, 160),
          content: resultat.slice(0, 20000),
        }),
      });
      setGarde(true);
      toast({ title: "Gardé dans vos écrits", description: "Retrouvez-le dans le mode complet, « Mes documents ».", variant: "success" });
    } catch (err) {
      toast({ title: "Enregistrement impossible", description: (err as Error).message, variant: "error" });
    } finally {
      setEnCours(false);
    }
  }

  const soldeTexte = solde?.illimite ? "illimité" : solde ? String(solde.credits) : "…";

  return (
    <div className="space-y-8">
      {/* En-tête et solde */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Que voulez-vous terminer&nbsp;?</h1>
          <p className="mt-2 text-muted-foreground">
            Choisissez la tâche, donnez les quelques informations utiles, relisez un résultat court
            et prêt à modifier.
          </p>
        </div>
        <Link
          href="/dashboard/adhesion"
          className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground hover:border-foreground/30"
        >
          Solde&nbsp;: <strong className="tabular-nums text-foreground">{soldeTexte}</strong> crédits
        </Link>
      </div>

      {/* Métier */}
      <section aria-label="Votre métier" className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Votre métier <span className="font-normal normal-case">(change les exemples, pas l’outil)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {METIERS_LEX.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={metier === m.id}
              onClick={() => choisirMetier(m.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                metier === m.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* Les trois tâches */}
      <section aria-label="La tâche" className="grid gap-3 md:grid-cols-3">
        {TACHES_LEX.map((t) => {
          const Icone = ICONES[t.id];
          const actif = tache === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={actif}
              onClick={() => {
                setTache(t.id);
                setOutilId("");
                setResultat("");
                setMasque(null);
              }}
              className={cn(
                "flex items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left transition",
                actif ? "border-primary shadow-card" : "border-border hover:border-foreground/30",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl",
                  actif ? "bg-primary text-primary-foreground" : "bg-secondary/10 text-secondary",
                )}
              >
                <Icone className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold leading-snug">{t.titre}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{t.sousTitre}</span>
              </span>
            </button>
          );
        })}
      </section>

      {/* Précisément */}
      <section aria-label="Précisément" className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {outils.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={outil.id === o.id}
              onClick={() => {
                setOutilId(o.id);
                setResultat("");
                setMasque(null);
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                outil.id === o.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-foreground/40",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{outil.description}</p>
      </section>

      {/* Formulaire et aperçu */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <form onSubmit={lancer} className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-5">
          {outil.champs.map((c: ChampLex) => (
            <div key={c.id} className="space-y-1.5">
              <label htmlFor={`lex-${c.id}`} className="text-sm font-semibold text-foreground/80">
                {c.label}
                {!c.requis ? <span className="font-normal text-muted-foreground"> (facultatif)</span> : null}
              </label>
              {c.long ? (
                <textarea
                  id={`lex-${c.id}`}
                  value={valeurs[c.id] ?? ""}
                  onChange={(e) => changer(c.id, e.target.value)}
                  placeholder={c.exemple}
                  rows={c.id === "options" || c.id === "besoins" ? 3 : 7}
                  maxLength={8000}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <input
                  id={`lex-${c.id}`}
                  value={valeurs[c.id] ?? ""}
                  onChange={(e) => changer(c.id, e.target.value)}
                  placeholder={c.exemple}
                  maxLength={300}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              )}
            </div>
          ))}
          {outil.tache !== "activite" ? (
            <p className="text-xs text-muted-foreground">
              Pas besoin de faire des phrases&nbsp;: LEX remet en forme sans rien inventer, et signale ce
              qui manque.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={enCours}>
              {enCours ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
              {enCours ? "LEX écrit…" : "Écrire"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Coût&nbsp;: 1 crédit · solde {soldeTexte}
            </span>
          </div>
        </form>

        <div className="min-w-0 space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Ce qui part vers l’IA</h2>
            <Button type="button" variant="outline" size="sm" onClick={voirLeMasquage} disabled={masquageEnCours || !texteEnvoye()}>
              {masquageEnCours ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              Voir, gratuitement
            </Button>
          </div>
          <div className="min-h-28 whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-3 text-sm leading-relaxed text-foreground/75">
            {masque !== null ? (
              <Masque texte={masque} />
            ) : (
              <span className="text-muted-foreground">
                Cliquez sur « Voir, gratuitement » : vous lirez exactement le texte envoyé, avec les noms
                remplacés.
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Les prénoms, noms, dates et coordonnées repérés sont remplacés avant l’envoi et reviennent dans le
            résultat sur votre écran. Un récit peut rester reconnaissable par ses lieux ou ses événements&nbsp;:
            évitez les détails qui permettent d’identifier quelqu’un.
          </p>
        </div>
      </div>

      {/* Résultat */}
      <section ref={zoneResultat} aria-live="polite" className="scroll-mt-24 space-y-3">
        {resultat ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Votre résultat</h2>
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                {raccourci ? "Version raccourcie, à relire" : "Prêt à relire"}
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-[15px] leading-relaxed">
              <Resultat texte={resultat} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={copier}>
                <Copy className="size-4" aria-hidden /> Copier
              </Button>
              <Button type="button" variant="outline" onClick={plusCourt} disabled={enCours}>
                <Scissors className="size-4" aria-hidden /> Plus court (1 crédit)
              </Button>
              <Button type="button" variant="outline" onClick={garder} disabled={enCours || garde}>
                <Save className="size-4" aria-hidden /> {garde ? "Gardé" : "Garder dans mes écrits"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              LEX propose, vous relisez et vous validez. Copier et corriger ne consomment rien.
            </p>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Votre résultat apparaîtra ici. Pour vous faire une idée avant d’écrire, des fiches et des trames
            gratuites sont dans{" "}
            <Link href="/ressources" className="font-semibold text-primary hover:underline">
              les ressources
            </Link>
            .
          </div>
        )}
      </section>

      <p className="flex flex-wrap items-center gap-1.5 border-t border-border pt-4 text-sm text-muted-foreground">
        Besoin de vos trames maison, de l’export Word ou de vos documents enregistrés&nbsp;?
        <Link href="/dashboard/assistant?mode=complet" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          Ouvrir le mode complet <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </p>
    </div>
  );
}
