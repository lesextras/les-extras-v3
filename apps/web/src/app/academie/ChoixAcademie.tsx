'use client';

import { useState } from 'react';
import { appel } from './_client';
import { CHAMP } from './_ui';

/** Ce que les répertoires publics savent d'un organisme de formation. */
export interface OrganismeTrouve {
  nom: string;
  sigle: string | null;
  siren: string;
  siret: string | null;
  ape: string | null;
  apeFormation: boolean;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  declaration: {
    nda: string;
    region: string | null;
    departement: string | null;
    certifie: boolean;
    specialites: string[];
  } | null;
}

/**
 * RETROUVER SON ORGANISME PLUTÔT QUE LE RECOPIER.
 *
 * Deux répertoires publics répondent : SIRENE pour le nom, le SIREN, le SIRET
 * et l'adresse ; la liste publique des organismes de formation pour le numéro
 * de déclaration d'activité, la DREETS et la certification. Ceux qui sont déjà
 * déclarés apparaissent en premier.
 *
 * Rien n'est obligatoire : un organisme qui n'est pas encore déclaré tape son
 * nom et complète plus tard.
 */
export function ChoixAcademie({
  nom,
  onNom,
  choisi,
  onChoisi,
}: {
  nom: string;
  onNom: (v: string) => void;
  choisi: OrganismeTrouve | null;
  onChoisi: (v: OrganismeTrouve | null) => void;
}) {
  const [resultats, setResultats] = useState<OrganismeTrouve[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [cherche, setCherche] = useState(false);

  async function chercher() {
    if (nom.trim().length < 3) return;
    setRecherche(true);
    onChoisi(null);
    try {
      const r = await appel<{ organismes: OrganismeTrouve[] }>(
        `/public/academie/recherche?q=${encodeURIComponent(nom.trim())}`,
      );
      setResultats(Array.isArray(r?.organismes) ? r.organismes : []);
    } catch {
      setResultats([]);
    } finally {
      setRecherche(false);
      setCherche(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Le nom de ton académie</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            required
            minLength={2}
            maxLength={160}
            value={nom}
            onChange={(e) => {
              onNom(e.target.value);
              onChoisi(null);
            }}
            onBlur={chercher}
            placeholder="Le nom de la structure qui forme"
            className={`flex-1 ${CHAMP}`}
          />
          <button
            type="button"
            onClick={chercher}
            disabled={recherche}
            className="whitespace-nowrap rounded-xl border-2 border-[#1E9E6A] px-4 py-3 text-sm font-bold text-[#0F5F3E] transition hover:bg-[#E3F5EC] disabled:opacity-60"
          >
            {recherche ? 'Recherche…' : 'Retrouver dans les répertoires'}
          </button>
        </div>
      </label>

      {resultats.length > 0 && !choisi ? (
        <ul className="divide-y divide-[#DDEBE4] rounded-xl border border-[#DDEBE4] bg-white text-sm">
          {resultats.map((r) => (
            <li key={r.siren}>
              <button
                type="button"
                onClick={() => onChoisi(r)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-[#F2F7F5]"
              >
                <span className="font-bold text-[#12312A]">
                  {r.nom}
                  {r.sigle ? ` (${r.sigle})` : ''}
                </span>
                <span className="text-[#5E7A6E]">
                  {[r.codePostal, r.commune].filter(Boolean).join(' ')} · SIREN {r.siren}
                  {r.declaration ? ` · NDA ${r.declaration.nda}` : ''}
                </span>
                {r.declaration ? (
                  <span className="mt-1 inline-flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[12px] font-bold text-[#0F5F3E]">
                      Activité déclarée
                    </span>
                    {r.declaration.certifie ? (
                      <span className="rounded-full bg-[#ECEBFC] px-2 py-0.5 text-[12px] font-bold text-[#4338CA]">Qualiopi</span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-[#5E7A6E]">
            Ce n&apos;est pas le tien ? Continue : tu le rattacheras plus tard.
          </li>
        </ul>
      ) : null}

      {cherche && !recherche && !resultats.length && !choisi ? (
        <p className="rounded-xl border border-[#DDEBE4] bg-[#F2F7F5] px-4 py-3 text-sm text-[#334A42]">
          Rien trouvé sous ce nom dans les répertoires publics — c&apos;est normal si la structure est très récente ou pas
          encore déclarée. Continue avec le nom que tu as tapé.
        </p>
      ) : null}

      {choisi ? (
        <p className="rounded-xl border border-[#B7E4CE] bg-[#E3F5EC] px-4 py-3 text-sm text-[#0F5F3E]">
          <span className="font-bold">{choisi.nom}</span> · SIREN {choisi.siren}
          {choisi.siret ? ` · SIRET ${choisi.siret}` : ''}
          {choisi.declaration ? ` · NDA ${choisi.declaration.nda}` : ''} — sa fiche sera pré-remplie.{' '}
          <button type="button" onClick={() => onChoisi(null)} className="underline underline-offset-4">
            Changer
          </button>
        </p>
      ) : null}
    </div>
  );
}
