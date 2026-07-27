"use client";

// Espace de rédaction des actualités : écrire, publier, partager sur LinkedIn.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import {
  Linkedin, Eye, Trash2, Pencil, Bold, Italic, Heading2, List, Quote, Link2, ImagePlus,
} from "lucide-react";
import { formatDate } from "./format";

export interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  coverUrl?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;
  views?: number | null;
  linkedinSharedAt?: string | null;
}

export interface LinkedinStatus {
  configured: boolean;
  connected: boolean;
  name?: string | null;
}

const LIBELLE: Record<ArticleRow["status"], string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  ARCHIVED: "Archivée",
};

export function ArticlesManager({
  initial,
  linkedin,
  accountId,
}: {
  initial: ArticleRow[];
  linkedin: LinkedinStatus;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState(initial);
  const [edite, setEdite] = useState<ArticleRow | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [depot, setDepot] = useState(false);
  const zoneRef = useRef<HTMLTextAreaElement>(null);
  const fichierRef = useRef<HTMLInputElement>(null);

  /** Insère du texte autour de la sélection courante. */
  function entourer(avant: string, apres: string) {
    const z = zoneRef.current;
    if (!z || !edite) return;
    const { selectionStart: d, selectionEnd: f, value } = z;
    const nouveau = value.slice(0, d) + avant + value.slice(d, f) + apres + value.slice(f);
    setEdite({ ...edite, content: nouveau });
    requestAnimationFrame(() => {
      z.focus();
      z.setSelectionRange(d + avant.length, f + avant.length);
    });
  }

  /** Préfixe la ligne courante (intertitre, liste, citation). */
  function prefixer(marque: string) {
    const z = zoneRef.current;
    if (!z || !edite) return;
    const { selectionStart: d, value } = z;
    const debutLigne = value.lastIndexOf("\n", d - 1) + 1;
    const nouveau = value.slice(0, debutLigne) + marque + value.slice(debutLigne);
    setEdite({ ...edite, content: nouveau });
    requestAnimationFrame(() => {
      z.focus();
      z.setSelectionRange(d + marque.length, d + marque.length);
    });
  }

  /** Dépose l'image dans le stockage privé et insère sa référence publique. */
  async function deposerImage(fichier: File) {
    if (!edite) return;
    setDepot(true);
    try {
      const form = new FormData();
      form.append("file", fichier);
      const res = await fetch("/api/proxy/files/article", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Envoi refusé");
      const { id } = (await res.json()) as { id: string };
      const url = `/api/proxy/public/images/${id}`;
      const z = zoneRef.current;
      const pos = z?.selectionStart ?? (edite.content ?? "").length;
      const v = edite.content ?? "";
      const balise = `\n![${fichier.name.replace(/\.[^.]+$/, "")}](${url})\n`;
      setEdite({ ...edite, content: v.slice(0, pos) + balise + v.slice(pos) });
      toast({ title: "Image ajoutée" });
    } catch (e) {
      toast({ title: "Image refusée", description: (e as Error).message });
    } finally {
      setDepot(false);
    }
  }

  const vide: ArticleRow = {
    id: "", title: "", slug: "", excerpt: "", content: "", coverUrl: "", status: "DRAFT",
  };

  async function enregistrer(publier: boolean) {
    if (!edite) return;
    setEnvoi(true);
    try {
      const corps = {
        title: edite.title,
        excerpt: edite.excerpt || undefined,
        content: edite.content ?? "",
        coverUrl: edite.coverUrl || undefined,
        status: publier ? "PUBLISHED" : edite.status,
      };
      const r = await apiRequest<ArticleRow>(
        edite.id ? `/articles/${edite.id}` : "/articles",
        { method: edite.id ? "PATCH" : "POST", body: corps, accountId },
      );
      setRows((l) => (edite.id ? l.map((x) => (x.id === r.id ? { ...x, ...r } : x)) : [r, ...l]));
      setOuvert(false);
      setEdite(null);
      toast({ title: publier ? "Actualité publiée" : "Brouillon enregistré" });
      router.refresh();
    } catch (e) {
      toast({ title: "Enregistrement impossible", description: (e as Error).message });
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(id: string) {
    try {
      await apiRequest(`/articles/${id}`, { method: "DELETE", accountId });
      setRows((l) => l.filter((x) => x.id !== id));
      toast({ title: "Actualité supprimée" });
    } catch (e) {
      toast({ title: "Suppression impossible", description: (e as Error).message });
    }
  }

  async function connecterLinkedin() {
    try {
      const { url } = await apiRequest<{ url: string }>("/articles/linkedin/authorize");
      window.location.href = url;
    } catch (e) {
      toast({ title: "LinkedIn indisponible", description: (e as Error).message });
    }
  }

  async function partager(a: ArticleRow) {
    try {
      const r = await apiRequest<{ url: string }>(`/articles/${a.id}/share`, {
        method: "POST",
        body: { network: "linkedin" },
        accountId,
      });
      setRows((l) =>
        l.map((x) => (x.id === a.id ? { ...x, linkedinSharedAt: new Date().toISOString() } : x)),
      );
      toast({ title: "Publié sur LinkedIn", description: r.url });
    } catch (e) {
      toast({ title: "Partage impossible", description: (e as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      {/* Connexion LinkedIn */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#0A66C2]/10 text-[#0A66C2]">
              <Linkedin className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">LinkedIn</p>
              <p className="text-xs text-muted-foreground">
                {!linkedin.configured
                  ? "Intégration pas encore activée par l’équipe Les Extras."
                  : linkedin.connected
                    ? `Connecté${linkedin.name ? ` — ${linkedin.name}` : ""}. Vos actualités peuvent être publiées sur votre profil.`
                    : "Connectez votre compte pour publier vos actualités sur votre profil en un clic."}
              </p>
            </div>
          </div>
          {linkedin.configured && !linkedin.connected ? (
            <Button onClick={connecterLinkedin} variant="outline" size="sm">
              Connecter LinkedIn
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEdite(vide);
            setOuvert(true);
          }}
        >
          Écrire une actualité
        </Button>
      </div>

      {/* Éditeur */}
      {ouvert && edite ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <Input
              placeholder="Titre de l’actualité"
              value={edite.title}
              onChange={(e) => setEdite({ ...edite, title: e.target.value })}
            />
            <Input
              placeholder="Chapô (une phrase de résumé, affichée dans le fil)"
              value={edite.excerpt ?? ""}
              onChange={(e) => setEdite({ ...edite, excerpt: e.target.value })}
            />
            <Input
              placeholder="URL de l’image de couverture (facultatif)"
              value={edite.coverUrl ?? ""}
              onChange={(e) => setEdite({ ...edite, coverUrl: e.target.value })}
            />
            <div className="rounded-lg border border-input">
              <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/40 px-2 py-1.5">
                <Outil titre="Gras" onClick={() => entourer("**", "**")}><Bold className="size-4" /></Outil>
                <Outil titre="Italique" onClick={() => entourer("*", "*")}><Italic className="size-4" /></Outil>
                <Outil titre="Intertitre" onClick={() => prefixer("## ")}><Heading2 className="size-4" /></Outil>
                <Outil titre="Liste" onClick={() => prefixer("- ")}><List className="size-4" /></Outil>
                <Outil titre="Citation" onClick={() => prefixer("> ")}><Quote className="size-4" /></Outil>
                <Outil titre="Lien" onClick={() => entourer("[", "](https://)")}><Link2 className="size-4" /></Outil>
                <span className="mx-1 h-5 w-px bg-border" aria-hidden />
                <Outil titre="Insérer une image" onClick={() => fichierRef.current?.click()}>
                  <ImagePlus className="size-4" />
                  <span className="ml-1 text-xs">{depot ? "Envoi…" : "Image"}</span>
                </Outil>
                <input
                  ref={fichierRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) deposerImage(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <Textarea
                ref={zoneRef}
                rows={16}
                placeholder="Votre texte… **gras**, *italique*, ## intertitre, - liste"
                className="rounded-none border-0 focus-visible:ring-0"
                value={edite.content ?? ""}
                onChange={(e) => setEdite({ ...edite, content: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Mise en forme simple : <b>**gras**</b>, <i>*italique*</i>, <code>## intertitre</code>,{" "}
              <code>- liste</code>, <code>&gt; citation</code>. Les images sont insérées dans le texte
              à l’endroit du curseur.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => { setOuvert(false); setEdite(null); }}>
                Annuler
              </Button>
              <Button variant="outline" disabled={envoi} onClick={() => enregistrer(false)}>
                Enregistrer le brouillon
              </Button>
              <Button disabled={envoi} onClick={() => enregistrer(true)}>
                Publier
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Liste */}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune actualité pour le moment. Racontez une intervention réussie, un projet de service,
          une nouveauté — c’est ce qui vous rend visible.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={a.status === "PUBLISHED" ? "secondary" : "outline"}>
                      {LIBELLE[a.status]}
                    </Badge>
                    {a.linkedinSharedAt ? (
                      <Badge variant="soft" className="gap-1">
                        <Linkedin className="size-3" /> Partagée
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.publishedAt ? formatDate(a.publishedAt) : "Non publiée"}
                    {a.views ? ` · ${a.views} lectures` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status === "PUBLISHED" ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/edublog/${a.slug}`} target="_blank">
                        <Eye className="size-4" /> Voir
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEdite(a); setOuvert(true); }}
                  >
                    <Pencil className="size-4" /> Modifier
                  </Button>
                  {a.status === "PUBLISHED" && linkedin.connected ? (
                    <Button variant="outline" size="sm" onClick={() => partager(a)}>
                      <Linkedin className="size-4" /> Publier sur LinkedIn
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => supprimer(a.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Outil({
  titre,
  onClick,
  children,
}: {
  titre: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titre}
      aria-label={titre}
      onClick={onClick}
      className="inline-flex min-h-8 items-center rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}
