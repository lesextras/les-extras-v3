'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { appel, connecter, ouvrirAcademie } from '../_client';
import { BTN_PRIMAIRE, CHAMP } from '../_ui';
import { LIBELLES_QUALIOPI, type EtatQualiopi } from '../_types';
import { ChoixAcademie, type OrganismeTrouve } from '../ChoixAcademie';

/**
 * L'INSCRIPTION EN UN ÉCRAN.
 *
 * Trois temps enchaînés sans que la personne ait à y penser : on crée le
 * compte, on l'ouvre, puis on ouvre l'espace de son académie. Le NDA est
 * facultatif — un organisme en cours de déclaration doit pouvoir entrer.
 */
export function FormulaireInscription() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nomAcademie, setNomAcademie] = useState('');
  // L'organisme retrouve dans les repertoires publics. C'est lui qui remplit
  // le SIRET, le NDA et l'etat Qualiopi, pour qu'on n'ait rien a recopier.
  const [choisi, setChoisi] = useState<OrganismeTrouve | null>(null);
  const [siret, setSiret] = useState('');
  const [nda, setNda] = useState('');
  const [qualiopi, setQualiopi] = useState<EtatQualiopi>('PAS_ENGAGE');
  const [accepte, setAccepte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      // 1. Le compte de la personne, sans association : c'est un organisme.
      await appel('/public/association/inscription', {
        method: 'POST',
        body: { prenom: prenom.trim(), nom: nom.trim(), email: email.trim(), password: motDePasse },
      });
      // 2. La session.
      await connecter(email.trim(), motDePasse);
      // 3. L'espace de l'académie.
      await ouvrirAcademie(choisi?.nom ?? nomAcademie, {
        // Le SIREN retrouve dans les repertoires pre-remplit la fiche cote
        // serveur, adresse et declaration d'activite comprises.
        siren: choisi?.siren,
        siret: siret.replace(/\s/g, '') || choisi?.siret || undefined,
        nda: nda.trim() || choisi?.declaration?.nda || undefined,
        qualiopi,
      });
      window.location.href = '/academie?bienvenue=1';
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'inscription a échoué.");
      setEnCours(false);
    }
  }

  const etats: EtatQualiopi[] = ['PAS_ENGAGE', 'EN_PREPARATION', 'AUDIT_PLANIFIE', 'CERTIFIE'];

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5F3E]">1. Ton académie</legend>
        <ChoixAcademie
          libelle="Son nom"
          nom={nomAcademie}
          onNom={setNomAcademie}
          choisi={choisi}
          onChoisi={(o) => {
            setChoisi(o);
            // Ce que les repertoires savent, on le pose dans les champs. La
            // personne voit ce qui a ete rempli, et peut le corriger.
            if (o) {
              if (o.siret) setSiret(o.siret);
              if (o.declaration?.nda) setNda(o.declaration.nda);
              if (o.declaration?.certifie) setQualiopi('CERTIFIE');
            }
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#12312A]">SIRET</span>
            <input type="text" inputMode="numeric" maxLength={17} value={siret} onChange={(e) => setSiret(e.target.value)} className={CHAMP} />
            <span className="text-xs text-[#5E7A6E]">
              {choisi?.siret ? 'Trouvé dans les répertoires publics.' : 'Facultatif, quatorze chiffres.'}
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#12312A]">Numéro de déclaration (NDA)</span>
            <input type="text" maxLength={20} value={nda} onChange={(e) => setNda(e.target.value)} className={CHAMP} />
            <span className="text-xs text-[#5E7A6E]">
              {choisi?.declaration?.nda
                ? 'Trouvé dans la liste publique des organismes de formation.'
                : 'Facultatif, tu peux entrer sans et le renseigner après.'}
            </span>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#12312A]">Où en es-tu avec Qualiopi ?</span>
          <select value={qualiopi} onChange={(e) => setQualiopi(e.target.value as EtatQualiopi)} className={CHAMP}>
            {etats.map((x) => (
              <option key={x} value={x}>
                {LIBELLES_QUALIOPI[x]}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#5E7A6E]">C&apos;est ce choix qui décide de ce que ton accueil met en avant.</span>
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5F3E]">2. Toi</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#12312A]">Prénom</span>
            <input type="text" required maxLength={80} autoComplete="given-name" value={prenom} onChange={(e) => setPrenom(e.target.value)} className={CHAMP} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#12312A]">Nom</span>
            <input type="text" required maxLength={80} autoComplete="family-name" value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#12312A]">Adresse e-mail</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#12312A]">Mot de passe</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className={CHAMP}
          />
          <span className="text-xs text-[#5E7A6E]">Au moins 8 caractères, avec une lettre et un chiffre.</span>
        </label>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-2 text-sm" style={{ color: '#5E7A6E' }}>
        <input
          type="checkbox"
          required
          checked={accepte}
          onChange={(e) => setAccepte(e.target.checked)}
          className="mt-1 size-4"
        />
        <span>
          J&apos;accepte les{' '}
          <Link href="/legal#cgu" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            conditions d&apos;utilisation
          </Link>{' '}
          et la{' '}
          <Link href="/legal#donnees" className="font-bold text-[#0F5F3E] underline underline-offset-4">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      {erreur ? (
        <p role="alert" className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          {erreur}
          {/existe déjà/i.test(erreur) ? (
            <>
              {' '}
              <Link href="/academie/connexion" className="font-bold underline underline-offset-4">
                Se connecter avec cette adresse
              </Link>
              , puis ouvrir l&apos;espace de ton académie.
            </>
          ) : null}
        </p>
      ) : null}

      <button type="submit" disabled={enCours || !accepte} className={BTN_PRIMAIRE}>
        {enCours ? 'Ouverture de ton espace…' : "Ouvrir l'espace de mon académie →"}
      </button>
      <p className="text-xs leading-relaxed text-[#5E7A6E]">
        Gratuit. Tes pièces restent les tiennes : tu peux les retirer, et fermer ton compte, à tout moment.
      </p>
    </form>
  );
}
