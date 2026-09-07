'use client';

import { useState, type FormEvent } from 'react';
import { connecter } from '../_client';
import { BTN_PRIMAIRE, CHAMP } from '../_ui';

/**
 * La connexion à l'espace académie. Le compte est le même que celui de
 * l'espace association : c'est l'espace ouvert qui change, pas l'identité.
 */
export function FormulaireConnexion({ destination }: { destination: string }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const { ouvert } = await connecter(email.trim(), motDePasse);
      window.location.href = ouvert ? destination : '/academie/ouvrir-mon-espace';
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La connexion a échoué.');
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Adresse e-mail</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CHAMP} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Mot de passe</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className={CHAMP}
        />
      </label>
      {erreur ? <p role="alert" className="rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3 text-sm font-bold text-[#8A1B3D]">{erreur}</p> : null}
      <button type="submit" disabled={enCours} className={`${BTN_PRIMAIRE} w-full`}>
        {enCours ? 'Connexion…' : 'Ouvrir mon espace'}
      </button>
    </form>
  );
}
