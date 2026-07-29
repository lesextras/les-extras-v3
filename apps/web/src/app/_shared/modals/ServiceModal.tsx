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
      const desc = [f.description, f.objectifs?.length ? `\nObjectifs :\n- ${f.objectifs.join("\n- ")}` : ""].filter(Boolean).join("\n");
      set("description", desc);
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
          setCategory(rows[0].id);
        }
      })
      .catch(() => {});
  }, [open, accountId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const corps = {
      title: String(fd.get("title") || ""),
      description: String(fd.get("description") || ""),
      ...(usingDb ? { categoryId: category } : { category }),
      duration: String(fd.get("duration") || "") || undefined,
      maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
      publicTarget: String(fd.get("publicTarget") || "") || undefined,
      price: fd.get("price") ? Number(fd.get("price")) : undefined,
      city: String(fd.get("city") || "") || undefined,
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Participants max" htmlFor="maxParticipants">
              <Input id="maxParticipants" name="maxParticipants" type="number" min={1} defaultValue={fiche?.maxParticipants ?? ""} placeholder="10" />
            </Field>
            <Field label="Prix (€)" htmlFor="price">
              <Input id="price" name="price" type="number" step="0.5" defaultValue={fiche?.price != null ? String(fiche.price) : ""} placeholder="250" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Public visé" htmlFor="publicTarget">
              <Input id="publicTarget" name="publicTarget" defaultValue={fiche?.publicTarget ?? ""} placeholder="Adultes en situation de handicap" />
            </Field>
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" defaultValue={fiche?.city ?? ""} placeholder="Melun" />
            </Field>
          </div>
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
