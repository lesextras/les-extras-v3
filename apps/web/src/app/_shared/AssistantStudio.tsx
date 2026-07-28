"use client";

// Studio de l'assistant d'écriture.
//
// Parcours volontairement guidé en trois temps, toujours visibles :
//   1. Choisir le type d'écrit   2. Poser ses notes   3. Relire et garder.
// Chaque étape explique ce qui se passe (et ce qui NE se passe pas : notes
// jamais stockées, noms masqués avant traitement, validation humaine).
import * as React from "react";
import {
  PenLine,
  Mic,
  MicOff,
  ShieldCheck,
  EyeOff,
  UserCheck,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Trash2,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ── Types alignés sur l'API ──────────────────────────────────────────────────

interface Trame {
  id: string;
  titre: string;
  description: string;
  conseils: string[];
  exemple: string;
}

interface DocumentResume {
  id: string;
  trame: string;
  title: string;
  createdAt: string;
}

type Etape = "choisir" | "ecrire" | "relire";

// ── Appels API via le proxy same-origin ─────────────────────────────────────

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

// ── Dictée vocale (API du navigateur — rien ne part sur un serveur) ─────────

function useDictee(onTexte: (t: string) => void) {
  const [actif, setActif] = React.useState(false);
  const [supporte, setSupporte] = React.useState(false);
  const recRef = React.useRef<{ stop: () => void } | null>(null);

  React.useEffect(() => {
    const w = window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown };
    setSupporte(Boolean(w.webkitSpeechRecognition || w.SpeechRecognition));
  }, []);

  const basculer = React.useCallback(() => {
    if (actif) {
      recRef.current?.stop();
      setActif(false);
      return;
    }
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => {
        lang: string; continuous: boolean; interimResults: boolean;
        onresult: (e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void;
        onend: () => void; start: () => void; stop: () => void;
      };
    };
    const Ctor = w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onTexte(e.results[i][0].transcript + " ");
      }
    };
    rec.onend = () => setActif(false);
    rec.start();
    recRef.current = rec;
    setActif(true);
  }, [actif, onTexte]);

  return { actif, supporte, basculer };
}

// ── Petites briques d'interface ─────────────────────────────────────────────

function Garantie({ icone, titre, texte }: { icone: React.ReactNode; titre: string; texte: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        {icone}
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{titre}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{texte}</p>
      </div>
    </div>
  );
}

function FilEtapes({ etape }: { etape: Etape }) {
  const etapes: { id: Etape; n: string; t: string }[] = [
    { id: "choisir", n: "1", t: "Choisir l'écrit" },
    { id: "ecrire", n: "2", t: "Poser vos notes" },
    { id: "relire", n: "3", t: "Relire et garder" },
  ];
  const rang = etapes.findIndex((e) => e.id === etape);
  return (
    <ol className="flex items-center gap-2" aria-label="Étapes">
      {etapes.map((e, i) => (
        <React.Fragment key={e.id}>
          {i > 0 && <span className={cn("h-px w-6 sm:w-10", i <= rang ? "bg-primary" : "bg-border")} />}
          <li className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full text-xs font-bold",
                i < rang && "bg-primary text-primary-foreground",
                i === rang && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                i > rang && "bg-muted text-muted-foreground",
              )}
            >
              {i < rang ? <Check className="size-3.5" /> : e.n}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:block",
                i === rang ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {e.t}
            </span>
          </li>
        </React.Fragment>
      ))}
    </ol>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────

