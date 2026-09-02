// Catalogue PUBLIC des ateliers (consultable sans connexion).
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CatalogView } from "../_catalog";
import { ETABLISSEMENTS } from "../ateliers-pour/donnees";
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: "Ateliers éducatifs, médiation et prévention",
  description:
    "Découvrez le catalogue public des ateliers, médiations, art-thérapie et actions de prévention proposés sur Les Extras.",
  path: "/ateliers",
});

export default async function AteliersCatalogPage({
  searchParams: searchParamsPromesse,
}: {
  searchParams?: Promise<{ search?: string; category?: string }>;
}) {
  const searchParams = await searchParamsPromesse;
  return (
    <>
      <CatalogView
        type="atelier"
        basePath="/ateliers"
        title="Nos ateliers"
        subtitle="Ateliers éducatifs, médiation, art-thérapie, prévention… un catalogue d'interventions clé en main, animées par les intervenants du réseau."
        searchPlaceholder="Rechercher un atelier…"
        emptyTitle="Catalogue d'ateliers en préparation"
        searchParams={searchParams}
      />

      {/*
        LES SIX PAGES SECTORIELLES, ATTEIGNABLES DEPUIS LE CATALOGUE.

        Sans ce bloc, elles ne seraient reliées que par le plan du site : un
        moteur de recherche suit les liens, il ne devine pas. Et pour un
        visiteur, la question qui précède « quel atelier ? » est toujours
        « est-ce que ça marche chez moi ? » — c'est à cette question-là que ces
        pages répondent, chacune avec les contraintes de son type de structure.
      */}
      <section className="mt-16 border-t border-border pt-10">
        <h2 className="text-xl font-semibold text-foreground">
          Un atelier chez vous, concrètement
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Ce qui fonctionne dans un ITEP ne fonctionne pas dans un EHPAD, et les contraintes
          d’un service sans murs n’ont rien à voir avec celles d’un internat. Six pages, une
          par type de structure : ce qu’un atelier y apporte, ce qui rate, et ce qu’il faut
          vérifier avant la première séance.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ETABLISSEMENTS.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/ateliers-pour/${e.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
              >
                <span className="text-sm font-semibold text-foreground">
                  Ateliers en {e.sigle}
                </span>
                <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {e.nom}
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  Lire
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
