"use client";

// IMPORTER SON PLANNING — le document qu'on a déjà entre dans l'agenda.
//
// Personne ne ressaisit un mois de service à la main. Les plannings existent
// déjà, en CSV, en Excel ou en PDF, et ils sont la seule source qui fasse foi
// dans une maison. On les lit donc tels quels.
//
// Trois précautions, parce qu'un agenda faux est pire qu'un agenda vide :
//  1. La lecture se fait ICI, dans le navigateur. Le document n'est pas
//     téléversé : seuls les créneaux retenus partent, une fois relus.
//  2. Rien n'entre sans relecture. On montre ce qu'on a compris, ligne par
//     ligne, et on laisse décocher.
//  3. Ce qu'on n'a pas compris est dit, pas caché. Une ligne écartée est
//     affichée avec sa raison — c'est ainsi qu'on répare un fichier.
//
// Les plafonds de durée du travail s'appliquent à l'import comme ailleurs :
// l'API refuse un créneau qui les dépasse, et le dit ligne par ligne.

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { lirePlanningCsv, type Lecture } from "@/lib/planning/lecture";
import {
  enCreneaux,
  personnes,
  type CreneauImportable,
  type LigneIgnoree,
} from "@/lib/planning/creneaux";

type Format = "csv" | "excel" | "pdf";

function formatDe(nom: string): Format | null {
  const n = nom.toLowerCase();
  if (n.endsWith(".csv") || n.endsWith(".txt") || n.endsWith(".tsv")) return "csv";
  if (n.endsWith(".xlsx") || n.endsWith(".xlsm")) return "excel";
  if (n.endsWith(".pdf")) return "pdf";
  return null;
}

interface Resultat {
  crees: number;
  refuses: number;
  resultats: { titre: string; debut: string; fin: string; cree?: string; refus?: string }[];
}

