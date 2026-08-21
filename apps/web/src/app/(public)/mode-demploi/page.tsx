import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, UserRound, BookOpenCheck } from "lucide-react";
import { metaPublique } from "@/lib/meta";
import { GUIDES } from "./contenu";

export const metadata: Metadata = metaPublique({
  title: "Mode d'emploi",
  description:
    "Les deux parcours complets, pas à pas : publier un renfort ou réserver un atelier côté établissement ; profil vérifié, missions et facturation côté intervenant.",
  path: "/mode-demploi",
});

// Le carrefour tient sur un écran : deux publics, deux guides, et rien
// d'autre. Celui qui arrive ici a déjà décidé de comprendre — on ne lui
// revend pas le produit, on lui montre le chemin.
const ICONES = { etablissement: Building2, intervenant: UserRound } as const;

export default function ModeDemploiPage() {
  return (
    <div className="section">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">
          <BookOpenCheck className="size-3.5" aria-hidden />
          Mode d&rsquo;emploi
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Le parcours complet, pas à pas
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Deux guides, un par public. Dix minutes de lecture chacun, dans
          l&rsquo;ordre où les choses se passent vraiment — et pour une question
          ponctuelle, le <Link href="/aide" className="text-primary underline-offset-4 hover:underline">centre d&rsquo;aide</Link> répond
          point par point.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        {GUIDES.map((g) => {
          const Icone = ICONES[g.slug as keyof typeof ICONES] ?? BookOpenCheck;
          return (
            <Link
              key={g.slug}
              href={`/mode-demploi/${g.slug}`}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <Icone className="size-5 text-primary" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{g.accroche}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Lire le guide
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
