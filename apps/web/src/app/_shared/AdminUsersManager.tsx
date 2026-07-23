"use client";

// Gestion complète des utilisateurs (back-office ADMIN).
//   POST /admin/users · PATCH /admin/users/:id · DELETE /admin/users/:id
//   PATCH /admin/users/:id/ban|unban
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
import {
  USER_STATUS_LABEL,
  GLOBAL_ROLE_LABEL,
  userStatusBadgeVariant,
  fullName,
  formatDate,
} from "./format";

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  status: string;
  createdAt: string;
}

const ROLE_OPTS = [
  { value: "USER", label: "Utilisateur" },
  { value: "ADMIN", label: "Administrateur" },
];
const STATUS_OPTS = [
  { value: "VERIFIED", label: "Vérifié" },
  { value: "PENDING", label: "En attente" },
  { value: "BANNED", label: "Banni" },
];

export function AdminUsersManager({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", role: "USER", status: "VERIFIED" });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) =>
      `${u.email} ${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase().includes(needle),
    );
  }, [users, q]);

  async function create() {
    if (!form.email.trim() || form.password.length < 8) {
      toast({ title: "E-mail requis et mot de passe ≥ 8 caractères", variant: "error" });
      return;
    }
    setBusy("create");
    try {
      await apiRequest("/admin/users", { method: "POST", body: { ...form } });
      toast({ title: "Utilisateur créé" });
      setForm({ email: "", password: "", firstName: "", lastName: "", role: "USER", status: "VERIFIED" });
      setShowCreate(false);
      router.refresh();
    } catch (err) {
      toast({ title: "Création impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, label: string) {
    setBusy(id);
    try {
      await apiRequest(`/admin/users/${id}`, { method: "PATCH", body });
      toast({ title: label });
      router.refresh();
    } catch (err) {
      toast({ title: "Modification impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await apiRequest(`/admin/users/${id}`, { method: "DELETE" });
      toast({ title: "Utilisateur supprimé" });
      router.refresh();
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom ou un e-mail…" className="flex-1" />
        <Button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Fermer" : "Nouvel utilisateur"}
        </Button>
      </div>

      {showCreate ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium text-foreground">Créer un utilisateur</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail" type="email" />
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mot de passe (≥ 8)" type="password" />
              <div className="hidden lg:block" />
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Prénom" />
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Nom" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTS.filter((o) => o.value !== "BANNED").map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={create} disabled={busy === "create"}>{busy === "create" ? "…" : "Créer"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="Aucun utilisateur" description="Aucun utilisateur ne correspond à votre recherche." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{fullName(u.firstName, u.lastName)}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(v) => patch(u.id, { role: v }, "Rôle mis à jour")}>
                          <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={userStatusBadgeVariant(u.status)}>{USER_STATUS_LABEL[u.status] ?? u.status}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {u.status === "BANNED" ? (
                            <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => patch(u.id, { status: "VERIFIED" }, "Utilisateur réactivé")}>Réactiver</Button>
                          ) : (
                            <Button size="sm" variant="ghost" disabled={busy === u.id} onClick={() => patch(u.id, { status: "BANNED" }, "Utilisateur banni")}>Bannir</Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === u.id} onClick={() => remove(u.id)}>Supprimer</Button>
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
    </div>
  );
}
