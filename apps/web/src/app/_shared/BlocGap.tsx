// Section « Le GAP » de l'accueil. Le fil lui-même n'est pas public — on
// présente donc le cadre et la promesse, pas des extraits de situations.
import Link from "next/link";
import { ArrowRight, EyeOff, ShieldCheck, HeartHandshake, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const CADRE = [
  {
    icone: EyeOff,
    titre: "Anonyme, toujours",
    texte:
      "Vous déposez sous « Un·e éducateur spécialisé », jamais sous votre nom. Les prénoms des personnes accompagnées sont masqués automatiquement et ne sont stockés nulle part en clair.",
  },
  {
    icone: ShieldCheck,
    titre: "Fermé, donc sûr",
    texte:
      "Rien n'est public, rien n'est indexé. Il faut un compte pour entrer — c'est ce qui permet de déposer une situation sans se surveiller.",
  },
  {
    icone: HeartHandshake,
    titre: "Bienveillant et constructif",
    texte:
      "On ne juge pas la pratique d'un collègue. On raconte ce qu'on a vécu, ce qu'on a tenté, ce que ça a donné — les échecs compris, souvent les plus utiles.",
  },
];

export function BlocGap({ illustration }: { illustration?: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-14">
      <div>
        <span className="eyebrow">Le GAP · réservé aux membres</span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
          Un groupe d&apos;analyse de la pratique, en ligne et permanent
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Une table ronde où chacun dépose la situation qui l&apos;occupe — celle qui tourne en
          boucle depuis trois semaines — et reçoit les retours de professionnels qui l&apos;ont
          vécue. Personne ne détient la bonne réponse : c&apos;est le fait de penser à plusieurs
          qui débloque.
        </p>

        <ul className="mt-8 space-y-5">
          {CADRE.map((c) => {
            const Icone = c.icone;
            return (
              <li key={c.titre} className="flex gap-3">
                <Icone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">{c.titre}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{c.texte}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">
              Créer mon compte pour entrer
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">J&apos;ai déjà un compte</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* LEX le GAPiste */}
        <div className="bloc-nuit rounded-3xl bg-[hsl(222,22%,13%)] p-7 ring-1 ring-primary/25 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Inclus dans l&apos;adhésion
          </span>
          <h3 className="mt-4 text-2xl font-bold tracking-tight">LEX le GAPiste</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            L&apos;animateur IA du groupe, avec la posture d&apos;un psychologue clinicien et
            d&apos;un éducateur spécialisé senior. Sa particularité : <strong>il ne répond pas
            tout de suite</strong>.
          </p>
          <ol className="mt-5 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                1
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Il questionne d&apos;abord</strong> — le
                contexte, les faits observables, ce que vous ressentez, ce qui se joue pour la
                personne et pour l&apos;équipe, ce que vous avez déjà tenté.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                2
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Puis il prend position</strong> — son analyse
                de ce qui se joue, la posture qu&apos;il vous conseille de tenir (avec les mots à
                dire), deux ou trois activités à essayer, et ce qu&apos;il ferait, lui, dès lundi.
              </span>
            </li>
          </ol>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Il n&apos;intervient que si vous le sollicitez, depuis votre propre situation, et
            l&apos;échange reste privé : il ne publie rien dans le fil. Il donne un avis franc,
            jamais un diagnostic — et tout ce qu&apos;il propose se valide en réunion avant
            d&apos;être mis en œuvre.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-7">
          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-[15rem] flex-1">
              <Users className="size-5 text-primary" aria-hidden />
              <p className="mt-3 font-medium">Filtré par métier et par public accompagné</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Un éducateur en EHPAD et un en ITEP ne cherchent pas les mêmes retours. Vous ne
                voyez que les situations qui vous concernent — et répondre à un collègue rapporte
                15 points, 40 de plus si votre retour est retenu.
              </p>
            </div>
            {illustration ? (
              <div className="mx-auto w-full max-w-[15rem] shrink-0">{illustration}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
