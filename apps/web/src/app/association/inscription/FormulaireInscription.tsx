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
 * Sinon : on crée seulement le compte, et on demande d'abord CE QU'ELLE VEUT
 * CRÉER — une association, un organisme de formation, ou les deux. Beaucoup de
 * gens portent les deux sans le savoir : une association qui forme reste une
 * association, c'est la déclaration d'activité qui fait l'organisme. Poser la
 * question ici évite de faire croire qu'il faut choisir.
 */

/** Ce qu'on veut créer, et où l'on arrive juste après. */
const PROJETS = [
  {
    cle: 'association' as const,
    titre: 'Une association',
    detail: "Déclarer une association loi 1901 : les statuts, la préfecture, le SIRET, le compte en banque, la première subvention.",
    apres: '/association/chemin?bienvenue=1',
  },
  {
    cle: 'academie' as const,
    titre: 'Un organisme de formation',
    detail: "Déclarer une activité de formation : le SIRET, la première convention, la DREETS, puis la certification Qualiopi.",
    apres: '/academie/chemin?bienvenue=1',
  },
  {
    cle: 'les-deux' as const,
    titre: 'Les deux',
    detail: "Une association qui forme suit les deux chemins. Un même compte porte les deux espaces, et tu passes de l'un à l'autre.",
    apres: '/chemin?bienvenue=1',
  },
];
export function FormulaireInscription({ avecAssociation = true }: { avecAssociation?: boolean }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nomAssociation, setNomAssociation] = useState('');
  const [choisie, setChoisie] = useState<AssociationTrouvee | null>(null);
  const [projet, setProjet] = useState<(typeof PROJETS)[number]['cle']>('association');
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
      const suite = PROJETS.find((p) => p.cle === projet)?.apres ?? '/chemin?bienvenue=1';
      window.location.href = avecAssociation ? '/espace?bienvenue=1' : suite;
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
      ) : (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#4338CA]">1. Ce que tu veux créer</legend>
          <div className="grid gap-2">
            {PROJETS.map((p) => (
              <label
                key={p.cle}
                className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition ${
                  projet === p.cle ? 'border-[#4F46E5] bg-[#ECEBFC]' : 'border-[#E6E4F3] bg-white hover:border-[#C7C4F2]'
                }`}
              >
                <input
                  type="radio"
                  name="projet"
                  value={p.cle}
                  checked={projet === p.cle}
                  onChange={() => setProjet(p.cle)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#4F46E5]"
                />
                <span className="min-w-0">
                  <span className="block text-[15px] font-extrabold text-[#1D1B5C]">{p.titre}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-[#3B3A66]">{p.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#4338CA]">2. Toi</legend>
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
