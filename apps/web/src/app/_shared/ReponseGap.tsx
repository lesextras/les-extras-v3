"use client";

// Réponses du GAP : dépôt, vote « utile », et désignation de la réponse
// qui a aidé (réservée à l'auteur de la question). L'auteur d'une réponse ne
// peut pas voter pour elle-même — c'est le seul garde-fou nécessaire ici.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThumbsUp, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";
import type { Reponse } from "./gap";
import { formatDate } from "./format";

export function FilReponses({
  questionId,
  reponses,
  estAuteurQuestion,
  connecte,
  accountId,
}: {
  questionId: string;
  reponses: Reponse[];
  estAuteurQuestion: boolean;
  connecte: boolean;
  accountId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [texte, setTexte] = useState("");
  const [piege, setPiege] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);

  async function repondre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (texte.trim().length < 20) {
      toast({
        title: "Réponse trop courte",
        description: "Décrivez ce que vous avez fait, dans quelle situation, et ce que ça a donné.",
        variant: "error",
      });
      return;
    }
    setEnvoi(true);
    try {
      await apiRequest(`/gap/${questionId}/reponses`, {
        method: "POST",
        body: { content: texte.trim(), website: piege || undefined },
        accountId,
      });
      setTexte("");
      toast({
        title: "Réponse publiée",
        description: "Elle rapporte 15 points, et 40 de plus si l'auteur la retient.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Publication impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  async function agir(chemin: string, id: string, succes?: string) {
    setEnCours(id);
    try {
      await apiRequest(chemin, { method: "POST", accountId });
      if (succes) toast({ title: succes });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        {reponses.length} réponse{reponses.length > 1 ? "s" : ""} de collègues
      </h2>

      {reponses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Personne n&apos;a encore répondu. Si vous avez vécu cette situation, votre retour vaut
            plus qu&apos;un article.
          </CardContent>
        </Card>
      ) : (
        /* Le fil des retours : une colonne, chaque réponse rattachée à la
           précédente par un trait. On suit la conversation de haut en bas. */
        <ul>
          {reponses.map((r, i) => (
            <li key={r.id} className="relative flex gap-3">
              <div className="flex shrink-0 flex-col items-center">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 ${
                    r.retenue
                      ? "bg-success/15 text-success-foreground ring-success/40"
                      : "bg-muted text-muted-foreground ring-border"
                  }`}
                  aria-hidden
                >
                  {r.auteur.replace(/^Un·e\s*/i, "").slice(0, 2).toUpperCase()}
                </span>
                {i < reponses.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                ) : null}
              </div>

              <div
                className={`min-w-0 flex-1 rounded-xl px-3 pb-6 pt-1 ${
                  r.retenue ? "bg-success/5" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="font-medium text-foreground">{r.auteur}</span>
                  <span className="text-xs text-muted-foreground">
                    · {formatDate(r.createdAt)}
                  </span>
                  {r.retenue ? (
                    <Badge variant="success" className="ml-auto">
                      <CheckCircle2 aria-hidden /> Retour retenu
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {r.content}
                </p>

                {/* Actions sous le message, comme dans un fil de discussion */}
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      connecte
                        ? agir(`/gap/reponses/${r.id}/vote`, r.id)
                        : toast({
                            title: "Connexion requise",
                            description: "Créez un compte gratuit pour voter.",
                          })
                    }
                    disabled={enCours === r.id || r.estMienne}
                    aria-pressed={r.aVote}
                    aria-label={r.aVote ? "Retirer mon vote" : "Ce retour m'a aidé"}
                    title={
                      r.estMienne
                        ? "Vous ne pouvez pas voter pour votre propre retour"
                        : "Ce retour m'a aidé"
                    }
                    className={`inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-60 ${
                      r.aVote
                        ? "font-medium text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ThumbsUp className="size-4" aria-hidden />
                    <span className="tabular-nums">{r.votes}</span>
                  </button>

                  {estAuteurQuestion && !r.retenue ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={enCours === r.id}
                      onClick={() =>
                        agir(
                          `/gap/reponses/${r.id}/retenir`,
                          r.id,
                          "Retour retenu — son auteur reçoit 40 points",
                        )
                      }
                    >
                      Ce retour m&apos;a aidé
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Dépôt d'une réponse */}
      {connecte ? (
        estAuteurQuestion ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-sm text-muted-foreground">
              C&apos;est votre question : les réponses viennent des autres. Quand l&apos;une
              d&apos;elles vous a aidé, retenez-la — c&apos;est ce qui aide les collègues suivants.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h3 className="font-semibold">Vous avez vécu cette situation ?</h3>
                <p className="text-sm text-muted-foreground">
                  Ce qui aide vraiment : ce que vous avez tenté, dans quel contexte, et ce que ça a
                  donné — y compris quand ça n&apos;a pas marché.
                </p>
              </div>
              <form onSubmit={repondre} className="space-y-4">
                <Field label="Votre réponse" htmlFor="reponse">
                  <Textarea
                    id="reponse"
                    rows={5}
                    value={texte}
                    maxLength={4000}
                    onChange={(e) => setTexte(e.target.value)}
                    placeholder="Chez nous, on avait la même chose avec un groupe d'ados. Ce qui a fini par débloquer…"
                  />
                </Field>
                <input
                  type="text"
                  value={piege}
                  onChange={(e) => setPiege(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={envoi}>
                    {envoi ? "Publication…" : "Publier ma réponse"}
                  </Button>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-success" aria-hidden />
                    Publié sous « Un·e {"{métier}"} » — les prénoms cités sont masqués
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-primary/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-sm text-muted-foreground">
              La lecture est libre. Pour répondre à un collègue, il faut un compte — c&apos;est
              gratuit et ça prend trente secondes.
            </p>
            <Button asChild>
              <Link href="/register">Créer mon compte</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
