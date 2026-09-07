'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { LIBELLES_ETAT_ACTION, pourInput, type ActionAssociation, type EtatAction } from '../_types';

const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

const ETATS: EtatAction[] = ['PREVUE', 'EN_COURS', 'TERMINEE'];

interface Valeurs {
  intitule: string;
  resume: string;
  lieu: string;
  dateDebut: string;
  dateFin: string;
  etat: EtatAction;
  beneficiaires: string;
  benevoles: string;
  heuresBenevoles: string;
  cout: string;
  partenaires: string;
  bilan: string;
}

const nombre = (v: string) => (v.trim() === '' ? null : Math.max(0, Math.round(Number(v.replace(',', '.')))) || 0);

function depuis(a: ActionAssociation | null): Valeurs {
  return {
    intitule: a?.intitule ?? '',
    resume: a?.resume ?? '',
    lieu: a?.lieu ?? '',
    dateDebut: pourInput(a?.dateDebut),
    dateFin: pourInput(a?.dateFin),
    etat: a?.etat ?? 'PREVUE',
    beneficiaires: a?.beneficiaires === null || a?.beneficiaires === undefined ? '' : String(a.beneficiaires),
    benevoles: a?.benevoles === null || a?.benevoles === undefined ? '' : String(a.benevoles),
    heuresBenevoles: a?.heuresBenevoles === null || a?.heuresBenevoles === undefined ? '' : String(a.heuresBenevoles),
    cout: a?.cout === null || a?.cout === undefined ? '' : String(a.cout),
    partenaires: a?.partenaires ?? '',
    bilan: a?.bilan ?? '',
  };
}

/**
 * La fiche d'un projet : peu de champs, et seulement ceux qui servent. Les
 * chiffres du bas sont exactement ceux qu'un financeur demande.
 */
export function FicheProjet({ projet, onFermer }: { projet: ActionAssociation | null; onFermer: () => void }) {
  const router = useRouter();
  const [v, setV] = useState<Valeurs>(depuis(projet));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const body = {
      intitule: v.intitule.trim(),
      resume: v.resume.trim() || null,
      lieu: v.lieu.trim() || null,
      dateDebut: v.dateDebut || null,
      dateFin: v.dateFin || null,
      etat: v.etat,
      beneficiaires: nombre(v.beneficiaires),
      benevoles: nombre(v.benevoles),
      heuresBenevoles: nombre(v.heuresBenevoles),
      cout: nombre(v.cout),
      partenaires: v.partenaires.trim() || null,
      bilan: v.bilan.trim() || null,
    };
    try {
      if (projet) await appel(`/association/actions/${projet.id}`, { method: 'PATCH', body });
      else await appel('/association/actions', { method: 'POST', body });
      router.refresh();
      onFermer();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!projet) return;
    if (!window.confirm(`Retirer « ${projet.intitule} » de mes projets ?`)) return;
    setEnCours(true);
    try {
      await appel(`/association/actions/${projet.id}`, { method: 'DELETE' });
      router.refresh();
      onFermer();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La suppression a échoué.');
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-4 rounded-2xl border-2 border-[#4F46E5] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[#1D1B5C]">{projet ? projet.intitule : 'Un nouveau projet'}</h3>
        <button type="button" onClick={onFermer} className="text-sm font-bold text-[#6B6A8A] hover:text-[#1D1B5C]">
          Fermer
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#1D1B5C]">Le nom du projet *</span>
        <input type="text" required maxLength={200} value={v.intitule} onChange={(e) => setV({ ...v, intitule: e.target.value })} placeholder="Sortie à la ferme, atelier cuisine, tournoi de foot…" className={CHAMP} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#1D1B5C]">Pour qui, et quoi</span>
        <span className="text-[#6B6A8A]">Deux phrases suffisent : c&apos;est ce texte qu&apos;on recopie dans le rapport d&apos;activité.</span>
        <textarea rows={3} maxLength={2000} value={v.resume} onChange={(e) => setV({ ...v, resume: e.target.value })} className={CHAMP} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Où</span>
          <input type="text" maxLength={160} value={v.lieu} onChange={(e) => setV({ ...v, lieu: e.target.value })} placeholder="Salle des fêtes, école, quartier…" className={CHAMP} />
        </label>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="font-bold text-[#1D1B5C]">Où en est-elle ?</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {ETATS.map((e) => (
              <label
                key={e}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-bold ${v.etat === e ? 'border-[#4F46E5] bg-[#ECEBFC] text-[#4338CA]' : 'border-[#D9D6EE] bg-white text-[#3B3A66]'}`}
              >
                <input type="radio" name="etat" checked={v.etat === e} onChange={() => setV({ ...v, etat: e })} className="sr-only" />
                {LIBELLES_ETAT_ACTION[e]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Du</span>
          <input type="date" value={v.dateDebut} onChange={(e) => setV({ ...v, dateDebut: e.target.value })} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Au</span>
          <input type="date" value={v.dateFin} onChange={(e) => setV({ ...v, dateFin: e.target.value })} className={CHAMP} />
        </label>
      </div>

      <fieldset className="rounded-xl bg-[#F5F4FC] p-4">
        <legend className="px-1 text-sm font-bold text-[#1D1B5C]">Les chiffres que les financeurs demandent</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Personnes touchées</span>
            <input type="number" min={0} value={v.beneficiaires} onChange={(e) => setV({ ...v, beneficiaires: e.target.value })} className={CHAMP} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Bénévoles</span>
            <input type="number" min={0} value={v.benevoles} onChange={(e) => setV({ ...v, benevoles: e.target.value })} className={CHAMP} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Heures de bénévolat</span>
            <input type="number" min={0} value={v.heuresBenevoles} onChange={(e) => setV({ ...v, heuresBenevoles: e.target.value })} className={CHAMP} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold text-[#1D1B5C]">Coût (euros)</span>
            <input type="number" min={0} value={v.cout} onChange={(e) => setV({ ...v, cout: e.target.value })} className={CHAMP} />
          </label>
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold text-[#1D1B5C]">Avec qui</span>
        <span className="text-[#6B6A8A]">La mairie, une école, une autre association, une entreprise.</span>
        <input type="text" maxLength={400} value={v.partenaires} onChange={(e) => setV({ ...v, partenaires: e.target.value })} className={CHAMP} />
      </label>

      {v.etat === 'TERMINEE' ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Ce qu&apos;on en retient</span>
          <span className="text-[#6B6A8A]">Ce qui a marché, ce qu&apos;on changerait. C&apos;est le bilan à joindre au compte rendu de subvention.</span>
          <textarea rows={3} maxLength={4000} value={v.bilan} onChange={(e) => setV({ ...v, bilan: e.target.value })} className={CHAMP} />
        </label>
      ) : null}

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
          {enCours ? 'Enregistrement…' : projet ? 'Enregistrer' : 'Ajouter ce projet'}
        </button>
        {projet ? (
          <button type="button" onClick={supprimer} disabled={enCours} className="rounded-xl px-4 py-3 text-sm font-bold text-[#8A2419] hover:bg-[#FDE8E6]">
            Supprimer
          </button>
        ) : null}
      </div>
    </form>
  );
}
