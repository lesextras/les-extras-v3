// Fiche d'une situation. Lecture libre ; répondre demande un compte.
// Si la personne est connectée, on relit via l'API authentifiée pour connaître
// l'état de ses votes et savoir si la question est la sienne.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/session";
import { fetchPublic, fetchApi } from "../../../_shared/server";
import { formatDate } from "../../../_shared/format";
import { FilReponses } from "../../../_shared/ReponseEntraide";
import type { QuestionDetail } from "../../../_shared/entraide";
import type { Session as SessionType } from "../../../_shared/types";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data } = await fetchPublic<QuestionDetail>(`/public/entraide/${params.id}`);
  if (!data) return { title: "Situation introuvable" };
  return {
    title: data.title,
    description: data.situation.slice(0, 155),
    alternates: { canonical: `/entraide/${params.id}` },
  };
}

export default async function QuestionPage({ params }: { params: { id: string } }) {
  const session = (await getSession()) as SessionType | null;

  const { data } = session
    ? await fetchApi<QuestionDetail>(session, `/entraide/${params.id}`)
    : await fetchPublic<QuestionDetail>(`/public/entraide/${params.id}`);

  if (!data) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/entraide"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Toutes les situations
      </Link>

      <article className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">{data.metier}</Badge>
          <Badge variant="outline">{data.publicVise}</Badge>
          {data.status === "RESOLUE" ? (
            <Badge variant="success">
              <CheckCircle2 aria-hidden /> Réponse retenue
            </Badge>
          ) : null}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-balance">
          {data.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{data.auteur}</span>
          <span>{formatDate(data.createdAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden /> {data.views} lecture
            {data.views > 1 ? "s" : ""}
          </span>
        </div>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                La situation
              </h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground">
                {data.situation}
              </p>
            </div>
            {data.tente ? (
              <div className="border-t border-border pt-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Ce qui a déjà été tenté
                </h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground">
                  {data.tente}
                </p>
              </div>
            ) : null}
            <p className="flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
              Les prénoms et coordonnées ont été masqués automatiquement à l&apos;enregistrement,
              et ne sont stockés nulle part en clair.
            </p>
          </CardContent>
        </Card>
      </article>

      <FilReponses
        questionId={data.id}
        reponses={data.reponses}
        estAuteurQuestion={data.estMienne}
        connecte={Boolean(session)}
        accountId={session?.account?.id}
      />
    </div>
  );
}
