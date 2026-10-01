'use client';
/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */

import { useState } from 'react';
import Link from 'next/link';
import { appel } from '../../_client';
import { BTN_PRIMAIRE, CARTE } from '../../_ui';

interface Piste {
  nom: string;
  type: 'PUBLIC' | 'FONDATION' | 'ENTREPRISE' | 'AUTRE';
  echelle?: string;
  soutient: string;
  pourquoiVous: string;
  commentFaire: string;
  lien?: string;
  aVerifier?: string;
  facilite: 'FACILE' | 'MOYEN' | 'DIFFICILE';
  pourquoiCetteNote?: string;
}

const LIBELLES_TYPE: Record<Piste['type'], string> = {
  PUBLIC: 'Financeur public',
  FONDATION: 'Fondation',
  ENTREPRISE: 'Mécénat d’entreprise',
  AUTRE: 'Autre',
};

/** La note d'accessibilité, du plus facile au plus difficile à décrocher. */
const FACILITES: Record<Piste['facilite'], { libelle: string; ton: string; puces: number }> = {
  FACILE: { libelle: 'Facile à obtenir', ton: 'bg-[#E3F5EC] text-[#0F5F3E]', puces: 1 },
  MOYEN: { libelle: 'Demande du travail', ton: 'bg-[#FEF3E2] text-[#7C3E06]', puces: 2 },
  DIFFICILE: { libelle: 'Difficile, à viser plus tard', ton: 'bg-[#FDE8E6] text-[#8A2419]', puces: 3 },
};

const TONS: Record<Piste['type'], string> = {
  PUBLIC: 'bg-[#ECEBFC] text-[#4338CA]',
  FONDATION: 'bg-[#E3F5EC] text-[#0F5F3E]',
  ENTREPRISE: 'bg-[#FEF3E2] text-[#7C3E06]',
  AUTRE: 'bg-[#F0EFF7] text-[#6B6A8A]',
};

/**
 * La recherche de financeurs : une phrase, un bouton, des pistes à vérifier,
 * classées de la plus facile à décrocher à la plus difficile. Quand elle est
 * ouverte depuis un projet, c'est la liste des financeurs DE CE projet.
 */
export function Recherche({ disponible, projetId, projetIntitule }: { disponible: boolean; projetId?: string; projetIntitule?: string }) {
  const [precision, setPrecision] = useState('');
  const [pistes, setPistes] = useState<Piste[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function chercher() {
    setErreur(null);
    setEnCours(true);
    try {
      const r = await appel<{ pistes: Piste[] }>('/association/ia/financeurs', {
        method: 'POST',
        body: {
          ...(precision.trim() ? { precision: precision.trim() } : {}),
          ...(projetId ? { projetId } : {}),
        },
      });
      setPistes(r.pistes);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La recherche a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  if (!disponible) {
    return (
      <div className={`${CARTE} p-5`}>
        <p className="font-extrabold text-[#1D1B5C]">Recherche assistée bientôt disponible.</p>
        <Link href="/chemin#droits" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
          Ce à quoi j&apos;ai droit →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${CARTE} p-5`}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">
            {projetIntitule ? `Précisions sur « ${projetIntitule} »` : 'Priorité à financer'}
          </span>
          <span className="text-[#6B6A8A]">Facultatif · ex. matériel, sortie pour 20 jeunes</span>
          <textarea
            rows={2}
            maxLength={1000}
            value={precision}
            onChange={(e) => setPrecision(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]"
          />
        </label>
        <button type="button" onClick={chercher} disabled={enCours} className={`${BTN_PRIMAIRE} mt-4 disabled:opacity-60`}>
          {enCours ? 'Recherche en cours…' : 'Chercher des financeurs'}
        </button>
      </div>

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}

      {pistes ? (
        pistes.length === 0 ? (
          <p className="text-sm text-[#6B6A8A]">Aucune piste. Précise et relance.</p>
        ) : (
          <>
            <p className="rounded-xl border border-[#D9D6EE] bg-[#F5F4FC] px-4 py-3 text-sm text-[#3B3A66]">
              <span className="font-bold text-[#1D1B5C]">Des pistes, pas des promesses.</span> Vérifie sur le site du financeur · de la plus facile à la plus difficile.
            </p>
            <ul className="grid gap-4 md:grid-cols-2">
              {pistes.map((p) => (
                <li key={p.nom}>
                  <article className={`${CARTE} flex h-full flex-col p-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-extrabold leading-snug text-[#1D1B5C]">{p.nom}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${TONS[p.type]}`}>{LIBELLES_TYPE[p.type]}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${FACILITES[p.facilite].ton}`}>
                        <span aria-hidden="true">
                          {'●'.repeat(FACILITES[p.facilite].puces)}
                          <span className="opacity-30">{'●'.repeat(3 - FACILITES[p.facilite].puces)}</span>
                        </span>
                        {FACILITES[p.facilite].libelle}
                      </span>
                      {p.echelle ? <span className="text-sm text-[#6B6A8A]">{p.echelle}</span> : null}
                    </div>
                    {p.pourquoiCetteNote ? <p className="mt-1 text-sm text-[#6B6A8A]">{p.pourquoiCetteNote}</p> : null}
                    <p className="mt-2 text-sm leading-relaxed text-[#3B3A66]">{p.soutient}</p>
                    <p className="mt-2 text-sm leading-relaxed">
                      <span className="font-bold text-[#1D1B5C]">Pourquoi vous : </span>
                      {p.pourquoiVous}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      <span className="font-bold text-[#1D1B5C]">Premier geste : </span>
                      {p.commentFaire}
                    </p>
                    {p.aVerifier ? <p className="mt-2 text-sm text-[#7C3E06]">À vérifier : {p.aVerifier}</p> : null}
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-sm font-bold">
                      {p.lien ? (
                        <a href={p.lien} target="_blank" rel="noopener" className="text-[#4F46E5] underline underline-offset-4">
                          Ouvrir le site ↗
                        </a>
                      ) : null}
                      <Link href="/espace/dossiers" className="text-[#4F46E5] underline underline-offset-4">
                        En faire une demande →
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </>
        )
      ) : null}
    </div>
  );
}
