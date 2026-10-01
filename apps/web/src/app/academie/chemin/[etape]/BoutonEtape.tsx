'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';

/**
 * Cocher ou décocher une étape du chemin. Rien d'irréversible : ça se rejoue.
 * Une étape qui le permet se marque aussi « Pas concerné » (elle compte alors comme faite).
 */
export function BoutonEtape({
  slug,
  faite,
  pasConcerne = false,
  peutNePasConcerner = false,
  chaqueAnnee = false,
  cycle = null,
}: {
  slug: string;
  faite: boolean;
  pasConcerne?: boolean;
  peutNePasConcerner?: boolean;
  chaqueAnnee?: boolean;
  /** Étape annuelle : l'année du cycle en cours (« 2026 »). */
  cycle?: number | null;
}) {
  const router = useRouter();
  const [etat, setEtat] = useState({ faite, pasConcerne: faite && pasConcerne });
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer(voulu: { faite: boolean; pasConcerne: boolean }) {
    setErreur(null);
    setEnCours(true);
    try {
      await appel(`/academie/chemin/${encodeURIComponent(slug)}`, {
        method: 'POST',
        body: voulu.pasConcerne ? voulu : { faite: voulu.faite },
      });
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void envoyer(etat.faite ? { faite: false, pasConcerne: false } : { faite: true, pasConcerne: false })}
          disabled={enCours}
          className={
            etat.pasConcerne
              ? 'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#D3D8E2] bg-[#EEF0F4] px-5 py-3 text-base font-bold text-[#3F4A5C] transition hover:border-[#64748B] disabled:opacity-60'
              : etat.faite
                ? 'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#B7E4CE] bg-[#E3F5EC] px-5 py-3 text-base font-bold text-[#0F5F3E] transition hover:border-[#1E9E6A] disabled:opacity-60'
                : 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white transition hover:bg-[#17845A] disabled:opacity-60'
          }
        >
          {enCours
            ? 'Enregistrement…'
            : etat.pasConcerne
              ? 'Pas concerné, remettre à faire'
              : etat.faite
                ? '✓ Cette étape est faite, la décocher'
                : "J'ai fait cette étape"}
        </button>
        {!etat.faite && peutNePasConcerner ? (
          <button
            type="button"
            onClick={() => void envoyer({ faite: true, pasConcerne: true })}
            disabled={enCours}
            className="inline-flex items-center justify-center rounded-xl border border-[#D3D8E2] bg-white px-5 py-3 text-base font-bold text-[#3F4A5C] transition hover:bg-[#EEF0F4] disabled:opacity-60"
          >
            Pas concerné
          </button>
        ) : null}
      </div>
      {chaqueAnnee ? (
        <p className="mt-2 text-sm text-[#5E7A6E]">
          {etat.faite
            ? `Cochée pour ${cycle ?? 'cette année'}. Elle revient pour l'année suivante.`
            : `Une fois cochée, elle compte pour ${cycle ?? "l'année en cours"}.`}
        </p>
      ) : null}
      {erreur ? <p className="mt-2 text-sm font-bold text-[#8A1B3D]">{erreur}</p> : null}
    </div>
  );
}
