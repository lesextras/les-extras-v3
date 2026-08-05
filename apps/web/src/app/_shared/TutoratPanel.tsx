"use client";

// Volet Tutorat / Accompagnement : projet d'avenir, entretiens réguliers, jalons.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

interface Entretien {
  id: string;
  date: string;
  notes?: string | null;
}
interface Jalon {
  id: string;
  label: string;
  dueDate?: string | null;
  status: "PENDING" | "DONE";
}
interface Tutorat {
  id: string;
  projetAvenir?: string | null;
  entretiens?: Entretien[];
  jalons?: Jalon[];
}

export function TutoratPanel({
  inscriptionId,
  accountId,
  tutorat,
}: {
  inscriptionId: string;
  accountId: string;
  tutorat: Tutorat | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [projet, setProjet] = useState(tutorat?.projetAvenir ?? "");
  const [busy, setBusy] = useState(false);

  const base = `/tutorat/inscription/${inscriptionId}`;

  async function call(path: string, body: unknown, ok: string) {
    setBusy(true);
    try {
      await apiRequest(path, { method: path.includes("/jalons/") ? "PATCH" : "POST", accountId, body });
      toast({ title: ok });
      router.refresh();
    } catch (err) {
      toast({ title: "Action impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function saveProjet() {
    setBusy(true);
    try {
      await apiRequest(base, { method: "PATCH", accountId, body: { projetAvenir: projet } });
      toast({ title: "Projet d'avenir enregistré" });
      router.refresh();
    } catch (err) {
      toast({ title: "Enregistrement impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  const jalons = tutorat?.jalons ?? [];
  const entretiens = tutorat?.entretiens ?? [];
  const doneCount = jalons.filter((j) => j.status === "DONE").length;

  return (
    <div className="space-y-6">
      {/* Projet d'avenir */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold text-foreground">Projet d'avenir</h3>
        <Textarea value={projet} onChange={(e) => setProjet(e.target.value)} rows={3} placeholder="Objectif d'insertion / de progression de l'apprenant…" />
        <div className="mt-3">
          <Button size="sm" onClick={saveProjet} disabled={busy}>Enregistrer</Button>
        </div>
      </section>

      {/* Jalons */}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Jalons du parcours</h3>
          <Badge variant="muted">{doneCount}/{jalons.length}</Badge>
        </div>
        <div className="space-y-2">
          {jalons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun jalon défini.</p>
          ) : (
            jalons.map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                {/* Même règle qu'au tableau de bord : un jalon atteint n'est pas raturé.
                    La couleur atténuée suffit à le distinguer. */}
                <span className={`text-sm ${j.status === "DONE" ? "text-muted-foreground" : "text-foreground"}`}>{j.label}</span>
                <Button
                  size="sm"
                  variant={j.status === "DONE" ? "ghost" : "outline"}
                  disabled={busy}
                  onClick={() => call(`/tutorat/jalons/${j.id}`, { status: j.status === "DONE" ? "PENDING" : "DONE" }, "Jalon mis à jour")}
                >
                  {j.status === "DONE" ? "Rouvrir" : "Terminer"}
                </Button>
              </div>
            ))
          )}
        </div>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const label = String(fd.get("label") || "");
            if (label) call(`${base}/jalons`, { label }, "Jalon ajouté");
            e.currentTarget.reset();
          }}
        >
          <Input name="label" placeholder="Nouveau jalon…" className="h-9 max-w-xs" />
          <Button type="submit" size="sm" variant="outline" disabled={busy}>Ajouter</Button>
        </form>
      </section>

      {/* Entretiens */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold text-foreground">Entretiens de suivi</h3>
        <div className="space-y-2">
          {entretiens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun entretien enregistré.</p>
          ) : (
            entretiens.map((en) => (
              <div key={en.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs font-medium text-foreground">
                  {new Date(en.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                {en.notes ? <p className="mt-0.5 text-sm text-muted-foreground">{en.notes}</p> : null}
              </div>
            ))
          )}
        </div>
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const date = String(fd.get("date") || "");
            const notes = String(fd.get("notes") || "");
            if (date) call(`${base}/entretiens`, { date: new Date(date).toISOString(), notes: notes || undefined }, "Entretien ajouté");
            e.currentTarget.reset();
          }}
        >
          <Field label="Date" htmlFor="date">
            <Input id="date" name="date" type="date" className="h-9" />
          </Field>
          <Input name="notes" placeholder="Notes de l'entretien…" className="h-9 max-w-xs" />
          <Button type="submit" size="sm" variant="outline" disabled={busy}>Ajouter</Button>
        </form>
      </section>
    </div>
  );
}
