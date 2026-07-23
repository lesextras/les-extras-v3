"use client";

// Modale « Former mes équipes en interne » (ESTABLISHMENT).
// Parcours B : crée un programme INTERNE (sans Qualiopi) + une 1ʳᵉ session
// animée par un salarié-membre sollicité comme formateur ponctuel.
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
import { Field, Textarea } from "./form-fields";

interface Trainer {
  userId: string;
  name: string;
  job: string | null;
  skills: string[];
}

export function FormationInterneModal({
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
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainerId, setTrainerId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    apiRequest<Trainer[]>("/formations/internal-trainers", { accountId })
      .then((rows) => {
        if (Array.isArray(rows)) {
          setTrainers(rows);
          if (rows.length) setTrainerId(rows[0].userId);
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
      const formation = await apiRequest<{ id: string }>("/formations", {
        method: "POST",
        accountId,
        body: {
          type: "INTERNE",
          title: String(fd.get("title") || ""),
          summary: String(fd.get("summary") || "") || undefined,
          durationHours: fd.get("durationHours") ? Number(fd.get("durationHours")) : undefined,
        },
      });
      if (formation?.id) {
        await apiRequest(`/formations/${formation.id}/sessions`, {
          method: "POST",
          accountId,
          body: {
            startDate: new Date(String(fd.get("startDate"))).toISOString(),
            trainerId: trainerId || undefined,
            location: String(fd.get("location") || "") || undefined,
            maxSeats: fd.get("maxSeats") ? Number(fd.get("maxSeats")) : undefined,
          },
        });
        await apiRequest(`/formations/${formation.id}`, {
          method: "PATCH",
          accountId,
          body: { status: "PUBLISHED" },
        }).catch(() => {});
      }
      toast({
        title: "Formation interne créée",
        description: "La session est planifiée. Inscrivez vos collègues depuis la fiche.",
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
      <DialogTrigger asChild>
        {trigger ?? <Button>Former mes équipes en interne</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une formation interne</DialogTitle>
          <DialogDescription>
            Un salarié référent forme ses collègues. Parcours simplifié, sans Qualiopi ni CPF —
            l’établissement délivre une attestation de fin de formation.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          Étapes : <span className="font-medium text-foreground">Programme → Session → Inscription des salariés → Émargement → Attestation</span>.
          Vous pourrez inscrire vos collègues juste après la création.
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Intitulé" htmlFor="title" required>
            <Input id="title" name="title" required placeholder="Gestion de crise en internat" />
          </Field>
          <Field
            label="Objectif / résumé"
            htmlFor="summary"
            hint="Décrivez ce que les participants sauront faire à l’issue de la formation."
          >
            <Textarea id="summary" name="summary" rows={3} placeholder="Ce que les participants sauront faire à l’issue…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Durée (heures)" htmlFor="durationHours">
              <Input id="durationHours" name="durationHours" type="number" min={1} placeholder="7" />
            </Field>
            <Field label="Places" htmlFor="maxSeats">
              <Input id="maxSeats" name="maxSeats" type="number" min={1} placeholder="12" />
            </Field>
          </div>
          <Field label="Formateur référent (salarié)" hint="Un membre de votre équipe qui animera la session.">

            {trainers.length > 0 ? (
              <Select value={trainerId} onValueChange={setTrainerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un membre" />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((t) => (
                    <SelectItem key={t.userId} value={t.userId}>
                      {t.name}
                      {t.job ? ` — ${t.job}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                Aucun salarié disponible. Invitez d’abord vos collègues depuis « Équipe »,
                puis désignez-en un comme formateur.
              </p>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date de session" htmlFor="startDate" required>
              <Input id="startDate" name="startDate" type="date" required />
            </Field>
            <Field label="Lieu" htmlFor="location" hint="Sur site ou distanciel.">
              <Input id="location" name="location" placeholder="Sur site / Distanciel" />
            </Field>
          </div>
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Créer la formation interne"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
