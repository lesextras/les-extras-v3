import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, MapPin, ShieldCheck } from "lucide-react";
import { metaPublique } from "@/lib/meta";
import { METIERS, VILLES, trouverMetier } from "../../donnees";

export function generateStaticParams() {
  return METIERS.map((m) => ({ slug: m.slug }));
}

/**
 * Le nom du métier passe en minuscules au milieu du titre — sauf les sigles,
 * qu'un `toLowerCase()` global transformait en « remplacement aes / amp ».
 */
function enMinuscules(nom: string): string {
  return nom
    .split(" ")
    .map((mot) => (mot === mot.toUpperCase() ? mot : mot.toLowerCase()))
    .join(" ");
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const m = trouverMetier(params.slug);
  if (!m) return { title: "Renfort" };
  // Titre et description de partage étaient déjà ceux de la page : le helper
  // les produit à l'identique et rétablit la carte de partage, que cet objet
  // `openGraph` effaçait en remplaçant celui du layout racine.
  //
  // Le titre racine ajoute « · LES EXTRAS » (13 caractères) : il reste 52 ici
  // pour tenir sous 65. Pire cas = le métier au nom le plus long,
  // « Éducateur de jeunes enfants » (27) : « Remplacement  » (13) + 27 = 40,
  // soit 53 affichés. D'où l'absence du suffixe « — RenforTeam » (13) que les
  // pages territoire, elles, conservent : 40 + 13 = 53 > 52, et ce métier
  // sortait à 66. Le dispositif reste nommé dans le corps de la page.
  return metaPublique({
    title: `Remplacement ${enMinuscules(m.nom)}`,
    description: m.accroche,
    path: `/renfort/metier/${m.slug}`,
  });
}

export default function MetierPage({ params }: { params: { slug: string } }) {
  const metier = trouverMetier(params.slug);
  if (!metier) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: `Remplacement ${metier.nom}`,
    provider: { "@type": "Organization", name: "Les Extras — ADéPA" },
    areaServed: VILLES.map((v) => ({ "@type": "AdministrativeArea", name: v.nom })),
    description: metier.accroche,
  };

  const autres = METIERS.filter((m) => m.slug !== metier.slug);

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
        <span className="text-foreground">{metier.nom}</span>
      </nav>

      <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
        Remplacement {metier.nom.toLowerCase()} en établissement médico-social
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        {metier.accroche}
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/register"
          className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          Publier un besoin
        </Link>
        <Link
          href="/renforteam"
          className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Comment marche la cascade
        </Link>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Clock className="size-4 text-primary" aria-hidden />
            Ce que couvre le renfort
          </h2>
          <ul className="mt-4 space-y-2.5">
            {metier.missions.map((m) => (
              <li key={m} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            Ce qui est vérifié avant la mise en relation
          </h2>
          <ul className="mt-4 space-y-2.5">
            {metier.verifications.map((v) => (
              <li key={v} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {v}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Les pièces vivent dans le coffre-fort de conformité, avec une alerte avant
            chaque échéance.
          </p>
        </section>
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground">Structures concernées</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{metier.structures}</p>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MapPin className="size-4 text-secondary" aria-hidden />
          Où nous intervenons
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {VILLES.map((v) => (
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Autres métiers</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {autres.map((m) => (
            <Link
              key={m.slug}
              href={`/renfort/metier/${m.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
            >
              {m.nom}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
