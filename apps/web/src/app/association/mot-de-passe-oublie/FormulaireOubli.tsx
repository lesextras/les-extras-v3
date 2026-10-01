'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { CHAMP } from '../_ui';

export function FormulaireOubli() {
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await appel('/auth/forgot-password', { method: 'POST', body: { email: email.trim(), produit: 'pilote' } });
      setEnvoye(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'L’envoi a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <div role="status" className="rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-4 text-[15px] leading-relaxed text-[#0F5F3E]">
        <p className="font-extrabold">C&apos;est parti.</p>
        <ul className="mt-2 space-y-1">
          <li>· Si un compte existe à cette adresse, le lien arrive dans quelques minutes.</li>
          <li>· Il est valable une heure.</li>
          <li>· Rien reçu ? Regarde dans les indésirables.</li>
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Adresse e-mail</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CHAMP} />
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
        {enCours ? 'Envoi…' : 'Recevoir le lien'}
      </button>
    </form>
  );
}
