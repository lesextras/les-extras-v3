'use client';

import { useState } from 'react';

/**
 * S'INSCRIRE À UN COURS.
 *
 * Un cours gratuit s'ouvre tout de suite : une adresse e-mail, et le lien
 * personnel s'affiche. Un cours payant n'encaisse rien ici — c'est l'organisme
 * qui vend, et qui inscrit ensuite depuis son espace. On le dit franchement
 * plutôt que d'ouvrir un formulaire qui ne mènerait nulle part.
 */
export function Rejoindre({
  slug,
  gratuit,
  couleur,
  ecole,
}: {
  slug: string;
  gratuit: boolean;
  couleur: string;
  ecole: string;
}) {
  const [email, setEmail] = useState('');
  const [prenom, setPrenom] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lien, setLien] = useState<string | null>(null);

  if (!gratuit) {
    return (
      <div>
        <p className="text-[15px] leading-relaxed text-[#334A42]">
          Ce cours est payant. {ecole} te donne ton accès dès que l&apos;inscription est réglée — par virement, par lien
          de paiement, ou par ton employeur.
        </p>
        <a
          href="/nous-contacter"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-base font-extrabold text-white no-underline"
          style={{ backgroundColor: couleur }}
        >
          Demander mon inscription
        </a>
      </div>
    );
  }

  if (lien) {
    return (
      <div className="rounded-xl border border-[#DDEBE4] bg-[#F2F7F5] p-4">
        <p className="text-[15px] font-bold text-[#12312A]">C&apos;est ouvert.</p>
        <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">
          Ton accès est personnel : garde ce lien, c&apos;est lui qui rouvre le cours.
        </p>
        <a
          href={lien}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-base font-extrabold text-white no-underline"
          style={{ backgroundColor: couleur }}
        >
          Commencer le cours
        </a>
      </div>
    );
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/proxy/public/ecole/cours/${encodeURIComponent(slug)}/rejoindre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), prenom: prenom.trim() }),
      });
      const texte = await res.text();
      const data = texte ? JSON.parse(texte) : {};
      if (!res.ok) throw new Error(data?.message ?? "L'inscription n'a pas abouti.");
      setLien(typeof data?.lien === 'string' ? data.lien : null);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setOccupe(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="grid gap-3">
      <input
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
        placeholder="Ton prénom"
        className={CHAMP}
        autoComplete="given-name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ton adresse e-mail"
        type="email"
        required
        className={CHAMP}
        autoComplete="email"
      />
      {erreur ? <p className="text-[15px] font-bold text-[#8A1B3D]">{erreur}</p> : null}
      <button
        type="submit"
        disabled={occupe}
        className="rounded-xl px-5 py-3.5 text-base font-extrabold text-white disabled:opacity-60"
        style={{ backgroundColor: couleur }}
      >
        {occupe ? 'Ouverture…' : 'Commencer gratuitement'}
      </button>
      <p className="text-sm leading-relaxed text-[#5E7A6E]">
        Pas de compte à créer. Ton adresse sert à retrouver ton avancement et à t&apos;envoyer ton attestation.
      </p>
    </form>
  );
}

const CHAMP =
  'w-full rounded-xl border border-[#CFE4D9] bg-white px-4 py-3 text-base text-[#12312A] placeholder:text-[#8FA79B] focus:border-[#1E9E6A] focus:outline-none focus:ring-4 focus:ring-[#E3F5EC]';
