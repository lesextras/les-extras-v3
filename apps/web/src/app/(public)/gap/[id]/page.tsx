// Une situation déposée dans le GAP : le récit, les retours des pairs, et
// LEX le GAPiste pour ceux qui veulent une élaboration guidée.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi, estAdherent } from "@/app/_shared/server";
import { formatDate } from "@/app/_shared/format";
import { FilReponses } from "@/app/_shared/ReponseGap";
import { ActionsSituation } from "@/app/_shared/ActionsSituation";
import { LexGapiste } from "@/app/_shared/LexGapiste";
import type { QuestionDetail } from "@/app/_shared/gap";

export const metadata: Metadata = { title: "Situation — Le GAP" };

export default async function SituationPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const [{ data }, adherent] = await Promise.all([
    fetchApi<QuestionDetail>(session, `/gap/${params.id}`),
    estAdherent(session),
  ]);

  if (!data) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/gap"
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
              <CheckCircle2 aria-hidden /> Retour retenu
            </Badge>
          ) : null}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-balance">
          {data.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{data.auteur}</span>
          <span>{formatDate(data.createdAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden /> {data.views} lecture
            {data.views > 1 ? "s" : ""}
          </span>
          </div>
          <ActionsSituation
            id={data.id}
            estMienne={data.estMienne}
            estAdmin={session.user.role === "ADMIN"}
            accountId={session.account.id}
          />
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
              Les prénoms et coordonnées ont été masqués automatiquement à l&apos;enregistrement.
              Cette page n&apos;est visible que par les membres connectés, et n&apos;est pas
              indexée par les moteurs de recherche.
            </p>
          </CardContent>
        </Card>
      </article>

      {/* LEX le GAPiste — proposé à l'auteur de la situation en priorité */}
      {data.estMienne ? (
        <LexGapiste
          accountId={session.account.id}
          estAdherent={adherent}
          contexte={{
            titre: data.title,
            situation: data.situation,
            tente: data.tente,
            metier: data.metier,
            publicVise: data.publicVise,
          }}
        />
      ) : null}

      <FilReponses
        questionId={data.id}
        reponses={data.reponses}
        estAuteurQuestion={data.estMienne}
        estAdmin={session.user.role === "ADMIN"}
        connecte
        accountId={session.account.id}
      />
    </div>
  );
}