export function ImportPlanning({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const entree = React.useRef<HTMLInputElement>(null);

  const [open, setOpen] = React.useState(false);
  const [nomFichier, setNomFichier] = React.useState<string | null>(null);
  const [format, setFormat] = React.useState<Format | null>(null);
  const [enLecture, setEnLecture] = React.useState(false);
  const [panne, setPanne] = React.useState<string | null>(null);
  const [lecture, setLecture] = React.useState<Lecture | null>(null);
  const [qui, setQui] = React.useState<string>("");
  const [ecartes, setEcartes] = React.useState<Set<number>>(new Set());
  const [envoi, setEnvoi] = React.useState(false);
  const [resultat, setResultat] = React.useState<Resultat | null>(null);

  const noms = React.useMemo(() => (lecture ? personnes(lecture.lignes) : []), [lecture]);

  const conversion = React.useMemo(() => {
    if (!lecture) return { creneaux: [] as CreneauImportable[], ignorees: [] as LigneIgnoree[] };
    return enCreneaux(lecture.lignes, qui || undefined);
  }, [lecture, qui]);

  const retenus = conversion.creneaux.filter((_, i) => !ecartes.has(i));

  function reinitialiser() {
    setNomFichier(null);
    setFormat(null);
    setPanne(null);
    setLecture(null);
    setQui("");
    setEcartes(new Set());
    setResultat(null);
    if (entree.current) entree.current.value = "";
  }

  async function charger(fichier: File) {
    const f = formatDe(fichier.name);
    setNomFichier(fichier.name);
    setPanne(null);
    setLecture(null);
    setResultat(null);
    setEcartes(new Set());
    setQui("");
    setFormat(f);
    if (!f) {
      setPanne("Format non reconnu. Déposez un CSV, un classeur Excel (.xlsx) ou un PDF.");
      return;
    }
    setEnLecture(true);
    try {
      if (f === "csv") {
        setLecture(lirePlanningCsv(await fichier.text()));
      } else if (f === "excel") {
        // Chargés à la demande : ces kilo-octets ne pèsent que sur qui importe.
        const { lireClasseur } = await import("@/lib/planning/tableur");
        const { lireMatrice } = await import("@/lib/planning/lecture");
        setLecture(lireMatrice(await lireClasseur(await fichier.arrayBuffer())));
      } else {
        const { lirePlanningPdf } = await import("@/lib/planning/pdf");
        setLecture(await lirePlanningPdf(await fichier.arrayBuffer()));
      }
    } catch (e) {
      setPanne(
        e instanceof Error ? e.message : "Ce fichier n'a pas pu être lu. Essayez un autre format.",
      );
    } finally {
      setEnLecture(false);
    }
  }

  async function envoyer() {
    if (!retenus.length) return;
    setEnvoi(true);
    try {
      const res = await apiRequest<Resultat>("/planning/import", {
        method: "POST",
        accountId,
        body: {
          creneaux: retenus.map((c) => ({
            titre: c.titre,
            debut: c.debut,
            fin: c.fin,
            note: c.note,
          })),
        },
      });
      setResultat(res);
      toast({
        title: `${res.crees} créneau${res.crees > 1 ? "x" : ""} ajouté${res.crees > 1 ? "s" : ""}`,
        description:
          res.refuses > 0
            ? `${res.refuses} créneau(x) non ajouté(s) — le détail est à l'écran.`
            : "Votre agenda est à jour.",
      });
      router.refresh();
    } catch (e) {
      toast({
        title: "L'import n'a pas abouti",
        description: e instanceof Error ? e.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reinitialiser();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarPlus aria-hidden="true" className="size-4" />
          Importer mon planning
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer un planning</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Déposez le planning que vous avez déjà — CSV, Excel ou PDF. Il est lu sur votre poste :
          le document ne quitte pas votre navigateur, seuls les créneaux que vous validez entrent
          dans votre agenda.
        </p>

        {/* Étape 1 — le fichier. */}
        <div className="rounded-xl border border-dashed border-border p-4">
          <input
            ref={entree}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xlsm,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void charger(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => entree.current?.click()}>
              <Upload aria-hidden="true" className="mr-2 size-4" />
              Choisir un fichier
            </Button>
            <span className="text-sm text-muted-foreground">
              {nomFichier ?? "Aucun fichier choisi"}
            </span>
          </div>
          {format === "pdf" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Un PDF ne porte pas de tableau : sa lecture est une reconstitution à partir de la
              position des mots. Relisez la liste avant de valider.
            </p>
          ) : null}
        </div>

        {enLecture ? <p className="text-sm text-muted-foreground">Lecture en cours…</p> : null}

        {panne ? (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {panne}
          </p>
        ) : null}

        {lecture && lecture.colonnesManquantes.length > 0 ? (
          <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <span>
              Colonnes non trouvées : {lecture.colonnesManquantes.join(", ")}. Le fichier doit
              nommer au moins une personne et une date ; ajoutez une ligne d'en-tête et
              recommencez.
            </span>
          </p>
        ) : null}

        {/* Étape 2 — de qui parle-t-on ? */}
        {noms.length > 1 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Ce planning nomme {noms.length} personnes</span>
            <select
              value={qui}
              onChange={(e) => {
                setQui(e.target.value);
                setEcartes(new Set());
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">— choisissez la vôtre —</option>
              {noms.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Vous n'importez que vos propres créneaux : ce sont vos heures qui entrent dans votre
              agenda.
            </span>
          </label>
        ) : null}

        {/* Étape 3 — la relecture. */}
        {!resultat && conversion.creneaux.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {retenus.length} créneau{retenus.length > 1 ? "x" : ""} à ajouter
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setEcartes(
                    ecartes.size ? new Set() : new Set(conversion.creneaux.map((_, i) => i)),
                  )
                }
              >
                {ecartes.size ? "Tout cocher" : "Tout décocher"}
              </Button>
            </div>
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
              {conversion.creneaux.map((c, i) => (
                <li key={`${c.debut}-${i}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0"
                    checked={!ecartes.has(i)}
                    onChange={() => {
                      const s = new Set(ecartes);
                      if (s.has(i)) s.delete(i);
                      else s.add(i);
                      setEcartes(s);
                    }}
                  />
                  <span className="flex-1 truncate">{c.lisible}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{c.titre}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Ce qu'on n'a pas retenu, et pourquoi. */}
        {!resultat && conversion.ignorees.length > 0 ? (
          <details className="rounded-xl border border-border p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              {conversion.ignorees.length} ligne{conversion.ignorees.length > 1 ? "s" : ""} non
              retenue{conversion.ignorees.length > 1 ? "s" : ""}
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {conversion.ignorees.slice(0, 40).map((l, i) => (
                <li key={i}>
                  {l.date} — {l.raison}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {lecture && !enLecture && conversion.creneaux.length === 0 && !panne && noms.length <= 1 ? (
          <p className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm text-muted-foreground">
            <FileSpreadsheet aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Aucun créneau daté n'a pu être tiré de ce fichier. Il faut une colonne date et deux
            colonnes d'horaire (début et fin).
          </p>
        ) : null}

        {/* Étape 4 — ce qui s'est passé. */}
        {resultat ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {resultat.crees} créneau{resultat.crees > 1 ? "x" : ""} ajouté
              {resultat.crees > 1 ? "s" : ""} à votre agenda.
            </p>
            {resultat.refuses > 0 ? (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-2 text-xs text-muted-foreground">
                {resultat.resultats
                  .filter((r) => r.refus)
                  .map((r, i) => (
                    <li key={i}>
                      {new Date(r.debut).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}{" "}
                      — {r.refus}
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          {resultat ? (
            <Button type="button" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void envoyer()}
              disabled={envoi || retenus.length === 0}
            >
              {envoi
                ? "Ajout en cours…"
                : `Ajouter ${retenus.length || ""} créneau${retenus.length > 1 ? "x" : ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
