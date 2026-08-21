import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { metaPublique } from "@/lib/meta";
import { GUIDES, trouverGuide } from "../contenu";

// Les deux guides sont connus à la compilation : pages entièrement statiques,
// servies depuis le CDN, indexables sans dépendre de l'API.
export function generateStaticParams() {
  return GUIDES.map((g) => ({ guide: g.slug }));
}
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { guide: string } }): Metadata {
  const g = trouverGuide(params.guide);
  if (!g) return { title: "Guide introuvable", robots: { index: false, follow: false } };
  return metaPublique({
    title: g.titre,
    description: g.description,
    path: `/mode-demploi/${g.slug}`,
  });
}

/**
 * Le guide au format `HowTo` de schema.org : c'est le vocabulaire que Google
 * comprend pour un contenu « étape par étape », et il rend la page éligible
 * aux résultats enrichis. Chaque étape reprend exactement le texte affiché —
 * des données structurées qui divergent de la page valent une pénalité.
 */
function howTo(g: NonNullable<ReturnType<typeof trouverGuide>>) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: g.accroche,
    description: g.description,
    totalTime: g.duree,
    inLanguage: "fr-FR",
    step: g.etapes.map((e, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: e.titre,
      text: e.texte.join(" "),
      url: `https://les-extras.fr/mode-demploi/${g.slug}#etape-${i + 1}`,
    })),
  };
}

export default function GuidePage({ params }: { params: { guide: string } }) {
  const g = trouverGuide(params.guide);
  if (!g) notFound();

  return (
    <div className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo(g)) }}
      />

      <nav aria-label="Fil d'Ariane" className="mx-auto max-w-3xl text-sm text-muted-foreground">
        <Link href="/mode-demploi" className="hover:text-foreground">
          Mode d&rsquo;emploi
        </Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-foreground">{g.slug === "etablissement" ? "Établissements" : "Intervenants"}</span>
      </nav>

      <header className="mx-auto mt-6 max-w-3xl">
        <span className="eyebrow">
          <BookOpenCheck className="size-3.5" aria-hidden />
          Pas à pas
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          {g.accroche}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{g.description}</p>
      </header>

      <ol className="mx-auto mt-12 max-w-3xl space-y-10">
        {g.etapes.map((e, i) => (
          <li key={e.titre} id={`etape-${i + 1}`} className="relative pl-14">
            {/* Le numéro est décoratif : l'ordre est déjà porté par le <ol>. */}
            <span
              aria-hidden
              className="absolute left-0 top-0 inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            >
              {i + 1}
            </span>
            <h2 className="text-xl font-semibold text-foreground">{e.titre}</h2>
            {e.texte.map((t) => (
              <p key={t.slice(0, 40)} className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {t}
              </p>
            ))}
            {e.lien ? (
              <Link
                href={e.lien.href}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {e.lien.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          Une question que le guide ne couvre pas ?
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href={g.slug === "etablissement" ? "/register?type=etablissement" : "/register?type=intervenant"}>
              Créer mon compte
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/aide">Centre d&rsquo;aide</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
