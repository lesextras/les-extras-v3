'use client';

import { useState } from 'react';
import { BTN_SECONDAIRE, CARTE } from '../../_ui';
import type { ModeleFabrique, Prerempli } from '../../_fabrique';
import { FabriqueDocument } from '../../FabriqueDocument';
import { BoutonDeposerFichiers } from '../../DeposerFichiers';

/**
 * Les documents du secrétariat : une carte par modèle. On peut le fabriquer
 * ici — ou déposer celui qu'on a déjà, et plusieurs d'un coup.
 */
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
          <div className={`${CARTE} flex h-full flex-col p-5`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECEBFC] text-[#4338CA]" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zM15 3v4h4M9 13h6M9 17h6" />
              </svg>
            </span>
            <span className="mt-3 block font-extrabold leading-snug text-[#1D1B5C]">{m.titre}</span>
            <span className="mt-1 block text-sm leading-relaxed text-[#6B6A8A]">{m.enUnMot}</span>
            <div className="mt-auto flex flex-col gap-2 pt-4">
              <button
                type="button"
                onClick={() => setOuvert(m)}
                className="rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4338CA]"
              >
                Fabriquer
              </button>
              <BoutonDeposerFichiers
                classeNom={`${BTN_SECONDAIRE} w-full !py-2.5 text-sm`}
                piece={m.piece ?? undefined}
                categorie={m.categorie ?? 'Autre'}
                titre={m.titre}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
