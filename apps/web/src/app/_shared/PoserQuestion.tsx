"use client";

// Dépôt d'une situation dans le GAP. Le parti pris : ce n'est pas un sujet
// qu'on dépose, c'est une situation. Les champs l'imposent — contexte
// obligatoire, « ce qui a été tenté » fortement suggéré, métier et public en
// listes fermées (c'est ce qui permet aux bons collègues de vous retrouver).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";
import { METIERS, PUBLICS } from "./gap";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

/** Situation existante : le même formulaire sert à corriger ce qu'on a déposé. */
export interface SituationAModifier {
  id: string;
  title: string;
  situation: string;
  tente?: string | null;
  metier: string;
  publicVise: string;
}

export function PoserQuestion({
  accountId,
  metierParDefaut,
  aModifier,
}: {
  accountId: string;
  metierParDefaut?: string;
  /** Fournie : le formulaire passe en correction au lieu de création. */
  aModifier?: SituationAModifier;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const modification = Boolean(aModifier);
  const [titre, setTitre] = useState(aModifier?.title ?? "");
  const [situation, setSituation] = useState(aModifier?.situation ?? "");
  const [tente, setTente] = useState(aModifier?.tente ?? "");
  const [metier, setMetier] = useState(
    aModifier?.metier ??
      (metierParDefaut && METIERS.includes(metierParDefaut) ? metierParDefaut : ""),
  );
  const [publicVise, setPublicVise] = useState(aModifier?.publicVise ?? "");
  const [anonyme, setAnonyme] = useState(true);
  const [piege, setPiege] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (titre.trim().length < 10) {
      toast({
        title: "Titre trop court",
        description: "Formulez-le comme une situation : « Comment faites-vous quand… »",
        variant: "error",
      });
      return;
    }
    if (situation.trim().length < 30) {
      toast({
        title: "Situation trop courte",
        description: "Décrivez ce qui se passe, depuis quand, avec qui. C'est ce qui appelle des réponses utiles.",
        variant: "error",
      });
      return;
    }
    if (!metier || !publicVise) {
      toast({
        title: "Métier et public requis",
        description: "Ce sont les deux filtres qui permettront aux bons collègues de vous trouver.",
        variant: "error",
      });
      return;
    }
    setEnvoi(true);
    try {
      const corps = {
        title: titre.trim(),
        situation: situation.trim(),
        tente: tente.trim() || undefined,
        metier,
        publicVise,
      };
      const r = aModifier
        ? await apiRequest<{ id: string }>(`/gap/${aModifier.id}`, {
            method: "PATCH",
            body: corps,
            accountId,
          })
        : await apiRequest<{ id: string }>("/gap", {
            method: "POST",
            body: { ...corps, anonyme, ...(piege ? { website: piege } : {}) },
            accountId,
          });
      toast({
        title: aModifier ? "Situation corrigée" : "Situation déposée",
        description: aModifier
          ? "Votre texte est à jour. Les prénoms restent masqués automatiquement."
          : "Les professionnels de votre métier la verront dans leur fil.",
      });
      router.push(`/gap/${aModifier?.id ?? r.id}`);
      router.refresh();
    } catch (err) {
      toast({
        title: aModifier ? "Correction impossible" : "Publication impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <Field
            label="Votre situation, en une phrase"
            htmlFor="titre"
            hint="Une situation, pas un thème. « Comment vous faites quand… » plutôt que « la gestion des émotions »."
          >
            <Input
              id="titre"
              value={titre}
              maxLength={180}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Comment vous faites quand un jeune refuse toute activité collective depuis des semaines ?"
            />
          </Field>

          <Field
            label="Ce qui se passe"
            htmlFor="situation"
            hint="Depuis quand, dans quel contexte, avec qui. Plus c'est concret, plus les réponses le seront."
          >
            <Textarea
              id="situation"
              rows={6}
              value={situation}
              maxLength={4000}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Sur notre unité d'adolescents, un jeune de 15 ans arrivé il y a trois mois refuse systématiquement…"
            />
          </Field>

          <Field
            label="Ce que vous avez déjà tenté"
            htmlFor="tente"
            hint="Facultatif mais précieux : ça évite qu'on vous propose ce que vous avez déjà essayé."
          >
            <Textarea
              id="tente"
              rows={4}
              value={tente}
              maxLength={2000}
              onChange={(e) => setTente(e.target.value)}
              placeholder="Entretien individuel, proposition d'activité en petit comité, association de sa référente…"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Votre métier" htmlFor="metier">
              <select
                id="metier"
                value={metier}
                onChange={(e) => setMetier(e.target.value)}
                className={selectClass}
              >
                <option value="">Choisir…</option>
                {METIERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Public accompagné" htmlFor="public">
              <select
                id="public"
                value={publicVise}
                onChange={(e) => setPublicVise(e.target.value)}
                className={selectClass}
              >
                <option value="">Choisir…</option>
                {PUBLICS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
            <input
              type="checkbox"
              checked={anonyme}
              onChange={(e) => setAnonyme(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-input accent-[hsl(var(--primary))]"
            />
            <span className="text-sm">
              <span className="font-medium">Publier sous pseudonyme</span>
              <span className="block text-muted-foreground">
                Votre situation apparaîtra signée « Un·e{" "}
                {metier ? metier.toLowerCase() : "professionnel·le"} ». C&apos;est le mode par
                défaut du GAP : on parle de personnes réelles, et l&apos;anonymat est ce qui
                permet de parler vraiment.
              </span>
            </span>
          </label>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
            Les prénoms et coordonnées que vous citez sont remplacés automatiquement avant
            l&apos;enregistrement. Ils ne sont stockés nulle part en clair, et personne ne pourra
            les retrouver.
          </p>
        </CardContent>
      </Card>

      <input
        type="text"
        value={piege}
        onChange={(e) => setPiege(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={envoi} size="lg">
          {envoi
            ? modification
              ? "Enregistrement…"
              : "Dépôt…"
            : modification
              ? "Enregistrer les corrections"
              : "Déposer ma situation"}
        </Button>
        {modification ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push(`/gap/${aModifier!.id}`)}
          >
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
