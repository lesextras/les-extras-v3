import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { RUBRIQUES, trouverRubrique } from "../contenu";

export function generateStaticParams() {
  return RUBRIQUES.map((r) => ({ rubrique: r.slug }));
}

export function generateMetadata({ params }: { params: { rubrique: string } }): Metadata {
  const r = trouverRubrique(params.rubrique);
  if (!r) return { title: "Aide" };
  return {
    title: `${r.titre} — Centre d’aide`,
    description: r.resume,
    alternates: { canonical: `/aide/${r.slug}` },
  };
}

export default function RubriquePage({ params }: { params: { rubrique: string } }) {
  const rubrique = trouverRubrique(params.rubrique);
  if (!rubrique) notFound();

  // Balisage FAQ : ce sont de vraies paires question/réponse, visibles sans clic.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rubrique.articles.map((a) => ({
      "@type": "Question",
      name: a.question,
      acceptedAnswer: { "@type": "Answer", text: a.reponse.join(" ") },
    })),
  };

  const autres = RUBRIQUES.filter((r) => r.slug !== rubrique.slug);

  return (
    <div className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/aide"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Centre d’aide
      </Link>

      <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {rubrique.titre}
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        {rubrique.resume}
      </p>

      <div className="mt-10 max-w-3xl space-y-4">
        {rubrique.articles.map((a) => (
          <article
            key={a.slug}
            id={a.slug}
            className="scroll-mt-24 rounded-xl border border-border bg-card p-5 md:p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">{a.question}</h2>
            {a.reponse.map((p, i) => (
              <p key={i} className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </article>
        ))}
      </div>

      <div className="mt-12 max-w-3xl">
        <p className="text-sm font-semibold text-foreground">Autres rubriques</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {autres.map((r) => (
            <Link
              key={r.slug}
              href={`/aide/${r.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
            >
              {r.titre}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
