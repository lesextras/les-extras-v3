"use client";

// Console de gestion du centre de formation (back-office ADMIN).
//   GET/POST/PATCH/DELETE /admin/formations · POST /admin/formations/:id/sessions
// L'admin (ADéPA = OF certifié) crée et pilote ses programmes certifiants ainsi
// que les formations internes. Calqué sur AdminArticlesManager / AdminUsersManager.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "./ui";
import { Field } from "./form-fields";
import {
  AdminFormationForm,
  toFormationPayload,
  type FormationFormValues,
} from "./AdminFormationForm";

export interface AdminFormation {
  id: string;
  title: string;
  type: "CERTIFIANTE" | "INTERNE";
  status: string;
  summary?: string | null;
  objectives?: string | null;
  program?: string | null;
  prerequisites?: string | null;
  targetAudience?: string | null;
  durationHours?: number | null;
  cpfEligible?: boolean;
  certifying?: boolean;
  certificationName?: string | null;
  categoryRef?: { id: string; title: string } | null;
  ownerAccount?: { id: string; name?: string | null } | null;
  _count?: { sessions?: number };
}
interface CategoryOption {
  id: string;
  title: string;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  ARCHIVED: "Archivée",
};

function toInitialValues(f: AdminFormation): Partial<FormationFormValues> {
  return {
    title: f.title,
    type: f.type,
    summary: f.summary ?? "",
    objectives: f.objectives ?? "",
    program: f.program ?? "",
    prerequisites: f.prerequisites ?? "",
    targetAudience: f.targetAudience ?? "",
    durationHours: f.durationHours != null ? String(f.durationHours) : "",
    categoryId: f.categoryRef?.id ?? "",
    cpfEligible: Boolean(f.cpfEligible),
    certifying: Boolean(f.certifying),
    certificationName: f.certificationName ?? "",
  };
}

