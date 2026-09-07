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
          className="flex-1 rounded-md border border-[#C9C3B5] bg-white px-4 py-2.5 text-base focus:border-[#1F6A4E] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]"
        />
        <button
          type="button"
          onClick={chercher}
          disabled={etat !== 'repos'}
          className="rounded-md bg-[#1F6A4E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#185540] disabled:opacity-60"
        >
          {etat === 'recherche' ? 'Recherche…' : 'Retrouver'}
        </button>
      </div>
      {erreur ? <p className="text-sm text-[#7A4A0E]">{erreur}</p> : null}
      {resultats.length ? (
        <ul className="divide-y divide-[#DDD8CC] rounded-md border border-[#DDD8CC] bg-white text-sm">
          {resultats.map((r) => (
            <li key={r.siren} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="font-medium">{r.nom}</span>
                <br />
                <span className="text-[#5C6B63]">
                  {[r.codePostal, r.commune].filter(Boolean).join(' ')} · SIREN {r.siren}
                  {r.rna ? ` · RNA ${r.rna}` : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => rattacher(r.siren)}
                disabled={etat !== 'repos'}
                className="shrink-0 rounded-md border border-[#1F6A4E] px-3 py-1.5 text-sm font-medium text-[#1F6A4E] hover:bg-[#E4EFE8] disabled:opacity-60"
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
