// Page publique du GAP — Groupe d'Analyse de Pratique en ligne.
//
// Elle explique, elle ne donne pas accès : les situations déposées parlent de
// personnes réellement accompagnées. Le visiteur voit que le GAP vit (nombre
// de situations, de réponses, métiers représentés) et des titres tronqués
// côté serveur, jamais une situation lisible. Pour lire et répondre, il faut
// un compte — c'est la condition même de la parole libre dans un GAP.
import type { Metadata } from "next";
import Link from "next/link";
import {
  MessagesSquare,
  Lock,
  EyeOff,
  ShieldCheck,
  UserRound,
  PenLine,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../_shared/server";

export const metadata: Metadata = {
  title: "Le GAP — Groupe d’Analyse de Pratique en ligne",
  description:
    "Déposez une situation de terrain, recevez les retours de professionnels du médico-social. Anonyme, entre pairs, accessible aux membres de Les Extras.",
  alternates: { canonical: "/gap" },
};

interface Apercu {
  apercu: {
    id: string;
    extrait: string;
    metier: string;
    publicVise: string;
    resolue: boolean;
    nbReponses: number;
    creeLe: string;
  }[];
  nbQuestions: number;
  nbReponses: number;
  metiers: string[];
}

const REGLES = [
  {
    icone: EyeOff,
    titre: "Anonyme par défaut",
    texte:
      "Vous publiez sous pseudonyme. Ni votre nom ni celui de votre structure n’apparaissent, sauf si vous choisissez de les montrer.",
  },
  {
    icone: ShieldCheck,
    titre: "Les prénoms sont masqués",
    texte:
      "À l’enregistrement, les prénoms détectés dans votre texte sont remplacés. On parle de personnes accompagnées réelles : elles n’ont pas à être reconnaissables.",
  },
  {
    icone: Lock,
    titre: "Rien n’est public",
    texte:
      "Aucune situation n’est visible depuis le site ni indexée par Google. Il faut un compte pour lire, et un compte pour répondre.",
  },
  {
    icone: Users,
    titre: "Entre pairs, sans hiérarchie",
    texte:
      "Éducateurs, AES, psychologues, moniteurs, chefs de service : on répond depuis sa pratique, pas depuis son grade.",
  },
];

const ETAPES = [
  {
    numero: "1",
    titre: "Vous déposez une situation",
    texte:
      "Pas un sujet théorique : ce qui se passe, depuis quand, avec qui — et surtout ce que vous avez déjà tenté. C’est ce dernier point qui évite les réponses évidentes.",
  },
  {
    numero: "2",
    titre: "Des professionnels répondent",
    texte:
      "Le fil s’enrichit au fil des retours. Chacun raconte comment il a fait face à quelque chose de proche. Vous pouvez relancer, préciser, remercier.",
  },
  {
    numero: "3",
    titre: "Vous retenez ce qui vous aide",
    texte:
      "Vous désignez la réponse qui a débloqué la situation. Elle reste visible en tête du fil pour les prochains qui traverseront la même chose.",
  },
];

export default async function GapPublicPage() {
  const { data } = await fetchPublic<Apercu>("/gap/apercu");
  const apercu = data?.apercu ?? [];
  const nbQuestions = data?.nbQuestions ?? 0;
  const nbReponses = data?.nbReponses ?? 0;
  const metiers = data?.metiers ?? [];

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-background to-background px-6 py-16 sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative max-w-3xl space-y-6">
          <Badge variant="soft" className="gap-1.5">
            <MessagesSquare className="size-3.5" />
            Groupe d’Analyse de Pratique en ligne
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            La situation que vous n’osez raconter qu’en salle de pause.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Le GAP, c’est l’analyse de pratique sans attendre la séance du mois prochain.
            Vous déposez une situation de terrain, des professionnels du médico-social vous
            répondent depuis leur expérience. Anonymement, entre pairs.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/register?next=/dashboard/gap">
                Créer un compte gratuit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login?next=/dashboard/gap">J’ai déjà un compte</Link>
            </Button>
          </div>
          {nbQuestions > 0 ? (
            <p className="pt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">{nbQuestions}</strong>{" "}
              {nbQuestions > 1 ? "situations déposées" : "situation déposée"} ·{" "}
              <strong className="text-foreground">{nbReponses}</strong>{" "}
              {nbReponses > 1 ? "réponses de professionnels" : "réponse de professionnel"}
            </p>
          ) : null}
        </div>
      </section>

      {/* Les règles de confidentialité */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Ce qui rend la parole possible
          </h2>
          <p className="text-muted-foreground">
            Un GAP ne fonctionne que si l’on peut dire ce qui coince vraiment. Quatre règles
            tiennent ce cadre — elles ne sont pas négociables.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {REGLES.map((r) => (
            <Card key={r.titre} className="border-border/80">
              <CardContent className="flex gap-4 p-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <r.icone className="size-5" />
                </span>
                <div className="space-y-1.5">
                  <p className="font-medium text-foreground">{r.titre}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{r.texte}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Comment ça se passe
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {ETAPES.map((e) => (
            <div key={e.numero} className="space-y-3">
              <span className="grid size-11 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {e.numero}
              </span>
              <p className="text-lg font-medium text-foreground">{e.titre}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu flouté — la preuve que ça vit, pas le contenu */}
      {apercu.length > 0 ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Ce qui se discute en ce moment
              </h2>
              <p className="text-muted-foreground">
                Les situations ne sont pas lisibles ici, et ne le seront jamais : elles
                parlent de personnes réelles. Voici seulement les thèmes ouverts.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="space-y-3" aria-hidden>
              {apercu.map((q) => (
                <Card key={q.id} className="border-border/70 bg-card/60">
                  <CardContent className="flex flex-wrap items-center gap-4 p-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                      <UserRound className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-sm font-medium text-foreground/80">
                        {q.extrait}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{q.metier}</Badge>
                        <Badge variant="outline">{q.publicVise}</Badge>
                        {q.resolue ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="size-3.5" /> Résolue
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {q.nbReponses} {q.nbReponses > 1 ? "réponses" : "réponse"}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Voile : on ne peut pas cliquer, et le bas s'estompe */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/85 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 pb-2">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4" />
                Les situations et les réponses sont réservées aux membres
              </p>
              <Button asChild>
                <Link href="/register?next=/dashboard/gap">
                  Rejoindre le GAP <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {metiers.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <span className="text-sm text-muted-foreground">Métiers représentés :</span>
              {metiers.map((m) => (
                <Badge key={m} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* LEX le GAPiste */}
      <section>
        <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-primary/10 to-background">
          <CardContent className="flex flex-col gap-5 p-8 sm:flex-row sm:items-center sm:gap-8">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/20 text-primary">
              <Sparkles className="size-7" />
            </span>
            <div className="space-y-2">
              <p className="text-xl font-medium text-foreground">LEX, l’animateur du GAP</p>
              <p className="leading-relaxed text-muted-foreground">
                Quand un fil s’essouffle, LEX relance avec les questions qu’un animateur de
                GAP poserait : qu’est-ce qui vous a surpris ? qu’avez-vous ressenti ? qu’est-ce
                que la personne cherchait à dire par ce comportement ? Il n’apporte pas de
                réponse toute faite — il aide le groupe à penser.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA final */}
      <section className="rounded-3xl border border-border bg-card/50 px-6 py-14 text-center sm:px-12">
        <div className="mx-auto max-w-2xl space-y-5">
          <PenLine className="mx-auto size-8 text-primary" />
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Vous avez une situation en tête depuis ce matin ?
          </h2>
          <p className="text-muted-foreground">
            Créer un compte prend deux minutes et ne coûte rien. Le GAP est ouvert à tous
            les professionnels du médico-social, salariés comme intervenants indépendants.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/register?next=/dashboard/gap">Créer mon compte</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login?next=/dashboard/gap">Se connecter</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
