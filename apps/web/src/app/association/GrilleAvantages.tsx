'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * CE À QUOI J'AI DROIT, EN CARTES.
 *
 * Une carte courte par avantage : qui l'offre, ce que c'est, une ligne. Un
 * clic ouvre la fiche complète dans une fenêtre, par-dessus la page.
 */
export interface CarteCourte {
  code: string;
  nom: string;
  par: string;
  gain: string;
  cout: string;
  ton: string;
  fiche: ReactNode;
}

export function GrilleAvantages({ cartes }: { cartes: CarteCourte[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const active = cartes.find((c) => c.code === ouverte) ?? null;

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h && cartes.some((c) => c.code === h)) setOuverte(h);
  }, [cartes]);

  useEffect(() => {
    if (!active) return;
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuverte(null);
    };
    window.addEventListener('keydown', echap);
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', echap);
      document.body.style.overflow = avant;
    };
  }, [active]);

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cartes.map((c) => (
          <li key={c.code} id={c.code} className="scroll-mt-24">
            <button
              type="button"
              onClick={() => setOuverte(c.code)}
              className="group flex h-full w-full flex-col rounded-2xl border border-[#E6E4F3] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#4F46E5] hover:shadow-[0_12px_28px_-20px_rgba(29,27,92,0.8)]"
            >
              <span className="flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.ton}`}>{c.cout}</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9A99B5]">{c.par}</span>
              </span>
              <span className="mt-2 block font-extrabold leading-snug text-[#1D1B5C] group-hover:text-[#4F46E5]">{c.nom}</span>
              <span className="mt-1 line-clamp-2 block text-sm text-[#6B6A8A]">{c.gain}</span>
              <span className="mt-auto pt-3 text-sm font-bold text-[#4F46E5]">Voir →</span>
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={active.nom}>
          <button type="button" aria-label="Fermer" className="fixed inset-0 bg-[#1D1B5C]/50" onClick={() => setOuverte(null)} />
          <div className="relative my-auto w-full max-w-3xl pt-11">
            <button
              type="button"
              onClick={() => setOuverte(null)}
              aria-label="Fermer"
              className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-[#1D1B5C] shadow"
            >
              ×
            </button>
            {active.fiche}
          </div>
        </div>
      ) : null}
    </>
  );
}
