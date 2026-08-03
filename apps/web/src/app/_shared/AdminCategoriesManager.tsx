"use client";

// CRUD Catégories (back-office ADMIN) — taxonomie éditable.
//   GET/POST/PATCH/DELETE /admin/categories
import { useState } from "react";
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

export interface AdminCategory {
  id: string;
  title: string;
  type?: string | null;
  description?: string | null;
  archived: boolean;
  parent?: { id: string; title: string } | null;
  _count?: { children: number; articles: number };
}

const TYPES = [
  { value: "article", label: "Article" },
  { value: "mission", label: "Mission" },
  { value: "service", label: "Atelier" },
  { value: "educatheure", label: "Éducat’heure" },
];

export function AdminCategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("article");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");

  async function create() {
    if (!title.trim()) {
      toast({ title: "Le titre est requis", variant: "error" });
      return;
    }
    setBusy("create");
    try {
      await apiRequest("/admin/categories", {
        method: "POST",
        body: { title: title.trim(), type, parentId: parentId || undefined, description: description || undefined },
      });
      toast({ title: "Catégorie créée" });
      setTitle("");
      setDescription("");
      setParentId("");
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
      await apiRequest(`/admin/categories/${id}`, { method: "PATCH", body });
      toast({ title: label });
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast({ title: "Modification impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement cette catégorie ? Les fiches qui l'utilisent perdront leur classement.")) return;
    setBusy(id);
    try {
      await apiRequest(`/admin/categories/${id}`, { method: "DELETE" });
      toast({ title: "Catégorie supprimée" });
      router.refresh();
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulaire de création */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium text-foreground">Nouvelle catégorie</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={parentId || "__none"} onValueChange={(v) => setParentId(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Parent (optionnel)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Aucun parent</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optionnel)" />
          </div>
          <div className="flex justify-end">
            <Button onClick={create} disabled={busy === "create"}>
              {busy === "create" ? "…" : "Ajouter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {categories.length === 0 ? (
        <EmptyState title="Aucune catégorie" description="Créez votre première catégorie ci-dessus." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {editing === c.id ? (
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-9" />
                        ) : (
                          <span className="text-sm font-medium text-foreground">{c.title}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editing === c.id ? (
                          <Select value={editType || "article"} onValueChange={setEditType}>
                            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{TYPES.find((t) => t.value === c.type)?.label ?? c.type ?? "—"}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.parent?.title ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c._count ? `${c._count.children} s-cat · ${c._count.articles} art.` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.archived ? "outline" : "success"}>
                          {c.archived ? "Archivée" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {editing === c.id ? (
                            <>
                              <Button size="sm" disabled={busy === c.id} onClick={() => patch(c.id, { title: editTitle, type: editType }, "Catégorie mise à jour")}>
                                {busy === c.id ? "…" : "Enregistrer"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => { setEditing(c.id); setEditTitle(c.title); setEditType(c.type ?? "article"); }}>
                                Éditer
                              </Button>
                              <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => patch(c.id, { archived: !c.archived }, c.archived ? "Catégorie réactivée" : "Catégorie archivée")}>
                                {c.archived ? "Réactiver" : "Archiver"}
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === c.id} onClick={() => remove(c.id)}>
                                Supprimer
                              </Button>
                            </>
                          )}
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
