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

export type ArticleKind = "ACTUALITE" | "ARTICLE";

export interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  kind?: ArticleKind;
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

/** Ce que chaque rayon veut dire, en clair, au moment d'écrire. */
const RAYONS: { cle: ArticleKind; titre: string; aide: string }[] = [
  {
    cle: "ACTUALITE",
    titre: "Actualité",
    aide: "Une nouvelle, un temps fort, un retour de terrain. Court, daté, vivant.",
  },
  {
    cle: "ARTICLE",
    titre: "Article de fond",
    aide: "Une analyse, un guide, une méthode. Plus long, il reste utile des mois.",
  },
];

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
  const couvertureRef = useRef<HTMLInputElement>(null);
  const [depotCouverture, setDepotCouverture] = useState(false);

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

  /** Dépose l'image de couverture : on choisit un fichier, pas une adresse. */
  async function deposerCouverture(fichier: File) {
    if (!edite) return;
    setDepotCouverture(true);
    try {
      const form = new FormData();
      form.append("file", fichier);
      const res = await fetch("/api/proxy/files/article", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Envoi refusé");
      const { id } = (await res.json()) as { id: string };
      setEdite({ ...edite, coverUrl: `/api/proxy/public/images/${id}` });
      toast({ title: "Couverture ajoutée" });
    } catch (e) {
      toast({ title: "Image refusée", description: (e as Error).message });
    } finally {
      setDepotCouverture(false);
    }
  }

  const vide: ArticleRow = {
    id: "", title: "", slug: "", kind: "ACTUALITE", excerpt: "", content: "", coverUrl: "",
    status: "DRAFT",
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
        kind: edite.kind ?? "ACTUALITE",
        status: publier ? "PUBLISHED" : edite.status,
      };
      const r = await apiRequest<ArticleRow>(
        edite.id ? `/articles/${edite.id}` : "/articles",
        { method: edite.id ? "PATCH" : "POST", body: corps, accountId },
      );
      setRows((l) => (edite.id ? l.map((x) => (x.id === r.id ? { ...x, ...r } : x)) : [r, ...l]));
      setOuvert(false);
      setEdite(null);
      toast({
        title: publier
          ? edite.kind === "ARTICLE"
            ? "Article publié"
            : "Actualité publiée"
          : "Brouillon enregistré",
      });
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

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setEdite({ ...vide, kind: "ACTUALITE" });
            setOuvert(true);
          }}
        >
          Écrire une actualité
        </Button>
        <Button
          onClick={() => {
            setEdite({ ...vide, kind: "ARTICLE" });
            setOuvert(true);
          }}
        >
          Écrire un article
        </Button>
      </div>

      {/* Éditeur */}
      {ouvert && edite ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {RAYONS.map((r) => {
                const actif = (edite.kind ?? "ACTUALITE") === r.cle;
                return (
                  <button
                    key={r.cle}
                    type="button"
                    onClick={() => setEdite({ ...edite, kind: r.cle })}
                    aria-pressed={actif}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      actif
                        ? "border-primary bg-primary/10"
                        : "border-input hover:bg-accent/50"
                    }`}
                  >
                    <span className="block text-sm font-medium text-foreground">{r.titre}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{r.aide}</span>
                  </button>
                );
              })}
            </div>
            <Input
              placeholder={edite.kind === "ARTICLE" ? "Titre de l’article" : "Titre de l’actualité"}
              value={edite.title}
              onChange={(e) => setEdite({ ...edite, title: e.target.value })}
            />
            <Input
              placeholder="Chapô (une phrase de résumé, affichée dans le fil)"
              value={edite.excerpt ?? ""}
              onChange={(e) => setEdite({ ...edite, excerpt: e.target.value })}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Image de couverture <span className="font-normal text-muted-foreground">(facultative)</span>
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {edite.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={edite.coverUrl}
                    alt="Aperçu de la couverture"
                    className="h-20 w-32 rounded-md border border-input object-cover"
                  />
                ) : (
                  <span className="grid h-20 w-32 place-items-center rounded-md border border-dashed border-input text-xs text-muted-foreground">
                    Aucune image
                  </span>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={depotCouverture}
                    onClick={() => couvertureRef.current?.click()}
                  >
                    <ImagePlus className="size-4" />
                    {depotCouverture
                      ? "Envoi…"
                      : edite.coverUrl
                        ? "Changer l’image"
                        : "Télécharger une image"}
                  </Button>
                  {edite.coverUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEdite({ ...edite, coverUrl: "" })}
                    >
                      Retirer
                    </Button>
                  ) : null}
                </div>
                <input
                  ref={couvertureRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) deposerCouverture(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG ou WebP. Elle illustre votre publication dans le fil de l’Édublog.
              </p>
            </div>
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
          Rien de publié pour le moment. Une actualité pour raconter une intervention réussie ou un
          temps fort ; un article de fond pour partager une méthode qui marche — c’est ce qui vous
          rend visible.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="soft">
                      {a.kind === "ARTICLE" ? "Article de fond" : "Actualité"}
                    </Badge>
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
