"use client";

// Modale « Créer / publier un atelier » (FREELANCE).
//   POST /services { ... , publish }
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "../form-fields";

const CATEGORIES = [
  { value: "ATELIER", label: "Atelier" },
  { value: "FORMATION", label: "Formation" },
  { value: "MEDIATION", label: "Médiation" },
  { value: "ART_THERAPIE", label: "Art-thérapie" },
  { value: "PREVENTION", label: "Prévention" },
];

/**
 * Publics visés, en cases à cocher plutôt qu'en texte libre. C'est ce qui rend
 * le filtre du catalogue utilisable : un chef de service qui cherche « handicap
 * adulte » ne trouve rien si chacun a écrit sa propre formulation.
 */
const PUBLICS = [
  "Enfants",
  "Adolescents",
  "Adultes",
  "Séniors",
  "Handicap",
  "Protection de l'enfance",
  "Insertion",
  "Professionnels",
];

/** Fiche existante, quand la modale sert à modifier. */
export interface FicheExistante {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  categoryId?: string | null;
  duration?: string | null;
  maxParticipants?: number | null;
  publicTarget?: string | null;
  price?: string | number | null;
  city?: string | null;
  status?: string | null;
  objectives?: string | null;
  methodology?: string | null;
  evaluation?: string | null;
  prerequisites?: string | null;
  material?: string | null;
  publicTargets?: string[] | null;
  timeSlots?: string[] | null;
}

