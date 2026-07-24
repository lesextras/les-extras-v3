"use client";

// Modale « Publier un SOS Renfort » (ESTABLISHMENT).
// Flow SOS Renfort — étape 1 : création + publication de la mission.
// POST /missions  -> { visibility } pilote la diffusion en cascade côté API.
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
  { value: "RENFORT", label: "Renfort" },
  { value: "REMPLACEMENT", label: "Remplacement" },
  { value: "ANALYSE_PRATIQUES", label: "Analyse des pratiques" },
  { value: "FORMATION", label: "Formation" },
];

const VISIBILITIES = [
  { value: "SALARIES", label: "Salariés d'abord (cascade)" },
  { value: "RESERVED", label: "Réseau réservé" },
  { value: "PUBLIC", label: "Public (marketplace)" },
];

export function RenfortModal({
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
  const [category, setCategory] = useState("RENFORT");
  const [visibility, setVisibility] = useState("SALARIES");
  const [dbCats, setDbCats] = useState<{ id: string; title: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const usingDb = dbCats.length > 0;

  useEffect(() => {
    if (!open) return;
    apiRequest<{ id: string; title: string }[]>("/categories?type=mission", { accountId })
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          setDbCats(rows);
          setCategory(rows[0].id);
        }
      })
      .catch(() => {});
    apiRequest<{ id: string; name: string }[]>("/units", { accountId })
      .then((rows) => {
        if (Array.isArray(rows)) setUnits(rows);
      })
      .catch(() => {});
  }, [open, accountId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      title: String(fd.get("title") || ""),
      description: String(fd.get("description") || ""),
      ...(usingDb ? { categoryId: category } : { category }),
      job: String(fd.get("job") || "") || undefined,
      startDate: String(fd.get("startDate") || ""),
      endDate: String(fd.get("endDate") || "") || undefined,
      startTime: String(fd.get("startTime") || "") || undefined,
      endTime: String(fd.get("endTime") || "") || undefined,
      city: String(fd.get("city") || "") || undefined,
      postalCode: String(fd.get("postalCode") || "") || undefined,
      hourlyRate: fd.get("hourlyRate") ? Number(fd.get("hourlyRate")) : undefined,
      headcount: fd.get("headcount") ? Number(fd.get("headcount")) : 1,
      emergency: fd.get("emergency") === "on",
      attachmentUrl: String(fd.get("attachmentUrl") || "") || undefined,
      orgUnitId: String(fd.get("orgUnitId") || "") || undefined,
    };
    try {
      const created = await apiRequest<{ id: string }>("/missions", { method: "POST", body, accountId });
      // Diffusion immédiate via l'endpoint dédié.
      if (created?.id) {
        await apiRequest(`/missions/${created.id}/publish`, { method: "POST", accountId }).catch(() => {});
      }
      toast({
        title: "Renfort publié",
        description: "Votre demande est diffusée. Vous serez notifié des candidatures.",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Publier un renfort</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publier un SOS Renfort</DialogTitle>
          <DialogDescription>
            Décrivez le besoin. La diffusion se fait en cascade selon la visibilité
            choisie.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Intitulé" htmlFor="title" required>
            <Input id="title" name="title" required placeholder="Éducateur spé — internat" />
          </Field>
          <Field label="Description" htmlFor="description" required>
            <Textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="Contexte, public accueilli, missions attendues…"
            />
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
            <Field label="Métier recherché" htmlFor="job">
              <Input id="job" name="job" placeholder="Moniteur-éducateur, AES…" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date de début" htmlFor="startDate" required>
              <Input id="startDate" name="startDate" type="date" required />
            </Field>
            <Field label="Date de fin" htmlFor="endDate">
              <Input id="endDate" name="endDate" type="date" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Heure début" htmlFor="startTime">
              <Input id="startTime" name="startTime" placeholder="09h00" />
            </Field>
            <Field label="Heure fin" htmlFor="endTime">
              <Input id="endTime" name="endTime" placeholder="17h00" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" placeholder="Melun" />
            </Field>
            <Field label="Code postal" htmlFor="postalCode">
              <Input id="postalCode" name="postalCode" placeholder="77000" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Taux horaire (€)" htmlFor="hourlyRate">
              <Input id="hourlyRate" name="hourlyRate" type="number" step="0.5" placeholder="24" />
            </Field>
            <Field label="Postes" htmlFor="headcount">
              <Input id="headcount" name="headcount" type="number" min={1} defaultValue={1} />
            </Field>
          </div>
          {units.length > 0 ? (
            <Field label="Unité / service concerné" htmlFor="orgUnitId">
              <select
                id="orgUnitId"
                name="orgUnitId"
                defaultValue=""
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Toute la structure —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Pièce jointe (lien vers un document)" htmlFor="attachmentUrl">
            <Input
              id="attachmentUrl"
              name="attachmentUrl"
              type="url"
              placeholder="https://… (fiche de poste, planning, consignes)"
            />
          </Field>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <input type="checkbox" name="emergency" className="h-4 w-4 rounded border-input accent-primary" />
            <span>
              <span className="font-medium text-foreground">Mission urgente</span>
              <span className="block text-xs text-muted-foreground">
                À la publication, tous les freelances dont le profil correspond (métier, zone, disponibilité) sont notifiés par e-mail. Premier arrivé, premier servi.
              </span>
            </span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Publication…" : "Publier le renfort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
