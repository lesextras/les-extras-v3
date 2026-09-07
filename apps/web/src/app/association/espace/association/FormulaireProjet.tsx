'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import type { Projet } from '../_types';

const QUESTIONS: { cle: keyof Pick<Projet, 'pourQui' | 'quoi' | 'comment' | 'apres'>; question: string; aide: string }[] = [
  { cle: 'pourQui', question: 'Pour qui ?', aide: 'Les gens que tu aides : qui, où, combien à peu près.' },
  { cle: 'quoi', question: 'Quoi ?', aide: "Ce que tu fais, concrètement : des ateliers, des sorties, un lieu ouvert…" },
  { cle: 'comment', question: 'Comment ?', aide: "Qui s'en occupe, où, quand, avec quel matériel." },
  { cle: 'apres', question: 'Et après ?', aide: 'Ce qui aura changé pour les gens dans un an. Des chiffres simples si tu en as.' },
];

const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

/** Le projet en une page, écrit en répondant à quatre questions. Le texte sert ensuite dans chaque dossier. */
export function FormulaireProjet({ projet }: { projet: Projet }) {
  const router = useRouter();
  const [valeurs, setValeurs] = useState({
    pourQui: projet.pourQui ?? '',
    quoi: projet.quoi ?? '',
    comment: projet.comment ?? '',
    apres: projet.apres ?? '',
    demande: projet.demande ?? '',
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);
    try {
      await appel('/association/projet', { method: 'PATCH', body: valeurs });
      setMessage('Enregistré. Ce texte est prêt à être recopié dans tes dossiers.');
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(projet.texte);
      setMessage('Texte copié. Colle-le dans le formulaire du financeur.');
    } catch {
      setErreur("Impossible de copier automatiquement : sélectionne le texte et copie-le.");
    }
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        {QUESTIONS.map((q) => (
          <label key={q.cle} className="flex flex-col gap-1">
            <span className="font-extrabold text-[#1D1B5C]">{q.question}</span>
            <span className="text-sm text-[#6B6A8A]">{q.aide}</span>
            <textarea
              rows={3}
              maxLength={2000}
              value={valeurs[q.cle]}
              onChange={(e) => setValeurs({ ...valeurs, [q.cle]: e.target.value })}
              className={CHAMP}
            />
          </label>
        ))}
        <label className="flex flex-col gap-1">
          <span className="font-extrabold text-[#1D1B5C]">Ce que nous demandons</span>
          <span className="text-sm text-[#6B6A8A]">Le montant et à quoi il servira. Exemple : « 1 500 € pour la serre et les outils des ateliers ».</span>
          <input type="text" maxLength={1000} value={valeurs.demande} onChange={(e) => setValeurs({ ...valeurs, demande: e.target.value })} className={CHAMP} />
        </label>
        {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}
        {message ? <p className="rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-3 text-sm text-[#0F5F3E]">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
            {enCours ? 'Enregistrement…' : 'Enregistrer mon projet'}
          </button>
          <a href="/association/modeles/exemple-projet-en-une-page.docx" download className="rounded-xl border-2 border-[#D9D6EE] bg-white px-5 py-[10px] text-base font-bold text-[#1D1B5C] no-underline hover:border-[#4F46E5]">
            Voir un exemple ↓
          </a>
        </div>
      </div>
      <div className="rounded-2xl bg-[#F5F4FC] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B6A8A]">Ta page, telle qu&apos;un financeur la lira</p>
          <button type="button" onClick={copier} disabled={!projet.texte} className="rounded-lg px-3 py-1.5 text-sm font-bold text-[#4F46E5] hover:bg-[#ECEBFC] disabled:opacity-50">
            Copier le texte
          </button>
        </div>
        {projet.texte ? (
          <pre className="mt-3 whitespace-pre-wrap font-[inherit] text-[15px] leading-relaxed text-[#1D1B5C]">{projet.texte}</pre>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[#6B6A8A]">
            Réponds aux quatre questions à gauche et enregistre : ta page apparaîtra ici, prête à être copiée dans le formulaire
            CERFA 12156 ou sur Le Compte Asso.
          </p>
        )}
      </div>
    </form>
  );
}
