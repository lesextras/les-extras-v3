'use client';

import { useState } from 'react';
import type { Champ } from '../../_shared/formulaires/types';

type Valeur = string | string[] | number;

/**
 * LE FORMULAIRE QU'ON REMPLIT.
 *
 * Un seul écran, une question par bloc, et un bouton. Tout est validé une
 * deuxième fois côté serveur : ce qui est ici sert à éviter un aller-retour
 * inutile, pas à faire confiance au navigateur.
 */
export function Repondre({
  slug,
  champs,
  demanderEmail,
  remerciement,
}: {
  slug: string;
  champs: Champ[];
  demanderEmail: boolean;
  remerciement: string;
}) {
  const [valeurs, setValeurs] = useState<Record<string, Valeur>>({});
  const [email, setEmail] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState<string | null>(null);

  function poser(id: string, v: Valeur) {
    setValeurs((p) => ({ ...p, [id]: v }));
    setErreur(null);
  }

  function basculer(id: string, option: string) {
    const actuel = Array.isArray(valeurs[id]) ? (valeurs[id] as string[]) : [];
    poser(id, actuel.includes(option) ? actuel.filter((o) => o !== option) : [...actuel, option]);
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/proxy/public/formulaires/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ valeurs, email: demanderEmail ? email.trim() : undefined }),
      });
      const texte = await res.text();
      const data = texte ? JSON.parse(texte) : {};
      if (!res.ok) throw new Error(data?.message ?? "L'envoi n'a pas abouti.");
      setEnvoye(typeof data?.remerciement === 'string' ? data.remerciement : remerciement);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setOccupe(false);
    }
  }

  if (envoye) {
    return (
      <div className="mt-5 rounded-[24px] border-2 border-[#C7C4F2] bg-[#ECEBFC] p-7 text-center sm:p-10">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F46E5] text-white"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#1D1B5C]">C&apos;est envoyé.</h2>
        <p className="mx-auto mt-2 max-w-[52ch] whitespace-pre-line leading-relaxed text-[#3B3A66]">{envoye}</p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="mt-5 grid gap-4">
      {champs.map((c) =>
        c.type === 'TITRE' ? (
          <div key={c.id} className="pt-4">
            <h2 className="text-xl font-extrabold tracking-tight text-[#1D1B5C]">{c.libelle}</h2>
            {c.aide ? <p className="mt-1 leading-relaxed text-[#6B6A8A]">{c.aide}</p> : null}
          </div>
        ) : (
          <fieldset key={c.id} className="rounded-2xl border border-[#E6E4F3] bg-white p-5 sm:p-6">
            <legend className="sr-only">{c.libelle}</legend>
            <p className="text-base font-bold text-[#1D1B5C]">
              {c.libelle}
              {c.obligatoire ? <span className="ml-1 text-[#C42B57]">*</span> : null}
            </p>
            {c.aide ? <p className="mt-1 text-sm leading-relaxed text-[#6B6A8A]">{c.aide}</p> : null}
            <div className="mt-3">
              <Question champ={c} valeur={valeurs[c.id]} poser={poser} basculer={basculer} />
            </div>
          </fieldset>
        ),
      )}

      {demanderEmail ? (
        <fieldset className="rounded-2xl border border-[#E6E4F3] bg-white p-5 sm:p-6">
          <legend className="sr-only">Adresse e-mail</legend>
          <p className="text-base font-bold text-[#1D1B5C]">
            Ton adresse e-mail<span className="ml-1 text-[#C42B57]">*</span>
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={CHAMP}
            placeholder="prenom@exemple.fr"
          />
        </fieldset>
      ) : null}

      {erreur ? (
        <p className="rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] px-5 py-4 text-[15px] font-bold text-[#8A1B3D]">
          {erreur}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={occupe}
          className="inline-flex items-center justify-center rounded-xl bg-[#4F46E5] px-6 py-3.5 text-base font-extrabold text-white shadow-sm transition hover:bg-[#4338CA] disabled:opacity-60"
        >
          {occupe ? 'Envoi…' : 'Envoyer ma réponse'}
        </button>
        <p className="text-sm text-[#6B6A8A]">Les champs marqués d&apos;une étoile sont obligatoires.</p>
      </div>
    </form>
  );
}

const CHAMP =
  'mt-2 w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] placeholder:text-[#9C9AB8] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

function Question({
  champ: c,
  valeur,
  poser,
  basculer,
}: {
  champ: Champ;
  valeur: Valeur | undefined;
  poser: (id: string, v: Valeur) => void;
  basculer: (id: string, option: string) => void;
}) {
  const options = c.options ?? [];

  if (c.type === 'PARAGRAPHE') {
    return (
      <textarea
        rows={5}
        required={c.obligatoire}
        value={typeof valeur === 'string' ? valeur : ''}
        onChange={(e) => poser(c.id, e.target.value)}
        className={CHAMP}
      />
    );
  }

  if (c.type === 'CHOIX_UNIQUE' || c.type === 'OUI_NON') {
    const liste = c.type === 'OUI_NON' ? ['Oui', 'Non'] : options;
    return (
      <div className="grid gap-2">
        {liste.map((o) => (
          <label
            key={o}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E6E4F3] px-4 py-3 text-[15px] text-[#3B3A66] hover:border-[#C7C4F2]"
          >
            <input
              type="radio"
              name={c.id}
              value={o}
              required={c.obligatoire}
              checked={valeur === o}
              onChange={() => poser(c.id, o)}
              className="h-4 w-4 accent-[#4F46E5]"
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  }

  if (c.type === 'CHOIX_MULTIPLE') {
    const choisies = Array.isArray(valeur) ? valeur : [];
    return (
      <div className="grid gap-2">
        {options.map((o) => (
          <label
            key={o}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E6E4F3] px-4 py-3 text-[15px] text-[#3B3A66] hover:border-[#C7C4F2]"
          >
            <input
              type="checkbox"
              value={o}
              checked={choisies.includes(o)}
              onChange={() => basculer(c.id, o)}
              className="h-4 w-4 accent-[#4F46E5]"
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  }

  if (c.type === 'LISTE') {
    return (
      <select
        required={c.obligatoire}
        value={typeof valeur === 'string' ? valeur : ''}
        onChange={(e) => poser(c.id, e.target.value)}
        className={CHAMP}
      >
        <option value="">Choisir…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (c.type === 'ECHELLE') {
    const min = c.min ?? 1;
    const max = c.max ?? 5;
    const crans: number[] = [];
    for (let i = min; i <= max; i += 1) crans.push(i);
    return (
      <div className="flex flex-wrap gap-2">
        {crans.map((n) => {
          const actif = Number(valeur) === n;
          return (
            <label
              key={n}
              className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border-2 text-base font-bold transition ${
                actif ? 'border-[#4F46E5] bg-[#4F46E5] text-white' : 'border-[#E6E4F3] bg-white text-[#3B3A66] hover:border-[#C7C4F2]'
              }`}
            >
              <input
                type="radio"
                name={c.id}
                value={n}
                required={c.obligatoire}
                checked={actif}
                onChange={() => poser(c.id, n)}
                className="sr-only"
              />
              {n}
            </label>
          );
        })}
      </div>
    );
  }

  const type =
    c.type === 'EMAIL' ? 'email' : c.type === 'TELEPHONE' ? 'tel' : c.type === 'NOMBRE' ? 'number' : c.type === 'DATE' ? 'date' : 'text';

  return (
    <input
      type={type}
      required={c.obligatoire}
      min={c.type === 'NOMBRE' ? c.min : undefined}
      max={c.type === 'NOMBRE' ? c.max : undefined}
      value={valeur === undefined ? '' : String(valeur)}
      onChange={(e) => poser(c.id, c.type === 'NOMBRE' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      className={CHAMP}
      autoComplete={c.type === 'EMAIL' ? 'email' : c.type === 'TELEPHONE' ? 'tel' : undefined}
    />
  );
}
