// UN SEUL FORMULAIRE — l’argument central, dit une fois, en clair.
//
// Ce que fait vraiment le logiciel, sans un mot de plus : une publication
// touche tout le réseau correspondant, et la réponse ne demande aucune
// relance. Chaque phrase ci-dessous correspond à un comportement réel du
// produit — diffusion en cascade, notification à la publication d’une
// mission urgente, attribution automatique ou validée, contrat émis dans la
// foulée. Rien n’y est promis qui ne soit déjà écrit dans le code.
import Link from "next/link";
import { Send, Users, FileSignature, PenLine, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";

const POUR_ETABLISSEMENT = [
  {
    icone: Send,
    // Chaque carte porte sa couleur : un liseré en haut, un dégradé qui part
    // de la teinte et retombe sur le fond de carte, une pastille pleine. Sur
    // fond charbon, un aplat à 10 % ne se voyait pas — trois cartes
    // identiques ne se distinguent pas, donc ne se lisent pas.
    bordure: "border-primary/40",
    fond: "bg-gradient-to-br from-primary/25 via-card to-card",
    lisere: "bg-primary",
    halo: "bg-primary/30",
    pastille: "bg-primary text-primary-foreground",
    titre: "L’offre part dans la seconde",
    texte:
      "Une case « mission urgente », et chaque intervenant dont le profil correspond (métier, zone, disponibilité) est prévenu par e-mail à la publication. Pas de liste à constituer, pas d’appels.",
  },
  {
    icone: Users,
    bordure: "border-secondary/40",
    fond: "bg-gradient-to-br from-secondary/25 via-card to-card",
    lisere: "bg-secondary",
    halo: "bg-secondary/30",
    pastille: "bg-secondary text-secondary-foreground",
    titre: "En cascade, dans votre ordre",
    texte:
      "Vos salariés d’abord, puis les intervenants déjà venus chez vous, puis le réseau. La diffusion s’élargit toute seule tant que le besoin n’est pas couvert.",
  },
  {
    icone: FileSignature,
    // Troisième teinte : le jeu de jetons n’en compte que deux. L’ambre
    // prolonge la même arche chaude — rose, terracotta, ambre — sans jurer.
    bordure: "border-amber-500/40",
    fond: "bg-gradient-to-br from-amber-500/25 via-card to-card",
    lisere: "bg-amber-500",
    halo: "bg-amber-500/30",
    pastille: "bg-amber-500 text-amber-950",
    titre: "La réponse est automatique",
    texte:
      "Le premier qui accepte prend la mission et le contrat s’émet dans la foulée. Ou vous gardez la main et validez chaque profil, l’un après l’autre.",
  },
];

const POUR_PROFESSIONNEL = [
  { icone: PenLine, titre: "Assistant d’écriture", texte: "Note d’incident, rapport de situation, projet personnalisé." },
  { icone: Sparkles, titre: "Générateur d’activités", texte: "Un public, un objectif : une séance complète, prête à animer." },
  { icone: GraduationCap, titre: "Appui scolaire", texte: "Le soutien construit pour les jeunes que vous accompagnez." },
];

export function UnSeulFormulaire() {
  return (
    <section id="un-seul-formulaire" className="section scroll-mt-24">
      <Reveal>
        <span className="eyebrow">Un seul formulaire</span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
          Vous publiez une fois. Le réseau est prévenu, la réponse vient toute seule.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Un renfort à couvrir, un atelier à programmer : vous remplissez un formulaire, une seule
          fois. Le reste ne vous revient plus : qui prévenir, dans quel ordre, qui relancer, quel
          contrat éditer.
        </p>
      </Reveal>

      <Reveal className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {POUR_ETABLISSEMENT.map((bloc) => {
          const Icone = bloc.icone;
          return (
            <div
              key={bloc.titre}
              className={`group relative overflow-hidden rounded-2xl border ${bloc.bordure} ${bloc.fond} p-7 shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl`}
            >
              {/* Le liseré donne la couleur au premier coup d’œil, avant même
                  qu’on lise le titre. */}
              <span className={`absolute inset-x-0 top-0 h-1 ${bloc.lisere}`} aria-hidden />
              {/* Halo diffus dans l’angle : la carte se décolle du fond. */}
              <span
                className={`pointer-events-none absolute -right-10 -top-14 size-36 rounded-full blur-3xl ${bloc.halo}`}
                aria-hidden
              />

              <span
                className={`relative inline-flex size-12 items-center justify-center rounded-2xl shadow-lg ${bloc.pastille}`}
              >
                <Icone className="size-6" aria-hidden />
              </span>
              <h3 className="relative mt-5 text-xl font-bold tracking-tight text-foreground">
                {bloc.titre}
              </h3>
              <p className="relative mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {bloc.texte}
              </p>
            </div>
          );
        })}
      </Reveal>

      <Reveal className="mt-6">
        <Button asChild size="lg">
          <Link href="/renforteam">Voir comment ça marche</Link>
        </Button>
      </Reveal>

      {/* L’autre versant : ce que le professionnel de terrain vient chercher. */}
      <Reveal className="mt-14 rounded-2xl border border-border bg-secondary/5 p-7 md:p-9">
        <span className="eyebrow">Et pour l’intervenant de terrain</span>
        <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl text-balance">
          LEX, le soutien de votre travail, pas seulement des missions
        </h3>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Le métier ne s’arrête pas quand la journée finit : restent les écrits, les séances à
          préparer, le suivi. LEX prend cette part-là.
        </p>
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {POUR_PROFESSIONNEL.map((bloc) => {
            const Icone = bloc.icone;
            return (
              <div key={bloc.titre} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                  <Icone className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-foreground">{bloc.titre}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{bloc.texte}</span>
                </span>
              </div>
            );
          })}
        </div>
        <Button asChild variant="outline" size="lg" className="mt-7">
          <Link href="/intervenant-independant">Ce que Les Extras change pour moi</Link>
        </Button>
      </Reveal>
    </section>
  );
}
