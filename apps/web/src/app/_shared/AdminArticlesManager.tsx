"use client";

// CRUD Articles (back-office ADMIN) — contenu / actualités.
//   GET/POST/PATCH/DELETE /admin/articles
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
import { formatDate } from "./format";

export interface AdminArticle {
  id: string;
  title: string;
  excerpt?: string | null;
  status: string;
  createdAt: string;
  category?: { id: string; title: string } | null;
  author?: { firstName?: string | null; lastName?: string | null; email?: string } | null;
}
interface CategoryOption { id: string; title: string }

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export function AdminArticlesManager({
  articles,
  categories,
}: {
  articles: AdminArticle[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [busy, setBusy] = useState<string | null>(null);

  async function create() {
    if (!title.trim()) {
      toast({ title: "Le titre est requis", variant: "error" });
      return;
    }
    setBusy("create");
    try {
      await apiRequest("/admin/articles", {
        method: "POST",
        body: { title: title.trim(), excerpt: excerpt || undefined, categoryId: categoryId || undefined, status },
      });
      toast({ title: "Article créé" });
      setTitle("");
      setExcerpt("");
      setCategoryId("");
      setStatus("DRAFT");
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
      await apiRequest(`/admin/articles/${id}`, { method: "PATCH", body });
      toast({ title: label });
      router.refresh();
    } catch (err) {
      toast({ title: "Modification impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Supprimer définitivement cet article ? Cette action est irréversible.")) return;
    setBusy(id);
    try {
      await apiRequest(`/admin/articles/${id}`, { method: "DELETE" });
      toast({ title: "Article supprimé" });
      router.refresh();
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium text-foreground">Nouvel article</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
            <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Accroche (optionnel)" />
            <Select value={categoryId || "__none"} onValueChange={(v) => setCategoryId(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Sans catégorie</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={create} disabled={busy === "create"}>
              {busy === "create" ? "…" : "Ajouter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {articles.length === 0 ? (
        <EmptyState title="Aucun article" description="Créez votre premier article ci-dessus." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                          {a.excerpt ? (
                            <p className="truncate text-xs text-muted-foreground">{a.excerpt}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.category?.title ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "PUBLISHED" ? "success" : "outline"}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(a.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {a.status === "PUBLISHED" ? (
                            <Button size="sm" variant="ghost" disabled={busy === a.id} onClick={() => patch(a.id, { status: "DRAFT" }, "Article dépublié")}>
                              Dépublier
                            </Button>
                          ) : (
                            <Button size="sm" disabled={busy === a.id} onClick={() => patch(a.id, { status: "PUBLISHED" }, "Article publié")}>
                              Publier
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === a.id} onClick={() => remove(a.id)}>
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
    </div>
  );
}
