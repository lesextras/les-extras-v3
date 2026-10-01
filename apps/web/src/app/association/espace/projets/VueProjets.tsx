'use client';

import { useEffect, useState } from 'react';
import type { ActionAssociation, MembreEquipe, TacheProjet } from '../_types';
import { Icone } from './_taches';
import { Kanban } from './Kanban';
import { Planning } from './Planning';

type Vue = 'COLONNES' | 'PLANNING';
const CLE = 'pilote-projets-vue';

/** Mes projets en colonnes, ou sur la frise du planning. Le choix est retenu dans ce navigateur. */
export function VueProjets({
  projets,
  taches,
  equipe,
  iaDisponible,
}: {
  projets: ActionAssociation[];
  taches: TacheProjet[];
  equipe: MembreEquipe[];
  iaDisponible: boolean;
}) {
  const [vue, setVue] = useState<Vue>('COLONNES');

  useEffect(() => {
    try {
      if (window.location.hash !== '#financeurs' && window.localStorage.getItem(CLE) === 'PLANNING') setVue('PLANNING');
    } catch {
      /* stockage indisponible : on reste en colonnes */
    }
  }, []);

  function choisir(v: Vue) {
    setVue(v);
    try {
      window.localStorage.setItem(CLE, v);
    } catch {
      /* rien */
    }
  }

  const options: { code: Vue; libelle: string; icone: 'colonnes' | 'planning' }[] = [
    { code: 'COLONNES', libelle: 'Colonnes', icone: 'colonnes' },
    { code: 'PLANNING', libelle: 'Planning', icone: 'planning' },
  ];

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Affichage des projets" className="inline-flex rounded-xl bg-[#ECEBFC] p-1">
        {options.map((o) => (
          <button
            key={o.code}
            type="button"
            role="tab"
            aria-selected={vue === o.code}
            onClick={() => choisir(o.code)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition ${
              vue === o.code ? 'bg-white text-[#1D1B5C] shadow-sm' : 'text-[#6B6A8A] hover:text-[#1D1B5C]'
            }`}
          >
            <Icone nom={o.icone} />
            {o.libelle}
          </button>
        ))}
      </div>

      {vue === 'COLONNES' ? (
        <Kanban projets={projets} iaDisponible={iaDisponible} taches={taches} equipe={equipe} />
      ) : (
        <Planning projets={projets} taches={taches} equipe={equipe} iaDisponible={iaDisponible} />
      )}
    </div>
  );
}
