'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from './_client';

/**
 * « C'est fait » / « Pas encore » : coche une étape du chemin pour l'association connectée.
 * Une étape « selon ton activité » se marque aussi « Pas concerné » (elle compte alors comme faite).
 */
export function BoutonEtapeFaite({
  slug,
  faite,
  verifiee,
  pasConcerne = false,
  peutNePasConcerner = false,
  chaqueAnnee = false,
}: {
  slug: string;
  faite: boolean;
  verifiee: boolean;
  pasConcerne?: boolean;
  peutNePasConcerner?: boolean;
  chaqueAnnee?: boolean;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer(corps: { faite: boolean; pasConcerne?: boolean }) {
    setEnCours(true);
    setErreur(null);
    try {
      await appel(`/association/chemin/${slug}`, { method: 'POST', body: corps });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Impossible pour le moment.');
    } finally {
      setEnCours(false);
    }
  }

  if (verifiee) {
    return (
      <p className="rounded-xl bg-[#E3F5EC] px-4 py-3 text-sm font-bold text-[#0F5F3E]">
        ✓ Fait, confirmé par les répertoires publics
      </p>
    );
  }

  if (faite && pasConcerne) {
    return (
      <div>
        <button
          type="button"
          onClick={() => void envoyer({ faite: false })}
          disabled={enCours}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#64748B] px-5 py-3 text-base font-bold text-white hover:bg-[#475569] disabled:opacity-60"
        >
          Pas concerné
        </button>
        <p className="mt-2 text-center text-xs text-[#6B6A8A]">Clique pour remettre l&apos;étape à faire.</p>
        {erreur ? <p className="mt-2 text-sm text-[#8A2419]">{erreur}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void envoyer({ faite: !faite })}
        disabled={enCours}
        className={
          faite
            ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white hover:bg-[#177F55] disabled:opacity-60'
            : 'inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1E9E6A] bg-white px-5 py-[10px] text-base font-bold text-[#1E9E6A] hover:bg-[#E3F5EC] disabled:opacity-60'
        }
      >
        {faite ? '✓ C’est fait' : 'Je l’ai fait, je coche'}
      </button>
      {!faite && peutNePasConcerner ? (
        <button
          type="button"
          onClick={() => void envoyer({ faite: true, pasConcerne: true })}
          disabled={enCours}
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-[#D3D8E2] bg-white px-5 py-2 text-sm font-bold text-[#3F4A5C] hover:bg-[#EEF0F4] disabled:opacity-60"
        >
          Pas concerné
        </button>
      ) : null}
      {faite ? (
        <p className="mt-2 text-center text-xs text-[#6B6A8A]">
          {chaqueAnnee ? 'Cochée pour cette année. Elle revient au 1er janvier. ' : ''}Clique encore pour décocher.
        </p>
      ) : chaqueAnnee ? (
        <p className="mt-2 text-center text-xs text-[#6B6A8A]">Une fois cochée, elle compte pour l&apos;année en cours.</p>
      ) : null}
      {erreur ? <p className="mt-2 text-sm text-[#8A2419]">{erreur}</p> : null}
    </div>
  );
}
