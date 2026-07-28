// ENTRAIDE — le fil des situations de terrain, en lecture libre.
// Ouvert sans compte volontairement : c'est ce qui permet à un professionnel
// de mesurer la valeur du réseau avant de s'inscrire, et ce qui rend les
// situations trouvables depuis un moteur de recherche.
import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleQuestion, Eye, CheckCircle2, Users, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../_shared/server";
import { PageHeader, EmptyState } from "../../_shared/ui";
import { formatDate } from "../../_shared/format";
import type { ListeQuestions } from "../../_shared/entraide";

export const metadata: Metadata = {
  title: "Entraide — les situations de terrain entre professionnels",
  description:
    "Les questions que se posent vraiment les éducateurs, AES, psychologues et chefs de service du médico-social — et les réponses de ceux qui ont vécu la même situation. Lecture libre, sans compte.",
  alternates: { canonical: "/entraide" },
};

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export default async function EntraidePage({
  searchParams,
}: {
  searchParams?: { search?: string; metier?: string; publicVise?: string; tri?: string };
}) {
  const qs = new URLSearchParams({ take: "30" });
  for (const cle of ["search", "metier", "publicVise", "tri"] as const) {
    const v = searchParams?.[cle];
    if (v) qs.set(cle, v);
  }

  const { data } = await fetchPublic<ListeQuestions>(`/public/entraide?${qs.toString()}`);
  const items = data?.items ?? [];
  const metiers = data?.metiers ?? [];
  const publics = data?.publics ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entraide"
        subtitle="Les situations qui n’ont pas de réponse dans les manuels — posées par des professionnels, traitées par des professionnels. Les prénoms sont masqués automatiquement."
        actions={
          <Button asChild>
            <Link href="/dashboard/entraide/poser">Poser ma question</Link>
          </Button>
        }
      />

      {data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <MessageCircleQuestion className="size-5 text-primary" aria-hidden />
              <div>
                <p className="text-xl font-semibold tabular-nums">{data.total}</p>
                <p className="text-xs text-muted-foreground">situations partagées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Users className="size-5 text-primary" aria-hidden />
              <div>
                <p className="text-xl font-semibold tabular-nums">{metiers.length}</p>
                <p className="text-xs text-muted-foreground">métiers représentés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <MessageCircleQuestion className="size-5 text-warning-foreground" aria-hidden />
              <div>
                <p className="text-xl font-semibold tabular-nums">{data.sansReponse}</p>
                <p className="text-xs text-muted-foreground">attendent une réponse</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <form method="GET" className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="search"
            defaultValue={searchParams?.search ?? ""}
            placeholder="Rechercher une situation…"
            className={`${inputClass} pl-9`}
            aria-label="Rechercher une situation"
          />
        </div>
        <select
          name="metier"
          defaultValue={searchParams?.metier ?? ""}
          className={`${inputClass} md:w-56`}
          aria-label="Filtrer par métier"
        >
          <option value="">Tous les métiers</option>
          {metiers.map((m) => (
            <option key={m.valeur} value={m.valeur}>
              {m.valeur} ({m.nb})
            </option>
          ))}
        </select>
        <select
          name="publicVise"
          defaultValue={searchParams?.publicVise ?? ""}
          className={`${inputClass} md:w-60`}
          aria-label="Filtrer par public accompagné"
        >
          <option value="">Tous les publics</option>
          {publics.map((p) => (
            <option key={p.valeur} value={p.valeur}>
              {p.valeur} ({p.nb})
            </option>
          ))}
        </select>
        <Button type="submit">Filtrer</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {[
          { cle: "", label: "Les plus récentes" },
          { cle: "sans-reponse", label: "Sans réponse" },
          { cle: "populaires", label: "Les plus lues" },
        ].map((t) => {
          const actif = (searchParams?.tri ?? "") === t.cle;
          const p = new URLSearchParams();
          if (searchParams?.search) p.set("search", searchParams.search);
          if (searchParams?.metier) p.set("metier", searchParams.metier);
          if (searchParams?.publicVise) p.set("publicVise", searchParams.publicVise);
          if (t.cle) p.set("tri", t.cle);
          const q = p.toString();
          return (
            <Link
              key={t.label}
              href={`/entraide${q ? `?${q}` : ""}`}
              aria-current={actif ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                actif
                  ? "border-primary bg-primary-soft font-medium text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune situation pour l’instant"
          description="Soyez le premier à décrire une situation : c’est souvent celle que dix collègues vivent aussi."
          action={
            <Button asChild>
              <Link href="/dashboard/entraide/poser">Poser ma question</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((q) => (
            <li key={q.id}>
              <Link href={`/entraide/${q.id}`} className="group block">
                <Card className="transition group-hover:border-primary/40 group-hover:shadow-card">
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="soft">{q.metier}</Badge>
                      <Badge variant="outline">{q.publicVise}</Badge>
                      {q.status === "RESOLUE" ? (
                        <Badge variant="success">
                          <CheckCircle2 aria-hidden /> Réponse retenue
                        </Badge>
                      ) : q.nbReponses === 0 ? (
                        <Badge variant="warning">Sans réponse</Badge>
                      ) : null}
                    </div>
                    <h2 className="font-semibold leading-snug text-foreground">{q.title}</h2>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{q.extrait}…</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>{q.auteur}</span>
                      <span>{formatDate(q.createdAt)}</span>
                      <span>
                        {q.nbReponses} réponse{q.nbReponses > 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3" aria-hidden /> {q.views}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
