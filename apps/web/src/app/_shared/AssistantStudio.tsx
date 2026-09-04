"use client";

// Studio de l'assistant d'écriture.
//
// Parcours volontairement guidé en trois temps, toujours visibles :
//   1. Choisir le type d'écrit   2. Poser ses notes   3. Relire et garder.
// Chaque étape explique ce qui se passe (et ce qui NE se passe pas : notes
// jamais stockées, noms masqués avant traitement, validation humaine).
import * as React from "react";
import {
  Mic,
  MicOff,
  ShieldCheck,
  EyeOff,
  UserCheck,
  Sparkles,
  ArrowLeft,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Trash2,
  Loader2,
  Info,
  Download,
  Mail,
  FileType2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ChoixTrameMaison, TramesMaisonPanel, type TrameMaison } from "./TramesMaison";
import { ChoixLex, useCatalogueLex } from "./ChoixLex";
import { LexTravaille } from "./LexTravaille";

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

type Etape = "ecrire" | "relire";

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

/**
 * Télécharge l'écrit en Word ou en PDF.
 *
 * Le contenu part du navigateur, donc APRÈS la relecture : le fichier contient
 * exactement ce que l'auteur a validé, corrections comprises. Rien n'est
 * renvoyé au moteur au passage — l'API ne fait que mettre en page.
 */
async function telecharger(titre: string, contenu: string, format: "docx" | "pdf") {
  const res = await fetch("/api/proxy/assistant/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titre, contenu, format }),
  });
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    throw new Error(Array.isArray(d.message) ? d.message[0] : (d.message ?? "Export impossible"));
  }
  const blob = await res.blob();
  // Le nom proposé vient de l'API (Content-Disposition) ; on le relit ici pour
  // que le fichier arrive nommé, daté, et pas « download ».
  const entete = res.headers.get("content-disposition") ?? "";
  const trouve = /filename="([^"]+)"/.exec(entete);
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = trouve?.[1] ?? `ecrit.${format}`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
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


// ── Composant principal ─────────────────────────────────────────────────────

/**
 * Les reponses du formulaire deviennent des notes ordonnees.
 *
 * Rien n'est invente : un champ laisse vide ne produit aucune ligne. Le
 * modele recoit exactement ce que le professionnel a ecrit, range dans
 * l'ordre ou un ecrit professionnel se lit — le cadre, les faits, puis ce qui
 * releve de l'hypothese, nomme comme tel.
 */
