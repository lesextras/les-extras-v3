'use client';

import { useMemo, useState } from 'react';
import { LIBELLES_MOYEN, LIBELLES_NATURE_MOUVEMENT, dateCourte, formaterEuros, type Mouvement } from '../_types';
import { FicheMouvement } from './FicheMouvement';

type Filtre = 'TOUT' | 'RECETTE' | 'DEPENSE' | 'DON' | 'BILLETTERIE';

const CHAMP = 'rounded-xl border border-[#D9D6EE] bg-white px-3 py-2 text-sm text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]';

/** Un CSV que n'importe quel tableur ouvre : point-virgule, virgule décimale. */
function versCsv(lignes: Mouvement[]) {
  const entetes = ['Date', 'Sens', 'Nature', 'Libellé', 'De qui / à qui', 'Moyen', 'Reçu fiscal', 'Montant'];
  const cellule = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const corps = lignes.map((m) =>
    [
      m.date.slice(0, 10),
      m.sens === 'RECETTE' ? 'Entrée' : 'Sortie',
      LIBELLES_NATURE_MOUVEMENT[m.nature],
      m.libelle,
      m.tiers ?? '',
      m.moyen ? LIBELLES_MOYEN[m.moyen] : '',
      m.nature === 'DON' ? (m.recuFiscal ? 'oui' : 'non') : '',
      String(m.montant).replace('.', ','),
    ]
      .map(cellule)
      .join(';'),
  );
  return [entetes.map(cellule).join(';'), ...corps].join('\r\n');
}

/**
 * LE CAHIER DE COMPTES : filtrer, chercher, corriger une ligne, tout exporter.
 * C'est la pièce qu'on présente en assemblée générale, et celle qu'un financeur
 * peut demander à voir.
 */
export function Mouvements({ mouvements }: { mouvements: Mouvement[] }) {
  const [filtre, setFiltre] = useState<Filtre>('TOUT');
  const [ouverte, setOuverte] = useState<Mouvement | null | 'nouvelle'>(null);
  const [depuis, setDepuis] = useState('');
  const [jusqua, setJusqua] = useState('');
  const [recherche, setRecherche] = useState('');

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return mouvements.filter((m) => {
      if (filtre === 'RECETTE' || filtre === 'DEPENSE') {
        if (m.sens !== filtre) return false;
      } else if (filtre === 'DON' && m.nature !== 'DON') return false;
      else if (filtre === 'BILLETTERIE' && m.nature !== 'BILLETTERIE' && m.nature !== 'VENTE') return false;
      const jour = m.date.slice(0, 10);
      if (depuis && jour < depuis) return false;
      if (jusqua && jour > jusqua) return false;
      if (q && !`${m.libelle} ${m.tiers ?? ''} ${LIBELLES_NATURE_MOUVEMENT[m.nature]}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mouvements, filtre, depuis, jusqua, recherche]);

  const entrees = liste.filter((m) => m.sens === 'RECETTE').reduce((t, m) => t + m.montant, 0);
  const sorties = liste.filter((m) => m.sens === 'DEPENSE').reduce((t, m) => t + m.montant, 0);

  const filtres: { code: Filtre; libelle: string; nombre: number }[] = [
    { code: 'TOUT', libelle: 'Tout', nombre: mouvements.length },
    { code: 'RECETTE', libelle: 'Ce qui entre', nombre: mouvements.filter((m) => m.sens === 'RECETTE').length },
    { code: 'DEPENSE', libelle: 'Ce qui sort', nombre: mouvements.filter((m) => m.sens === 'DEPENSE').length },
    { code: 'DON', libelle: 'Les dons', nombre: mouvements.filter((m) => m.nature === 'DON').length },
    { code: 'BILLETTERIE', libelle: 'Billetterie et ventes', nombre: mouvements.filter((m) => m.nature === 'BILLETTERIE' || m.nature === 'VENTE').length },
  ];

  function exporter() {
    const blob = new Blob([`﻿${versCsv(liste)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cahier-de-comptes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

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

      {/* Chercher dans le cahier, et le sortir en tableur. */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E6E4F3] bg-white px-4 py-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">À partir du</span>
          <input type="date" value={depuis} onChange={(e) => setDepuis(e.target.value)} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Jusqu&apos;au</span>
          <input type="date" value={jusqua} onChange={(e) => setJusqua(e.target.value)} className={CHAMP} />
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Chercher</span>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Un nom, un libellé, une nature…"
            className={`${CHAMP} w-full`}
          />
        </label>
        {depuis || jusqua || recherche ? (
          <button
            type="button"
            onClick={() => {
              setDepuis('');
              setJusqua('');
              setRecherche('');
            }}
            className="rounded-xl px-3 py-2 text-sm font-bold text-[#6B6A8A] hover:bg-[#F5F4FC]"
          >
            Tout afficher
          </button>
        ) : null}
        <button type="button" onClick={exporter} className="rounded-xl border-2 border-[#D9D6EE] px-4 py-2 text-sm font-bold text-[#1D1B5C] hover:border-[#4F46E5] hover:text-[#4F46E5]">
          Exporter en tableur
        </button>
      </div>

      <p className="text-sm text-[#6B6A8A]">
        <span className="font-bold text-[#1D1B5C]">{liste.length}</span> ligne{liste.length > 1 ? 's' : ''} affichée{liste.length > 1 ? 's' : ''} ·{' '}
        <span className="font-bold text-[#0F5F3E]">+ {formaterEuros(entrees)}</span> ·{' '}
        <span className="font-bold text-[#8A2419]">− {formaterEuros(sorties)}</span> · solde{' '}
        <span className="font-bold text-[#1D1B5C]">{formaterEuros(entrees - sorties)}</span>
      </p>

      {ouverte === 'nouvelle' ? <FicheMouvement mouvement={null} onFermer={() => setOuverte(null)} /> : null}

      {liste.length === 0 ? (
        <div className="rounded-2xl border border-[#E6E4F3] bg-white px-6 py-10 text-center">
          <p className="font-bold text-[#1D1B5C]">{mouvements.length ? 'Aucune ligne ne correspond à cette recherche.' : 'Aucune ligne pour l’instant.'}</p>
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
