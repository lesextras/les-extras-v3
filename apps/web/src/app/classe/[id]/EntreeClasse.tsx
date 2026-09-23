'use client';

import dynamic from 'next/dynamic';
import { useState, type FormEvent } from 'react';
import { appelApprenant } from '../../ecole/_espace/coque';
import type { AccesSalle } from './SalleClasse';

// La bibliothèque de visio ne se charge qu'au moment d'entrer.
const SalleClasse = dynamic(() => import('./SalleClasse').then((m) => m.SalleClasse), { ssr: false });

export interface ClassePublique {
  id: string;
  titre: string;
  description: string | null;
  formation: string | null;
  debut: string;
  fin: string | null;
  ouvertureLe: string;
  fermetureLe: string;
  etat: 'TROP_TOT' | 'OUVERTE' | 'TERMINEE';
  salleIntegree: boolean;
  lienExterne: string | null;
  disponible: boolean;
  ecole: { nom: string; couleur: string; logoUrl: string | null; slug: string | null };
}

function quand(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}

export function EntreeClasse({ classe, animateur, jeton }: { classe: ClassePublique; animateur: string | null; jeton: string | null }) {
  const couleur = classe.ecole.couleur || '#0F5F3E';
  const [prenom, setPrenom] = useState('');
  const [acces, setAcces] = useState<AccesSalle | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [partie, setPartie] = useState(false);

  async function entrer(e: FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const a = await appelApprenant<AccesSalle>(`/classes/${classe.id}/rejoindre`, {
        methode: 'POST',
        corps: {
          ...(animateur ? { animateur } : {}),
          ...(jeton ? { jeton } : {}),
          ...(prenom.trim() ? { prenom: prenom.trim() } : {}),
        },
      });
      setAcces(a);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'entrée dans la salle n'a pas abouti.");
    } finally {
      setEnCours(false);
    }
  }

  if (acces) {
    return (
      <div className="min-h-screen bg-[#12312A] p-3 sm:p-5">
        <div className="mx-auto mb-3 flex max-w-[1400px] items-center justify-between gap-3 text-white">
          <p className="font-extrabold">{classe.titre}</p>
          <p className="text-sm text-white/70">{classe.ecole.nom}</p>
        </div>
        <div className="mx-auto max-w-[1400px]">
          <SalleClasse
            acces={acces}
            couleur={couleur}
            onQuitter={() => {
              setAcces(null);
              setPartie(true);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#334A42]">
      <header style={{ backgroundColor: couleur }} className="px-4 py-5 text-white">
        <div className="mx-auto flex max-w-[760px] items-center gap-3">
          {classe.ecole.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={classe.ecole.logoUrl} alt="" className="h-10 w-10 rounded-xl bg-white/10 object-contain p-1" />
          ) : null}
          <span className="text-lg font-extrabold">{classe.ecole.nom}</span>
        </div>
      </header>
      <main className="mx-auto max-w-[760px] px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5E7A6E]">Classe virtuelle{animateur ? ' · animateur' : ''}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#12312A]">{classe.titre}</h1>
        <p className="mt-2 text-lg first-letter:uppercase">{quand(classe.debut)}</p>
        {classe.formation ? <p className="mt-1 text-[15px] text-[#5E7A6E]">Formation : {classe.formation}</p> : null}
        {classe.description ? <p className="mt-4 whitespace-pre-line leading-relaxed">{classe.description}</p> : null}

        <div className="mt-8 rounded-2xl border border-[#DDEBE4] bg-white p-6">
          {partie ? <p className="mb-4 font-bold text-[#0F5F3E]">Vous avez quitté la salle. Vous pouvez y revenir tant que la classe dure.</p> : null}
          {!classe.salleIntegree ? (
            classe.lienExterne ? (
              <>
                <p className="leading-relaxed">Cette classe se tient sur un outil de visio choisi par l&apos;école.</p>
                <a href={classe.lienExterne} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-xl px-5 py-3 font-extrabold text-white no-underline" style={{ backgroundColor: couleur }}>
                  Ouvrir le lien de la classe
                </a>
              </>
            ) : (
              <p>L&apos;école n&apos;a pas encore indiqué comment rejoindre cette classe.</p>
            )
          ) : !classe.disponible ? (
            <p>La salle de visio n&apos;est pas disponible pour le moment. Réessayez dans quelques minutes.</p>
          ) : classe.etat === 'TERMINEE' ? (
            <p>Cette classe est terminée.</p>
          ) : classe.etat === 'TROP_TOT' && !animateur ? (
            <p className="leading-relaxed">
              La salle ouvre un quart d&apos;heure avant le début, <strong>{quand(classe.ouvertureLe)}</strong>. Revenez sur cette page à ce moment-là.
            </p>
          ) : (
            <form onSubmit={entrer} className="grid gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Le prénom affiché dans la salle</span>
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={60} placeholder={animateur ? 'Formateur' : 'Votre prénom'} className="w-full rounded-xl border-2 border-[#DDEBE4] px-4 py-3 text-base focus:outline-none" />
              </label>
              <p className="text-sm text-[#5E7A6E]">
                Votre navigateur vous demandera d&apos;autoriser la caméra et le micro. Rien n&apos;est enregistré.
              </p>
              {erreur ? <p className="font-bold text-[#8A1B3D]">{erreur}</p> : null}
              <button type="submit" disabled={enCours} className="rounded-xl px-5 py-3 font-extrabold text-white disabled:opacity-60" style={{ backgroundColor: couleur }}>
                {enCours ? 'Entrée…' : 'Entrer dans la classe'}
              </button>
              {!animateur && !jeton && classe.ecole.slug ? (
                <p className="text-sm text-[#5E7A6E]">
                  Pas encore connecté ?{' '}
                  <a href={`/ecole/${classe.ecole.slug}/connexion`} className="font-bold underline underline-offset-4">
                    Ouvrir mon espace apprenant
                  </a>
                </p>
              ) : null}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
