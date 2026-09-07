'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { appel, connecter } from '../_client';
import { CHAMP, ChoixAssociation, type AssociationTrouvee } from '../ChoixAssociation';

/**
 * L'inscription en un écran, deux portes.
 *
 * `avecAssociation` : l'association existe déjà — on la cherche par son nom,
 * et si elle est dans les répertoires publics son classeur naît rempli de ce
 * que l'administration sait déjà.
 *
 * Sinon : on crée seulement le compte. La personne suit le chemin, et ouvrira
 * l'espace de son association le jour où celle-ci existera.
 */
export function FormulaireInscription({ avecAssociation = true }: { avecAssociation?: boolean }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nomAssociation, setNomAssociation] = useState('');
  const [choisie, setChoisie] = useState<AssociationTrouvee | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await appel('/public/association/inscription', {
        method: 'POST',
        body: {
          prenom: prenom.trim(),
          nom: nom.trim(),
          email: email.trim(),
          password: motDePasse,
          ...(avecAssociation
            ? { nomAssociation: (choisie?.nom ?? nomAssociation).trim(), ...(choisie ? { siren: choisie.siren } : {}) }
            : {}),
        },
      });
      await connecter(email.trim(), motDePasse);
      window.location.href = avecAssociation ? '/espace?bienvenue=1' : '/chemin?bienvenue=1';
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'inscription a échoué.");
      setEnCours(false);
    }
  }

  const champ = CHAMP;

  return (
    <form onSubmit={soumettre} className="flex max-w-[560px] flex-col gap-5">
      {avecAssociation ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#4338CA]">1. Ton association</legend>
          <ChoixAssociation nom={nomAssociation} onNom={setNomAssociation} choisie={choisie} onChoisie={setChoisie} />
        </fieldset>
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#4338CA]">{avecAssociation ? '2. Toi' : 'Toi'}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold">Prénom</span>
            <input type="text" required maxLength={80} autoComplete="given-name" value={prenom} onChange={(e) => setPrenom(e.target.value)} className={champ} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold">Nom</span>
            <input type="text" required maxLength={80} autoComplete="family-name" value={nom} onChange={(e) => setNom(e.target.value)} className={champ} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Adresse e-mail</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Mot de passe</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className={champ}
          />
          <span className="text-xs text-[#6B6A8A]">Au moins 8 caractères, avec une lettre et un chiffre.</span>
        </label>
      </fieldset>

      {erreur ? (
        <p role="alert" className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          {erreur}
          {/existe déjà/i.test(erreur) ? (
            <>
              {' '}
              <Link href="/connexion" className="font-bold underline underline-offset-4">
                Se connecter avec cette adresse
              </Link>
              , tout reprendra où tu en étais.
            </>
          ) : null}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enCours}
        className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60"
      >
        {enCours ? 'Création de ton compte…' : avecAssociation ? "Créer l'espace de mon association →" : 'Créer mon compte et commencer →'}
      </button>
      <p className="text-xs leading-relaxed text-[#6B6A8A]">
        Gratuit. Tes pièces restent les tiennes : tu peux les retirer, et fermer ton compte, à tout moment.
      </p>
    </form>
  );
}
