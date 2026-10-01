'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { CHAMP } from '../_ui';

/** Mêmes règles qu'à l'inscription : 8 caractères, une lettre, un chiffre. */
function probleme(mdp: string, confirmation: string): string | null {
  if (mdp.length < 8) return 'Au moins 8 caractères.';
  if (!/[A-Za-z]/.test(mdp)) return 'Au moins une lettre.';
  if (!/[0-9]/.test(mdp)) return 'Au moins un chiffre.';
  if (mdp !== confirmation) return 'Les deux mots de passe ne sont pas identiques.';
  return null;
}

export function FormulaireNouveau({ token }: { token: string }) {
  const [mdp, setMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    const p = probleme(mdp, confirmation);
    if (p) {
      setErreur(p);
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      await appel('/auth/reset-password', { method: 'POST', body: { token, password: mdp } });
      setFait(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le changement a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  if (fait) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-3 font-bold text-[#0F5F3E]">
          C&apos;est fait. Ton nouveau mot de passe est enregistré.
        </p>
        <Link href="/connexion" className="rounded-xl bg-[#4F46E5] px-5 py-3 text-center text-base font-bold text-white no-underline hover:bg-[#4338CA]">
          Me connecter
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Nouveau mot de passe</span>
        <input type="password" required autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} className={CHAMP} />
        <span className="text-[#6B6A8A]">8 caractères minimum · une lettre · un chiffre</span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Encore une fois</span>
        <input type="password" required autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={CHAMP} />
      </label>
      {erreur ? (
        <p role="alert" className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          {erreur}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enCours}
        className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60"
      >
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
