'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from './_client';

/** « C'est fait » / « Pas encore » : coche une étape du chemin pour l'association connectée. */
export function BoutonEtapeFaite({ slug, faite, verifiee }: { slug: string; faite: boolean; verifiee: boolean }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function basculer() {
    setEnCours(true);
    setErreur(null);
    try {
      await appel(`/association/chemin/${slug}`, { method: 'POST', body: { faite: !faite } });
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

  return (
    <div>
      <button
        type="button"
        onClick={basculer}
        disabled={enCours}
        className={
          faite
            ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white hover:bg-[#177F55] disabled:opacity-60'
            : 'inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1E9E6A] bg-white px-5 py-[10px] text-base font-bold text-[#1E9E6A] hover:bg-[#E3F5EC] disabled:opacity-60'
        }
      >
        {faite ? '✓ C’est fait' : 'Je l’ai fait, je coche'}
      </button>
      {faite ? (
        <p className="mt-2 text-center text-xs text-[#6B6A8A]">Clique encore pour décocher.</p>
      ) : null}
      {erreur ? <p className="mt-2 text-sm text-[#8A2419]">{erreur}</p> : null}
    </div>
  );
}
