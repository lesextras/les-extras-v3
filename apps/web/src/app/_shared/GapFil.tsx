// Le fil du GAP, pour les membres connectés.
// Il vit sur le site (/gap) et non dans le tableau de bord : le GAP est un
// lieu, pas un outil de gestion. On y entre comme on entre dans le catalogue
// d'ateliers — sauf qu'il faut un compte pour en franchir la porte.
//
// Une table ronde permanente entre professionnels. L'accès est réservé aux
// comptes et rien n'est public : on parle de situations réelles, et la
// sécurité du cadre prime sur la visibilité.
import Link from "next/link";
import {
  MessageCircleQuestion, Eye, CheckCircle2, Users, Search, ShieldCheck, HeartHandshake, EyeOff, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "./server";
import { PageHeader, EmptyState, ErrorState } from "./ui";
import { formatDate } from "./format";
import type { ListeQuestions } from "./gap";

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

/**
 * LE CADRE DU GAP, EN UNE LIGNE.
 *
 * C'étaient deux encarts empilés — le cadre en trois cartes, puis LEX dans une
 * carte à part — qui mangeaient un écran entier avant la première situation.
 * Or ce cadre se relit à chaque visite : s'il est long, il n'est plus relu, et
 * il ne protège plus rien. Trois pastilles colorées, une glose de quatre mots
 * chacune : on le prend d'un coup d'œil, ce qui est exactement le but.
 */
const CADRE = [
  {
    icone: EyeOff,
    titre: "Anonyme",
    glose: "les prénoms sont masqués",
    teinte: "text-primary",
    fond: "bg-primary/10",
    anneau: "ring-primary/25",
  },
  {
    icone: ShieldCheck,
    titre: "Entre pros",
    glose: "rien n'est public",
    teinte: "text-success",
    fond: "bg-success/10",
    anneau: "ring-success/25",
  },
  {
    icone: HeartHandshake,
    titre: "Sans jugement",
    glose: "les échecs sont les plus utiles",
    teinte: "text-secondary",
    fond: "bg-secondary/10",
    anneau: "ring-secondary/25",
  },
];

/** Les délais d'apparition, écrits en clair : Tailwind ne sait pas deviner une
 *  classe construite par interpolation, elle serait purgée du bundle. */
const DELAIS = ["stagger-1", "stagger-2", "stagger-3"];

export async function GapFil({
  searchParams,
}: {
  searchParams?: { search?: string; metier?: string; publicVise?: string; tri?: string };
}) {
  const session = await requireSession();

  const qs = new URLSearchParams({ take: "30" });
  for (const cle of ["search", "metier", "publicVise", "tri"] as const) {
    const v = searchParams?.[cle];
    if (v) qs.set(cle, v);
  }

  const { data, error } = await fetchApi<ListeQuestions>(session, `/gap?${qs.toString()}`);
  const items = data?.items ?? [];
  const metiers = data?.metiers ?? [];
  const publics = data?.publics ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Le GAP"
        subtitle="Groupe d'Analyse de la Pratique, en ligne et permanent. Vous déposez une situation, des professionnels qui l'ont vécue vous répondent."
        actions={
          <Button asChild>
            <Link href="/gap/poser">Déposer une situation</Link>
          </Button>
        }
      />

      {/* UN SEUL ENCART, moitié moins haut que les deux qu'il remplace : le
          cadre et l'issue de secours disent la même chose — comment on parle
          ici, et à qui, quand personne ne répond. */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6">
        <span
          className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <p className="relative max-w-3xl text-[15px] leading-relaxed text-foreground/90">
          Vous posez la situation qui tourne en boucle, d&apos;autres professionnels vous
          renvoient leur lecture.{" "}
          <span className="font-medium text-primary">
            Penser à plusieurs, c&apos;est ça qui débloque.
          </span>
        </p>

        <ul className="relative mt-4 flex flex-wrap gap-2">
          {CADRE.map((c, i) => {
            const Icone = c.icone;
            return (
              <li
                key={c.titre}
                className={`animate-fade-in-up ${DELAIS[i]} inline-flex items-center gap-2 rounded-full ${c.fond} px-3 py-1.5 ring-1 ring-inset ${c.anneau}`}
              >
                <Icone className={`size-4 shrink-0 ${c.teinte}`} aria-hidden />
                <span className={`text-sm font-semibold ${c.teinte}`}>{c.titre}</span>
                <span className="text-sm text-muted-foreground">— {c.glose}</span>
              </li>
            );
          })}
        </ul>

        <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-4">
          <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <span className="absolute inset-0 rounded-xl bg-primary/25 animate-anneau" aria-hidden />
            <Sparkles className="relative size-4.5" aria-hidden />
          </span>
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
            Personne ne répond ?{" "}
            <span className="font-semibold text-foreground">LEX le GAPiste</span> vous
            questionne d&apos;abord, comme un animateur en séance, puis prend position — en
            privé.
          </p>
          <Button asChild className="shrink-0">
            <Link href="/gap/poser">Déposer ma situation</Link>
          </Button>
        </div>
      </section>

      {error ? <ErrorState description={error} /> : null}

      {data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <MessageCircleQuestion className="size-5 text-primary" aria-hidden />
              <div>
                <p className="text-xl font-semibold tabular-nums">{data.total}</p>
                <p className="text-xs text-muted-foreground">situations déposées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Users className="size-5 text-primary" aria-hidden />
              <div>
                <p className="text-xl font-semibold tabular-nums">{metiers.length}</p>
                <p className="text-xs text-muted-foreground">métiers autour de la table</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <MessageCircleQuestion className="size-5 text-warning-foreground" aria-hidden />
              <div>
                <p className="text-xl font-semibold tabular-nums">{data.sansReponse}</p>
                <p className="text-xs text-muted-foreground">attendent un retour</p>
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
          { cle: "sans-reponse", label: "Sans retour" },
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
              href={`/gap${q ? `?${q}` : ""}`}
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
          title="La table est encore vide"
          description="La première situation lance le groupe. Celle qui vous occupe en occupe sûrement dix autres."
          action={
            <Button asChild>
              <Link href="/gap/poser">Déposer la première situation</Link>
            </Button>
          }
        />
      ) : (
        /* Le fil : une seule colonne, chaque situation à la suite de la
           précédente, reliées par un trait continu. On lit le GAP comme une
           conversation qui se déroule, pas comme un tableau d'annonces. */
        <ul className="mx-auto w-full max-w-2xl">
          {items.map((q, i) => (
            <li key={q.id} className="relative flex gap-3 pb-2">
              {/* Colonne de gauche : pastille + trait de liaison vers la suivante */}
              <div className="flex shrink-0 flex-col items-center">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-accent-foreground ring-1 ring-border"
                  aria-hidden
                >
                  {initialesMetier(q.metier)}
                </span>
                {i < items.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                ) : null}
              </div>

              <Link
                href={`/gap/${q.id}`}
                className="group min-w-0 flex-1 rounded-xl px-3 pb-6 pt-1.5 transition-colors hover:bg-accent/40"
              >
                {/* Ligne d'auteur, comme un fil de discussion */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-medium text-foreground">{q.auteur}</span>
                  <span className="text-muted-foreground">· {q.publicVise}</span>
                  <span className="text-muted-foreground">· {formatDate(q.createdAt)}</span>
                  {q.estMienne ? (
                    <Badge variant="secondary" className="ml-auto">
                      Ma situation
                    </Badge>
                  ) : null}
                </div>

                <h2 className="mt-1.5 font-semibold leading-snug text-foreground group-hover:underline">
                  {q.title}
                </h2>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {q.extrait}…
                </p>

                {q.status === "RESOLUE" ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-success-foreground">
                    <CheckCircle2 className="size-3.5" aria-hidden /> Un retour a été retenu
                  </p>
                ) : q.nbReponses === 0 ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-warning-foreground">
                    Personne n’a encore répondu
                  </p>
                ) : null}

                {/* Barre d'actions, en bas comme dans un fil */}
                <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 transition-colors group-hover:text-foreground">
                    <MessageCircleQuestion className="size-4" aria-hidden />
                    {q.nbReponses > 0
                      ? `${q.nbReponses} retour${q.nbReponses > 1 ? "s" : ""}`
                      : "Répondre"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="size-4" aria-hidden /> {q.views}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Badge variant="outline" className="font-normal">
                      {q.metier}
                    </Badge>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Deux lettres tirées du métier : une pastille d'auteur qui ne dit rien de la personne. */
function initialesMetier(metier: string): string {
  const mots = metier.split(/[\s'’-]+/).filter(Boolean);
  if (mots.length >= 2) return (mots[0][0] + mots[1][0]).toUpperCase();
  return metier.slice(0, 2).toUpperCase();
}
