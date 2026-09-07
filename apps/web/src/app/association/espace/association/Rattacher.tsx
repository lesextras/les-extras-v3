'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';

interface Trouvee {
  nom: string;
  siren: string;
  rna: string | null;
  commune: string | null;
  codePostal: string | null;
}

/** Retrouver l'association dans les répertoires publics et la rattacher. */
export function Rattacher({ valeurInitiale = '' }: { valeurInitiale?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(valeurInitiale);
  const [resultats, setResultats] = useState<Trouvee[]>([]);
  const [etat, setEtat] = useState<'repos' | 'recherche' | 'rattachement'>('repos');
  const [erreur, setErreur] = useState<string | null>(null);

  async function chercher() {
    if (q.trim().length < 3) return;
    setEtat('recherche');
    setErreur(null);
    try {
      setResultats(await appel<Trouvee[]>(`/public/association/recherche?q=${encodeURIComponent(q.trim())}`));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Recherche impossible.');
    } finally {
      setEtat('repos');
    }
  }

  async function rattacher(siren: string) {
    setEtat('rattachement');
    setErreur(null);
    try {
      await appel('/association/organisation/rattacher', { method: 'POST', body: { siren } });
      router.refresh();
      setResultats([]);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Rattachement impossible.');
    } finally {
      setEtat('repos');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void chercher();
            }
          }}
          placeholder="Nom, SIREN ou numéro RNA"
          className="flex-1 rounded-xl border border-[#D9D6EE] bg-white px-4 py-2.5 text-base focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]"
        />
        <button
          type="button"
          onClick={chercher}
          disabled={etat !== 'repos'}
          className="rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4338CA] disabled:opacity-60"
        >
          {etat === 'recherche' ? 'Recherche…' : 'Retrouver'}
        </button>
      </div>
      {erreur ? <p className="text-sm text-[#7C3E06]">{erreur}</p> : null}
      {resultats.length ? (
        <ul className="divide-y divide-[#E6E4F3] rounded-xl border border-[#E6E4F3] bg-white text-sm">
          {resultats.map((r) => (
            <li key={r.siren} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="font-bold">{r.nom}</span>
                <br />
                <span className="text-[#6B6A8A]">
                  {[r.codePostal, r.commune].filter(Boolean).join(' ')} · SIREN {r.siren}
                  {r.rna ? ` · RNA ${r.rna}` : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => rattacher(r.siren)}
                disabled={etat !== 'repos'}
                className="shrink-0 rounded-xl border border-[#4F46E5] px-3 py-1.5 text-sm font-bold text-[#4F46E5] hover:bg-[#ECEBFC] disabled:opacity-60"
              >
                C&apos;est la mienne
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
