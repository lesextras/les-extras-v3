"use client";

// LA MESSAGERIE INTERNE — 9/09/2026.
//
// ⚠ POURQUOI CET ÉCRAN EXISTE. Une personne inscrite qui butait sur quelque
// chose n'avait que le formulaire de contact public : elle re-saisissait son
// nom et son adresse, le message arrivait sans qu'on sache de quel compte il
// venait, et la réponse partait par courriel — hors de la plateforme, sans
// trace, introuvable trois jours plus tard. La plupart renonçaient.
//
// ⚠ LE FORMULAIRE EST OUVERT, PAS PLIÉ DERRIÈRE UN BOUTON. Quelqu'un qui vient
// ici a déjà un problème ; lui demander un clic de plus pour pouvoir le dire,
// c'est en perdre une partie à chaque clic.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

export interface FilAssistance {
  id: string;
  sujet: string;
  categorie: string;
  statut: string;
  dernierAt: string;
  createdAt: string;
  nonLu?: boolean;
  messages?: MessageAssistance[];
}

export interface MessageAssistance {
  id: string;
  corps: string;
  parEquipe: boolean;
  createdAt: string;
  auteur?: { id: string; firstName?: string | null; lastName?: string | null } | null;
}

export const CATEGORIES: { valeur: string; libelle: string }[] = [
  { valeur: "PROBLEME_TECHNIQUE", libelle: "Un problème technique" },
  { valeur: "QUESTION_COMPTE", libelle: "Mon compte" },
  { valeur: "RESERVATION", libelle: "Une réservation" },
  { valeur: "FACTURATION", libelle: "Facturation ou paiement" },
  { valeur: "FICHE_ATELIER", libelle: "Ma fiche, mon atelier" },
  { valeur: "AUTRE", libelle: "Autre chose" },
];

export const LIBELLE_STATUT: Record<string, string> = {
  OUVERT: "En attente de réponse",
  EN_COURS: "Réponse reçue",
  RESOLU: "Réglé",
};

export function libelleCategorie(valeur: string): string {
  return CATEGORIES.find((c) => c.valeur === valeur)?.libelle ?? "Autre chose";
}

export function quand(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** L'ouverture d'un fil, et la liste de ceux qui existent déjà. */
export function Assistance({
  fils,
  accountId,
  sujetInitial,
  categorieInitiale,
  placeholderSujet,
  indiceMessage,
}: {
  fils: FilAssistance[];
  accountId?: string;
  /** Pré-remplissages quand le fil est ouvert depuis un écran dédié : une
   *  demande d'intervenant n'est pas une question au support, et l'objet
   *  comme la catégorie sont déjà connus. */
  sujetInitial?: string;
  categorieInitiale?: string;
  placeholderSujet?: string;
  indiceMessage?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [sujet, setSujet] = useState(sujetInitial ?? "");
  const [categorie, setCategorie] = useState(categorieInitiale ?? "PROBLEME_TECHNIQUE");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (sujet.trim().length < 3 || message.trim().length < 10) {
      toast({
        variant: "error",
        title: "Il manque quelque chose",
        description: "Donnez un objet et décrivez votre demande en quelques mots.",
      });
      return;
    }
    setEnvoi(true);
    try {
      const cree = await apiRequest<{ id: string }>("/assistance", {
        method: "POST",
        body: { sujet: sujet.trim(), message: message.trim(), categorie },
        accountId,
      });
      toast({
        variant: "success",
        title: "Message envoyé",
        description: "Nous vous répondons ici même, et vous recevrez un e-mail.",
      });
      setSujet("");
      setMessage("");
      router.push(`/dashboard/aide/${cree.id}`);
      router.refresh();
    } catch (err) {
      toast({
        variant: "error",
        title: "Envoi impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
      });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={envoyer} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="De quoi s'agit-il ?" htmlFor="categorie">
                <select
                  id="categorie"
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.valeur} value={c.valeur}>
                      {c.libelle}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Objet" htmlFor="sujet">
                <Input
                  id="sujet"
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  placeholder={placeholderSujet ?? "Je n'arrive pas à publier mon atelier"}
                  maxLength={140}
                />
              </Field>
            </div>
            <Field
              label="Votre message"
              htmlFor="message"
              hint={indiceMessage ?? "Dites ce que vous avez fait et ce que vous avez vu : c'est ce qui nous fait gagner le plus de temps."}
            >
              <Textarea
                id="message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={5000}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={envoi}>
                <Send className="mr-2 size-4" aria-hidden />
                {envoi ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {fils.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Vos échanges</h2>
          {fils.map((f) => (
            <Link key={f.id} href={`/dashboard/aide/${f.id}`} className="block">
              <Card className="transition hover:border-primary/50">
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{f.sujet}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {libelleCategorie(f.categorie)} · {quand(f.dernierAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {f.nonLu ? <Badge>Nouveau</Badge> : null}
                    <Badge variant="outline">{LIBELLE_STATUT[f.statut] ?? f.statut}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="size-4" aria-hidden />
          Vous n&apos;avez encore écrit aucun message.
        </p>
      )}
    </div>
  );
}

/** Le fil, et le champ pour y répondre. Sert aux deux côtés. */
export function FilMessages({
  fil,
  chemin,
  accountId,
  cotePlateforme = false,
}: {
  fil: FilAssistance;
  /** Route de l'API où poster la réponse. */
  chemin: string;
  accountId?: string;
  /** Vrai côté association : change qui est « nous » dans l'affichage. */
  cotePlateforme?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [reponse, setReponse] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!reponse.trim()) return;
    setEnvoi(true);
    try {
      await apiRequest(chemin, {
        method: "POST",
        body: { message: reponse.trim() },
        accountId,
      });
      setReponse("");
      toast({ variant: "success", title: "Message envoyé" });
      router.refresh();
    } catch (err) {
      toast({
        variant: "error",
        title: "Envoi impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
      });
    } finally {
      setEnvoi(false);
    }
  }

  const messages = fil.messages ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((m) => {
          // « Nous », c'est l'équipe côté association et la personne côté
          // usager : le même fil se lit des deux bords sans se relire.
          const aDroite = cotePlateforme ? m.parEquipe : !m.parEquipe;
          return (
            <div key={m.id} className={aDroite ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  aDroite
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground",
                ].join(" ")}
              >
                <p className="whitespace-pre-wrap break-words">{m.corps}</p>
                <p
                  className={[
                    "mt-1.5 text-[11px]",
                    aDroite ? "text-primary-foreground/70" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {m.parEquipe ? "Les Extras" : "Vous"} · {quand(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {fil.statut === "RESOLU" ? (
        <p className="text-xs text-muted-foreground">
          Cet échange est marqué réglé. Répondre le rouvre.
        </p>
      ) : null}

      <form onSubmit={envoyer} className="space-y-3">
        <Textarea
          rows={4}
          value={reponse}
          onChange={(e) => setReponse(e.target.value)}
          placeholder="Votre réponse…"
          maxLength={5000}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={envoi || !reponse.trim()}>
            <Send className="mr-2 size-4" aria-hidden />
            {envoi ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
