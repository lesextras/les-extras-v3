// Entraide vue depuis l'espace connecté : le même fil, plus mes questions.
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, EmptyState } from "../../../_shared/ui";
import { formatDate } from "../../../_shared/format";
import type { ListeQuestions } from "../../../_shared/entraide";

export const metadata: Metadata = { title: "Entraide" };

export default async function EntraideDashboardPage() {
  const session = await requireSession();
  const [fil, sansReponse] = await Promise.all([
    fetchApi<ListeQuestions>(session, "/entraide?take=20"),
    fetchApi<ListeQuestions>(session, "/entraide?tri=sans-reponse&take=6"),
  ]);

  const items = fil.data?.items ?? [];
  const miennes = items.filter((q) => q.estMienne);
  const orphelines = (sansReponse.data?.items ?? []).filter((q) => !q.estMienne);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entraide"
        subtitle="Les situations de terrain partagées par le réseau. Répondre rapporte 15 points, et 40 de plus si votre réponse est retenue."
        actions={
          <Button asChild>
            <Link href="/dashboard/entraide/poser">Poser une question</Link>
          </Button>
        }
      />

      {orphelines.length > 0 ? (
        <section className="space-y-4">
          <SectionTitle
            title="Des collègues attendent une réponse"
            action={<Badge variant="warning">{fil.data?.sansReponse ?? 0} sans réponse</Badge>}
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {orphelines.slice(0, 4).map((q) => (
              <li key={q.id}>
                <Link href={`/entraide/${q.id}`} className="group block h-full">
                  <Card className="h-full transition group-hover:border-primary/40 group-hover:shadow-card">
                    <CardContent className="space-y-2 pt-6">
                      <Badge variant="soft">{q.metier}</Badge>
                      <p className="font-medium leading-snug">{q.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{q.extrait}…</p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionTitle title="Mes questions" />
        {miennes.length === 0 ? (
          <EmptyState
            title="Vous n'avez pas encore posé de question"
            description="Une situation qui vous bloque en bloque probablement dix autres. La poser, c'est aussi rendre service."
            action={
              <Button asChild>
                <Link href="/dashboard/entraide/poser">Poser ma première question</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {miennes.map((q) => (
              <li key={q.id}>
                <Link href={`/entraide/${q.id}`} className="group block">
                  <Card className="transition group-hover:border-primary/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                      <div className="min-w-0">
                        <p className="font-medium">{q.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(q.createdAt)} · {q.views} lecture{q.views > 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant={q.nbReponses > 0 ? "default" : "warning"}>
                        {q.nbReponses} réponse{q.nbReponses > 1 ? "s" : ""}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Le fil du réseau"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/entraide">Tout voir et filtrer</Link>
            </Button>
          }
        />
        <ul className="space-y-2">
          {items.slice(0, 8).map((q) => (
            <li key={q.id}>
              <Link
                href={`/entraide/${q.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary/40"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{q.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {q.metier} · {q.nbReponses} rép.
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
