'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import type { Organisation } from '../_types';

const NIVEAUX: { code: Organisation['niveau']; libelle: string; detail: string }[] = [
  { code: 'PETITE', libelle: 'Petite association', detail: 'Sans salarié, une à trois personnes actives.' },
  { code: 'GESTIONNAIRE', libelle: 'Association gestionnaire', detail: 'Des salariés, un ou plusieurs établissements.' },
  { code: 'RESEAU', libelle: 'Tête de réseau', detail: 'Fédération ou union, avec des associations affiliées.' },
];

export function FormulaireOrganisation({ organisation: o }: { organisation: Organisation }) {
  const router = useRouter();
  const [nom, setNom] = useState(o.nom);
  const [sigle, setSigle] = useState(o.sigle ?? '');
  const [niveau, setNiveau] = useState<Organisation['niveau']>(o.niveau);
  const [mois, setMois] = useState(String(o.moisClotureExercice));
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);
    try {
      await appel('/association/organisation', {
        method: 'PATCH',
        body: { nom: nom.trim(), sigle: sigle.trim(), niveau, moisClotureExercice: Number(mois) },
      });
      setMessage('Enregistré.');
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  const champ =
    'rounded-md border border-[#C9C3B5] bg-white px-3 py-2 text-sm focus:border-[#1F6A4E] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]';

  return (
    <form onSubmit={enregistrer} className="grid gap-3 rounded-md border border-[#DDD8CC] bg-white p-5 sm:grid-cols-2">
      <h2 className="text-sm uppercase tracking-[0.14em] text-[#5C6B63] sm:col-span-2">Ce que vous précisez</h2>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nom d&apos;usage</span>
        <input type="text" required maxLength={200} value={nom} onChange={(e) => setNom(e.target.value)} className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Sigle</span>
        <input type="text" maxLength={40} value={sigle} onChange={(e) => setSigle(e.target.value)} className={champ} />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-medium">Taille</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {NIVEAUX.map((n) => (
            <label key={n.code} className={`flex cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2 text-sm ${niveau === n.code ? 'border-[#1F6A4E] bg-[#E4EFE8]' : 'border-[#DDD8CC]'}`}>
              <span className="flex items-center gap-2 font-medium">
                <input type="radio" name="niveau" value={n.code} checked={niveau === n.code} onChange={() => setNiveau(n.code)} className="accent-[#1F6A4E]" />
                {n.libelle}
              </span>
              <span className="text-xs text-[#5C6B63]">{n.detail}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Mois de clôture de l&apos;exercice</span>
        <select value={mois} onChange={(e) => setMois(e.target.value)} className={champ}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}
            </option>
          ))}
        </select>
        <span className="text-xs text-[#5C6B63]">Décembre pour une année civile.</span>
      </label>
      {erreur ? <p className="text-sm text-[#7A4A0E] sm:col-span-2">{erreur}</p> : null}
      {message ? <p className="text-sm text-[#1F6A4E] sm:col-span-2">{message}</p> : null}
      <div className="sm:col-span-2">
        <button type="submit" disabled={enCours} className="rounded-md bg-[#1F6A4E] px-4 py-2 text-sm font-medium text-white hover:bg-[#185540] disabled:opacity-60">
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
