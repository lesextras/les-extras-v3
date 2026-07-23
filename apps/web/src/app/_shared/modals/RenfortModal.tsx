"use client";

// Modale « Publier un SOS Renfort » (ESTABLISHMENT).
// Flow SOS Renfort — étape 1 : création + publication de la mission.
// POST /missions  -> { visibility } pilote la diffusion en cascade côté API.
import { useState } from "react";
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      title: String(fd.get("title") || ""),
      description: String(fd.get("description") || ""),
      category,
      job: String(fd.get("job") || "") || undefined,
      startDate: String(fd.get("startDate") || ""),
      endDate: String(fd.get("endDate") || "") || undefined,
      startTime: String(fd.get("startTime") || "") || undefined,
      endTime: String(fd.get("endTime") || "") || undefined,
      city: String(fd.get("city") || "") || undefined,
      postalCode: String(fd.get("postalCode") || "") || undefined,
      hourlyRate: fd.get("hourlyRate") ? Number(fd.get("hourlyRate")) : undefined,
      headcount: fd.get("headcount") ? Number(fd.get("headcount")) : 1,
      visibility,
      // demande de publication immédiate ; l'API bascule le statut en PUBLISHED
      publish: true,
    };
    try {
      await apiRequest("/missions", { method: "POST", body, accountId });
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
                  {CATEGORIES.map((c) => (
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
          <Field label="Visibilité (cascade de diffusion)">
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