export function AssistantStudio() {
  const { toast } = useToast();
  const [trames, setTrames] = React.useState<Trame[]>([]);
  const [disponible, setDisponible] = React.useState(true);
  const [documents, setDocuments] = React.useState<DocumentResume[]>([]);

  const [etape, setEtape] = React.useState<Etape>("choisir");
  const [trame, setTrame] = React.useState<Trame | null>(null);
  const [notes, setNotes] = React.useState("");
  const [brouillon, setBrouillon] = React.useState("");
  const [titre, setTitre] = React.useState("");
  const [protection, setProtection] = React.useState<{ personnes: number; dates: number; contacts: number } | null>(null);
  const [enCours, setEnCours] = React.useState(false);
  const [enregistre, setEnregistre] = React.useState(false);
  const [avisDonne, setAvisDonne] = React.useState(false);

  const zoneNotes = React.useRef<HTMLTextAreaElement>(null);
  const dictee = useDictee((t) => setNotes((n) => n + t));

  React.useEffect(() => {
    api<{ disponible: boolean; trames: Trame[] }>("/assistant/trames")
      .then((d) => { setTrames(d.trames); setDisponible(d.disponible); })
      .catch(() => setDisponible(false));
    api<DocumentResume[]>("/assistant/documents").then(setDocuments).catch(() => undefined);
  }, []);

  const libelleTrame = React.useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of trames) m[t.id] = t.titre;
    return m;
  }, [trames]);

  // ── Actions ────────────────────────────────────────────────────────────

  async function generer() {
    if (!trame) return;
    setEnCours(true);
    try {
      const r = await api<{ brouillon: string; protection: typeof protection }>("/assistant/generer", {
        method: "POST",
        body: JSON.stringify({ trame: trame.id, notes }),
      });
      setBrouillon(r.brouillon);
      setProtection(r.protection ?? null);
      setTitre(`${trame.titre} — ${new Date().toLocaleDateString("fr-FR")}`);
      setEnregistre(false);
      setAvisDonne(false);
      setEtape("relire");
    } catch (err) {
      toast({ title: "Génération impossible", description: (err as Error).message, variant: "error" });
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrer() {
    if (!trame) return;
    setEnCours(true);
    try {
      await api("/assistant/documents", {
        method: "POST",
        body: JSON.stringify({ trame: trame.id, title: titre, content: brouillon }),
      });
      setEnregistre(true);
      api<DocumentResume[]>("/assistant/documents").then(setDocuments).catch(() => undefined);
      toast({ title: "Document enregistré", description: "Retrouvez-le dans « Mes documents », en bas de page.", variant: "success" });
    } catch (err) {
      toast({ title: "Enregistrement impossible", description: (err as Error).message, variant: "error" });
    } finally {
      setEnCours(false);
    }
  }

  async function copier() {
    await navigator.clipboard.writeText(brouillon);
    toast({ title: "Copié", description: "Le document est dans votre presse-papiers." });
  }

  async function avis(utile: boolean) {
    if (!trame) return;
    setAvisDonne(true);
    api("/assistant/feedback", {
      method: "POST",
      body: JSON.stringify({ trame: trame.id, utile }),
    }).catch(() => undefined);
    toast({ title: "Merci pour votre retour", description: "Il sert directement à améliorer les trames." });
  }

  async function supprimerDoc(id: string) {
    await api(`/assistant/documents/${id}`, { method: "DELETE" }).catch(() => undefined);
    setDocuments((d) => d.filter((x) => x.id !== id));
  }

  function recommencer() {
    setEtape("choisir"); setTrame(null); setNotes(""); setBrouillon("");
    setProtection(null); setEnregistre(false); setAvisDonne(false);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Les trois garanties, toujours visibles : c'est ce qui rend l'outil
          acceptable dans ce métier. */}
      <div className="grid gap-3 md:grid-cols-3">
        <Garantie
          icone={<EyeOff className="size-4" />}
          titre="Vos notes ne sont jamais stockées"
          texte="Ce que vous tapez ou dictez sert uniquement à produire le document, puis disparaît. Seule la version que vous validez est conservée."
        />
        <Garantie
          icone={<ShieldCheck className="size-4" />}
          titre="Les noms sont masqués avant traitement"
          texte="Prénoms, dates de naissance et coordonnées sont remplacés par des codes avant tout envoi. Le service d'IA ne voit jamais l'identité des personnes."
        />
        <Garantie
          icone={<UserCheck className="size-4" />}
          titre="Vous restez l'auteur"
          texte="L'assistant propose un brouillon, jamais un document final. Rien n'est enregistré sans votre relecture et votre validation."
        />
      </div>

      {!disponible ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-5">
            <Info className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
            <div>
              <p className="font-semibold text-foreground">L'assistant arrive très bientôt</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Le service de rédaction est en cours d'activation sur la plateforme. Vous pouvez
                déjà découvrir les types d'écrits ci-dessous.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FilEtapes etape={etape} />
            {etape !== "choisir" ? (
              <Button variant="ghost" size="sm" onClick={recommencer}>
                <ArrowLeft className="size-4" />
                Recommencer
              </Button>
            ) : null}
          </div>

          {/* ÉTAPE 1 — le choix de la trame, avec description claire */}
          {etape === "choisir" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Quel document voulez-vous écrire ?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chaque trame connaît les attendus du métier : structure, ton, distinction entre
                  faits et hypothèses.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {trames.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setTrame(t); setEtape("ecrire"); setTimeout(() => zoneNotes.current?.focus(), 50); }}
                    className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <PenLine className="size-4 text-primary" />
                        {t.titre}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                      {t.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* ÉTAPE 2 — les notes, avec conseils et exemple dépliable */}
          {etape === "ecrire" && trame ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{trame.titre}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Posez vos notes comme elles viennent — phrases incomplètes, style télégraphique,
                  tout convient. L'assistant s'occupe de la forme.
                </p>
              </div>

              <ul className="space-y-1.5 rounded-xl bg-primary-soft/60 p-4 text-sm text-foreground">
                {trame.conseils.map((c) => (
                  <li key={c} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {c}
                  </li>
                ))}
              </ul>

              <div className="relative">
                <textarea
                  ref={zoneNotes}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={9}
                  placeholder="Vos notes brutes…"
                  aria-label="Vos notes"
                  className="w-full rounded-xl border border-input bg-card p-4 pr-14 text-sm leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                {dictee.supporte ? (
                  <button
                    type="button"
                    onClick={dictee.basculer}
                    aria-pressed={dictee.actif}
                    aria-label={dictee.actif ? "Arrêter la dictée" : "Dicter mes notes"}
                    title={dictee.actif ? "Arrêter la dictée" : "Dicter mes notes"}
                    className={cn(
                      "absolute right-3 top-3 grid size-9 place-items-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      dictee.actif
                        ? "animate-pulse border-destructive/40 bg-destructive/10 text-destructive"
                        : "border-border bg-card text-muted-foreground hover:text-primary",
                    )}
                  >
                    {dictee.actif ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </button>
                ) : null}
              </div>

              <details className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                <summary className="cursor-pointer font-medium text-foreground">
                  Voir un exemple de notes
                </summary>
                <p className="mt-2 whitespace-pre-wrap italic text-muted-foreground">« {trame.exemple} »</p>
              </details>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {notes.length < 20
                    ? "Encore quelques mots — une vingtaine de caractères minimum."
                    : `${notes.length.toLocaleString("fr-FR")} caractères. Prêt quand vous l'êtes.`}
                </p>
                <Button onClick={generer} disabled={notes.length < 20 || enCours || !disponible} size="lg">
                  {enCours ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {enCours ? "Rédaction en cours…" : "Rédiger le document"}
                </Button>
              </div>
            </div>
          ) : null}

          {/* ÉTAPE 3 — relecture, édition, validation */}
          {etape === "relire" && trame ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Relisez avant de garder</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ce texte est un brouillon : corrigez-le librement ci-dessous. Vous en êtes
                    l'auteur — rien n'est conservé tant que vous n'enregistrez pas.
                  </p>
                </div>
                <Badge variant="soft" className="shrink-0">
                  <Sparkles className="size-3" />
                  Brouillon assisté par IA
                </Badge>
              </div>

              {protection && (protection.personnes > 0 || protection.dates > 0 || protection.contacts > 0) ? (
                <p className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2.5 text-sm text-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-success" />
                  Pendant la rédaction, {protection.personnes > 0 ? `${protection.personnes} nom${protection.personnes > 1 ? "s" : ""}` : ""}
                  {protection.dates > 0 ? `${protection.personnes > 0 ? ", " : ""}${protection.dates} date${protection.dates > 1 ? "s" : ""}` : ""}
                  {protection.contacts > 0 ? ` et ${protection.contacts} coordonnée${protection.contacts > 1 ? "s" : ""}` : ""}
                  {" "}ont été masqués au service d'IA, puis rétablis ici, sur nos serveurs.
                </p>
              ) : null}

              <input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                aria-label="Titre du document"
                className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm font-semibold text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              <textarea
                value={brouillon}
                onChange={(e) => { setBrouillon(e.target.value); setEnregistre(false); }}
                rows={16}
                aria-label="Document à relire"
                className="w-full rounded-xl border border-input bg-card p-4 text-sm leading-relaxed text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={enregistrer} disabled={enCours || enregistre}>
                  {enregistre ? <Check className="size-4" /> : <FileText className="size-4" />}
                  {enregistre ? "Enregistré" : "Valider et enregistrer"}
                </Button>
                <Button variant="outline" onClick={copier}>
                  <Copy className="size-4" />
                  Copier le texte
                </Button>
                <Button variant="ghost" onClick={() => setEtape("ecrire")}>
                  <ArrowLeft className="size-4" />
                  Reprendre mes notes
                </Button>
                {!avisDonne ? (
                  <span className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                    Ce brouillon vous aide ?
                    <button type="button" onClick={() => avis(true)} aria-label="Oui, utile" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-success/10 hover:text-success">
                      <ThumbsUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => avis(false)} aria-label="Non, pas utile" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                      <ThumbsDown className="size-4" />
                    </button>
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground">
                En l'enregistrant, vous attestez avoir relu ce document. Il portera la mention
                « rédigé avec assistance IA, relu et validé par son auteur ».
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* MES DOCUMENTS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Mes documents</h2>
        {documents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Vos documents validés apparaîtront ici. Ils restent dans votre espace, visibles par
            vous seul·e.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {libelleTrame[d.trame] ?? d.trame} ·{" "}
                    {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={async () => {
                      const doc = await api<{ content: string }>(`/assistant/documents/${d.id}`);
                      await navigator.clipboard.writeText(doc.content);
                      toast({ title: "Copié", description: `« ${d.title} » est dans votre presse-papiers.` });
                    }}
                    aria-label={`Copier ${d.title}`}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => supprimerDoc(d.id)}
                    aria-label={`Supprimer ${d.title}`}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
