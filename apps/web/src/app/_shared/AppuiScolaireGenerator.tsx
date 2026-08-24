"use client";

// Appui scolaire : le professionnel décrit un enfant qui coince, LEX rend un
// support utilisable tout de suite avec lui. Aucun diagnostic, jamais.
// Les textes saisis sont pseudonymisés côté serveur avant tout traitement.
import * as React from "react";
import { Lightbulb, Loader2, Copy, Check, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RichText } from "./RichText";
import { useToast } from "@/components/ui/use-toast";
import { LexTravaille } from "./LexTravaille";
import { ChoixLex, useCatalogueLex } from "./ChoixLex";

export function AppuiScolaireGenerator() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [resultat, setResultat] = React.useState<string | null>(null);
  const [protection, setProtection] = React.useState<string | null>(null);
  const [copie, setCopie] = React.useState(false);
  const groupes = useCatalogueLex("appui");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setResultat(null);
    const minuteur = setTimeout(() => {
      toast({
        title: "C'est un peu long…",
        description: "LEX rédige encore. Laissez la page ouverte quelques secondes de plus.",
      });
    }, 20_000);
    try {
      const r = await apiRequest<{ support: string; protection?: string }>(
        "/assistant/appui-scolaire",
        {
          method: "POST",
          body: {
            niveau: String(fd.get("niveau") || ""),
            matiere: String(fd.get("matiere") || ""),
            difficulte: String(fd.get("difficulte") || ""),
            temps: String(fd.get("temps") || "") || undefined,
            moyens: String(fd.get("moyens") || "") || undefined,
            // Cases cochées : le formulaire les rend telles quelles.
            supports: fd.getAll("supports").map(String),
            obstacles: fd.getAll("obstacles").map(String),
            posture: String(fd.get("posture") || "") || undefined,
          },
        },
      );
      setResultat(r.support);
      setProtection(r.protection ?? null);
    } catch (err) {
      toast({
        title: "Génération impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      clearTimeout(minuteur);
      setLoading(false);
    }
  }

  async function copier() {
    if (!resultat) return;
    await navigator.clipboard.writeText(resultat);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div>
          <label htmlFor="niveau" className="text-sm font-medium">Âge ou classe *</label>
          <input id="niveau" name="niveau" required minLength={2} placeholder="Ex : CM1, 9 ans"
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        </div>
        <div>
          <label htmlFor="matiere" className="text-sm font-medium">Matière ou domaine *</label>
          <input id="matiere" name="matiere" required minLength={2} placeholder="Ex : lecture, tables de multiplication"
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        </div>
        <div>
          <label htmlFor="difficulte" className="text-sm font-medium">Ce que vous observez *</label>
          <textarea id="difficulte" name="difficulte" required minLength={10} rows={4}
            placeholder="Ex : il commence, se décourage au bout de deux lignes et range son cahier"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
          <p className="mt-1 text-xs text-muted-foreground">
            Décrivez ce que vous voyez, pas ce que vous en concluez. LEX ne pose aucun diagnostic.
          </p>
        </div>
        <div>
          <label htmlFor="temps" className="text-sm font-medium">Temps disponible</label>
          <input id="temps" name="temps" placeholder="Ex : 20 minutes après l'étude"
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        </div>
        <div>
          <label htmlFor="moyens" className="text-sm font-medium">Moyens sur place</label>
          <input id="moyens" name="moyens" placeholder="Ex : papier, crayons, pas d'imprimante couleur"
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        </div>
        <ChoixLex groupes={groupes} />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Lightbulb className="size-4" />}
          {loading ? "Préparation en cours…" : "Préparer le support"}
        </Button>
      </form>

      <div className="min-h-[300px]">
        {/* Pendant la conception, le panneau d'attente prend la place du vide :
            un cadre gris de 300 px de haut ne dit pas qu'il se passe quelque
            chose. Les étapes sont celles de la préparation du support. */}
        {loading ? (
          <LexTravaille
            titre="LEX conçoit la séance…"
            etapes={[
              "Je lis le public et l'objectif",
              "Je cherche un support qui tienne debout",
              "Je pose le déroulé et le matériel",
              "J'ajoute les points de vigilance",
            ]}
          />
        ) : resultat ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              {protection ? (
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-primary" />
                  {protection}
                </p>
              ) : <span />}
              <Button type="button" variant="outline" size="sm" onClick={copier}>
                {copie ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copie ? "Copié" : "Copier"}
              </Button>
            </div>
            {/* Le générateur répond en Markdown (titres, listes) : on le rend
                mis en forme plutôt qu'avec les symboles bruts. */}
            <div className="text-[15px] leading-relaxed text-foreground">
              <RichText value={resultat} />
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-[300px] place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div>
              <Lightbulb className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Dites l’âge, la matière et ce que vous observez : vous recevrez un support prêt
                à poser sur la table — comment l’amener, quoi faire si ça bloque, et à quoi voir
                que ça a marché.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
