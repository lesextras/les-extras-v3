"use client";

// Cycles de planning : déroule la semaine courante (créneaux saisis à la
// main) sur N semaines. Les copies en conflit sont sautées et signalées.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

/** Lundi de la semaine courante, à minuit UTC (même convention que l'API). */
function lundiCourant(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString();
}

export function RepeterSemaine({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function derouler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const semaines = Number(new FormData(e.currentTarget).get("semaines") || 4);
    setBusy(true);
    try {
      const res = await apiRequest<{ crees: number; sautes: string[] }>("/gta/cycles", {
        method: "POST",
        accountId,
        body: { lundi: lundiCourant(), semaines },
      });
      toast({
        title: `${res.crees} créneau${res.crees > 1 ? "x" : ""} créé${res.crees > 1 ? "s" : ""}`,
        description:
          res.sautes.length > 0
            ? `${res.sautes.length} copie(s) sautée(s) pour cause de conflit.`
            : "La semaine a été déroulée sans conflit.",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Cycle impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Répéter cette semaine</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dérouler la semaine en cycle</DialogTitle>
        </DialogHeader>
        <form onSubmit={derouler} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Les créneaux saisis à la main sur la semaine en cours sont recopiés sur les semaines
            suivantes. Les copies qui créeraient un conflit (même personne, même période) sont
            sautées et signalées.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Nombre de semaines (1 à 12)</span>
            <Input type="number" name="semaines" min={1} max={12} defaultValue={4} required />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Déroulement…" : "Dérouler"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
