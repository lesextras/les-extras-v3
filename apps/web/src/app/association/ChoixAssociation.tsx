'use client';

import { useState } from 'react';
import { appel } from './_client';

export interface AssociationTrouvee {
  nom: string;
  siren: string;
  rna: string | null;
  commune: string | null;
  codePostal: string | null;
}

export const CHAMP =
  'rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]';

/**
 * Le nom de l'association, cherché dans les répertoires publics. Si elle y
 * est, on retient son SIREN et son classeur naîtra pré-rempli ; sinon on garde
 * le nom tapé, et le rattachement se fera plus tard.
 */
export function ChoixAssociation({
  nom,
  onNom,
  choisie,
  onChoisie,
}: {
  nom: string;
  onNom: (v: string) => void;
  choisie: AssociationTrouvee | null;
  onChoisie: (v: AssociationTrouvee | null) => void;
}) {
  const [resultats, setResultats] = useState<AssociationTrouvee[]>([]);
  const [recherche, setRecherche] = useState(false);

  async function chercher() {
    if (nom.trim().length < 3) return;
    setRecherche(true);
    onChoisie(null);
    try {
      const r = await appel<AssociationTrouvee[]>(`/public/association/recherche?q=${encodeURIComponent(nom.trim())}`);
      setResultats(r);
    } catch {
      setResultats([]);
    } finally {
      setRecherche(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Son nom</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            required
            minLength={3}
            value={nom}
            onChange={(e) => {
              onNom(e.target.value);
              onChoisie(null);
            }}
            onBlur={chercher}
            placeholder="Tel qu'il est déclaré en préfecture"
            className={`flex-1 ${CHAMP}`}
          />
          <button
            type="button"
            onClick={chercher}
            disabled={recherche}
            className="rounded-xl border border-[#4F46E5] px-4 py-3 text-sm font-bold text-[#4F46E5] hover:bg-[#ECEBFC] disabled:opacity-60"
          >
            {recherche ? 'Recherche…' : 'Retrouver dans les répertoires'}
          </button>
        </div>
      </label>
      {resultats.length > 0 && !choisie ? (
        <ul className="divide-y divide-[#E6E4F3] rounded-xl border border-[#E6E4F3] bg-white text-sm">
          {resultats.map((r) => (
            <li key={r.siren}>
              <button
                type="button"
                onClick={() => onChoisie(r)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-[#F5F4FC]"
              >
                <span className="font-bold">{r.nom}</span>
                <span className="text-[#6B6A8A]">
                  {[r.codePostal, r.commune].filter(Boolean).join(' ')} · SIREN {r.siren}
                  {r.rna ? ` · RNA ${r.rna}` : ''}
                </span>
              </button>
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-[#6B6A8A]">Ce n&apos;est pas la vôtre ? Continuez, vous la rattacherez plus tard.</li>
        </ul>
      ) : null}
      {choisie ? (
        <p className="rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-3 text-sm">
          <span className="font-bold">{choisie.nom}</span> · SIREN {choisie.siren}
          {choisie.rna ? ` · RNA ${choisie.rna}` : ''} — son classeur sera pré-rempli.{' '}
          <button type="button" onClick={() => onChoisie(null)} className="underline underline-offset-4">
            Changer
          </button>
        </p>
      ) : null}
    </div>
  );
}
