"use client";

// Le parcours, par profil : ce que la plateforme fait pour vous, étape par
// étape. Chaque étape dit d'abord le problème tel qu'il se vit aujourd'hui,
// puis ce qui change — parce qu'un visiteur n'achète pas une fonctionnalité,
// il achète la disparition d'un problème qu'il reconnaît.
import * as React from "react";
import Link from "next/link";
import {
  Building2,
  UserRound,
  Check,
  Lock,
  ArrowRight,
  LayoutDashboard,
  CalendarClock,
  ShieldCheck,
  Sparkles,
  Megaphone,
  GraduationCap,
  PenLine,
  FileCheck2,
  Star,
  Target,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Niveau = "gratuit" | "adhesion" | "usage";

interface Etape {
  titre: string;
  texte: string;
  /** Ce que la personne vit aujourd'hui, sans nous. */
  probleme: string;
  /** Ce qui change concrètement. */
  change: string;
  niveau: Niveau;
  icone: React.ComponentType<{ className?: string }>;
}

const PARCOURS: Record<
  "etablissement" | "intervenant",
  { etapes: Etape[]; cta: { href: string; label: string } }
> = {
  etablissement: {
    cta: { href: "/register", label: "Créer un compte établissement" },
    etapes: [
      {
        niveau: "gratuit",
        icone: LayoutDashboard,
        titre: "Créez votre espace",
        texte: "Structure, unités, membres. Cinq minutes, sans engagement.",
        probleme:
          "Un cahier, un tableur, trois appels.",
        change:
          "Tout au même endroit. Même quand la personne qui savait est en congé.",
      },
      {
        niveau: "gratuit",
        icone: CalendarClock,
        titre: "Organisez votre équipe interne",
        texte:
          "Planning, missions récurrentes, congés et compteurs d’heures, import de l’équipe en CSV. Gratuit, pour toujours.",
        probleme:
          "Le planning vit dans la tête du chef de service.",
        change:
          "Chacun voit ses créneaux et déclare ses heures.",
      },
      {
        niveau: "gratuit",
        icone: ShieldCheck,
        titre: "Sécurisez vos obligations",
        texte:
          "Coffre-fort : identité, casier, diplômes, URSSAF. Alerte avant expiration.",
        probleme:
          "Un casier périmé se découvre le jour du contrôle.",
        change:
          "Vous êtes prévenue avant l’échéance, pas après.",
      },
      {
        niveau: "usage",
        icone: Sparkles,
        titre: "Réservez un atelier du réseau",
        texte:
          "Médiations clés en main. Devis sous 48 h, contrat et facture générés.",
        probleme:
          "Trouver, vérifier, négocier, contractualiser : des semaines pour une séance.",
        change:
          "Vous choisissez une fiche vérifiée. L’administratif se fait tout seul.",
      },
      {
        niveau: "usage",
        icone: Megaphone,
        titre: "Publiez un SOS Renfort",
        texte:
          "Votre équipe d’abord, puis les habitués, enfin le réseau. Le premier qui accepte est engagé. Rappel automatique la veille, validation hiérarchique en option.",
        probleme:
          "Un arrêt maladie à 21 h. Vingt appels, personne ne décroche.",
        change:
          "Le besoin descend tout seul, palier par palier. Rien à arbitrer.",
      },
      {
        niveau: "usage",
        icone: GraduationCap,
        titre: "Formez vos équipes",
        texte:
          "Parcours Qualiopi finançables OPCO. Émargement et attestations automatiques.",
        probleme:
          "Chercher l’organisme, monter le financement, justifier après coup.",
        change:
          "Un catalogue déjà certifié. Les justificatifs se remplissent au fil des séances.",
      },
      {
        niveau: "gratuit",
        icone: FileCheck2,
        titre: "Suivez et payez juste",
        texte:
          "72 h pour ajuster les heures après chaque mission, contrôle des plafonds légaux tous employeurs confondus, taux de missions pourvues, export paie en CSV.",
        probleme:
          "Les heures se contestent des semaines après, au moment de payer.",
        change:
          "Chacun vérifie dans les 72 h. Passé le délai, tout est validé et exportable.",
      },
      {
        niveau: "adhesion",
        icone: PenLine,
        titre: "Adhérez pour débloquer LEX",
        texte:
          "Assistant d’écriture, générateur d’activités, assistant intégré.",
        probleme:
          "Les écrits se rédigent le soir, après le service.",
        change:
          "Vos notes deviennent un écrit structuré. Vous relisez, vous signez.",
      },
    ],
  },
  intervenant: {
    cta: { href: "/register", label: "Proposer mes services" },
    etapes: [
      {
        niveau: "gratuit",
        icone: UserRound,
        titre: "Créez votre profil",
        texte:
          "Diplômes, expériences, zones d’intervention. Profil vérifié par l’équipe.",
        probleme:
          "À chaque structure, on renvoie les mêmes diplômes.",
        change:
          "Un profil vérifié une fois, qui parle pour vous partout.",
      },
      {
        niveau: "gratuit",
        icone: Sparkles,
        titre: "Publiez vos ateliers",
        texte:
          "Vos médiations au catalogue, à vos tarifs. Zéro commission.",
        probleme:
          "Faire connaître sa médiation tient au bouche-à-oreille.",
        change:
          "Votre atelier est présenté comme un produit. Votre prix reste le vôtre.",
      },
      {
        niveau: "gratuit",
        icone: Target,
        titre: "Répondez aux missions de renfort",
        texte:
          "Les opportunités qui collent à votre profil, filtrées par rayon autour de chez vous. Candidature en un clic, rappel la veille de chaque mission.",
        probleme:
          "Les remplacements circulent en groupes fermés.",
        change:
          "Les missions viennent à vous, filtrées sur votre métier et votre secteur.",
      },
      {
        niveau: "gratuit",
        icone: GraduationCap,
        titre: "Animez des formations",
        texte:
          "Intervenez sous la certification Qualiopi de l’association.",
        probleme:
          "Se déclarer organisme seul : Qualiopi, bilan pédagogique, mur administratif.",
        change:
          "Vous apportez le contenu, l’association porte le cadre.",
      },
      {
        niveau: "gratuit",
        icone: FileCheck2,
        titre: "Laissez la paperasse à la plateforme",
        texte:
          "Contrat, déclaration d’heures, facture : générés automatiquement.",
        probleme:
          "Chaque mission traîne son contrat, ses heures, sa facture à relancer.",
        change:
          "Tout part de la mission. Et un seul payeur au lieu de dix.",
      },
      {
        niveau: "gratuit",
        icone: Star,
        titre: "Gagnez en visibilité",
        texte:
          "Avis après mission, articles, points de fidélité : votre travail devient votre réputation.",
        probleme:
          "La réputation met dix ans à se construire et ne se transporte pas.",
        change:
          "Chaque intervention laisse une trace publique et vérifiable.",
      },
      {
        niveau: "gratuit",
        icone: Target,
        titre: "Progressez : Confirmé, puis Super Extra",
        texte:
          "Vos missions réussies vous font monter de palier. Les Super Extras sont prévenus en premier des renforts. Parrainez un collègue : 40 points chacun.",
        probleme:
          "Être fiable ne se voit nulle part et ne rapporte rien.",
        change:
          "Votre fiabilité devient un badge public et une priorité réelle sur les missions.",
      },
      {
        niveau: "adhesion",
        icone: PenLine,
        titre: "Adhérez pour débloquer LEX",
        texte:
          "Assistant d’écriture, générateur d’activités, assistant intégré.",
        probleme:
          "Comptes rendus et projets d’activité sur votre temps personnel.",
        change:
          "Vous dictez, LEX structure, vous relisez. Prénoms masqués, rien conservé.",
      },
    ],
  },
};

/** Une couleur par niveau : on lit le coût de l'étape avant de lire son titre. */
const NIVEAU: Record<
  Niveau,
  { label: string; icone: typeof Check; pastille: string; badge: string; halo: string; trait: string }
> = {
  gratuit: {
    label: "Gratuit",
    icone: Check,
    pastille: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40",
    badge: "bg-emerald-500/15 text-emerald-300",
    halo: "bg-emerald-500/25",
    trait: "from-emerald-500/60",
  },
  usage: {
    label: "À l’usage",
    icone: ArrowRight,
    pastille: "bg-amber-500/15 text-amber-300 ring-amber-500/40",
    badge: "bg-amber-500/15 text-amber-300",
    halo: "bg-amber-500/25",
    trait: "from-amber-500/60",
  },
  adhesion: {
    label: "Adhésion",
    icone: Lock,
    pastille: "bg-primary/20 text-primary ring-primary/40",
    badge: "bg-primary/15 text-primary",
    halo: "bg-primary/25",
    trait: "from-primary/60",
  },
};

export function TimelineParcours() {
  const [profil, setProfil] = React.useState<"etablissement" | "intervenant">("etablissement");
  const data = PARCOURS[profil];

  // Le trait se dessine et les étapes montent quand la section arrive à
  // l'écran, pas au chargement de la page : sinon l'animation est finie avant
  // que le visiteur n'ait descendu jusqu'ici, et il ne voit rien.
  const zone = React.useRef<HTMLDivElement>(null);
  const [anime, setAnime] = React.useState(false);

  React.useEffect(() => {
    const el = zone.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnime(true);
      return;
    }
    const io = new IntersectionObserver(
      (entrees) => {
        if (entrees[0]?.isIntersecting) {
          setAnime(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={zone}>
      {/* Sélecteur de profil — l'indicateur glisse d'un onglet à l'autre */}
      <div className="mx-auto grid w-fit grid-cols-2 gap-1 rounded-full border border-border bg-card p-1">
        {(
          [
            ["etablissement", "Je suis un établissement", Building2],
            ["intervenant", "Je suis un intervenant", UserRound],
          ] as const
        ).map(([cle, label, Icone]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setProfil(cle)}
            aria-pressed={profil === cle}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 md:px-5",
              profil === cle
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icone className="size-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{cle === "etablissement" ? "Établissement" : "Intervenant"}</span>
          </button>
        ))}
      </div>

      {/* Le fil. La clé change avec le profil : React remonte la liste, donc
          l'animation d'entrée rejoue et le changement de chemin se voit. */}
      <ol key={profil} className="relative mx-auto mt-12 max-w-3xl">
        {/* Trait continu, dégradé, qui se dessine de haut en bas */}
        <span
          aria-hidden
          className={cn(
            "absolute left-[19px] top-2 h-[calc(100%-2rem)] w-0.5 rounded-full bg-gradient-to-b from-emerald-500/50 via-amber-500/40 to-primary/50 md:left-[23px]",
            anime ? "animate-trait" : "scale-y-0",
          )}
        />

        {data.etapes.map((e, i) => {
          const n = NIVEAU[e.niveau];
          const IconeNiveau = n.icone;
          const IconeEtape = e.icone;
          return (
            <li
              key={e.titre}
              className={cn(
                "group relative flex gap-4 pb-10 last:pb-0 md:gap-6",
                anime ? "animate-etape" : "opacity-0",
              )}
              style={anime ? { animationDelay: `${i * 90}ms` } : undefined}
            >
              {/* Pastille : icône de l'étape, couleur du niveau, halo au survol */}
              <span className="relative z-10 shrink-0">
                <span
                  aria-hidden
                  className={cn(
                    "absolute -inset-1 rounded-full opacity-0 blur-md transition-all duration-500 group-hover:scale-110 group-hover:opacity-100",
                    n.halo,
                  )}
                />
                <span
                  className={cn(
                    "relative grid size-10 place-items-center rounded-full ring-1 transition-transform duration-300 group-hover:scale-110 md:size-12",
                    n.pastille,
                  )}
                >
                  <IconeEtape className="size-5" />
                </span>
              </span>

              {/* Carte de l'étape */}
              <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-card/60 p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-border group-hover:bg-card group-hover:shadow-card md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    Étape {i + 1}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      n.badge,
                    )}
                  >
                    <IconeNiveau className="size-3" />
                    {n.label}
                  </span>
                </div>

                <h3 className="mt-1.5 text-lg font-semibold text-foreground md:text-xl">{e.titre}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{e.texte}</p>

                {/* Le cœur du message : le problème, puis ce qui change. */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-destructive/5 p-3.5 ring-1 ring-inset ring-destructive/15">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-destructive/80">
                      <AlertCircle className="size-3.5" /> Aujourd’hui
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {e.probleme}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 p-3.5 ring-1 ring-inset ring-emerald-500/20">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                      <Check className="size-3.5" /> Ce que ça change
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{e.change}</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href={data.cta.href}>
            {data.cta.label}
            <ArrowRight />
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Gratuit = pour toujours · À l’usage = la prestation seule · Adhésion = LEX inclus
        </p>
      </div>
    </div>
  );
}
