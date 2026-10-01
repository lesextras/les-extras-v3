import type { ReactNode } from 'react';

/** Quelques pictos (tracés 24 × 24) pour les listes vides de l'espace. */
export const PICTOS = {
  personnes: 'M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0M2.5 20a6.5 6.5 0 0 1 13 0M17 11v6M14 14h6',
  action: 'M13 2L3 14h7l-1 8 10-12h-7z',
  ligne: 'M4 6h16M4 12h16M4 18h10',
  document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  sac: 'M6 7h12l1 13H5zM9 7a3 3 0 0 1 6 0',
  colis: 'M21 8l-9-5-9 5 9 5zM3 8v8l9 5 9-5V8M12 13v8',
} as const;

/**
 * UNE LISTE VIDE : un picto, une ligne, un bouton. Toujours la même forme,
 * pour qu'on reconnaisse d'un coup d'œil « ici il n'y a rien, et voici quoi faire ».
 */
export function EtatVide({ picto, children, action }: { picto: keyof typeof PICTOS; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#E6E4F3] bg-white px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#ECEBFC] text-[#4F46E5]" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={PICTOS[picto]} />
        </svg>
      </span>
      <p className="mt-3 font-bold text-[#1D1B5C]">{children}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
