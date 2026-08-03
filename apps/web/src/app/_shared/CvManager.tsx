"use client";

// CV structuré du freelance : diplômes/formations (Qualification) + expériences (Experience).
// CRUD client-side via /users/me/cv, /users/me/qualifications, /users/me/experiences.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { BandeauPanne } from "./BandeauPanne";
import { Field, Textarea } from "./form-fields";

interface Qualification {
  id: string;
  title: string;
  organization?: string | null;
  year?: string | null;
}
interface Experience {
  id: string;
  title: string;
  year?: string | null;
  description?: string | null;
}

export function CvManager({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const [quals, setQuals] = useState<Qualification[]>([]);
  const [exps, setExps] = useState<Experience[]>([]);
  const [panne, setPanne] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const cv = await apiRequest<{ qualifications: Qualification[]; experiences: Experience[] }>(
        "/users/me/cv",
        { accountId },
      );
      setQuals(cv.qualifications ?? []);
      setExps(cv.experiences ?? []);
      setPanne(false);
    } catch {
      // Un CV vide et un CV qui n'a pas chargé se ressemblent trop : c'est ce
      // que les établissements consultent pour décider de vous retenir.
      setPanne(true);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addQual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      title: String(fd.get("title") || ""),
      organization: String(fd.get("organization") || "") || undefined,
      year: String(fd.get("year") || "") || undefined,
    };
    if (!body.title) return;
    setBusy(true);
    try {
      await apiRequest("/users/me/qualifications", { method: "POST", body, accountId });
      form.reset();
      await load();
    } catch (err) {
      toast({ title: "Ajout impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function addExp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      title: String(fd.get("title") || ""),
      year: String(fd.get("year") || "") || undefined,
      description: String(fd.get("description") || "") || undefined,
    };
    if (!body.title) return;
    setBusy(true);
    try {
      await apiRequest("/users/me/experiences", { method: "POST", body, accountId });
      form.reset();
      await load();
    } catch (err) {
      toast({ title: "Ajout impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(kind: "qualifications" | "experiences", id: string) {
    setBusy(true);
    try {
      await apiRequest(`/users/me/${kind}/${id}`, { method: "DELETE", accountId });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {panne ? <BandeauPanne quoi="votre CV" onReessayer={() => void load()} /> : null}
      {/* Diplômes & formations */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Diplômes &amp; formations</h3>
        <ul className="mt-3 space-y-2">
          {quals.length === 0 ? (
            <li className="text-sm text-muted-foreground">Aucun diplôme renseigné.</li>
          ) : (
            quals.map((q) => (
              <li key={q.id} className="flex items-start justify-between gap-2 rounded-lg border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{q.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[q.organization, q.year].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove("qualifications", q.id)}
                  disabled={busy}
                  className="text-xs text-destructive hover:underline"
                >
                  Supprimer
                </button>
              </li>
            ))
          )}
        </ul>
        <form onSubmit={addQual} className="mt-4 space-y-3 border-t border-border pt-4">
          <Field label="Intitulé du diplôme / de la formation" htmlFor="q-title" required>
            <Input id="q-title" name="title" required placeholder="DEES — Diplôme d'État d'éducateur spécialisé" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Établissement" htmlFor="q-org">
              <Input id="q-org" name="organization" placeholder="IRTS, IFEN…" />
            </Field>
            <Field label="Année" htmlFor="q-year">
              <Input id="q-year" name="year" placeholder="2018" />
            </Field>
          </div>
          <Button type="submit" size="sm" variant="secondary" disabled={busy}>
            Ajouter le diplôme
          </Button>
        </form>
      </section>

      {/* Expériences */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Expériences professionnelles</h3>
        <ul className="mt-3 space-y-2">
          {exps.length === 0 ? (
            <li className="text-sm text-muted-foreground">Aucune expérience renseignée.</li>
          ) : (
            exps.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-2 rounded-lg border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{x.title}</p>
                  {x.year ? <p className="text-xs text-muted-foreground">{x.year}</p> : null}
                  {x.description ? <p className="mt-1 text-xs text-muted-foreground">{x.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove("experiences", x.id)}
                  disabled={busy}
                  className="text-xs text-destructive hover:underline"
                >
                  Supprimer
                </button>
              </li>
            ))
          )}
        </ul>
        <form onSubmit={addExp} className="mt-4 space-y-3 border-t border-border pt-4">
          <Field label="Poste / structure" htmlFor="x-title" required>
            <Input id="x-title" name="title" required placeholder="Éducateur spé — MECS Les Hirondelles" />
          </Field>
          <Field label="Période" htmlFor="x-year">
            <Input id="x-year" name="year" placeholder="2019 – 2023" />
          </Field>
          <Field label="Description" htmlFor="x-desc">
            <Textarea id="x-desc" name="description" rows={2} placeholder="Missions, public accueilli…" />
          </Field>
          <Button type="submit" size="sm" variant="secondary" disabled={busy}>
            Ajouter l&apos;expérience
          </Button>
        </form>
      </section>
    </div>
  );
}
