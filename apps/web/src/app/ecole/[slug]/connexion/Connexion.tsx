'use client';

import { useState } from 'react';
import { appelApprenant } from '../../_espace/coque';

export function Connexion({ slug, couleur, nom }: { slug: string; couleur: string; nom: string }) {
  const [mode, setMode] = useState<'connexion' | 'lien'>('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      if (mode === 'connexion') {
        await appelApprenant(`/ecoles/${encodeURIComponent(slug)}/connexion`, { methode: 'POST', corps: { email, motDePasse } });
        window.location.href = `/ecole/${slug}/espace`;
        return;
      }
      await appelApprenant(`/ecoles/${encodeURIComponent(slug)}/lien`, { methode: 'POST', corps: { email } });
      setEnvoye(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setOccupe(false);
    }
  }

  const champ = 'w-full rounded-xl border-2 border-[#DDEBE4] bg-white px-4 py-3 text-base focus:outline-none';

  return (
    <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-[#DDEBE4] bg-white p-6 sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5E7A6E]">{nom}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#12312A]">
        {mode === 'connexion' ? 'Mon espace apprenant' : 'Recevoir mon lien'}
      </h1>
      <p className="mt-2 leading-relaxed">
        {mode === 'connexion'
          ? 'Retrouvez toutes vos formations au même endroit.'
          : 'Première connexion ou mot de passe oublié : indiquez l’adresse avec laquelle vous êtes inscrit, un lien vous arrive par e-mail.'}
      </p>

      {envoye ? (
        <p className="mt-6 rounded-xl border border-[#B7E4CE] bg-[#E3F5EC] px-4 py-3 leading-relaxed text-[#0F5F3E]">
          Si cette adresse suit une formation de {nom}, un lien vient de lui être envoyé. Il est valable une heure. Pensez à regarder dans les indésirables.
        </p>
      ) : (
        <form onSubmit={envoyer} className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-sm font-bold text-[#12312A]">
            Adresse e-mail
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} />
          </label>
          {mode === 'connexion' ? (
            <label className="grid gap-1.5 text-sm font-bold text-[#12312A]">
              Mot de passe
              <input type="password" required autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={champ} />
            </label>
          ) : null}
          {erreur ? <p className="text-[15px] font-bold text-[#8A1B3D]">{erreur}</p> : null}
          <button type="submit" disabled={occupe} className="rounded-xl px-5 py-3 text-base font-extrabold text-white disabled:opacity-60" style={{ backgroundColor: couleur }}>
            {occupe ? 'Un instant…' : mode === 'connexion' ? 'Me connecter' : 'Recevoir mon lien'}
          </button>
        </form>
      )}

      <p className="mt-5 text-[15px]">
        {mode === 'connexion' ? (
          <button type="button" onClick={() => { setMode('lien'); setErreur(null); }} className="font-bold underline underline-offset-4" style={{ color: couleur }}>
            Première connexion ou mot de passe oublié ?
          </button>
        ) : (
          <button type="button" onClick={() => { setMode('connexion'); setEnvoye(false); setErreur(null); }} className="font-bold underline underline-offset-4" style={{ color: couleur }}>
            J’ai déjà un mot de passe
          </button>
        )}
      </p>
    </div>
  );
}