export function AdminFormationsManager({
  formations,
  categories,
}: {
  formations: AdminFormation[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminFormation | null>(null);
  const [sessionTarget, setSessionTarget] = useState<AdminFormation | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return formations;
    return formations.filter((f) =>
      `${f.title} ${f.ownerAccount?.name ?? ""}`.toLowerCase().includes(needle),
    );
  }, [formations, q]);

  const certifiantes = formations.filter((f) => f.type === "CERTIFIANTE").length;
  const internes = formations.filter((f) => f.type === "INTERNE").length;

  async function create(values: FormationFormValues) {
    if (!values.title.trim()) {
      toast({ title: "L'intitulé est requis", variant: "error" });
      return;
    }
    setBusy("create");
    try {
      await apiRequest("/admin/formations", { method: "POST", body: toFormationPayload(values) });
      toast({ title: "Formation créée" });
      setCreateOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Création impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit(values: FormationFormValues) {
    if (!editTarget) return;
    if (!values.title.trim()) {
      toast({ title: "L'intitulé est requis", variant: "error" });
      return;
    }
    setBusy("edit");
    try {
      await apiRequest(`/admin/formations/${editTarget.id}`, {
        method: "PATCH",
        body: toFormationPayload(values),
      });
      toast({ title: "Formation mise à jour" });
      setEditTarget(null);
      router.refresh();
    } catch (err) {
      toast({
        title: "Modification impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, label: string) {
    setBusy(id);
    try {
      await apiRequest(`/admin/formations/${id}`, { method: "PATCH", body });
      toast({ title: label });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement ce programme de formation et ses sessions ? Cette action est irréversible.")) return;
    setBusy(id);
    try {
      await apiRequest(`/admin/formations/${id}`, { method: "DELETE" });
      toast({ title: "Formation supprimée" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function createSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionTarget) return;
    const fd = new FormData(e.currentTarget);
    const startRaw = String(fd.get("startDate") || "");
    if (!startRaw) {
      toast({ title: "La date de début est requise", variant: "error" });
      return;
    }
    const endRaw = String(fd.get("endDate") || "");
    setBusy("session");
    try {
      await apiRequest(`/admin/formations/${sessionTarget.id}/sessions`, {
        method: "POST",
        body: {
          startDate: new Date(startRaw).toISOString(),
          endDate: endRaw ? new Date(endRaw).toISOString() : undefined,
          location: String(fd.get("location") || "") || undefined,
          maxSeats: fd.get("maxSeats") ? Number(fd.get("maxSeats")) : undefined,
          priceHt: fd.get("priceHt") ? Number(fd.get("priceHt")) : undefined,
        },
      });
      toast({ title: "Session planifiée" });
      setSessionTarget(null);
      router.refresh();
    } catch (err) {
      toast({
        title: "Planification impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un programme…"
          className="flex-1"
        />
        <Button onClick={() => setCreateOpen(true)}>Nouvelle formation</Button>
      </div>

      {formations.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{formations.length} programme(s)</span>
          <span>· {certifiantes} certifiante(s)</span>
          <span>· {internes} interne(s)</span>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune formation"
          description={
            q.trim()
              ? "Aucun programme ne correspond à votre recherche."
              : "Créez la première formation certifiante d'ADéPA avec le bouton « Nouvelle formation »."
          }
          action={
            q.trim() ? undefined : (
              <Button onClick={() => setCreateOpen(true)}>Créer la première formation</Button>
            )
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programme</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Attributs</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{f.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {f.ownerAccount?.name ?? "—"}
                            {f.durationHours ? ` · ${f.durationHours} h` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.type === "INTERNE" ? "outline" : "soft"}>
                          {f.type === "INTERNE" ? "Interne" : "Certifiante"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {f.cpfEligible ? <Badge variant="success">CPF</Badge> : null}
                          {f.certifying ? <Badge variant="soft">Certifiant</Badge> : null}
                          {!f.cpfEligible && !f.certifying ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.status === "PUBLISHED" ? "success" : "outline"}>
                          {STATUS_LABEL[f.status] ?? f.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {f._count?.sessions ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === f.id}
                            onClick={() => setEditTarget(f)}
                          >
                            Éditer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === f.id}
                            onClick={() => setSessionTarget(f)}
                          >
                            Planifier
                          </Button>
                          {f.status === "PUBLISHED" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === f.id}
                              onClick={() => patch(f.id, { status: "DRAFT" }, "Formation dépubliée")}
                            >
                              Dépublier
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={busy === f.id}
                              onClick={() => patch(f.id, { status: "PUBLISHED" }, "Formation publiée")}
                            >
                              Publier
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={busy === f.id}
                            onClick={() => remove(f.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Création */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle formation</DialogTitle>
            <DialogDescription>
              Créez un programme certifiant (Qualiopi) ou une formation interne.
            </DialogDescription>
          </DialogHeader>
          <AdminFormationForm
            categories={categories}
            submitting={busy === "create"}
            submitLabel="Créer la formation"
            onSubmit={create}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Édition */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Éditer la formation</DialogTitle>
            <DialogDescription>
              Mettez à jour le contenu, les objectifs et les attributs du programme.
            </DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <AdminFormationForm
              key={editTarget.id}
              initial={toInitialValues(editTarget)}
              categories={categories}
              submitting={busy === "edit"}
              submitLabel="Enregistrer"
              onSubmit={saveEdit}
              onCancel={() => setEditTarget(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Planifier une session */}
      <Dialog open={sessionTarget !== null} onOpenChange={(o) => !o && setSessionTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Planifier une session</DialogTitle>
            <DialogDescription>{sessionTarget?.title}</DialogDescription>
          </DialogHeader>
          <form onSubmit={createSession} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date de début" htmlFor="s-start" required>
                <Input id="s-start" name="startDate" type="date" required />
              </Field>
              <Field label="Date de fin" htmlFor="s-end">
                <Input id="s-end" name="endDate" type="date" />
              </Field>
            </div>
            <Field label="Lieu" htmlFor="s-location">
              <Input id="s-location" name="location" placeholder="Melun / Distanciel" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Places" htmlFor="s-seats">
                <Input id="s-seats" name="maxSeats" type="number" min={1} placeholder="12" />
              </Field>
              <Field label="Prix HT (€)" htmlFor="s-price">
                <Input id="s-price" name="priceHt" type="number" min={0} step="0.01" placeholder="1200" />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setSessionTarget(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={busy === "session"}>
                {busy === "session" ? "…" : "Planifier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
