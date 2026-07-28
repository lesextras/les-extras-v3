// Section « Entraide » de l'accueil : présentation du produit, illustrée par
// de vraies questions du fil. Si le fil est encore vide, on présente quand
// même la promesse — mais on n'invente aucune question.
import Link from "next/link";
import { ArrowRight, MessagesSquare, ShieldCheck, Filter, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuestionCard } from "./entraide";

const PILIERS = [
  {
    icone: Filter,
    titre: "Filtré par métier et par public",
    texte:
      "Un éducateur en EHPAD et un en ITEP ne cherchent pas les mêmes réponses. Vous ne voyez que ce qui vous concerne.",
  },
  {
    icone: ShieldCheck,
    titre: "Les prénoms sont masqués automatiquement",
    texte:
      "On parle de personnes accompagnées réelles. Prénoms et coordonnées sont remplacés à l'enregistrement, et ne sont stockés nulle part en clair.",
  },
  {
    icone: Award,
    titre: "Répondre rapporte des points",
    texte:
      "15 points par réponse, 40 de plus si l'auteur la retient comme utile. 10 points = 1 € de réduction sur vos prestations.",
  },
];

export function BlocEntraide({ questions }: { questions: QuestionCard[] }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
      <div>
        <span className="eyebrow">Entraide · lecture libre</span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
          Les situations qui n&apos;ont pas de réponse dans les manuels
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          « Un jeune refuse toute activité collective depuis trois semaines, vous faites comment ? »
          Cette question n&apos;a pas une bonne réponse — elle a dix réponses de collègues qui
          l&apos;ont vécue. L&apos;Entraide, c&apos;est ça : des professionnels du médico-social qui
          se répondent entre eux, par métier et par public accompagné.
        </p>

        <ul className="mt-8 space-y-5">
          {PILIERS.map((p) => {
            const Icone = p.icone;
            return (
              <li key={p.titre} className="flex gap-3">
                <Icone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">{p.titre}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.texte}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/entraide">
              Lire les situations
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard/entraide/poser">Poser ma question</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {questions.length > 0 ? (
          questions.map((q) => (
            <Link key={q.id} href={`/entraide/${q.id}`} className="group block">
              <div className="rounded-2xl border border-border bg-card p-6 transition group-hover:border-primary/40 group-hover:shadow-card">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="soft">{q.metier}</Badge>
                  <Badge variant="outline">{q.publicVise}</Badge>
                </div>
                <p className="mt-3 font-medium leading-snug">{q.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{q.extrait}…</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {q.auteur} · {q.nbReponses} réponse{q.nbReponses > 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <MessagesSquare className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <p className="mt-4 font-medium">Le fil vient d&apos;ouvrir</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              La première question posée est celle qui lance tout. Si une situation vous occupe en
              ce moment, il y a de fortes chances qu&apos;elle occupe dix autres professionnels.
            </p>
            <Button asChild className="mt-5">
              <Link href="/dashboard/entraide/poser">Poser la première question</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
