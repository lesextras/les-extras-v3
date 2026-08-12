import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, MapPin, Users } from "lucide-react";
import { METIERS, VILLES, trouverVille } from "../donnees";

export function generateStaticParams() {
  return VILLES.map((v) => ({ ville: v.slug }));
}

export function generateMetadata({ params }: { params: { ville: string } }): Metadata {
  const v = trouverVille(params.ville);
  if (!v) return { title: "Renfort" };
  return {
    title: `Renfort éducatif ${v.nom} — intervenants qualifiés`,
    description: `Trouver un intervenant qualifié pour un remplacement en établissement médico-social à ${v.nom} et alentours. Profils vérifiés, contrat généré, zéro commission côté intervenant.`,
    alternates: { canonical: `/renfort/${v.slug}` },
  };
}

export default function VillePage({ params }: { params: { ville: string } }) {
  const ville = trouverVille(params.ville);
  if (!ville) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Renfort éducatif en établissement médico-social",
    provider: { "@type": "Organization", name: "Les Extras — ADéPA" },
    areaServed: { "@type": "AdministrativeArea", name: ville.nom },
    description: ville.contexte,
  };

  const autres = VILLES.filter((v) => v.slug !== ville.slug);

  return (
    <div className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Fil d’Ariane" className="text-sm text-muted-foreground">
        <Link href="/renfort" className="transition-colors hover:text-foreground">
          Renfort
        </Link>
        <span aria-hidden> · </span>
        <span className="text-foreground">{ville.nom}</span>
      </nav>

      <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
        Renfort éducatif à {ville.nom}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        {ville.contexte}
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/register"
          className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          Publier un besoin
        </Link>
        <Link
          href="/sos-renfort"
          className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Comment ça marche
        </Link>
      </div>

      <section className="mt-12 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <MapPin className="size-4 text-secondary" aria-hidden />
          Communes couvertes depuis {ville.nom}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ville.autour.map((c) => (
            <span
              key={c}
              className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground/80"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Users className="size-4 text-primary" aria-hidden />
          Métiers disponibles sur ce secteur
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METIERS.map((m) => (
            <Link
              key={m.slug}
              href={`/renfort/metier/${m.slug}`}
              className="group rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
            >
              <p className="font-semibold text-foreground">{m.nom}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.structures}</p>
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

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <Building2 className="size-4 text-primary" aria-hidden />
          Comment ça se passe
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Vous publiez le besoin en quelques minutes. Il part d’abord vers vos propres
          salariés rattachés au compte, puis vers les intervenants déjà venus chez vous,
          puis vers le réseau du secteur. Le premier qui accepte emporte la mission, et le
          contrat se génère tout seul.
        </p>
        <Link
          href="/sos-renfort"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Le détail de la cascade
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Autres territoires</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {autres.map((v) => (
            <Link
              key={v.slug}
              href={`/renfort/${v.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-secondary/40 hover:text-secondary"
            >
              {v.nom}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
