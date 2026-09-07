'use client';

import { useState } from 'react';
import { LIBELLES_MOYEN, LIBELLES_NATURE_MOUVEMENT, dateCourte, formaterEuros, type Mouvement } from '../_types';
import { FicheMouvement } from './FicheMouvement';

type Filtre = 'TOUT' | 'RECETTE' | 'DEPENSE' | 'DON';

/** Le cahier de comptes : un filtre, un tableau, une ligne qui s'ouvre pour être corrigée. */
export function Mouvements({ mouvements }: { mouvements: Mouvement[] }) {
  const [filtre, setFiltre] = useState<Filtre>('TOUT');
  const [ouverte, setOuverte] = useState<Mouvement | null | 'nouvelle'>(null);

  const liste = mouvements.filter((m) =>
    filtre === 'TOUT' ? true : filtre === 'DON' ? m.nature === 'DON' : m.sens === filtre,
  );
  const filtres: { code: Filtre; libelle: string; nombre: number }[] = [
    { code: 'TOUT', libelle: 'Tout', nombre: mouvements.length },
    { code: 'RECETTE', libelle: 'Ce qui entre', nombre: mouvements.filter((m) => m.sens === 'RECETTE').length },
    { code: 'DEPENSE', libelle: 'Ce qui sort', nombre: mouvements.filter((m) => m.sens === 'DEPENSE').length },
    { code: 'DON', libelle: 'Les dons', nombre: mouvements.filter((m) => m.nature === 'DON').length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filtres.map((f) => (
          <button
            key={f.code}
            type="button"
            onClick={() => {
              setFiltre(f.code);
              setOuverte(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold ${filtre === f.code ? 'bg-[#1D1B5C] text-white' : 'bg-white text-[#3B3A66] hover:bg-[#ECEBFC]'}`}
          >
            {f.libelle} <span className={filtre === f.code ? 'text-[#C7C4F2]' : 'text-[#9A99B5]'}>{f.nombre}</span>
          </button>
        ))}
        <button type="button" onClick={() => setOuverte('nouvelle')} className="ml-auto rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4338CA]">
          + Ajouter une ligne
        </button>
      </div>

      {ouverte === 'nouvelle' ? <FicheMouvement mouvement={null} onFermer={() => setOuverte(null)} /> : null}

      {liste.length === 0 ? (
        <div className="rounded-2xl border border-[#E6E4F3] bg-white px-6 py-10 text-center">
          <p className="font-bold text-[#1D1B5C]">Aucune ligne pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-[#6B6A8A]">
            Note chaque euro : un don, une cotisation, la buvette, une subvention reçue, un achat. C&apos;est ce cahier qu&apos;on présente en assemblée générale.
          </p>
          <button type="button" onClick={() => setOuverte('nouvelle')} className="mt-4 rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA]">
            Ajouter une ligne
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E6E4F3] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F4FC] text-left text-xs font-extrabold uppercase tracking-wide text-[#6B6A8A]">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Libellé</th>
                  <th className="px-5 py-3">Nature</th>
                  <th className="px-5 py-3">De qui / à qui</th>
                  <th className="px-5 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4F3]">
                {liste.map((m) =>
                  ouverte && ouverte !== 'nouvelle' && ouverte.id === m.id ? (
                    <tr key={m.id}>
                      <td colSpan={5} className="p-3">
                        <FicheMouvement mouvement={m} onFermer={() => setOuverte(null)} />
                      </td>
                    </tr>
                  ) : (
                    <tr key={m.id} className="cursor-pointer hover:bg-[#F5F4FC]" onClick={() => setOuverte(m)}>
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-[#6B6A8A]">{dateCourte(m.date)}</td>
                      <td className="px-5 py-3 font-bold text-[#1D1B5C]">
                        {m.libelle}
                        {m.nature === 'DON' && m.recuFiscal ? (
                          <span className="ml-2 rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[11px] font-bold text-[#0F5F3E]">Reçu fiscal</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-[#6B6A8A]">{LIBELLES_NATURE_MOUVEMENT[m.nature]}</td>
                      <td className="px-5 py-3 text-[#6B6A8A]">
                        {m.tiers ?? '—'}
                        {m.moyen ? <span className="text-[#9A99B5]"> · {LIBELLES_MOYEN[m.moyen]}</span> : null}
                      </td>
                      <td className={`whitespace-nowrap px-5 py-3 text-right font-extrabold tabular-nums ${m.sens === 'RECETTE' ? 'text-[#0F5F3E]' : 'text-[#8A2419]'}`}>
                        {m.sens === 'RECETTE' ? '+' : '−'} {formaterEuros(m.montant)}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
