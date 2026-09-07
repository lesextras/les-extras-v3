'use client';

import { useState } from 'react';
import { CARTE } from '../../_ui';
import type { ModeleFabrique, Prerempli } from '../../_fabrique';
import { FabriqueDocument } from '../../FabriqueDocument';

/** Les documents du secrétariat : une carte par modèle, l'assistant s'ouvre en place. */
export function DocumentsSecretariat({ modeles, prerempli }: { modeles: ModeleFabrique[]; prerempli: Prerempli }) {
  const [ouvert, setOuvert] = useState<ModeleFabrique | null>(null);

  if (ouvert) {
    return <FabriqueDocument modele={ouvert} prerempli={prerempli} connecte onFermer={() => setOuvert(null)} />;
  }

  if (!modeles.length) {
    return (
      <div className={`${CARTE} px-6 py-8 text-center`}>
        <p className="font-bold text-[#1D1B5C]">Les modèles ne se chargent pas pour le moment.</p>
        <p className="mt-1 text-sm text-[#6B6A8A]">Recharge la page dans un instant.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modeles.map((m) => (
        <li key={m.code}>
          <button
            type="button"
            onClick={() => setOuvert(m)}
            className={`${CARTE} flex h-full w-full flex-col p-5 text-left transition hover:-translate-y-0.5 hover:border-[#4F46E5] hover:shadow-[0_12px_28px_-20px_rgba(29,27,92,0.8)]`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECEBFC] text-[#4338CA]" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zM15 3v4h4M9 13h6M9 17h6" />
              </svg>
            </span>
            <span className="mt-3 block font-extrabold leading-snug text-[#1D1B5C]">{m.titre}</span>
            <span className="mt-1 block text-sm leading-relaxed text-[#6B6A8A]">{m.enUnMot}</span>
            <span className="mt-auto pt-4 text-sm font-bold text-[#4F46E5]">Fabriquer →</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
