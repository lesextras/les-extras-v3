'use client';

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
}

const LIBELLES_TYPE: Record<Piste['type'], string> = {
  PUBLIC: 'Financeur public',
  FONDATION: 'Fondation',
  ENTREPRISE: 'Mécénat d’entreprise',
  AUTRE: 'Autre',
};

const TONS: Record<Piste['type'], string> = {
  PUBLIC: 'bg-[#ECEBFC] text-[#4338CA]',
  FONDATION: 'bg-[#E3F5EC] text-[#0F5F3E]',
  ENTREPRISE: 'bg-[#FEF3E2] text-[#7C3E06]',
  AUTRE: 'bg-[#F0EFF7] text-[#6B6A8A]',
};

/** La recherche de financeurs : une phrase, un bouton, des pistes à vérifier. */
export function Recherche({ disponible }: { disponible: boolean }) {
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
        body: precision.trim() ? { precision: precision.trim() } : {},
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
        <p className="font-extrabold text-[#1D1B5C]">La recherche assistée n&apos;est pas encore activée sur ce serveur.</p>
        <p className="mt-1 text-sm leading-relaxed text-[#6B6A8A]">
          En attendant, la liste des dispositifs connus et des outils utiles reste consultable.
        </p>
        <Link href="/avantages" className="mt-3 inline-flex text-sm font-bold text-[#4F46E5] underline underline-offset-4">
          Ce à quoi j&apos;ai droit →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${CARTE} p-5`}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Que cherches-tu à financer en priorité ?</span>
          <span className="text-[#6B6A8A]">Facultatif. Par exemple : du matériel pour l&apos;atelier cuisine, un poste de coordination, une sortie pour vingt jeunes.</span>
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
        <p className="mt-2 text-xs text-[#6B6A8A]">
          La recherche part de ce que tu as noté : ton projet en une page, tes projets, ta commune. Plus c&apos;est rempli, plus les pistes sont justes.
        </p>
      </div>

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}

      {pistes ? (
        pistes.length === 0 ? (
          <p className="text-sm text-[#6B6A8A]">Aucune piste cette fois. Précise ton projet et relance.</p>
        ) : (
          <>
            <p className="rounded-xl border border-[#D9D6EE] bg-[#F5F4FC] px-4 py-3 text-sm text-[#3B3A66]">
              <span className="font-bold text-[#1D1B5C]">Des pistes, pas des promesses.</span> Vérifie toujours sur le site du financeur : les conditions, les
              montants et les dates changent. Rien de ce qui est écrit ici ne remplace l&apos;annonce officielle.
            </p>
            <ul className="grid gap-4 md:grid-cols-2">
              {pistes.map((p) => (
                <li key={p.nom}>
                  <article className={`${CARTE} flex h-full flex-col p-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-extrabold leading-snug text-[#1D1B5C]">{p.nom}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${TONS[p.type]}`}>{LIBELLES_TYPE[p.type]}</span>
                    </div>
                    {p.echelle ? <p className="mt-0.5 text-sm text-[#6B6A8A]">{p.echelle}</p> : null}
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
