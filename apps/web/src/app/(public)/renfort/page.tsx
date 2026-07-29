import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Megaphone, UserRound } from "lucide-react";
import { METIERS, VILLES } from "./donnees";

export const metadata: Metadata = {
  title: "Renfort éducatif — par métier et par territoire",
  description:
    "Trouvez un intervenant qualifié pour un remplacement en établissement médico-social : éducateur spécialisé, moniteur-éducateur, AES, psychologue. Île-de-France.",
  alternates: { canonical: "/renfort" },
};

export default function RenfortIndexPage() {
  return (
    <div className="section">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">
          <Megaphone className="size-3.5" aria-hidden />
          SOS Renfort
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Un renfort, par métier et par territoire
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Choisissez le métier que vous cherchez, ou le territoire où vous êtes.
          Chaque page explique ce que couvre le renfort et ce qui est vérifié avant
          la mise en relation.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <UserRound className="size-4 text-primary" aria-hidden />
          Par métier
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METIERS.map((m) => (
            <Link
              key={m.slug}
              href={`/renfort/metier/${m.slug}`}
              className="group rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
            >
              <p className="font-semibold text-foreground">{m.nom}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {m.structures}
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Voir
                <ArrowRight
                  className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MapPin className="size-4 text-secondary" aria-hidden />
          Par territoire
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VILLES.map((v) => (
            <Link
              key={v.slug}
              href={`/renfort/${v.slug}`}
              className="group rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-card"
            >
              <p className="font-semibold text-foreground">{v.nom}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {v.autour.slice(0, 3).join(", ")}…
              </p>
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
                Voir
                <ArrowRight
                  className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