function avecContexte(fd: FormData, notes: string): string {
  const champ = (nom: string) => String(fd.get(nom) || "").trim();
  const cadre: [string, string][] = [
    ["Quand", champ("quand")],
    ["Ou", champ("ou")],
    ["Personnes presentes", champ("presents")],
  ];
  const poses = cadre.filter(([, v]) => v);
  const hypotheses = champ("hypotheses");
  return [
    poses.length ? poses.map(([k, v]) => `${k} : ${v}`).join("\n") : "",
    notes,
    hypotheses ? `Ce que j'en pense (hypotheses, ressenti) :\n${hypotheses}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function AssistantStudio({ peutPublier = false }: { peutPublier?: boolean }) {
  const { toast } = useToast();
  const [trames, setTrames] = React.useState<Trame[]>([]);
  const [tramesMaison, setTramesMaison] = React.useState<TrameMaison[]>([]);
  const [trameMaisonId, setTrameMaisonId] = React.useState("");
  const [disponible, setDisponible] = React.useState(true);
  const [documents, setDocuments] = React.useState<DocumentResume[]>([]);

  const [etape, setEtape] = React.useState<Etape>("ecrire");
  const [trame, setTrame] = React.useState<Trame | null>(null);
  const [notes, setNotes] = React.useState("");
  const [brouillon, setBrouillon] = React.useState("");
  const [titre, setTitre] = React.useState("");
  const [protection, setProtection] = React.useState<{
    personnes: number;
    dates: number;
    contacts: number;
    roles?: string[];
  } | null>(null);
  const groupesEcrit = useCatalogueLex("ecrit");
  const [enCours, setEnCours] = React.useState(false);
  const [adresse, setAdresse] = React.useState("");
  const [envoi, setEnvoi] = React.useState(false);
  const [enregistre, setEnregistre] = React.useState(false);
  const [avisDonne, setAvisDonne] = React.useState(false);

  const zoneNotes = React.useRef<HTMLTextAreaElement>(null);
  const dictee = useDictee((t) => setNotes((n) => n + t));

  React.useEffect(() => {
    api<{ disponible: boolean; trames: Trame[] }>("/assistant/trames")
      .then((d) => {
        setTrames(d.trames);
        setDisponible(d.disponible);
        // Le formulaire s'ouvre deja rempli : le premier genre sert de defaut,
        // et la liste deroulante reste a portee pour en changer.
        setTrame((actuelle) => actuelle ?? d.trames[0] ?? null);
      })
      .catch(() => setDisponible(false));
    api<DocumentResume[]>("/assistant/documents").then(setDocuments).catch(() => undefined);
    chargerTrames();
  }, []);

  const chargerTrames = React.useCallback(() => {
    api<TrameMaison[]>("/assistant/trames-maison")
      .then(setTramesMaison)
      .catch(() => undefined);
  }, []);

  const libelleTrame = React.useMemo(() => {
    const m: Record<string, string> = {};
    for (const t of trames) m[t.id] = t.titre;
    return m;
  }, [trames]);

  // ── Actions ────────────────────────────────────────────────────────────

  /**
   * Un formulaire, pas une page blanche.
   *
   * Une zone de texte seule laissait tout le cadrage au professionnel : il
   * devait penser a preciser le quand, le ou, les presents, et a separer ce
   * qu'il a vu de ce qu'il en pense. Quand il l'oubliait, le modele comblait
   * — et il comblait avec du generique. Les champs posent les questions a sa
   * place, et ce qui reste vide reste vide.
   */
  async function generer(fd?: FormData) {
    if (!trame) return;
    setEnCours(true);
    try {
      const r = await api<{ brouillon: string; protection: typeof protection }>("/assistant/generer", {
        method: "POST",
        body: JSON.stringify({
          trame: trame.id,
          notes: fd ? avecContexte(fd, notes) : notes,
          ...(trameMaisonId ? { trameMaisonId } : {}),
          ...(fd
            ? {
                destinataire: String(fd.get("destinataire") || "") || undefined,
                registre: String(fd.get("registre") || "") || undefined,
                longueur: String(fd.get("longueur") || "") || undefined,
                sections: fd.getAll("sections").map(String),
              }
            : {}),
        }),
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

  /**
   * ENVOYER PLUTOT QUE TELECHARGER (25/08/2026).
   *
   * Telecharger suppose qu'on ecrit depuis le poste ou l'on veut le fichier.
   * Sur un poste partage d'unite, ce n'est pas le cas. L'adresse est saisie
   * ici, apres relecture, et n'est pas conservee.
   */
  async function envoyerParMail(format: "docx" | "pdf") {
    const cible = adresse.trim();
    if (!cible) return;
    setEnvoi(true);
    try {
      await api("/assistant/envoyer", {
        method: "POST",
        body: JSON.stringify({ titre, contenu: brouillon, format, email: cible }),
      });
      toast({ title: "Document envoyé", description: `Il est parti à ${cible}.` });
      setAdresse("");
    } catch (err) {
      toast({
        title: "Envoi impossible",
        description: (err as Error).message,
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  async function enregistrer() {
    if (!trame) return;
    setEnCours(true);
    try {
      await api("/assistant/documents", {
        method: "POST",
        body: JSON.stringify({
          trame: trame.id,
          title: titre,
          content: brouillon,
          ...(trameMaisonId ? { trameMaisonId } : {}),
        }),
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

  async function exporter(format: "docx" | "pdf") {
    try {
      await telecharger(titre || "Écrit professionnel", brouillon, format);
    } catch (err) {
      toast({ title: "Téléchargement impossible", description: (err as Error).message, variant: "error" });
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
    // ⚠ LA LIGNE DISPARAISSAIT MÊME QUAND LA SUPPRESSION ÉCHOUAIT.
    // `.catch(() => undefined)` avalait l'erreur, puis on retirait le document
    // de la liste : à l'écran il était supprimé, en base il était toujours là,
    // et il revenait au rechargement suivant. On ne retire de la liste que ce
    // que le serveur a réellement supprimé, et on le dit quand il refuse.
    try {
      await api(`/assistant/documents/${id}`, { method: "DELETE" });
      setDocuments((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description:
          err instanceof Error ? err.message : "Le document n'a pas pu être supprimé. Réessayez.",
        variant: "error",
      });
    }
  }

  function recommencer() {
    setEtape("ecrire"); setNotes(""); setBrouillon("");
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
              {/* CE BANDEAU DIT UNE PANNE, PAS UN LANCEMENT.
                  Il s'affiche quand le moteur ne répond pas. « Arrive très
                  bientôt » laissait croire à un service pas encore ouvert :
                  un abonné qui paie 19 € et lit ça pense s'être trompé
                  d'achat, et n'écrit pas au support. */}
              <p className="font-semibold text-foreground">
                L&apos;assistant est momentanément indisponible
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                La rédaction ne répond pas pour l&apos;instant. Vos crédits ne sont pas consommés
                tant qu&apos;une génération n&apos;aboutit pas, et vos écrits enregistrés restent
                accessibles. Réessayez dans quelques minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* LE STYLE MAISON D'ABORD (25/08/2026).
          Deposer un ecrit deja rendu change tout ce qui suit : autant le
          proposer avant la saisie, pas apres. */}
      <TramesMaisonPanel
        trames={tramesMaison}
        onChange={chargerTrames}
        peutPublier={peutPublier}
        genres={trames.map((t) => ({ id: t.id, titre: t.titre }))}
      />

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {etape === "relire" ? (
              <Button variant="ghost" size="sm" onClick={recommencer}>
                <ArrowLeft className="size-4" />
                Recommencer
              </Button>
            ) : null}
          </div>

          {/* LE FORMULAIRE — le genre, le cadre, les faits, puis les reglages */}
          {etape === "ecrire" ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void generer(new FormData(e.currentTarget));
              }}
            >
              {/* UNE SEULE PAGE, UN SEUL FORMULAIRE (25/08/2026).
                  La grille de huit vignettes faisait choisir avant de comprendre,
                  et repoussait toute la saisie hors de l'ecran. Le genre d'ecrit
                  est un champ comme les autres. */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-foreground">Quel document voulez-vous écrire ?</span>
                <select
                  value={trame?.id ?? ""}
                  onChange={(e) => setTrame(trames.find((x) => x.id === e.target.value) ?? null)}
                  className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm font-medium text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {trames.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.titre}
                    </option>
                  ))}
                </select>
                {trame ? (
                  <span className="text-xs text-muted-foreground">{trame.description}</span>
                ) : null}
              </label>

              <ChoixTrameMaison
                trames={tramesMaison.filter((t) => !t.genre || t.genre === trame?.id)}
                valeur={trameMaisonId}
                onChange={setTrameMaisonId}
              />

              <ul className="space-y-1.5 rounded-xl bg-primary-soft/60 p-4 text-sm text-foreground">
                {(trame?.conseils ?? []).map((c) => (
                  <li key={c} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {c}
                  </li>
                ))}
              </ul>

              {/* Le cadre : trois questions que tout ecrit professionnel pose,
                  et qu'une page blanche laissait au hasard de la memoire. */}
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex min-w-0 flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">Quand</span>
                  <input name="quand" placeholder="Mardi 12, 9h-11h" className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">Où</span>
                  <input name="ou" placeholder="Salle d’activité, unité 2" className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">Qui était présent</span>
                  <input name="presents" placeholder="6 jeunes, 2 professionnels" className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
                </label>
              </div>

              <p className="text-sm font-medium text-foreground">Ce que vous avez vu et entendu</p>
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

              {/* Separer les faits de ce qu'on en pense n'est pas une coquetterie :
                  c'est ce qui distingue un ecrit opposable d'un jugement. Le champ
                  existe pour que l'hypothese soit dite, et dite a sa place. */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-foreground">
                  Ce que vous en pensez{" "}
                  <span className="font-normal text-muted-foreground">— facultatif</span>
                </span>
                <textarea
                  name="hypotheses"
                  rows={3}
                  placeholder="Hypothèses, ressenti, ce qui vous interroge. LEX les formulera prudemment, à part des faits."
                  className="w-full rounded-xl border border-input bg-card p-3 text-sm leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </label>

              <ChoixLex groupes={groupesEcrit} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {notes.length < 20
                    ? "Encore quelques mots — une vingtaine de caractères minimum."
                    : `${notes.length.toLocaleString("fr-FR")} caractères. Prêt quand vous l'êtes.`}
                </p>
                <Button type="submit" disabled={!trame || notes.length < 20 || enCours || !disponible} size="lg">
                  {enCours ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {enCours ? "Rédaction en cours…" : "Rédiger le document"}
                </Button>
              </div>

              {/* Le bouton seul ne suffisait pas : pendant quinze secondes,
                  l'écran ne bougeait plus et l'on croyait à une panne. */}
              {enCours ? <LexTravaille /> : null}
            </form>
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

              {/* La preuve plutôt que la promesse : on montre littéralement ce
                  que le moteur a lu à la place des noms. C'est ce qu'un
                  professionnel peut ouvrir devant sa direction. */}
              {protection?.roles && protection.roles.length > 0 ? (
                <p className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
                  À la place des prénoms, le service d&apos;IA a lu :{" "}
                  {protection.roles.map((r) => (
                    <span
                      key={r}
                      className="mr-1 inline-block rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                    >
                      {r}
                    </span>
                  ))}
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
                <Button variant="outline" onClick={() => exporter("docx")}>
                  <Download className="size-4" />
                  Télécharger (Word)
                </Button>
                <Button variant="outline" onClick={() => exporter("pdf")}>
                  <FileType2 className="size-4" />
                  PDF
                </Button>
                <Button variant="ghost" onClick={copier}>
                  <Copy className="size-4" />
                  Copier
                </Button>
              </div>

              {/* Une adresse, pas un carnet : on l'ecrit, le document part,
                  et rien n'est retenu. */}
              <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-muted/30 p-3">
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">Envoyer le document par e-mail</span>
                  <input
                    type="email"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    placeholder="adresse@etablissement.fr"
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </label>
                <Button
                  variant="outline"
                  disabled={envoi || !adresse.trim()}
                  onClick={() => void envoyerParMail("docx")}
                >
                  <Mail className="size-4" />
                  Envoyer en Word
                </Button>
                <Button
                  variant="outline"
                  disabled={envoi || !adresse.trim()}
                  onClick={() => void envoyerParMail("pdf")}
                >
                  <Mail className="size-4" />
                  Envoyer en PDF
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                      try {
                        const doc = await api<{ content: string }>(`/assistant/documents/${d.id}`);
                        await telecharger(d.title, doc.content, "docx");
                      } catch (err) {
                        toast({ title: "Téléchargement impossible", description: (err as Error).message, variant: "error" });
                      }
                    }}
                    aria-label={`Télécharger ${d.title} au format Word`}
                    title="Télécharger en Word"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Download className="size-4" />
                  </button>
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
