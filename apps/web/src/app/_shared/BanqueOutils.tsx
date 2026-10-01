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
import { ArrowRight, Download, FolderOpen, Puzzle, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES_RESSOURCES, RESSOURCES, type Ressource } from '@/lib/ressources';
import { Reveal } from './Reveal';
import { ChoixCategorieOutils } from './ChoixCategorieOutils';

/**
 * DEUX VITRINES MISES EN AVANT (01/10/2026, demande de Siham : « mets en avant
 * les fiches d'activité et d'aide du quotidien, design et joli ; toutes les
 * catégories en dessous dans une liste déroulante »).
 */
const VITRINES = [
  {
    code: 'activites',
    titre: 'Fiches d’activité',
    sousTitre: 'Prêtes à animer, sur une page.',
    icone: Puzzle,
    categories: ['activites', 'animation'],
    lien: '/ressources?categorie=activites',
    halo: 'from-primary/25',
  },
  {
    code: 'quotidien',
    titre: 'Aide au quotidien',
    sousTitre: 'Routines, repères, motivation, émotions.',
    icone: Sun,
    categories: ['temps', 'motivation', 'emotions'],
    lien: '/ressources?categorie=temps',
    halo: 'from-amber-400/25',
  },
] as const;

function Apercu({ r }: { r: Ressource }) {
  return (
    <a
      href={r.fichier}
      download
      className="group/carte relative block overflow-hidden rounded-xl border border-border bg-background no-underline shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={r.apercu}
          alt=""
          fill
          sizes="(min-width: 1024px) 14vw, (min-width: 640px) 28vw, 45vw"
          className="object-cover object-top transition-transform duration-700 group-hover/carte:scale-105"
        />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-8 text-xs font-semibold text-white opacity-0 transition group-hover/carte:opacity-100">
          <Download className="size-3.5" aria-hidden />
          PDF
        </span>
      </div>
      <p className="line-clamp-2 p-2.5 text-[13px] font-semibold leading-snug text-foreground">{r.titre}</p>
    </a>
  );
}

export function BanqueOutils() {
  const categories = CATEGORIES_RESSOURCES.map((c) => ({ id: c.id, titre: c.titre, n: RESSOURCES.filter((r) => r.categorie === c.id).length })).filter((c) => c.n > 0);

  return (
    <section id="outils-gratuits" className="scroll-mt-24">
      <div className="section">
        <Reveal className="max-w-3xl">
          <span className="eyebrow flex w-fit">
            <FolderOpen className="size-3.5" />
            Outils gratuits · sans compte
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
            Le planning, la grille, l’affiche : déjà prêts
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">{RESSOURCES.length} outils à imprimer ou à modifier, écrits par ADéPA.</p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {VITRINES.map((v, i) => {
            const Icone = v.icone;
            const liste = RESSOURCES.filter((r) => (v.categories as readonly string[]).includes(r.categorie));
            return (
              <Reveal key={v.code} delay={i * 120} className="h-full">
                <div className="reflet relative h-full overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
                  <div className={`pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-gradient-to-br ${v.halo} to-transparent blur-2xl`} aria-hidden />
                  <div className="relative flex items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                      <Icone className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold tracking-tight text-foreground">{v.titre}</h3>
                      <p className="text-sm text-muted-foreground">{v.sousTitre}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-background px-3 py-1 text-sm font-bold text-foreground ring-1 ring-border">{liste.length}</span>
                  </div>
                  <div className="relative mt-5 grid grid-cols-3 gap-3">
                    {liste.slice(0, 3).map((r) => (
                      <Apercu key={r.id} r={r} />
                    ))}
                  </div>
                  <Link
                    href={v.lien}
                    className="group relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary no-underline"
                  >
                    Tout voir
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={160} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <ChoixCategorieOutils categories={categories} />
          <Button asChild size="lg">
            <Link href="/ressources">
              Voir les {RESSOURCES.length} outils
              <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
