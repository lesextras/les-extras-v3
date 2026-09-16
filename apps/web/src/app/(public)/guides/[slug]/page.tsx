import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, Scale, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { metaPublique } from '@/lib/meta';
import { GUIDES_ECRITS, trouverGuideEcrit, type Bloc } from '../contenu';

// Six guides connus à la compilation : pages entièrement statiques, servies
// sans toucher l'API, indexables même si l'API tousse.
export function generateStaticParams() {
  return GUIDES_ECRITS.map((g) => ({ slug: g.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({
  params: paramsPromesse,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await paramsPromesse;
  const g = trouverGuideEcrit(params.slug);
  if (!g) return { title: 'Guide introuvable', robots: { index: false, follow: false } };
  return metaPublique({
    title: g.titre,
    titrePartage: g.accroche,
    description: g.description,
    path: `/guides/${g.slug}`,
  });
}

/**
 * Deux blocs de données structurées, et pas un de plus.
 *
 * `Article` dit à Google qui écrit et de quoi il s'agit. `FAQPage` rend les
 * questions éligibles aux résultats enrichis — c'est le format qui gagne le
 * plus de surface sur une page de résultats, et nos concurrents ne le posent
 * pas. Les questions et réponses sont reprises MOT POUR MOT de la page :
 * des données structurées qui divergent du contenu visible valent une
 * pénalité, pas un bonus.
 */
function donneesStructurees(g: NonNullable<ReturnType<typeof trouverGuideEcrit>>) {
  const url = `https://les-extras.fr/guides/${g.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: g.accroche,
        description: g.description,
        inLanguage: 'fr-FR',
        mainEntityOfPage: url,
        author: { '@id': 'https://les-extras.fr/#organisation' },
        publisher: { '@id': 'https://les-extras.fr/#organisation' },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: g.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.r },
        })),
      },
    ],
  };
}

function RenduBloc({ bloc }: { bloc: Bloc }) {
  if (bloc.type === 'p') {
    return (
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{bloc.texte}</p>
    );
  }
  if (bloc.type === 'liste') {
    return (
      <ul className="mt-4 space-y-2.5">
        {bloc.items.map((i) => (
          <li
            key={i.slice(0, 48)}
            className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    );
  }
  // Le bloc qui fait la différence avec un contenu écrit pour le moteur de
  // recherche : deux versions d'une même phrase, et la raison du changement.
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
          Ce qu’on lit souvent
        </p>
        <p className="mt-2 text-[15px] italic leading-relaxed text-muted-foreground">
          « {bloc.avant} »
        </p>
      </div>
      <div className="border-b border-border bg-success/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-success">
          Ce qui tient
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground">« {bloc.apres} »</p>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pourquoi
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bloc.pourquoi}</p>
      </div>
    </div>
  );
}

export default async function GuideEcritPage({
  params: paramsPromesse,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromesse;
  const g = trouverGuideEcrit(params.slug);
  if (!g) notFound();

  const autres = GUIDES_ECRITS.filter((x) => x.slug !== g.slug).slice(0, 3);

  return (
    <div className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees(g)) }}
      />

      <nav aria-label="Fil d'Ariane" className="mx-auto max-w-3xl text-sm text-muted-foreground">
        <Link href="/guides" className="hover:text-foreground">
          Guides
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-foreground">{g.titre}</span>
      </nav>

      <header className="mx-auto mt-6 max-w-3xl">
        <span className="eyebrow">
          <PenLine className="size-3.5" aria-hidden />
          Écrits professionnels
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          {g.accroche}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{g.chapo}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {g.minutes} minutes de lecture
        </p>
      </header>

      {g.cadre.length > 0 ? (
        <aside className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Scale className="size-4 text-primary" aria-hidden />
            Ce que dit le droit
          </p>
          <dl className="mt-4 space-y-4">
            {g.cadre.map((r) => (
              <div key={r.ou}>
                <dt className="text-[15px] leading-relaxed text-foreground">{r.quoi}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{r.ou}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            Références relues une par une le 2 septembre 2026. Elles vous situent ; elles
            ne remplacent pas l’avis de votre chef de service ni celui d’un juriste.
          </p>
        </aside>
      ) : null}

      <article className="mx-auto mt-12 max-w-3xl">
        {g.sections.map((s) => (
          <section key={s.titre} className="mt-12 first:mt-0">
            <h2 className="text-xl font-semibold text-foreground text-balance">{s.titre}</h2>
            {s.blocs.map((b, i) => (
              <RenduBloc key={`${s.titre}-${i}`} bloc={b} />
            ))}
          </section>
        ))}

        <section className="mt-16">
          <h2 className="text-xl font-semibold text-foreground">Questions fréquentes</h2>
          <dl className="mt-6 space-y-6">
            {g.faq.map((f) => (
              <div key={f.q}>
                <dt className="text-[15px] font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {f.r}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </article>

      <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-base font-semibold text-foreground">
          Écrire, c’est votre métier. Structurer, non.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          LEX apprend la trame de votre établissement, propose un brouillon depuis vos
          notes et signale les phrases qui glissent vers le jugement. Les noms ne quittent
          jamais votre poste : ils sont remplacés par des rôles avant tout traitement, puis
          rétablis chez vous. Quinze générations offertes chaque mois, sans carte bancaire
          et sans date de fin.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/register">Créer un compte</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/confiance-lex">Comment vos données sont protégées</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <p className="text-sm font-semibold text-foreground">À lire ensuite</p>
        <ul className="mt-4 space-y-3">
          {autres.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/guides/${a.slug}`}
                className="group inline-flex items-center gap-2 text-[15px] text-primary underline-offset-4 hover:underline"
              >
                {a.accroche}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
