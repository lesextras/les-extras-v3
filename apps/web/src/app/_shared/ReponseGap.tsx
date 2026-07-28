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
      await apiRequest(`/dashboard/gap/${questionId}/reponses`, {
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
        <ul className="space-y-3">
          {reponses.map((r) => (
            <li key={r.id}>
              <Card className={r.retenue ? "border-success/40 bg-success/5" : undefined}>
                <CardContent className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() =>
                      connecte
                        ? agir(`/dashboard/gap/reponses/${r.id}/vote`, r.id)
                        : toast({
                            title: "Connexion requise",
                            description: "Créez un compte gratuit pour voter.",
                          })
                    }
                    disabled={enCours === r.id || r.estMienne}
                    aria-pressed={r.aVote}
                    aria-label={r.aVote ? "Retirer mon vote" : "Cette réponse m'a aidé"}
                    title={r.estMienne ? "Vous ne pouvez pas voter pour votre réponse" : "Cette réponse m'a aidé"}
                    className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border transition ${
                      r.aVote
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    } disabled:opacity-60`}
                  >
                    <ThumbsUp className="h-4 w-4" aria-hidden />
                    <span className="text-sm font-semibold tabular-nums">{r.votes}</span>
                  </button>

                  <div className="min-w-0 flex-1 space-y-2">
                    {r.retenue ? (
                      <Badge variant="success">
                        <CheckCircle2 aria-hidden /> Réponse retenue par l&apos;auteur
                      </Badge>
                    ) : null}
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                      {r.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.auteur} · {formatDate(r.createdAt)}
                    </p>
                    {estAuteurQuestion && !r.retenue ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={enCours === r.id}
                        onClick={() =>
                          agir(
                            `/dashboard/gap/reponses/${r.id}/retenir`,
                            r.id,
                            "Réponse retenue — son auteur reçoit 40 points",
                          )
                        }
                      >
                        Cette réponse m&apos;a aidé
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
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
