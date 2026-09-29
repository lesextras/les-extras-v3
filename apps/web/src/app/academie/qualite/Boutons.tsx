'use client';

import { useState } from 'react';
import { BTN_SECONDAIRE } from '../_ui';
import { telecharger } from '../_gestion/outils';

export function CopierTexte({ texte }: { texte: string }) {
  const [fait, setFait] = useState(false);
  return (
    <button
      type="button"
      className={BTN_SECONDAIRE}
      onClick={() => {
        void navigator.clipboard?.writeText(texte);
        setFait(true);
        setTimeout(() => setFait(false), 2500);
      }}
    >
      {fait ? 'Copié' : 'Copier le texte'}
    </button>
  );
}

export function BoutonCsv({ annee }: { annee: number }) {
  const [erreur, setErreur] = useState<string | null>(null);
  return (
    <>
      <button type="button" className={BTN_SECONDAIRE} onClick={() => void telecharger(`/academie/gestion/qualite.csv?annee=${annee}`, `indicateurs-${annee}.csv`).catch((e: Error) => setErreur(e.message))}>
        Exporter (CSV)
      </button>
      {erreur ? <span className="text-sm text-[#8A1B3D]">{erreur}</span> : null}
    </>
  );
}
