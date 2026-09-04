import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, PenLine, ShieldCheck, Clock } from 'lucide-react';
import { metaPublique } from '@/lib/meta';
import { GUIDES_ECRITS } from './contenu';

export const metadata: Metadata = metaPublique({
  title: 'Guides des écrits professionnels',
  description:
    'Rapport de situation, projet personnalisé, ESS et GEVA-Sco, information préoccupante, bilan de fin d’accompagnement : six guides, avec les références juridiques vérifiées et de vrais exemples réécrits.',
  path: '/guides',
});

// Le carrefour des guides. Il ne vend rien : quelqu'un qui cherche « comment
// rédiger un rapport de situation » à 22 h un dimanche ne veut pas d'un
// argumentaire, il veut la réponse. La proposition d'essayer LEX arrive au
// bout du guide qu'il aura lu, pas avant qu'il ait commencé.

export default function GuidesPage() {
  return (
    <div className="section">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">
          <PenLine className="size-3.5" aria-hidden />
          Guides
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Les écrits professionnels, guide par guide
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Six guides écrits pour être utilisés un soir de rédaction, pas pour être
          feuilletés. Chaque référence juridique y est citée telle qu’elle se vérifie, et
          chaque guide contient des passages réécrits phrase par phrase.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
        {GUIDES_ECRITS.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
          >
            <h2 className="text-lg font-semibold text-foreground">{g.accroche}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {g.description}
            </p>
            <span className="mt-4 flex items-center justify-between text-sm font-medium text-primary">
              <span className="inline-flex items-center gap-1.5">
                Lire le guide
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <Clock className="size-3.5" aria-hidden />
                {g.minutes} min
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-border bg-card p-6">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          Comment ces guides sont vérifiés
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Chaque article de loi cité a été relu un par un avant publication. Trois erreurs
          très répandues ont été écartées à cette occasion : le Code de l’action sociale et
          des familles ne dit pas « projet personnalisé » mais « projet d’accueil et
          d’accompagnement » ; le rapport annuel au juge des enfants découle du dernier
          alinéa de l’article 375 du code civil et non de l’article L223-5 du CASF ; et
          l’article qui régit l’équipe de suivi de la scolarisation est le D351-10 du code
          de l’éducation, pas le D351-16-1, qui traite de l’aide humaine. Là où aucune
          norme n’existe : c’est le cas pour la règle « faits d’un côté, interprétation de
          l’autre » : , nous le disons plutôt que d’inventer une recommandation officielle.
        </p>
      </div>
    </div>
  );
}
