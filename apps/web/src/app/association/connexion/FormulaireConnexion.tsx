'use client';

import { useState, type FormEvent } from 'react';
import { connecter } from '../_client';

export function FormulaireConnexion({ suivant }: { suivant: string }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await connecter(email.trim(), motDePasse);
      window.location.href = suivant.startsWith('/') && !suivant.startsWith('//') ? suivant : '/espace';
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Connexion impossible.');
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="flex max-w-[440px] flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Adresse e-mail</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-[#C9C3B5] bg-white px-4 py-3 text-base focus:border-[#1F6A4E] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Mot de passe</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="rounded-md border border-[#C9C3B5] bg-white px-4 py-3 text-base focus:border-[#1F6A4E] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]"
        />
      </label>
      {erreur ? (
        <p role="alert" className="rounded-md border border-[#E4C9A0] bg-[#F7EBD6] px-4 py-3 text-sm text-[#7A4A0E]">
          {erreur}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-[#1F6A4E] px-5 py-3 text-base font-medium text-white hover:bg-[#185540] disabled:opacity-60"
      >
        {enCours ? 'Connexion…' : 'Ouvrir mon espace'}
      </button>
    </form>
  );
}
