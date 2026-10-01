'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';

/**
 * « Date de l'AG : [date] » : la date qu'une association choisit pour une
 * étape annuelle (01/10/2026). Elle fixe l'année du cycle et l'échéance de
 * l'étape (POST /association/chemin/:slug/date). Vide : on l'efface.
 */
export function ChoixDateEtape({ slug, libelle, aide, valeur }: { slug: string; libelle: string; aide?: string; valeur: string | null }) {
  const router = useRouter();
  const [date, setDate] = useState(valeur ?? '');
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  async function enregistrer(nouvelle: string) {
    setEnCours(true);
    setMessage(null);
    try {
      await appel(`/association/chemin/${encodeURIComponent(slug)}/date`, { method: 'POST', body: { date: nouvelle || null } });
      setMessage({ ok: true, texte: nouvelle ? 'Date enregistrée.' : 'Date effacée.' });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, texte: err instanceof Error ? err.message : "La date n'a pas été enregistrée." });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form
      id="date-choisie"
      className="mb-6 scroll-mt-24 rounded-2xl border border-[#A7DCD8] bg-[#E0F4F3] p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void enregistrer(date);
      }}
    >
      <label htmlFor={`date-${slug}`} className="block text-sm font-extrabold text-[#115E59]">
        {libelle} :
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          id={`date-${slug}`}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-[#A7DCD8] bg-white px-3 py-2 text-sm font-bold text-[#1D1B5C] focus:border-[#0D9488] focus:outline-none"
        />
        <button
          type="submit"
          disabled={enCours || date === (valeur ?? '')}
          className="rounded-xl bg-[#0D9488] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F766E] disabled:opacity-60"
        >
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {valeur ? (
          <button
            type="button"
            disabled={enCours}
            onClick={() => {
              setDate('');
              void enregistrer('');
            }}
            className="rounded-xl border border-[#A7DCD8] bg-white px-4 py-2 text-sm font-bold text-[#115E59] hover:bg-[#F0FAF9] disabled:opacity-60"
          >
            Effacer
          </button>
        ) : null}
      </div>
      {aide ? <p className="mt-2 text-xs text-[#115E59]">{aide}</p> : null}
      {message ? (
        <p role="status" className={`mt-2 text-sm font-bold ${message.ok ? 'text-[#0F5F3E]' : 'text-[#8A2419]'}`}>
          {message.texte}
        </p>
      ) : null}
    </form>
  );
}
