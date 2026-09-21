'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';

/** Cocher ou décocher une étape du chemin. Rien d'irréversible : ça se rejoue. */
export function BoutonEtape({ slug, faite }: { slug: string; faite: boolean }) {
  const router = useRouter();
  const [etat, setEtat] = useState(faite);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function basculer() {
    setErreur(null);
    setEnCours(true);
    const voulu = !etat;
    try {
      await appel(`/academie/chemin/${encodeURIComponent(slug)}`, { method: 'POST', body: { faite: voulu } });
      setEtat(voulu);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Le changement n'a pas été enregistré.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={basculer}
        disabled={enCours}
        className={
          etat
            ? 'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#B7E4CE] bg-[#E3F5EC] px-5 py-3 text-base font-bold text-[#0F5F3E] transition hover:border-[#1E9E6A] disabled:opacity-60'
            : 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white transition hover:bg-[#17845A] disabled:opacity-60'
        }
      >
        {enCours ? 'Enregistrement…' : etat ? '✓ Cette étape est faite, la décocher' : "J'ai fait cette étape"}
      </button>
      {erreur ? <p className="mt-2 text-sm font-bold text-[#8A1B3D]">{erreur}</p> : null}
    </div>
  );
}
