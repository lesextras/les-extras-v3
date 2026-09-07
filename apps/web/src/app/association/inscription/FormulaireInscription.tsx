'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { appel, connecter } from '../_client';
import { CHAMP, ChoixAssociation, type AssociationTrouvee } from '../ChoixAssociation';

/**
 * L'inscription en un écran. Le SIREN est cherché par le nom : si
 * l'association est dans les répertoires publics, son classeur naît déjà
 * rempli de ce que l'administration sait.
 */
export function FormulaireInscription() {
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
          nomAssociation: (choisie?.nom ?? nomAssociation).trim(),
          ...(choisie ? { siren: choisie.siren } : {}),
        },
      });
      await connecter(email.trim(), motDePasse);
      window.location.href = '/espace';
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'inscription a échoué.");
      setEnCours(false);
    }
  }

  const champ = CHAMP;

  return (
    <form onSubmit={soumettre} className="flex max-w-[560px] flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Votre association</legend>
        <ChoixAssociation nom={nomAssociation} onNom={setNomAssociation} choisie={choisie} onChoisie={setChoisie} />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Vous</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Prénom</span>
            <input type="text" required maxLength={80} autoComplete="given-name" value={prenom} onChange={(e) => setPrenom(e.target.value)} className={champ} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nom</span>
            <input type="text" required maxLength={80} autoComplete="family-name" value={nom} onChange={(e) => setNom(e.target.value)} className={champ} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Adresse e-mail</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Mot de passe</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className={champ}
          />
          <span className="text-xs text-[#5C6B63]">Au moins 8 caractères, avec une lettre et un chiffre.</span>
        </label>
      </fieldset>

      {erreur ? (
        <p role="alert" className="rounded-md border border-[#E4C9A0] bg-[#F7EBD6] px-4 py-3 text-sm text-[#7A4A0E]">
          {erreur}
          {/existe déjà/i.test(erreur) ? (
            <>
              {' '}
              <Link href="/connexion" className="font-medium underline underline-offset-4">
                Se connecter avec cette adresse
              </Link>
              , l&apos;espace de votre association s&apos;ouvrira dans la foulée.
            </>
          ) : null}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enCours}
        className="rounded-md bg-[#1F6A4E] px-5 py-3 text-base font-medium text-white hover:bg-[#185540] disabled:opacity-60"
      >
        {enCours ? 'Création de votre espace…' : "Créer l'espace de mon association"}
      </button>
      <p className="text-xs leading-relaxed text-[#5C6B63]">
        Gratuit. Vos pièces restent les vôtres : vous pouvez les retirer, et fermer l&apos;espace, à tout moment.
      </p>
    </form>
  );
}
