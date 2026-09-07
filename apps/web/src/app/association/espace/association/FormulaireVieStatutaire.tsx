'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { pourInput, type VieStatutaire } from '../_types';

const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

/** La dernière assemblée générale et la durée des mandats : c'est ce qui permet de prévenir avant l'échéance. */
export function FormulaireVieStatutaire({ vie }: { vie: VieStatutaire }) {
  const router = useRouter();
  const [dateAG, setDateAG] = useState(pourInput(vie.dateDerniereAG));
  const [duree, setDuree] = useState(String(vie.dureeMandatMois));
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);
    try {
      await appel('/association/vie-statutaire', {
        method: 'PATCH',
        body: { dateDerniereAG: dateAG || null, dureeMandatMois: Number(duree) },
      });
      setMessage('Enregistré.');
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
      <label className="flex flex-col gap-1">
        <span className="font-extrabold text-[#1D1B5C]">Dernière assemblée générale</span>
        <span className="text-sm text-[#6B6A8A]">La date de la dernière grande réunion des membres.</span>
        <input type="date" value={dateAG} onChange={(e) => setDateAG(e.target.value)} className={CHAMP} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-extrabold text-[#1D1B5C]">Durée des mandats</span>
        <span className="text-sm text-[#6B6A8A]">Combien de temps un responsable est élu (voir les statuts).</span>
        <select value={duree} onChange={(e) => setDuree(e.target.value)} className={CHAMP}>
          {[12, 24, 36, 48].map((m) => (
            <option key={m} value={m}>
              {m / 12} an{m > 12 ? 's' : ''}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
        {enCours ? '…' : 'Enregistrer'}
      </button>
      {erreur ? <p className="sm:col-span-3 rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}
      {message ? <p className="sm:col-span-3 rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-3 text-sm text-[#0F5F3E]">{message}</p> : null}
    </form>
  );
}
