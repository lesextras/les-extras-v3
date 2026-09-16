import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, MapPin, Users } from "lucide-react";
import { SOCLE_OG } from "@/lib/meta";
import { METIERS, VILLES, trouverVille } from "../donnees";

export function generateStaticParams() {
  return VILLES.map((v) => ({ ville: v.slug }));
}

/**
 * Le gabarit doit tenir dans 65 caractères SUFFIXE COMPRIS : le titre racine
 * ajoute « · LES EXTRAS », soit 13 caractères, ce qui laisse 52 ici. Pire cas
 * = le nom de territoire le plus long, « Seine-Saint-Denis » (17) :
 * « Renfort éducatif  » (17) + 17 + « — RenforTeam » précédé d'une espace (13)
 * = 47, donc 60 affichés. L'ancien suffixe « — intervenants qualifiés » (25)
 * portait le même cas à 72. La promesse n'est pas perdue : « dossier de
 * conformité » reste dans la description.
 *
 * Même arithmétique pour la description, plafonnée à 160 : la partie fixe fait
 * 135 caractères, plus le nom du territoire (17 au pire) = 152. « Profils
 * vérifiés » y figurait auparavant : la mention est fausse tant qu'aucun
 * contrôle d'identité ni de casier n'est réellement opéré, et elle a donc été
 * remplacée par ce que le produit fait vraiment — un dossier de conformité.
 */
export async function generateMetadata({ params: paramsPromesse }: { params: Promise<{ ville: string }>}): Promise<Metadata> {
  const params = await paramsPromesse;
  const v = trouverVille(params.ville);
  /**
   * ⚠⚠ `noindex` SUR UNE VILLE INCONNUE — même raison que `/aide/[rubrique]`.
   * La frontière Suspense de `(public)/loading.tsx` fait partir la coquille
   * avant `notFound()` : `/renfort/nimporte-ou` répondait 200 et `index,
   * follow` (mesuré le 16/09/2026). Sur des pages de ville, c'est le pire
   * endroit où laisser ça : une adresse inventée par ville concurrence
   * directement les six vraies pages locales.
   */
  if (!v) return { title: "Renfort", robots: { index: false, follow: true } };
  return {
    title: `Renfort éducatif ${v.nom}, RenforTeam`,
    description: `${v.nom} : un intervenant qualifié pour un remplacement en établissement médico-social. Dossier de conformité, contrat généré, zéro commission.`,
    alternates: { canonical: `/renfort/${v.slug}` },
    // Sans `url`, le partage héritait de celui du layout racine (« / ») :
    // une publicité pointant sur la page Melun s'affichait avec l'adresse
    // de l'accueil.
    //
    // Pas de `metaPublique` ici : la description de partage est volontairement
    // plus courte que celle des résultats de recherche, et le helper n'en pose
    // qu'une seule. `SOCLE_OG` réémet ce que la fusion de surface efface —
    // image, `siteName`, locale, `type`. Voir `lib/meta.ts`.
    openGraph: {
      ...SOCLE_OG,
      url: `/renfort/${v.slug}`,
      title: `Renfort éducatif ${v.nom}, RenforTeam`,
      description: `Trouver un intervenant qualifié pour un remplacement en établissement médico-social à ${v.nom} et alentours.`,
    },
  };
}

export default async function VillePage({ params: paramsPromesse }: { params: Promise<{ ville: string }>}) {
  const params = await paramsPromesse;
  const ville = trouverVille(params.ville);
  if (!ville) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Renfort éducatif en établissement médico-social",
    provider: { "@type": "Organization", name: "Les Extras, ADéPA" },
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
          href="/renforteam"
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
          href="/renforteam"
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
