'use client';

import { useState, type FormEvent } from 'react';

export interface InfosCommanditaire {
  organisme: string;
  couleur: string | null;
  formation: string;
  debut: string;
  fin: string | null;
  entreprise: string | null;
  stagiaires: (string | null)[];
  dejaRepondu: boolean;
}

/** L'enquête du commanditaire : une minute, trois questions, sur les effets de la formation. */
export function AvisCommanditaire({ jeton, infos }: { jeton: string; infos: InfosCommanditaire }) {
  const couleur = infos.couleur || '#0F5F3E';
  const [note, setNote] = useState(0);
  const [effets, setEffets] = useState<'' | 'OUI' | 'PARTIELLEMENT' | 'NON'>('');
  const [recommande, setRecommande] = useState<'' | 'oui' | 'non'>('');
  const [commentaire, setCommentaire] = useState('');
  const [fait, setFait] = useState(infos.dejaRepondu);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!note) return setErreur('Donnez au moins votre note.');
    setOccupe(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/proxy/public/academie/commanditaire/${encodeURIComponent(jeton)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ note, ...(effets ? { effets } : {}), ...(recommande ? { recommande: recommande === 'oui' } : {}), ...(commentaire.trim() ? { commentaire: commentaire.trim() } : {}) }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { message?: string | string[] } | null;
        const m = j?.message;
        throw new Error((Array.isArray(m) ? m.join(' · ') : m) || "L'envoi n'a pas abouti.");
      }
      setFait(true);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setOccupe(false);
    }
  };

  const choix = (actif: boolean) => `cursor-pointer rounded-xl border-2 px-5 py-2 font-bold ${actif ? 'border-[#1E9E6A] bg-[#E3F5EC] text-[#0F5F3E]' : 'border-[#CFE4D9] text-[#5E7A6E]'}`;
  const noms = infos.stagiaires.filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-[#F2F7F5] px-4 py-10 text-[#334A42]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[640px] rounded-3xl border border-[#DDEBE4] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#5E7A6E]">{infos.organisme}</p>
        <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-[#12312A]">Votre avis sur « {infos.formation} »</h1>
        <p className="mt-2 text-[16px]">
          {infos.entreprise ? `${infos.entreprise} · ` : ''}
          {noms.length ? `${noms.length > 3 ? `${noms.slice(0, 3).join(', ')} et ${noms.length - 3} autre${noms.length - 3 > 1 ? 's' : ''}` : noms.join(', ')}` : ''}
        </p>
        {fait ? (
          <p className="mt-6 rounded-2xl bg-[#E3F5EC] px-5 py-4 text-[17px] font-bold text-[#0F5F3E]">Merci : votre avis est enregistré.</p>
        ) : (
          <form onSubmit={envoyer} className="mt-6 grid gap-5">
            <fieldset>
              <legend className="mb-1.5 text-[15px] font-bold text-[#12312A]">Votre satisfaction, sur 5</legend>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className={`flex h-11 w-11 items-center justify-center ${choix(note === n)}`} style={{ padding: 0 }}>
                    <input type="radio" name="note" className="sr-only" checked={note === n} onChange={() => setNote(n)} />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1.5 text-[15px] font-bold text-[#12312A]">Constatez-vous des effets dans le travail de vos collaborateurs ?</legend>
              <div className="flex flex-wrap gap-2">
                {([
                  ['OUI', 'Oui'],
                  ['PARTIELLEMENT', 'En partie'],
                  ['NON', 'Pas encore'],
                ] as const).map(([k, l]) => (
                  <label key={k} className={choix(effets === k)}>
                    <input type="radio" name="effets" className="sr-only" checked={effets === k} onChange={() => setEffets(k)} />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1.5 text-[15px] font-bold text-[#12312A]">Referiez-vous appel à cet organisme ?</legend>
              <div className="flex gap-2">
                {(['oui', 'non'] as const).map((r) => (
                  <label key={r} className={choix(recommande === r)}>
                    <input type="radio" name="reco" className="sr-only" checked={recommande === r} onChange={() => setRecommande(r)} />
                    {r === 'oui' ? 'Oui' : 'Non'}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-1.5 block text-[15px] font-bold text-[#12312A]">Un commentaire ?</span>
              <textarea className="min-h-[100px] w-full rounded-xl border border-[#CFE4D9] px-4 py-3" maxLength={3000} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
            </label>
            <button type="submit" disabled={occupe} className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-base font-bold text-white disabled:opacity-60" style={{ backgroundColor: couleur }}>
              Envoyer
            </button>
            {erreur ? <p className="rounded-xl bg-[#FDE7EC] px-4 py-3 text-[#8A1B3D]" role="alert">{erreur}</p> : null}
          </form>
        )}
      </div>
    </main>
  );
}
