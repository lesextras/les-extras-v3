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
  'rounded-md border border-[#C9C3B5] bg-white px-4 py-3 text-base focus:border-[#1F6A4E] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]';

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
        <span className="font-medium">Son nom</span>
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
            className="rounded-md border border-[#1F6A4E] px-4 py-3 text-sm font-medium text-[#1F6A4E] hover:bg-[#E4EFE8] disabled:opacity-60"
          >
            {recherche ? 'Recherche…' : 'Retrouver dans les répertoires'}
          </button>
        </div>
      </label>
      {resultats.length > 0 && !choisie ? (
        <ul className="divide-y divide-[#DDD8CC] rounded-md border border-[#DDD8CC] bg-white text-sm">
          {resultats.map((r) => (
            <li key={r.siren}>
              <button
                type="button"
                onClick={() => onChoisie(r)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-[#F6F4EE]"
              >
                <span className="font-medium">{r.nom}</span>
                <span className="text-[#5C6B63]">
                  {[r.codePostal, r.commune].filter(Boolean).join(' ')} · SIREN {r.siren}
                  {r.rna ? ` · RNA ${r.rna}` : ''}
                </span>
              </button>
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-[#5C6B63]">Ce n&apos;est pas la vôtre ? Continuez, vous la rattacherez plus tard.</li>
        </ul>
      ) : null}
      {choisie ? (
        <p className="rounded-md border border-[#B9D6C6] bg-[#E4EFE8] px-4 py-3 text-sm">
          <span className="font-medium">{choisie.nom}</span> · SIREN {choisie.siren}
          {choisie.rna ? ` · RNA ${choisie.rna}` : ''} — son classeur sera pré-rempli.{' '}
          <button type="button" onClick={() => onChoisie(null)} className="underline underline-offset-4">
            Changer
          </button>
        </p>
      ) : null}
    </div>
  );
}
