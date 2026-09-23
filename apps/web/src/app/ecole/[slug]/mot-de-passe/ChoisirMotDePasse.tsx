'use client';

import Link from 'next/link';
import { useState } from 'react';
import { appelApprenant } from '../../_espace/coque';

export function ChoisirMotDePasse({ slug, jeton, couleur }: { slug: string; jeton: string; couleur: string }) {
  const [mdp, setMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (mdp.length < 8) return setErreur('Le mot de passe doit faire au moins 8 caractères.');
    if (mdp !== confirmation) return setErreur('Les deux mots de passe ne sont pas identiques.');
    setOccupe(true);
    setErreur(null);
    try {
      await appelApprenant(`/ecoles/${encodeURIComponent(slug)}/mot-de-passe`, { methode: 'POST', corps: { jeton, motDePasse: mdp } });
      window.location.href = `/ecole/${slug}/espace`;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue');
      setOccupe(false);
    }
  }

  const champ = 'w-full rounded-xl border-2 border-[#DDEBE4] bg-white px-4 py-3 text-base focus:outline-none';
  if (!jeton) {
    return (
      <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-[#DDEBE4] bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#12312A]">Ce lien est incomplet</h1>
        <p className="mt-2 leading-relaxed">Demandez un nouveau lien depuis la page de connexion.</p>
        <Link href={`/ecole/${slug}/connexion`} className="mt-5 inline-block font-bold underline underline-offset-4" style={{ color: couleur }}>
          Aller à la connexion
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-[#DDEBE4] bg-white p-6 sm:p-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#12312A]">Choisir mon mot de passe</h1>
      <p className="mt-2 leading-relaxed">Huit caractères au moins. Il vous servira à retrouver toutes vos formations.</p>
      <form onSubmit={envoyer} className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-sm font-bold text-[#12312A]">
          Nouveau mot de passe
          <input type="password" required autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} className={champ} />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-[#12312A]">
          Le même, une seconde fois
          <input type="password" required autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={champ} />
        </label>
        {erreur ? <p className="text-[15px] font-bold text-[#8A1B3D]">{erreur}</p> : null}
        <button type="submit" disabled={occupe} className="rounded-xl px-5 py-3 text-base font-extrabold text-white disabled:opacity-60" style={{ backgroundColor: couleur }}>
          {occupe ? 'Un instant…' : 'Enregistrer et ouvrir mon espace'}
        </button>
      </form>
    </div>
  );
}
