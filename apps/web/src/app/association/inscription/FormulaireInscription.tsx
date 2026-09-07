'use client';

import { useState, type FormEvent } from 'react';
import { appel, connecter } from '../_client';

interface Trouvee {
  nom: string;
  siren: string;
  rna: string | null;
  commune: string | null;
  codePostal: string | null;
}

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
  const [resultats, setResultats] = useState<Trouvee[]>([]);
  const [choisie, setChoisie] = useState<Trouvee | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function chercher() {
    if (nomAssociation.trim().length < 3) return;
    setRecherche(true);
    setChoisie(null);
    try {
      const r = await appel<Trouvee[]>(`/public/association/recherche?q=${encodeURIComponent(nomAssociation.trim())}`);
      setResultats(r);
    } catch {
      setResultats([]);
    } finally {
      setRecherche(false);
    }
  }

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

  const champ =
    'rounded-md border border-[#C9C3B5] bg-white px-4 py-3 text-base focus:border-[#1F6A4E] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]';

  return (
    <form onSubmit={soumettre} className="flex max-w-[560px] flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">Votre association</legend>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Son nom</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              required
              minLength={3}
              value={nomAssociation}
              onChange={(e) => {
                setNomAssociation(e.target.value);
                setChoisie(null);
              }}
              onBlur={chercher}
              placeholder="Tel qu'il est déclaré en préfecture"
              className={`flex-1 ${champ}`}
            />
            <button
              type="button"
              onClick={chercher}
              disabled={recherche}
              className="rounded-md border border-[#1F6A4E] px-4 py-3 text-sm font-medium text-[#1F6A4E] hover:bg-[#E4EFE8] disabled:opacity-60"
            >
              {recherche ? 'Recherche…' : 'Retrouver dans les répertoires'}
            </button>
          </div>
        </label>
        {resultats.length > 0 && !choisie ? (
          <ul className="divide-y divide-[#DDD8CC] rounded-md border border-[#DDD8CC] bg-white text-sm">
            {resultats.map((r) => (
              <li key={r.siren}>
                <button
                  type="button"
                  onClick={() => setChoisie(r)}
                  className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-[#F6F4EE]"
                >
                  <span className="font-medium">{r.nom}</span>
                  <span className="text-[#5C6B63]">
                    {[r.codePostal, r.commune].filter(Boolean).join(' ')} · SIREN {r.siren}
                    {r.rna ? ` · RNA ${r.rna}` : ''}
                  </span>
                </button>
              </li>
            ))}
            <li className="px-4 py-2 text-xs text-[#5C6B63]">Ce n&apos;est pas la vôtre ? Continuez, vous la rattacherez plus tard.</li>
          </ul>
        ) : null}
        {choisie ? (
          <p className="rounded-md border border-[#B9D6C6] bg-[#E4EFE8] px-4 py-3 text-sm">
            <span className="font-medium">{choisie.nom}</span> · SIREN {choisie.siren}
            {choisie.rna ? ` · RNA ${choisie.rna}` : ''} — son classeur sera pré-rempli.{' '}
            <button type="button" onClick={() => setChoisie(null)} className="underline underline-offset-4">
              Changer
            </button>
          </p>
        ) : null}
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
