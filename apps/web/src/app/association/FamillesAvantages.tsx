'use client';

import { useEffect, useRef, useState } from 'react';
import { GrilleAvantages, type CarteCourte } from './GrilleAvantages';

/**
 * LES TROIS FAMILLES, EN PORTES (01/10/2026, demande de Siham : « ces cartes
 * doivent être visibles quand on clique sur les cartes de catégories »).
 * Un clic sur une famille déplie ses avantages juste en dessous ; un second
 * clic la replie. Un lien /chemin#canva ou #outils ouvre la bonne famille.
 */
export interface Famille {
  code: string;
  titre: string;
  detail: string;
  fond: string;
  bordure: string;
  pastille: string;
  texte: string;
  icone: string;
  cartes: CarteCourte[];
}

export function FamillesAvantages({ familles }: { familles: Famille[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const zone = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (!h) return;
    const f = familles.find((x) => x.code.toLowerCase() === h.toLowerCase() || x.cartes.some((c) => c.code === h));
    if (f) setOuverte(f.code);
  }, [familles]);

  function choisir(code: string) {
    const suite = ouverte === code ? null : code;
    setOuverte(suite);
    if (suite) window.setTimeout(() => zone.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  const active = familles.find((f) => f.code === ouverte) ?? null;

  return (
    <>
      <div className="mt-4 grid gap-4 md:grid-cols-3" role="tablist" aria-label="Familles d’avantages">
        {familles.map((f) => {
          const choisie = f.code === ouverte;
          return (
            <button
              key={f.code}
              type="button"
              role="tab"
              aria-selected={choisie}
              aria-controls="avantages-famille"
              onClick={() => choisir(f.code)}
              className={`group flex flex-col rounded-2xl border-2 ${f.bordure} ${f.fond} p-5 text-left transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_34px_-18px_rgba(29,27,92,0.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                choisie ? 'ring-4 ring-[#4F46E5]/25 shadow-[0_16px_34px_-18px_rgba(29,27,92,0.55)]' : ''
              } ${ouverte && !choisie ? 'opacity-60' : ''}`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.pastille} text-white`} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icone} />
                </svg>
              </span>
              <span className="mt-3 block text-lg font-extrabold text-[#1D1B5C]">{f.titre}</span>
              <span className="mt-1 block text-sm leading-relaxed text-[#3B3A66]">{f.detail}</span>
              <span className={`mt-auto pt-4 text-sm font-bold ${f.texte}`}>
                {f.cartes.length} avantages{' '}
                <span className={`inline-block transition-transform duration-300 ${choisie ? 'rotate-90' : 'group-hover:translate-x-1'}`}>→</span>
              </span>
            </button>
          );
        })}
      </div>

      <div ref={zone} id="avantages-famille" role="tabpanel" className="scroll-mt-24">
        {active ? (
          <section key={active.code} id={active.code.toLowerCase()} className="mt-8 animate-fade-in-up">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-extrabold text-[#1D1B5C]">{active.titre}</h3>
              <button type="button" onClick={() => setOuverte(null)} className="text-sm font-bold text-[#6B6A8A] hover:text-[#1D1B5C]">
                Replier
              </button>
            </div>
            <GrilleAvantages cartes={active.cartes} />
          </section>
        ) : null}
      </div>
    </>
  );
}
