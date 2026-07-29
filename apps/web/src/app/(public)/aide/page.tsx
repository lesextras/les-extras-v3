import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  GraduationCap,
  LifeBuoy,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { RUBRIQUES, TOUS_LES_ARTICLES } from "./contenu";
import { RechercheAide } from "./RechercheAide";

export const metadata: Metadata = {
  title: "Centre d’aide",
  description:
    "Réponses aux questions les plus fréquentes : publier un renfort, rejoindre le réseau, facturation, notifications, données personnelles.",
  alternates: { canonical: "/aide" },
};

const ICONES = {
  building: Building2,
  user: UserRound,
  wallet: Wallet,
  shield: ShieldCheck,
  bell: Bell,
  graduation: GraduationCap,
} as const;

export default function AidePage() {
  const entrees = TOUS_LES_ARTICLES.map((a) => ({
    slug: a.slug,
    question: a.question,
    reponse: a.reponse,
    rubriqueSlug: a.rubrique.slug,
    rubriqueTitre: a.rubrique.titre,
  }));

  return (
    <div className="section">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">
          <LifeBuoy className="size-3.5" aria-hidden />
          Centre d’aide
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Une question ? La réponse est sûrement là.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {entrees.length} réponses, classées par situation. Et si vous ne trouvez pas,
          l’équipe répond sous 48 h ouvrées.
        </p>
      </div>

      <RechercheAide entrees={entrees} />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RUBRIQUES.map((r, i) => {
          const Icone = ICONES[r.icone];
          return (
            <Link
              key={r.slug}
              href={`/aide/${r.slug}`}
              className={`group animate-fade-in-up ${
                ["stagger-1", "stagger-2", "stagger-3"][i % 3]
              } rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card`}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <Icone className="size-5" aria-hidden />
              </span>
              <p className="mt-3.5 font-semibold text-foreground">{r.titre}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.resume}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {r.articles.length} réponses
                <ArrowRight
                  className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center md:p-8">
        <p className="text-lg font-semibold text-foreground">Vous ne trouvez pas ?</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Écrivez-nous, ou demandez une démonstration si vous voulez qu’on vous montre
          la plateforme sur votre propre besoin.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Nous écrire
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Demander une démo
          </Link>
        </div>
      </div>
    </div>
  );
}
