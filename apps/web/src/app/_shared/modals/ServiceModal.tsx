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

export function ServiceModal({
  accountId,
  trigger,
  categorieInitiale = "ATELIER",
}: {
  accountId: string;
  trigger?: React.ReactNode;
  /** Pré-sélectionne le type de fiche. Le champ reste modifiable : on ouvre
   *  la bonne porte, on n'enferme pas. */
  categorieInitiale?: "ATELIER" | "FORMATION" | "MEDIATION" | "ART_THERAPIE" | "PREVENTION";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(categorieInitiale);
  const [dbCats, setDbCats] = useState<{ id: string; title: string }[]>([]);
  const [brief, setBrief] = useState("");
  const intitule =
    categorieInitiale === "FORMATION" ? "Créer une formation" : "Créer un atelier";
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
    try {
      const created = await apiRequest<{ id: string }>("/services", {
        method: "POST",
        body: {
          title: String(fd.get("title") || ""),
          description: String(fd.get("description") || ""),
          ...(usingDb ? { categoryId: category } : { category }),
          duration: String(fd.get("duration") || "") || undefined,
          maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
          publicTarget: String(fd.get("publicTarget") || "") || undefined,
          price: fd.get("price") ? Number(fd.get("price")) : undefined,
          city: String(fd.get("city") || "") || undefined,
        },
        accountId,
      });
      // Publication immédiate (l'atelier est créé en brouillon par défaut).
      if ((created as { id?: string })?.id) {
        await apiRequest(`/services/${(created as { id: string }).id}`, {
          method: "PATCH",
          body: { status: "PUBLISHED" },
          accountId,
        }).catch(() => {});
      }
      toast({ title: "Atelier publié", description: "Il apparaît désormais dans le catalogue." });
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
          <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-3">
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
            <Input id="title" name="title" required placeholder="Atelier médiation animale" />
          </Field>
          <Field label="Description" htmlFor="description" required>
            <Textarea id="description" name="description" required rows={4} />
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
              <Input id="duration" name="duration" placeholder="2H" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Participants max" htmlFor="maxParticipants">
              <Input id="maxParticipants" name="maxParticipants" type="number" min={1} placeholder="10" />
            </Field>
            <Field label="Prix (€)" htmlFor="price">
              <Input id="price" name="price" type="number" step="0.5" placeholder="250" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Public visé" htmlFor="publicTarget">
              <Input id="publicTarget" name="publicTarget" placeholder="Adultes en situation de handicap" />
            </Field>
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" placeholder="Melun" />
            </Field>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Publication…" : "Publier l'atelier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
