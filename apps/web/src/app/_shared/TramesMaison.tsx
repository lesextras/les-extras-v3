"use client";

/**
 * MES TRAMES — apprendre à LEX la mise en forme de la maison.
 *
 * Chaque MECS, chaque IME a ses intitulés, son ordre, ses formules, imposés
 * par la direction, par l'ASE ou par le juge. Un assistant qui rend un texte
 * dans SA structure oblige à tout reprendre pour le faire rentrer dans le
 * modèle : autant écrire directement. Cet écran supprime cette friction — on
 * dépose un écrit déjà rendu, LEX en apprend la forme, et tous les documents
 * suivants sortent dans cette forme-là.
 *
 * Ce qui est appris est une FORME, pas un contenu : les noms sont masqués
 * avant analyse, et ce qui est conservé tient en quelques lignes d'intitulés.
 * Le texte de l'écran le dit, parce qu'un professionnel qui dépose le rapport
 * d'un enfant a le droit de savoir exactement ce qu'on en fait.
 */
import * as React from "react";
import {
  BookOpen,
  Building2,
  Check,
  FileUp,
  Loader2,
  Lock,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export interface TrameMaison {
  id: string;
  nom: string;
  genre: string | null;
  portee: "PERSONNELLE" | "ETABLISSEMENT";
  squelette: string;
  style: string;
  usages: number;
  authorId: string;
  createdAt: string;
  author?: { id: string; firstName?: string | null; lastName?: string | null } | null;
}

const EXTENSIONS = ".docx,.pdf,.txt,.md";

export function TramesMaisonPanel({
  trames,
  onChange,
  peutPublier,
  genres,
}: {
  trames: TrameMaison[];
  onChange: () => void;
  /** Publier pour toute l'équipe est réservé aux responsables. */
  peutPublier: boolean;
  genres: { id: string; titre: string }[];
}) {
  const { toast } = useToast();
  const [ouvert, setOuvert] = React.useState(false);
  const [nom, setNom] = React.useState("");
  const [genre, setGenre] = React.useState("");
  const [pourEquipe, setPourEquipe] = React.useState(false);
  const [fichier, setFichier] = React.useState<File | null>(null);
  const [texte, setTexte] = React.useState("");
  const [enCours, setEnCours] = React.useState(false);

  async function importer(e: React.FormEvent) {
    e.preventDefault();
    if (!fichier && texte.trim().length < 120) {
      toast({
        title: "Il manque le modèle",
        description: "Déposez un document, ou collez au moins un paragraphe de votre trame.",
        variant: "error",
      });
      return;
    }
    setEnCours(true);
    const corps = new FormData();
    corps.append("nom", nom.trim() || fichier?.name.replace(/\.[^.]+$/, "") || "Ma trame");
    if (genre) corps.append("genre", genre);
    if (pourEquipe) corps.append("portee", "ETABLISSEMENT");
    if (fichier) corps.append("fichier", fichier);
    else corps.append("texte", texte.trim());

    try {
      // Pas de Content-Type posé à la main : le navigateur ajoute la frontière
      // multipart, et l'écraser casserait l'envoi.
      const res = await fetch("/api/proxy/assistant/trames-maison", {
        method: "POST",
        body: corps,
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(
          Array.isArray(d.message) ? d.message[0] : (d.message ?? "Import impossible"),
        );
      }
      const r = (await res.json()) as { sourceConservee: boolean };
      toast({
        title: "Trame apprise ✅",
        description: r.sourceConservee
          ? "Elle est disponible dans vos écrits. Le document d'origine est conservé dans votre espace."
          : "Elle est disponible dans vos écrits.",
        variant: "success",
      });
      setNom("");
      setGenre("");
      setPourEquipe(false);
      setFichier(null);
      setTexte("");
      setOuvert(false);
      onChange();
    } catch (err) {
      toast({
        title: "Import impossible",
        description: (err as Error).message,
        variant: "error",
      });
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(t: TrameMaison) {
    if (!window.confirm(`Supprimer la trame « ${t.nom} » ? Le modèle d'origine sera supprimé aussi.`)) {
      return;
    }
    await fetch(`/api/proxy/assistant/trames-maison/${t.id}`, { method: "DELETE" }).catch(
      () => undefined,
    );
    onChange();
  }

  async function basculerPortee(t: TrameMaison) {
    await fetch(`/api/proxy/assistant/trames-maison/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portee: t.portee === "ETABLISSEMENT" ? "PERSONNELLE" : "ETABLISSEMENT",
      }),
    }).catch(() => undefined);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Mes trames</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Déposez un écrit que vous avez déjà rendu : LEX en apprend la forme — vos intitulés,
            leur ordre, votre ton — et rédigera vos prochains documents dedans. Les noms sont
            masqués avant l&apos;analyse ; ce qui est conservé, c&apos;est la structure, pas la
            situation.
          </p>
        </div>
        <Button variant={ouvert ? "ghost" : "outline"} onClick={() => setOuvert((o) => !o)}>
          <FileUp className="size-4" />
          {ouvert ? "Annuler" : "Apprendre une trame"}
        </Button>
      </div>

      {ouvert ? (
        <form
          onSubmit={importer}
          className="space-y-4 rounded-xl border border-primary/30 bg-primary-soft/20 p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-foreground">Nom de la trame</span>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Rapport de situation — modèle MECS"
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-foreground">Type d&apos;écrit concerné</span>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">— Tous les écrits —</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.titre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Votre modèle</span>
            <input
              type="file"
              accept={EXTENSIONS}
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Word ou PDF, 10 Mo maximum. Un PDF scanné est une image : dans ce cas, copiez le
              texte et collez-le ci-dessous — le résultat est le même.
            </p>
            {!fichier ? (
              <textarea
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                rows={5}
                placeholder="…ou collez ici le texte de votre modèle."
                className="w-full rounded-lg border border-input bg-background p-3 text-sm"
              />
            ) : null}
          </div>

          {peutPublier ? (
            <label className="flex items-start gap-2 rounded-lg border border-border bg-background/70 p-3 text-sm">
              <input
                type="checkbox"
                checked={pourEquipe}
                onChange={(e) => setPourEquipe(e.target.checked)}
                className="mt-0.5 size-4 rounded border-input accent-primary"
              />
              <span>
                <span className="font-medium text-foreground">
                  Publier cette trame pour toute l&apos;équipe
                </span>
                <span className="block text-xs text-muted-foreground">
                  Tous les membres de l&apos;établissement pourront l&apos;utiliser. C&apos;est le
                  moyen d&apos;obtenir des écrits homogènes sans avoir à les reprendre un par un.
                </span>
              </span>
            </label>
          ) : null}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={enCours}>
              {enCours ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
              {enCours ? "Analyse du modèle…" : "Apprendre cette trame"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Gratuit — aucun crédit consommé.
            </span>
          </div>
        </form>
      ) : null}

      {trames.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Aucune trame apprise pour l&apos;instant. Vos écrits utilisent la structure standard.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {trames.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                  {t.portee === "ETABLISSEMENT" ? (
                    <Users className="size-4 shrink-0 text-primary" />
                  ) : (
                    <Lock className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  {t.nom}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.portee === "ETABLISSEMENT" ? "Publiée pour l'équipe" : "Visible de vous seul·e"}
                  {t.usages > 0 ? ` · ${t.usages} écrit${t.usages > 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {peutPublier ? (
                  <button
                    type="button"
                    onClick={() => basculerPortee(t)}
                    title={
                      t.portee === "ETABLISSEMENT"
                        ? "Retirer de l'équipe"
                        : "Publier pour toute l'équipe"
                    }
                    aria-label={
                      t.portee === "ETABLISSEMENT"
                        ? `Retirer ${t.nom} de l'équipe`
                        : `Publier ${t.nom} pour l'équipe`
                    }
                    className={cn(
                      "rounded-lg p-2 transition-colors hover:bg-accent",
                      t.portee === "ETABLISSEMENT" ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Building2 className="size-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => supprimer(t)}
                  aria-label={`Supprimer ${t.nom}`}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Sélecteur de mise en forme, affiché au moment d'écrire. */
export function ChoixTrameMaison({
  trames,
  valeur,
  onChange,
}: {
  trames: TrameMaison[];
  valeur: string;
  onChange: (id: string) => void;
}) {
  if (trames.length === 0) return null;
  return (
    <label className="block rounded-xl border border-border bg-muted/30 p-4 text-sm">
      <span className="font-medium text-foreground">Mise en forme</span>
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="">Structure standard Les Extras</option>
        {trames.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nom}
            {t.portee === "ETABLISSEMENT" ? " (équipe)" : ""}
          </option>
        ))}
      </select>
      <span className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5 text-primary" />
        {valeur
          ? "Le document reprendra vos intitulés, dans votre ordre."
          : "Vos trames apprises apparaissent ici."}
      </span>
    </label>
  );
}
