'use client';

import { useState, type FormEvent } from 'react';
import { connecter, ouvrirEspace } from '../_client';
import { CHAMP, ChoixAssociation, type AssociationTrouvee } from '../ChoixAssociation';

/**
 * Connexion en un écran. Si la personne a bien un compte mais aucune
 * association dessus, on ne la renvoie pas à l'inscription (son adresse y
 * serait refusée) : on lui demande le nom de son association et on ouvre
 * l'espace dans la foulée, avec le même mot de passe.
 */
export function FormulaireConnexion({ suivant }: { suivant: string }) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [etape, setEtape] = useState<'connexion' | 'ouverture'>('connexion');
  const [nomAssociation, setNomAssociation] = useState('');
  const [choisie, setChoisie] = useState<AssociationTrouvee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const destination = suivant.startsWith('/') && !suivant.startsWith('//') ? suivant : '/espace';

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const { ouvert } = await connecter(email.trim(), motDePasse);
      if (ouvert) {
        window.location.href = destination;
        return;
      }
      setEtape('ouverture');
      setEnCours(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Connexion impossible.');
      setEnCours(false);
    }
  }

  async function ouvrir(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await ouvrirEspace((choisie?.nom ?? nomAssociation).trim(), choisie?.siren);
      // Nouveau jeton : il porte désormais le compte de l'association.
      const { ouvert } = await connecter(email.trim(), motDePasse);
      if (!ouvert) throw new Error("L'espace a été créé mais la session n'a pas pu s'ouvrir. Reconnectez-vous.");
      window.location.href = destination;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'ouverture de l'espace a échoué.");
      setEnCours(false);
    }
  }

  if (etape === 'ouverture') {
    return (
      <form onSubmit={ouvrir} className="flex max-w-[560px] flex-col gap-5">
        <p className="rounded-md border border-[#B9D6C6] bg-[#E4EFE8] px-4 py-3 text-sm">
          Vous êtes connecté avec <span className="font-medium">{email.trim()}</span>, mais ce compte n&apos;a pas encore
          d&apos;espace d&apos;association. Dites-nous laquelle : on l&apos;ouvre tout de suite.
        </p>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Votre association</legend>
          <ChoixAssociation nom={nomAssociation} onNom={setNomAssociation} choisie={choisie} onChoisie={setChoisie} />
        </fieldset>
        {erreur ? (
          <p role="alert" className="rounded-md border border-[#E4C9A0] bg-[#F7EBD6] px-4 py-3 text-sm text-[#7A4A0E]">
            {erreur}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={enCours || nomAssociation.trim().length < 3}
          className="rounded-md bg-[#1F6A4E] px-5 py-3 text-base font-medium text-white hover:bg-[#185540] disabled:opacity-60"
        >
          {enCours ? 'Ouverture…' : "Ouvrir l'espace de mon association"}
        </button>
      </form>
    );
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
          className={CHAMP}
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
          className={CHAMP}
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
