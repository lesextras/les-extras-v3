"use client";

// Comptes / Organisations (back-office ADMIN) — liste + édition des fiches.
//   GET /admin/accounts · PATCH /admin/accounts/:id
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "./ui";

export interface AdminAccount {
  id: string;
  name: string;
  type: "ESTABLISHMENT" | "FREELANCE";
  legalName?: string | null;
  siret?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  credits?: number;
  owner?: { email?: string; firstName?: string | null; lastName?: string | null } | null;
  _count?: { memberships?: number; reliefMissions?: number; services?: number; bookings?: number };
}

const TYPE_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "ESTABLISHMENT", label: "Établissements" },
  { value: "FREELANCE", label: "Freelances" },
];

export function AdminAccountsTable({ accounts }: { accounts: AdminAccount[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminAccount>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return accounts.filter((a) => {
      if (type && a.type !== type) return false;
      if (!needle) return true;
      const hay = `${a.name} ${a.city ?? ""} ${a.siret ?? ""} ${a.owner?.email ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [accounts, q, type]);

  function startEdit(a: AdminAccount) {
    setEditing(a.id);
    setForm({
      name: a.name,
      legalName: a.legalName ?? "",
      siret: a.siret ?? "",
      city: a.city ?? "",
      postalCode: a.postalCode ?? "",
      phone: a.phone ?? "",
      credits: a.credits ?? 0,
    });
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await apiRequest(`/admin/accounts/${id}`, { method: "DELETE" });
      toast({ title: "Compte supprimé" });
      router.refresh();
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function save(id: string) {
    setBusy(id);
    try {
      await apiRequest(`/admin/accounts/${id}`, {
        method: "PATCH",
        body: {
          name: form.name,
          legalName: form.legalName,
          siret: form.siret,
          city: form.city,
          postalCode: form.postalCode,
          phone: form.phone,
          credits: typeof form.credits === "number" ? form.credits : Number(form.credits) || 0,
        },
      });
      toast({ title: "Fiche mise à jour" });
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast({ title: "Enregistrement impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un compte, une ville, un SIRET…" className="flex-1" />
        <Select value={type || "__all"} onValueChange={(v) => setType(v === "__all" ? "" : v)}>
          <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value || "__all"}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun compte" description="Aucun compte ne correspond à votre recherche." />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                {editing === a.id ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" />
                      <Input value={form.legalName ?? ""} onChange={(e) => setForm({ ...form, legalName: e.target.value })} placeholder="Raison sociale" />
                      <Input value={form.siret ?? ""} onChange={(e) => setForm({ ...form, siret: e.target.value })} placeholder="SIRET" />
                      <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ville" />
                      <Input value={form.postalCode ?? ""} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="Code postal" />
                      <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" />
                      <Input type="number" value={String(form.credits ?? 0)} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} placeholder="Crédits" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" disabled={busy === a.id} onClick={() => save(a.id)}>{busy === a.id ? "…" : "Enregistrer"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
                        <Badge variant={a.type === "ESTABLISHMENT" ? "default" : "outline"}>
                          {a.type === "ESTABLISHMENT" ? "Établissement" : "Freelance"}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {[a.city, a.owner?.email].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a._count?.memberships ?? 0} membre(s) · {a._count?.reliefMissions ?? 0} mission(s) · {a._count?.services ?? 0} atelier(s) · {a.credits ?? 0} crédit(s)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={`/admin/etablissements/${a.id}`}>Membres</a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(a)}>Éditer</Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === a.id} onClick={() => remove(a.id)}>Supprimer</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
