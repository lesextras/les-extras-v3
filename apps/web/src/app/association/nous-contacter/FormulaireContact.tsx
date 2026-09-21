'use client';

import { useState, type FormEvent } from 'react';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CHAMP } from '../_ui';

/**
 * ÉCRIRE À ADéPA.
 *
 * Le message part par le site, tout de suite : c'est le seul envoi qui marche
 * partout. Le bouton ouvrait la messagerie de l'appareil — sur un téléphone
 * sans compte configuré, il ne se passait rien, et le message était perdu.
 *
 * La messagerie reste proposée, en second : qui préfère écrire depuis sa boîte
 * et garder une copie dans ses envoyés le peut toujours.
 */

export const ADRESSE_ADEPA = 'assoc.adepa@gmail.com';

const SUJETS = [
  'Une question sur l’outil',
  'Un problème, quelque chose ne marche pas',
  'Une idée, une demande',
  'Parler d’un partenariat',
  'Autre',
];

export function FormulaireContact() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [association, setAssociation] = useState('');
  const [sujet, setSujet] = useState(SUJETS[0]);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);

  function corps() {
    return [
      message.trim(),
      '',
      '···',
      `Nom : ${nom.trim()}`,
      association.trim() ? `Association : ${association.trim()}` : null,
      email.trim() ? `Répondre à : ${email.trim()}` : null,
      'Envoyé depuis Piloter mon association',
    ]
      .filter((l) => l !== null)
      .join('\n');
  }

  /** La messagerie de l'appareil, en second choix. */
  function parMessagerie() {
    const lien = `mailto:${ADRESSE_ADEPA}?subject=${encodeURIComponent(`[Piloter] ${sujet}`)}&body=${encodeURIComponent(corps())}`;
    window.location.href = lien;
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !message.trim()) {
      setErreur('Il manque ton nom ou ton message.');
      return;
    }
    if (!email.trim()) {
      setErreur('Il nous faut ton adresse e-mail pour pouvoir te répondre.');
      return;
    }

    setErreur(null);
    setEnCours(true);
    try {
      const res = await fetch('/api/proxy/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: nom.trim(),
          email: email.trim(),
          content: [`Sujet : ${sujet}`, association.trim() ? `Association : ${association.trim()}` : null, '', message.trim()]
            .filter((l) => l !== null)
            .join('\n'),
        }),
      });
      const texte = await res.text();
      const data = texte ? JSON.parse(texte) : {};
      if (!res.ok) {
        const m = data?.message;
        throw new Error(Array.isArray(m) ? m[0] : typeof m === 'string' ? m : "L'envoi n'a pas abouti.");
      }
      setEnvoye(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'envoi n'a pas abouti.");
    } finally {
      setEnCours(false);
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(`${ADRESSE_ADEPA}\n\n${corps()}`);
      setCopie(true);
      setTimeout(() => setCopie(false), 4000);
    } catch {
      setErreur(`Copie impossible. L’adresse est : ${ADRESSE_ADEPA}`);
    }
  }

  if (envoye) {
    return (
      <div className="rounded-2xl border-2 border-[#B7E4CE] bg-[#E3F5EC] p-6 text-center">
        <h3 className="text-xl font-extrabold tracking-tight text-[#0F5F3E]">C&apos;est parti.</h3>
        <p className="mt-2 leading-relaxed text-[#0F5F3E]/85">
          Ton message est arrivé chez ADéPA. On répond en général sous deux à trois jours ouvrés, à l&apos;adresse que tu
          nous as laissée.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">
            Ton nom <span className="text-[#4F46E5]">*</span>
          </span>
          <input type="text" required maxLength={120} value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">
            Ton adresse e-mail <span className="text-[#4F46E5]">*</span>
          </span>
          <input type="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} className={CHAMP} autoComplete="email" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">Ton association (facultatif)</span>
          <input type="text" maxLength={200} value={association} onChange={(e) => setAssociation(e.target.value)} className={CHAMP} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">Le sujet</span>
          <select value={sujet} onChange={(e) => setSujet(e.target.value)} className={CHAMP}>
            {SUJETS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-[#1D1B5C]">
          Ton message <span className="text-[#4F46E5]">*</span>
        </span>
        <textarea required rows={7} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} className={CHAMP} />
        <span className="mt-1 block text-xs text-[#6B6A8A]">Dis-nous où tu en es : plus c&apos;est concret, plus la réponse est utile.</span>
      </label>

      {erreur ? <p className="rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3 text-sm font-bold text-[#8A1B3D]">{erreur}</p> : null}
      {copie ? <p className="rounded-xl border border-[#B7E4CE] bg-[#E3F5EC] px-4 py-3 text-sm font-bold text-[#0F5F3E]">Message copié. Colle-le dans ton e-mail.</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
          {enCours ? 'Envoi…' : 'Envoyer le message'}
        </button>
        <button type="button" onClick={parMessagerie} className={BTN_SECONDAIRE}>
          Écrire depuis ma messagerie
        </button>
        <button type="button" onClick={copier} className={BTN_SECONDAIRE}>
          Copier le message
        </button>
      </div>
      <p className="text-sm text-[#6B6A8A]">
        Le message part directement d&apos;ici. Tu préfères écrire depuis ta boîte et garder une copie dans tes envoyés ?
        Le second bouton ouvre ta messagerie, et l&apos;adresse est{' '}
        <a href={`mailto:${ADRESSE_ADEPA}`} className="font-bold text-[#4F46E5] underline underline-offset-4">
          {ADRESSE_ADEPA}
        </a>
        .
      </p>
    </form>
  );
}
