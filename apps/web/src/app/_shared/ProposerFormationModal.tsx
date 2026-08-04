"use client";

// Modale « Proposer une formation » (intervenant indépendant).
//
// Un intervenant rédige son programme ; il part en BROUILLON et n'est PAS
// publié tant qu'ADéPA ne l'a pas relu. C'est volontaire : une formation
// certifiante est diffusée sous la certification Qualiopi de l'association —
// la mettre en ligne engage ADéPA, pas seulement celui qui l'a écrite (le
// serveur applique la même règle, voir formations.service.ts).
//
//   POST /formations  → programme CERTIFIANTE, statut DRAFT
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

export function ProposerFormationModal({
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await apiRequest("/formations", {
        method: "POST",
        accountId,
        body: {
          // CERTIFIANTE : le programme a vocation à rejoindre le catalogue
          // ADéPA. Les mentions « certifiant » et « CPF » sont posées par
          // ADéPA à la validation, jamais par l'auteur (règle serveur).
          type: "CERTIFIANTE",
          title: String(fd.get("title") || ""),
          summary: String(fd.get("summary") || "") || undefined,
          objectives: String(fd.get("objectives") || "") || undefined,
          program: String(fd.get("program") || "") || undefined,
          prerequisites: String(fd.get("prerequisites") || "") || undefined,
          targetAudience: String(fd.get("targetAudience") || "") || undefined,
          durationHours: fd.get("durationHours")
            ? Number(fd.get("durationHours"))
            : undefined,
        },
      });
      toast({
        title: "Programme envoyé à ADéPA",
        description:
          "Il reste en brouillon le temps de la relecture. Vous serez prévenu·e dès sa publication.",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Proposer une formation</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Proposer une formation</DialogTitle>
          <DialogDescription>
            Décrivez votre programme : l&apos;équipe ADéPA le relit, puis le publie au catalogue
            sous sa certification Qualiopi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex gap-3 rounded-xl bg-primary-soft/50 p-3 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p>
              Votre programme reste en <strong className="text-foreground">brouillon</strong> tant
              qu&apos;ADéPA ne l&apos;a pas validé : une formation certifiante engage la
              certification Qualiopi de l&apos;association. Vous pourrez le modifier entre-temps.
            </p>
          </div>

          <Field
            label="Intitulé du programme"
            htmlFor="pf-title"
            required
            hint="Le titre tel qu'il apparaîtra au catalogue. Ex. « Gestion des conflits en internat »."
          >
            <Input id="pf-title" name="title" required placeholder="Gestion des conflits en internat" />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <Field
              label="Résumé"
              htmlFor="pf-summary"
              hint="Deux ou trois phrases : à qui s'adresse la formation et ce qu'elle apporte."
            >
              <Input id="pf-summary" name="summary" placeholder="Anticiper les situations de tension…" />
            </Field>
            <Field
              label="Durée (heures)"
              htmlFor="pf-duration"
              hint="Durée totale du programme, en heures."
            >
              <Input id="pf-duration" name="durationHours" type="number" min={1} placeholder="6" />
            </Field>
          </div>

          <Field
            label="Objectifs pédagogiques"
            htmlFor="pf-objectives"
            hint="Ce que les participants savent faire à la fin. Un objectif par ligne — attendu en audit Qualiopi."
          >
            <Textarea
              id="pf-objectives"
              name="objectives"
              rows={4}
              placeholder="Repérer les signes avant-coureurs d'une montée en tension…"
            />
          </Field>

          <Field
            label="Programme / contenu"
            htmlFor="pf-program"
            hint="Le déroulé concret de la formation, séquence par séquence."
          >
            <Textarea id="pf-program" name="program" rows={5} placeholder="Séquence 1 — …" />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Public visé"
              htmlFor="pf-audience"
              hint="Les métiers concernés. Ex. « éducateurs spécialisés, moniteurs-éducateurs »."
            >
              <Input id="pf-audience" name="targetAudience" placeholder="Équipes éducatives en internat" />
            </Field>
            <Field
              label="Prérequis"
              htmlFor="pf-prereq"
              hint="Ce qu'il faut déjà savoir ou avoir vécu pour suivre utilement. Laissez vide s'il n'y en a aucun."
            >
              <Input id="pf-prereq" name="prerequisites" placeholder="Aucun" />
            </Field>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Envoyer à ADéPA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
