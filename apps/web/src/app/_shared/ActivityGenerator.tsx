"use client";

// Générateur d'activités éducatives & thérapeutiques : le professionnel
// décrit le public et les besoins, l'IA propose deux activités structurées.
// Les textes saisis sont pseudonymisés côté serveur avant tout traitement.
import * as React from "react";
import { Lightbulb, Loader2, Copy, Check, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RichText } from "./RichText";
import { useToast } from "@/components/ui/use-toast";
import { LexTravaille } from "./LexTravaille";

export function ActivityGenerator() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [resultat, setResultat] = React.useState<string | null>(null);
  const [protection, setProtection] = React.useState<string | null>(null);
  const [copie, setCopie] = React.useState(false);

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
      const r = await apiRequest<{ activite: string; protection?: string }>("/assistant/activite", {
        method: "POST",
        body: {
          publicCible: String(fd.get("publicCible") || ""),
          besoins: String(fd.get("besoins") || ""),
          objectifs: String(fd.get("objectifs") || "") || undefined,
          duree: String(fd.get("duree") || "") || undefined,
          effectif: String(fd.get("effectif") || "") || undefined,
          contraintes: String(fd.get("contraintes") || "") || undefined,
        },
      });
      setResultat(r.activite);
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
          <label htmlFor="publicCible" className="text-sm font-medium">Public concerné *</label>
          <input id="publicCible" name="publicCible" required minLength={3}
            placeholder="Ex : adolescents 12-16 ans en MECS"
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        </div>
        <div>
          <label htmlFor="besoins" className="text-sm font-medium">Besoins, difficultés ou troubles à travailler *</label>
          <textarea id="besoins" name="besoins" required minLength={10} rows={4}
            placeholder="Ex : gestion de la colère, faible estime de soi, difficultés à verbaliser les émotions, tensions dans le groupe…"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
          <p className="mt-1 text-xs text-muted-foreground">
            Décrivez la situation avec vos mots. Les noms éventuels sont masqués avant tout traitement.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="duree" className="text-sm font-medium">Durée disponible</label>
            <input id="duree" name="duree" placeholder="Ex : 1 h 30"
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
          </div>
          <div>
            <label htmlFor="effectif" className="text-sm font-medium">Effectif</label>
            <input id="effectif" name="effectif" placeholder="Ex : 6 jeunes"
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
          </div>
        </div>
        <div>
          <label htmlFor="objectifs" className="text-sm font-medium">Objectifs souhaités</label>
          <input id="objectifs" name="objectifs" placeholder="Ex : cohésion du groupe, canaliser l'énergie"
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        </div>
        <div>
          <label htmlFor="contraintes" className="text-sm font-medium">Contraintes (lieu, matériel, budget)</label>
          <input id="contraintes" name="contraintes" placeholder="Ex : salle commune, peu de matériel"
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Lightbulb className="size-4" />}
          {loading ? "Conception en cours…" : "Proposer des activités"}
        </Button>
      </form>

      <div className="min-h-[300px]">
        {/* Pendant la conception, le panneau d'attente prend la place du vide :
            un cadre gris de 300 px de haut ne dit pas qu'il se passe quelque
            chose. Les étapes sont celles de la génération d'activité. */}
        {loading ? (
          <LexTravaille
            titre="LEX conçoit la séance…"
            etapes={[
              "Je lis le public et l'objectif",
              "Je cherche des activités qui tiennent debout",
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
                Décrivez votre groupe et ce que vous voulez travailler : vous recevrez deux
                propositions d'activités structurées (déroulé, matériel, points de vigilance),
                à valider en équipe avant mise en œuvre.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
