import Link from 'next/link';
import type { ReactNode } from 'react';
import { BTN_PRIMAIRE, CARTE_VIVE, Pastille } from './_ui';
import { LIBELLES_COUT, type Avantage } from './_avantages';

/**
 * UNE FICHE « CE À QUOI J'AI DROIT ».
 *
 * En haut, ce qu'on gagne et pour qui : ça se lit en trois secondes. En
 * dessous, replié, ce qu'il faut et la marche à suivre, comme une notice
 * qu'on déplie quand on décide de le faire. Le bouton « Demander » reste
 * visible tout le temps. Pas de JavaScript : un <details> natif.
 */

function LienDirect({ href, children, className }: { href: string; children: ReactNode; className: string }) {
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener" className={className}>
      {children}
    </a>
  );
}

export function CarteAvantage({ avantage: a, numero, duree, ouvert = false }: { avantage: Avantage; numero?: number; duree?: string; ouvert?: boolean }) {
  const externe = !a.lien.startsWith('/');
  return (
    <article id={a.code} className={`${CARTE_VIVE} scroll-mt-24 p-5 sm:p-6`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {numero ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-sm font-extrabold text-white">{numero}</span>
            ) : null}
            <Pastille ton={a.cout === 'PUBLIC' ? 'accent' : a.cout === 'REMISE' ? 'attention' : 'ok'}>{LIBELLES_COUT[a.cout]}</Pastille>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Par {a.par}</span>
          </div>
          <h3 className="mt-2 text-xl font-extrabold leading-snug text-[#1D1B5C]">{a.nom}</h3>
          <p className="mt-2 max-w-[62ch] leading-relaxed">{a.gain}</p>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed">
            <span className="font-bold text-[#6B6A8A]">Pour qui : </span>
            {a.pourQui}
          </p>
          {a.coutDetail ? <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-[#6B6A8A]">{a.coutDetail}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <LienDirect href={a.lien} className={`${BTN_PRIMAIRE} !py-2.5 text-sm`}>
            {a.lienLibelle}
            {externe ? ' ↗' : ' →'}
          </LienDirect>
          {a.delai ? <span className="text-xs text-[#6B6A8A]">Délai : {a.delai}</span> : null}
          {duree ? <span className="text-xs text-[#6B6A8A]">Ça prend : {duree}</span> : null}
        </div>
      </div>

      <details className="group mt-4 rounded-xl bg-[#F5F4FC]" open={ouvert}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#1D1B5C] transition hover:bg-[#ECEBFC] [&::-webkit-details-marker]:hidden">
          <span>Ce qu&apos;il te faut, et comment faire pas à pas</span>
          <span className="text-[#4F46E5] transition-transform duration-300 group-open:rotate-180" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </summary>
        <div className="grid gap-5 px-4 pb-5 pt-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Il te faut</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
              {a.ilTeFaut.map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4F46E5]" aria-hidden="true" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">Comment faire</p>
            <ol className="mt-2 space-y-2 text-sm leading-relaxed">
              {a.commentFaire.map((x, i) => (
                <li key={x} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-[#4F46E5] ring-1 ring-[#C7C4F2]">{i + 1}</span>
                  <span>{x}</span>
                </li>
              ))}
            </ol>
            {a.liensUtiles?.length ? (
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {a.liensUtiles.map((l) => (
                  <LienDirect key={l.url} href={l.url} className="font-bold text-[#4F46E5] underline underline-offset-4">
                    {l.libelle}
                    {l.url.startsWith('/') ? ' →' : ' ↗'}
                  </LienDirect>
                ))}
              </p>
            ) : null}
          </div>
        </div>
      </details>
    </article>
  );
}