export function ServiceModal({
  accountId,
  trigger,
  categorieInitiale = "ATELIER",
  fiche,
}: {
  accountId: string;
  trigger?: React.ReactNode;
  /** Pré-sélectionne le type de fiche. Le champ reste modifiable : on ouvre
   *  la bonne porte, on n'enferme pas. */
  categorieInitiale?: "ATELIER" | "FORMATION" | "MEDIATION" | "ART_THERAPIE" | "PREVENTION";
  /**
   * Fiche à modifier. Sans elle, la modale crée. Une fiche publiée n'était
   * jusqu'ici plus modifiable nulle part dans l'interface — l'API l'a
   * toujours permis, c'est le bouton qui manquait.
   */
  fiche?: FicheExistante;
}) {
  const edition = Boolean(fiche);
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(
    fiche?.categoryId ?? fiche?.category ?? categorieInitiale,
  );
  const [dbCats, setDbCats] = useState<{ id: string; title: string }[]>([]);
  const [brief, setBrief] = useState("");
  const [statut, setStatut] = useState<string>(fiche?.status ?? "PUBLISHED");
  const [publics, setPublics] = useState<string[]>(fiche?.publicTargets ?? []);
  // Le bloc pédagogique est replié à la création pour ne pas décourager, mais il
  // s'ouvre dès que l'IA y écrit quelque chose : un champ rempli qu'on ne voit
  // pas est pire qu'un champ vide.
  const [detailOuvert, setDetailOuvert] = useState(Boolean(fiche));
  const intitule = edition
    ? "Modifier la fiche"
    : categorieInitiale === "FORMATION"
      ? "Créer une formation"
      : "Créer un atelier";
  const [iaLoading, setIaLoading] = useState(false);

  /** Pré-remplit le formulaire depuis un brief, via l'assistant. Les champs
   *  restent modifiables : l'IA propose, l'intervenant décide. */
  async function remplirAvecIA() {
    if (brief.trim().length < 15 || iaLoading) return;
    setIaLoading(true);
    try {
      const r = await apiRequest<{ fiche?: Record<string, unknown>; brut?: string }>("/assistant/fiche", {
        method: "POST",
        accountId,
        body: { type: "ATELIER", brief: brief.trim() },
      });
      const f = r.fiche as { title?: string; description?: string; publicTarget?: string; duration?: string; objectifs?: string[] } | undefined;
      if (!f) throw new Error("Réponse inexploitable — réessayez en précisant le brief.");
      const set = (id: string, v?: string) => {
        const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el && v) el.value = v;
      };
      set("title", f.title);
      set("description", f.description);
      // Les objectifs ont désormais leur champ : les recopier dans la
      // description les rendait invisibles au filtre comme à l'audit.
      if (f.objectifs?.length) {
        set("objectives", f.objectifs.join("\n"));
        setDetailOuvert(true);
      }
      set("publicTarget", f.publicTarget);
      set("duration", f.duration);
      toast({ title: "Fiche pré-remplie", description: "Relisez et ajustez chaque champ avant de publier." });
    } catch (err) {
      toast({ title: "Aide IA indisponible", description: err instanceof Error ? err.message : "Réessayez.", variant: "error" });
    } finally {
      setIaLoading(false);
    }
  }
  const usingDb = dbCats.length > 0;

  useEffect(() => {
    if (!open) return;
    apiRequest<{ id: string; title: string }[]>("/categories?type=service", { accountId })
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          setDbCats(rows);
          // En edition, la categorie de la fiche est deja posee : la forcer a
          // la premiere de la liste reaffectait silencieusement chaque fiche
          // modifiee. On ne preselectionne qu'a la creation.
          if (!fiche) setCategory((c) => (rows.some((r) => r.id === c) ? c : rows[0].id));
        }
      })
      .catch(() => {});
  }, [open, accountId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const texte = (nom: string) => String(fd.get(nom) || "").trim() || undefined;
    // Les créneaux se saisissent en une ligne — « 9h-12h, 14h-17h » — et se
    // rangent en tableau. Demander un formulaire répétable pour deux valeurs
    // aurait été plus lourd à remplir qu'à lire.
    const creneaux = String(fd.get("timeSlots") || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const corps = {
      title: String(fd.get("title") || ""),
      description: String(fd.get("description") || ""),
      ...(usingDb ? { categoryId: category } : { category }),
      duration: texte("duration"),
      maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
      publicTarget: texte("publicTarget"),
      price: fd.get("price") ? Number(fd.get("price")) : undefined,
      city: texte("city"),
      // Le contenu pédagogique : ces champs existaient en base et dans l'API
      // depuis le début, mais seul l'import de catalogue les remplissait. Une
      // fiche créée à la main sortait donc systématiquement plus pauvre qu'une
      // fiche importée — et c'est précisément ce détail qui décide un chef de
      // service à réserver ou à passer son chemin.
      objectives: texte("objectives"),
      methodology: texte("methodology"),
      evaluation: texte("evaluation"),
      prerequisites: texte("prerequisites"),
      material: texte("material"),
      publicTargets: publics.length ? publics : undefined,
      timeSlots: creneaux.length ? creneaux : undefined,
    };
    try {
      if (edition && fiche) {
        await apiRequest(`/services/${fiche.id}`, {
          method: "PATCH",
          body: { ...corps, status: statut },
          accountId,
        });
        toast({
          title: statut === "PUBLISHED" ? "Fiche mise à jour" : "Fiche mise en brouillon",
          description:
            statut === "PUBLISHED"
              ? "Les modifications sont visibles dans le catalogue."
              : "Elle n'apparaît plus dans le catalogue public. Vous pourrez la republier quand vous voudrez.",
        });
        setOpen(false);
        router.refresh();
        return;
      }
      const created = await apiRequest<{ id: string }>("/services", {
        method: "POST",
        body: corps,
        accountId,
      });
      // La fiche est créée en brouillon : on applique le statut choisi.
      if ((created as { id?: string })?.id) {
        await apiRequest(`/services/${(created as { id: string }).id}`, {
          method: "PATCH",
          body: { status: statut },
          accountId,
        }).catch(() => {});
      }
      toast({
        title: statut === "PUBLISHED" ? "Atelier publié" : "Brouillon enregistré",
        description:
          statut === "PUBLISHED"
            ? "Il apparaît désormais dans le catalogue."
            : "Vous le publierez quand il sera prêt.",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>{intitule}</Button>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{intitule}</DialogTitle>
          <DialogDescription>
            Décrivez votre intervention pour la rendre réservable par les établissements.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* L'aide à la rédaction n'a de sens qu'à la création : en
              modification, la fiche est déjà écrite et l'écraser serait
              un piège. */}
          <div className={edition ? "hidden" : "rounded-xl border border-primary/20 bg-primary-soft/40 p-3"}>
            <p className="text-xs font-semibold text-foreground">✨ Remplir avec l'IA</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Décrivez votre atelier en 2-3 phrases : titre, description, public et durée seront proposés. Vous restez libre de tout modifier.
            </p>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={2}
              placeholder="Ex : atelier boxe éducative pour ados en foyer, canaliser l'agressivité, 2 h en gymnase…"
              className="mt-2"
            />
            <Button type="button" size="sm" variant="outline" className="mt-2" disabled={iaLoading || brief.trim().length < 15} onClick={remplirAvecIA}>
              {iaLoading ? "Rédaction en cours…" : "Proposer un contenu"}
            </Button>
          </div>
          <Field label="Titre" htmlFor="title" required>
            <Input id="title" name="title" required defaultValue={fiche?.title ?? ""} placeholder="Atelier médiation animale" />
          </Field>
          <Field label="Description" htmlFor="description" required>
            <Textarea id="description" name="description" required rows={4} defaultValue={fiche?.description ?? ""} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Catégorie">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(usingDb
                    ? dbCats.map((c) => ({ value: c.id, label: c.title }))
                    : CATEGORIES
                  ).map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Durée" htmlFor="duration">
              <Input id="duration" name="duration" defaultValue={fiche?.duration ?? ""} placeholder="2H" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Participants max" htmlFor="maxParticipants">
              <Input id="maxParticipants" name="maxParticipants" type="number" min={1} defaultValue={fiche?.maxParticipants ?? ""} placeholder="10" />
            </Field>
            <Field label="Prix (€)" htmlFor="price">
              <Input id="price" name="price" type="number" step="0.5" defaultValue={fiche?.price != null ? String(fiche.price) : ""} placeholder="250" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Public visé" htmlFor="publicTarget">
              <Input id="publicTarget" name="publicTarget" defaultValue={fiche?.publicTarget ?? ""} placeholder="Adultes en situation de handicap" />
            </Field>
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" defaultValue={fiche?.city ?? ""} placeholder="Melun" />
            </Field>
          </div>

          <Field
            label="Publics concernés"
            hint="Sert au filtre du catalogue : cochez tout ce qui s'applique."
          >
            <div className="flex flex-wrap gap-2">
              {PUBLICS.map((p) => {
                const actif = publics.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={actif}
                    onClick={() =>
                      setPublics((liste) =>
                        actif ? liste.filter((x) => x !== p) : [...liste, p],
                      )
                    }
                    className={
                      actif
                        ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                        : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* LE CONTENU PÉDAGOGIQUE.
              Replié par défaut : ces champs ne sont pas obligatoires pour
              publier, mais ce sont eux qui font la différence entre une fiche
              qu'on parcourt et une fiche qu'on réserve. Les laisser hors du
              formulaire, comme c'était le cas, revenait à condamner toute fiche
              saisie à la main à rester plus pauvre qu'une fiche importée. */}
          <details
            className="rounded-xl border border-border p-3"
            open={detailOuvert}
            onToggle={(e) => setDetailOuvert((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              Contenu pédagogique
              <span className="ml-2 font-normal text-muted-foreground">
                — objectifs, méthode, évaluation
              </span>
            </summary>
            <div className="mt-3 space-y-4">
              <Field
                label="Objectifs"
                htmlFor="objectives"
                hint="Ce que les participants savent faire à la fin. Un objectif par ligne."
              >
                <Textarea
                  id="objectives"
                  name="objectives"
                  rows={3}
                  defaultValue={fiche?.objectives ?? ""}
                  placeholder={"Exprimer une émotion sans passer par la violence\nCoopérer sur une tâche commune"}
                />
              </Field>
              <Field
                label="Déroulé et méthode"
                htmlFor="methodology"
                hint="Comment la séance se passe concrètement."
              >
                <Textarea
                  id="methodology"
                  name="methodology"
                  rows={3}
                  defaultValue={fiche?.methodology ?? ""}
                  placeholder="Accueil et cadre (15 min), mise en situation (1 h), reprise collective (30 min)…"
                />
              </Field>
              <Field
                label="Évaluation"
                htmlFor="evaluation"
                hint="Comment vous mesurez ce qui a été atteint. Attendu en audit Qualiopi."
              >
                <Textarea
                  id="evaluation"
                  name="evaluation"
                  rows={2}
                  defaultValue={fiche?.evaluation ?? ""}
                  placeholder="Grille d'observation remplie avec l'équipe éducative, bilan oral en fin de cycle…"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Prérequis" htmlFor="prerequisites">
                  <Textarea
                    id="prerequisites"
                    name="prerequisites"
                    rows={2}
                    defaultValue={fiche?.prerequisites ?? ""}
                    placeholder="Aucun. Tenue souple conseillée."
                  />
                </Field>
                <Field label="Matériel et lieu" htmlFor="material">
                  <Textarea
                    id="material"
                    name="material"
                    rows={2}
                    defaultValue={fiche?.material ?? ""}
                    placeholder="Salle de 40 m² au sol souple. Matériel fourni par l'intervenant."
                  />
                </Field>
              </div>
              <Field
                label="Créneaux proposés"
                htmlFor="timeSlots"
                hint="Séparés par des virgules. Laissez vide si tout se convient au cas par cas."
              >
                <Input
                  id="timeSlots"
                  name="timeSlots"
                  defaultValue={(fiche?.timeSlots ?? []).join(", ")}
                  placeholder="9h-12h, 14h-17h"
                />
              </Field>
            </div>
          </details>

          <Field label="Visibilité">
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLISHED">Publiée — visible dans le catalogue</SelectItem>
                <SelectItem value="DRAFT">Brouillon — retirée du catalogue</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Mettre en brouillon suspend la fiche sans la supprimer : les réservations déjà
              acceptées ne sont pas touchées, et vous pouvez la republier quand vous voulez.
            </p>
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Enregistrement…"
                : edition
                  ? "Enregistrer"
                  : statut === "PUBLISHED"
                    ? "Publier l'atelier"
                    : "Enregistrer en brouillon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
