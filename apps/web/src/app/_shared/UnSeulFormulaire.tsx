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
      "Chaque intervenant dont le profil correspond est prévenu par e-mail. Pas de liste à constituer, pas d’appels.",
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
      "Vos salariés, puis votre vivier, puis le réseau. Vous fixez l’ordre une fois ; la diffusion s’élargit seule.",
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
      "Le premier qui accepte prend la mission, le contrat s’émet dans la foulée. Ou vous validez chaque profil.",
  },
];

const POUR_PROFESSIONNEL = [
  { icone: PenLine, titre: "Assistant d’écriture", texte: "Note d’incident, rapport de situation, projet personnalisé." },
  { icone: Sparkles, titre: "Générateur d’activités", texte: "Un public, un objectif : une séance complète, prête à animer." },
  { icone: GraduationCap, titre: "Appui scolaire", texte: "Le soutien construit pour les jeunes que vous accompagnez." },
];

// Les trois paliers, nommes avec les mots de l'etablissement : ses salaries,
// son vivier de remplacants habituels, et seulement ensuite le reseau.
const CASCADE = [
  {
    titre: "Vos salariés",
    texte:
      "En interne d’abord, vers ceux qui connaissent déjà la maison. Heures complémentaires proposées en un clic.",
    pastille: "bg-primary text-primary-foreground",
  },
  {
    titre: "Votre vivier de CDD",
    texte:
      "Sans réponse, l’offre passe à vos remplaçants habituels, déjà venus chez vous. Leurs coordonnées sont là.",
    pastille: "bg-secondary text-secondary-foreground",
  },
  {
    titre: "Le réseau Les Extras",
    texte:
      "En dernier recours, l’offre s’ouvre au réseau : filtré sur le métier, la zone et les disponibilités.",
    pastille: "bg-amber-500 text-amber-950",
  },
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
          Un renfort, un atelier : un seul formulaire. Le logiciel prévient dans l’ordre que vous
          avez fixé, relance, et édite le contrat dès qu’un intervenant accepte.
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
      {/* La cascade, en clair. C’est l’ordre de diffusion qui sépare ce
          logiciel d’une annonce publiée au hasard : encore fallait-il le dire. */}
      <Reveal className="mt-8 overflow-hidden rounded-2xl border border-border bg-card/60">
        <div className="border-b border-border px-6 py-5 md:px-8">
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            La cascade : votre équipe d’abord, le réseau en dernier
          </h3>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            À chaque palier : le logiciel prévient, laisse un délai, relance, puis élargit seul.
          </p>
        </div>
        <ol className="grid gap-px bg-border md:grid-cols-3">
          {CASCADE.map((etape, i) => (
            <li key={etape.titre} className="bg-card px-6 py-5 md:px-8">
              <div className="flex items-center gap-2.5">
                <span
                  className={
                    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold " +
                    etape.pastille
                  }
                >
                  {i + 1}
                </span>
                <span className="text-sm font-bold text-foreground">{etape.titre}</span>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{etape.texte}</p>
            </li>
          ))}
        </ol>
        <p className="border-t border-border px-6 py-5 text-sm leading-relaxed text-muted-foreground md:px-8">
          Dès qu’un intervenant accepte :{" "}
          <strong className="font-semibold text-foreground">contrat ou CDD édité</strong>, planning à
          jour, heures suivies, facture générée. Sans double saisie.
        </p>
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
          Le métier ne s’arrête pas quand la journée finit : restent les écrits et les séances à
          préparer. LEX prend cette part-là.
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
