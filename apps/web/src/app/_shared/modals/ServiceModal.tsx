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
}: {
  accountId: string;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("ATELIER");
  const [dbCats, setDbCats] = useState<{ id: string; title: string }[]>([]);
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
      <DialogTrigger asChild>{trigger ?? <Button>Créer un atelier</Button>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un atelier</DialogTitle>
          <DialogDescription>
            Décrivez votre intervention pour la rendre réservable par les établissements.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
