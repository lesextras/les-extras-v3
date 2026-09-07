'use client';

import { useState } from 'react';
import { appel } from '../../../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE } from '../../../_ui';

interface DossierRedige {
  presentation: string;
  objectifs: string[];
  publics: string;
  deroulement: string;
  partenaires: string;
  evaluation: string;
  argumentaire: string;
  aCompleter: string[];
}

const BLOCS: { cle: keyof DossierRedige; titre: string }[] = [
  { cle: 'presentation', titre: 'Présentation du projet' },
  { cle: 'publics', titre: 'À qui ça s’adresse' },
  { cle: 'deroulement', titre: 'Comment ça se passe' },
  { cle: 'partenaires', titre: 'Avec qui' },
  { cle: 'evaluation', titre: 'Comment on saura que ça a marché' },
  { cle: 'argumentaire', titre: 'Pourquoi ce financeur' },
];

/** Écrire les textes de la demande à partir de ce qui est déjà noté dans l'espace. */
export function RedigerIA({ dossierId, disponible }: { dossierId: string; disponible: boolean }) {
  const [precision, setPrecision] = useState('');
  const [texte, setTexte] = useState<DossierRedige | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);

  async function rediger() {
    setErreur(null);
    setEnCours(true);
    try {
      const r = await appel<{ dossier: DossierRedige }>(`/association/ia/dossier/${dossierId}`, {
        method: 'POST',
        body: precision.trim() ? { precision: precision.trim() } : {},
      });
      setTexte(r.dossier);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La rédaction a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  async function copier(cle: string, valeur: string) {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(cle);
      setTimeout(() => setCopie(null), 2000);
    } catch {
      setErreur('La copie a échoué : sélectionne le texte à la main.');
    }
  }

  if (!disponible) {
    return (
      <div className={`${CARTE} p-5`}>
        <h2 className="text-lg font-extrabold text-[#1D1B5C]">Écrire la demande</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#6B6A8A]">
          La rédaction assistée n&apos;est pas encore activée sur ce serveur. En attendant, la fabrique produit les documents officiels (projet en une page,
          budget, rapport d&apos;activité) à partir de tes réponses.
        </p>
      </div>
    );
  }

  return (
    <div className={`${CARTE} p-5`}>
      <h2 className="text-lg font-extrabold text-[#1D1B5C]">Écrire la demande</h2>
      <p className="mt-1 text-sm leading-relaxed text-[#6B6A8A]">
        À partir de ton projet, de tes projets notés et de ce que demande ce financeur. Rien n&apos;est inventé : ce qui manque est listé à la fin, à toi de le
        compléter. Relis toujours avant d&apos;envoyer.
      </p>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#1D1B5C]">Quelque chose à préciser ?</span>
        <textarea
          rows={2}
          maxLength={2000}
          value={precision}
          onChange={(e) => setPrecision(e.target.value)}
          placeholder="Par exemple : insister sur les jeunes du quartier, prévoir deux sorties, mentionner la mairie comme partenaire."
          className="w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]"
        />
      </label>

      <button type="button" onClick={rediger} disabled={enCours} className={`${BTN_PRIMAIRE} mt-3 disabled:opacity-60`}>
        {enCours ? 'Rédaction en cours…' : texte ? 'Réécrire' : 'Écrire la demande'}
      </button>

      {erreur ? <p className="mt-3 rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}

      {texte ? (
        <div className="mt-5 space-y-4">
          {BLOCS.map(({ cle, titre }) => {
            const valeur = texte[cle];
            if (typeof valeur !== 'string' || !valeur) return null;
            return (
              <div key={cle} className="rounded-xl bg-[#F5F4FC] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-extrabold text-[#1D1B5C]">{titre}</h3>
                  <button type="button" onClick={() => copier(cle, valeur)} className="shrink-0 text-sm font-bold text-[#4F46E5] underline underline-offset-4">
                    {copie === cle ? 'Copié' : 'Copier'}
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#3B3A66]">{valeur}</p>
              </div>
            );
          })}

          {texte.objectifs.length ? (
            <div className="rounded-xl bg-[#F5F4FC] p-4">
              <h3 className="font-extrabold text-[#1D1B5C]">Les objectifs</h3>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-[#3B3A66]">
                {texte.objectifs.map((o) => (
                  <li key={o} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5B400]" aria-hidden="true" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {texte.aCompleter.length ? (
            <div className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] p-4">
              <h3 className="font-extrabold text-[#7C3E06]">À compléter par toi</h3>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-[#7C3E06]">
                {texte.aCompleter.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() =>
              copier(
                'tout',
                BLOCS.map(({ cle, titre }) => (typeof texte[cle] === 'string' && texte[cle] ? `${titre}\n${texte[cle] as string}` : '')).filter(Boolean).join('\n\n'),
              )
            }
            className={BTN_SECONDAIRE}
          >
            {copie === 'tout' ? 'Tout est copié' : 'Copier tout le texte'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
