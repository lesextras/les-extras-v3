import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Building2, ClipboardCheck, ListChecks, Scale, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { metaPublique } from '@/lib/meta';
import { ETABLISSEMENTS, SOCLE_COMMUN, trouverEtablissement } from '../donnees';

// Six types d'établissement connus à la compilation : pages entièrement
// statiques, servies sans toucher l'API.
export function generateStaticParams() {
  return ETABLISSEMENTS.map((e) => ({ etablissement: e.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({
  params: paramsPromesse,
}: {
  params: Promise<{ etablissement: string }>;
}): Promise<Metadata> {
  const params = await paramsPromesse;
  const e = trouverEtablissement(params.etablissement);
  if (!e) return { title: 'Ateliers', robots: { index: false, follow: false } };
  return metaPublique({
    title: e.titre,
    titrePartage: e.accroche,
    description: e.description,
    path: `/ateliers-pour/${e.slug}`,
  });
}

export default async function AteliersPourPage({
  params: paramsPromesse,
}: {
  params: Promise<{ etablissement: string }>;
}) {
  const params = await paramsPromesse;
  const e = trouverEtablissement(params.etablissement);
  if (!e) notFound();

  const autres = ETABLISSEMENTS.filter((x) => x.slug !== e.slug);
  const cadre = [...e.cadre, ...SOCLE_COMMUN];

  return (
    <div className="section">
      <nav aria-label="Fil d'Ariane" className="mx-auto max-w-3xl text-sm text-muted-foreground">
        <Link href="/ateliers" className="hover:text-foreground">
          Ateliers
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-foreground">{e.sigle}</span>
      </nav>

      <header className="mx-auto mt-6 max-w-3xl">
        <span className="eyebrow">
          <Building2 className="size-3.5" aria-hidden />
          {e.nom}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          {e.accroche}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{e.presentation}</p>
      </header>

      <article className="mx-auto mt-12 max-w-3xl">
        <section>
          <h2 className="text-xl font-semibold text-foreground">Qui est accueilli, et ce que ça change</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{e.publicAccueilli}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">
            Ce qu’un atelier apporte en {e.sigle}
          </h2>
          <ul className="mt-4 space-y-3">
            {e.cequunAtelierApporte.map((t) => (
              <li key={t.slice(0, 40)} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* La partie que les catalogues d'ateliers ne publient jamais, et qui
            est pourtant ce qu'une direction cherche : ce qui rate. */}
        <section className="mt-12 rounded-2xl border border-border bg-card p-6">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <TriangleAlert className="size-4 text-primary" aria-hidden />
            Les contraintes du lieu, à connaître avant de proposer quoi que ce soit
          </p>
          <ul className="mt-4 space-y-3">
            {e.contraintes.map((t) => (
              <li key={t.slice(0, 40)} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
            <ClipboardCheck className="size-5 text-primary" aria-hidden />
            Ce qu’on vérifie avant la première séance
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
Sur Les Extras, ces pièces sont déposées une fois et resservent à chaque
            intervention. Vous consultez ce dossier de conformité avant de réserver, pas après.
          </p>
          <ul className="mt-4 space-y-3">
            {e.avantDeFaireEntrer.map((t) => (
              <li key={t.slice(0, 40)} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="mt-12 rounded-2xl border border-border bg-card p-6">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Scale className="size-4 text-primary" aria-hidden />
            Le cadre qui s’applique
          </p>
          <dl className="mt-4 space-y-4">
            {cadre.map((r) => (
              <div key={r.ou}>
                <dt className="text-[15px] leading-relaxed text-foreground">{r.quoi}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{r.ou}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
Références relues une par une le 2 septembre 2026. Elles ne remplacent pas l’avis de
            votre direction.
          </p>
        </aside>

        <section className="mt-12">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
            <ListChecks className="size-5 text-primary" aria-hidden />
            Comment ça se passe, concrètement
          </h2>
          <ol className="mt-4 space-y-3">
            {[
              'Vous ouvrez les fiches qui correspondent à votre public : chaque fiche porte le tarif de l’intervenant, sa zone et ses disponibilités.',
              'Vous demandez un devis, établi sous 48 heures, sans commission : vous payez le tarif de l’intervenant, qui le touche en entier.',
              'Le contrat est généré et signé en ligne, la facture suit. Rien à ressaisir.',
              'Après l’intervention, ce que l’intervenant observe vous revient par écrit — c’est utilisable dans le projet personnalisé.',
            ].map((t, i) => (
              <li key={t.slice(0, 30)} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                >
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </section>
      </article>

      <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-base font-semibold text-foreground">
          Le catalogue est consultable sans créer de compte
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
Tarifs, zones et disponibilités sont visibles sans compte. Vous n’en créez un que pour
          demander un devis.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/ateliers">Voir le catalogue d’ateliers</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/comparatif-plateformes-remplacement">Ce que coûtent les autres</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <p className="text-sm font-semibold text-foreground">Pour un autre type d’établissement</p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          {autres.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/ateliers-pour/${a.slug}`}
                className="group inline-flex items-center gap-1.5 text-[15px] text-primary underline-offset-4 hover:underline"
              >
                {a.sigle}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Et si vous cherchez plutôt à écrire — bilan, rapport de situation, projet
          personnalisé —, les{' '}
          <Link href="/guides" className="text-primary underline-offset-4 hover:underline">
            guides des écrits professionnels
          </Link>{' '}
          sont en accès libre.
        </p>
      </div>
    </div>
  );
}
