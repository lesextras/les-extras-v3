"use client";

// Boîte à idées — chaque compte peut proposer une amélioration et voter pour
// celles des autres. Le vote est une bascule (un utilisateur = une voix).
// L'arbitrage (statut + réponse publique) n'est visible que pour l'équipe.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";
import { Input } from "@/components/ui/input";

export type IdeaStatus = "NEW" | "REVIEWING" | "PLANNED" | "DONE" | "DECLINED";

export interface IdeaItem {
  id: string;
  title: string;
  content: string;
  status: IdeaStatus;
  reply?: string | null;
  auteur: string;
  votes: number;
  aVote: boolean;
  createdAt: string;
}

const STATUTS: Record<IdeaStatus, { label: string; variant: BadgeVariant }> = {
  NEW: { label: "Nouvelle", variant: "secondary" },
  REVIEWING: { label: "À l'étude", variant: "warning" },
  PLANNED: { label: "Retenue — au programme", variant: "default" },
  DONE: { label: "Livrée", variant: "success" },
  DECLINED: { label: "Écartée", variant: "muted" },
};

export function IdeaBox({
  idees,
  accountId,
  estAdmin,
}: {
  idees: IdeaItem[];
  accountId: string;
  estAdmin: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);

  async function proposer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (titre.trim().length < 4 || contenu.trim().length < 10) {
      toast({
        title: "Idée incomplète",
        description:
          "Il faut un titre d'au moins 4 caractères et une explication d'au moins 10 caractères.",
        variant: "error",
      });
      return;
    }
    setEnvoi(true);
    try {
      await apiRequest("/community/idees", {
        method: "POST",
        body: { title: titre.trim(), content: contenu.trim() },
        accountId,
      });
      setTitre("");
      setContenu("");
      toast({
        title: "Idée déposée",
        description: "Elle est visible par la communauté et peut recueillir des votes.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Dépôt impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  async function voter(id: string) {
    setEnCours(id);
    try {
      await apiRequest(`/community/idees/${id}/vote`, { method: "POST", accountId });
      router.refresh();
    } catch (err) {
      toast({
        title: "Vote impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnCours(null);
    }
  }

  async function arbitrer(id: string, status: IdeaStatus) {
    setEnCours(id);
    try {
      await apiRequest(`/community/idees/${id}`, {
        method: "PATCH",
        body: { status },
        accountId,
      });
      toast({ title: "Statut mis à jour" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Mise à jour impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-semibold">Proposer une amélioration</h2>
              <p className="text-sm text-muted-foreground">
                Un manque, une friction, une idée de fonctionnalité : dites-le ici plutôt que par
                mail. Les idées les plus votées passent en priorité, et une idée retenue rapporte
                40 points à son auteur.
              </p>
            </div>
          </div>
          <form onSubmit={proposer} className="space-y-4">
            <Field label="Titre" htmlFor="idee-titre">
              <Input
                id="idee-titre"
                value={titre}
                maxLength={120}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex. Alerte SMS quand une mission urgente reste sans candidat"
              />
            </Field>
            <Field
              label="Expliquez le besoin"
              htmlFor="idee-contenu"
              hint="Décrivez la situation concrète : à quel moment ça vous bloque, et ce que vous faites aujourd'hui pour contourner."
            >
              <Textarea
                id="idee-contenu"
                rows={4}
                value={contenu}
                maxLength={2000}
                onChange={(e) => setContenu(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={envoi}>
              {envoi ? "Envoi…" : "Déposer mon idée"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {idees.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucune idée pour l&apos;instant — la vôtre sera la première.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {idees.map((idee) => {
            const statut = STATUTS[idee.status] ?? STATUTS.NEW;
            return (
              <li key={idee.id}>
                <Card>
                  <CardContent className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => voter(idee.id)}
                      disabled={enCours === idee.id}
                      aria-pressed={idee.aVote}
                      aria-label={
                        idee.aVote
                          ? `Retirer mon vote pour « ${idee.title} »`
                          : `Voter pour « ${idee.title} »`
                      }
                      className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border transition ${
                        idee.aVote
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden />
                      <span className="text-sm font-semibold tabular-nums">{idee.votes}</span>
                    </button>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{idee.title}</h3>
                        <Badge variant={statut.variant}>{statut.label}</Badge>
                      </div>
                      <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {idee.content}
                      </p>
                      {idee.reply ? (
                        <p className="rounded-md border-l-2 border-primary bg-muted/40 p-3 text-sm">
                          <span className="font-medium">Réponse de l&apos;équipe : </span>
                          {idee.reply}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">Proposée par {idee.auteur}</p>
                      {estAdmin ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(["REVIEWING", "PLANNED", "DONE", "DECLINED"] as IdeaStatus[]).map(
                            (s) => (
                              <Button
                                key={s}
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={enCours === idee.id || idee.status === s}
                                onClick={() => arbitrer(idee.id, s)}
                              >
                                {STATUTS[s].label}
                              </Button>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
