/**
 * LA BANQUE D'OUTILS GRATUITS SUR L'ACCUEIL (01/10/2026, demande de Siham :
 * « présente cette ressource dans la home page »).
 *
 * Le problème d'abord, comme les autres sections : le support qu'on refait
 * chaque année. Puis quatre outils qu'on télécharge en un clic, sans compte,
 * et les catégories qui mènent chacune à /ressources déjà filtré.
 *
 * ⚠ TOUT VIENT DE `lib/ressources.ts` : les compteurs, les titres, les
 * fichiers. Aucun nombre écrit ici à la main, sinon l'accueil annoncera un
 * jour un nombre d'outils que la page ne tient plus.
 *
 * ⚠ COMPOSANT SERVEUR, aucune donnée d'API : le bloc ne disparaît pas
 * pendant un redéploiement.
 */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Download, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES_RESSOURCES, RESSOURCES } from '@/lib/ressources';
import { Reveal } from './Reveal';

/** Quatre « incontournables » (voir `INCONTOURNABLES`) : social, éducation spécialisée, accueil de loisirs, motivation. */
const A_LA_UNE = ['budget-familial-mensuel', 'trame-scenario-social', 'fiche-d-inscription-accueil-de-loisirs', 'tableau-motivation-semaine'];

export function BanqueOutils() {
  const une = A_LA_UNE.map((id) => RESSOURCES.find((r) => r.id === id)).filter((r) => r !== undefined);
  const modifiables = RESSOURCES.filter((r) => r.modifiables.length > 0).length;
  const categories = CATEGORIES_RESSOURCES.map((c) => ({ ...c, n: RESSOURCES.filter((r) => r.categorie === c.id).length })).filter((c) => c.n > 0);

  return (
    <section id="outils-gratuits" className="scroll-mt-24">
      <div className="section">
        <Reveal className="max-w-3xl">
          <span className="eyebrow flex w-fit">
            <FolderOpen className="size-3.5" />
            Outils gratuits · sans compte
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
            Le planning, la grille, l’affiche qu’on refait chaque année : déjà prêts
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {RESSOURCES.length} outils écrits par l’association ADéPA pour l’éducation, l’animation, le
            handicap, la protection de l’enfance et la vie associative. En PDF à imprimer, et {modifiables}{' '}
            d’entre eux aussi en Word, Excel ou PowerPoint à modifier.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {une.map((r, i) => (
            <Reveal key={r.id} delay={i * 90} className="h-full">
              <a
                href={r.fichier}
                download
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background no-underline shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-muted">
                  {/* `alt` vide : le titre est écrit juste en dessous, dans le même lien. */}
                  <Image
                    src={r.apercu}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">{r.theme}</span>
                  <h3 className="text-base font-semibold leading-snug text-foreground">{r.titre}</h3>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-primary">
                    <Download className="size-4" aria-hidden />
                    Télécharger le PDF
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-8">
          <ul className="flex flex-wrap gap-2" aria-label="Les catégories d’outils">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/ressources?categorie=${c.id}`}
                  className="inline-flex rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium no-underline transition hover:border-foreground/40"
                >
                  {c.titre} <span className="ml-1 opacity-60">({c.n})</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={160} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button asChild size="lg">
            <Link href="/ressources">
              Voir les {RESSOURCES.length} outils
              <ArrowRight />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">Filtrez par métier, par âge et par format. Aucune adresse e-mail demandée.</p>
        </Reveal>
      </div>
    </section>
  );
}
