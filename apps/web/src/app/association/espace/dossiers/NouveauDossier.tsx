'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { LIBELLES_NATURE, type NatureDossier } from '../_types';

/**
 * Une nouvelle demande. Rien n'est pré-rempli : chaque subvention et chaque
 * appel à projet a ses propres règles. On recopie ce qu'annonce le financeur,
 * et l'idée qu'on va lui proposer.
 *
 * Seule exception, et c'est le principe du site : les financeurs déjà notés
 * dans « Mes contacts » et les projets déjà notés dans « Mes projets » sont
 * proposés, pour ne jamais retaper deux fois la même chose.
 */
export function NouveauDossier({ financeursConnus = [], projetsConnus = [] }: { financeursConnus?: string[]; projetsConnus?: string[] }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [nature, setNature] = useState<NatureDossier>('SUBVENTION');
  const [intitule, setIntitule] = useState('');
  const [financeur, setFinanceur] = useState('');
  const [description, setDescription] = useState('');
  const [ideeProjet, setIdeeProjet] = useState('');
  const [dateLimiteDepot, setDateLimiteDepot] = useState('');
  const [montantMax, setMontantMax] = useState('');
  const [montantDemande, setMontantDemande] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const cree = await appel<{ id: string }>('/association/dossiers', {
        method: 'POST',
        body: {
          nature,
          intitule: intitule.trim(),
          financeur: financeur.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(ideeProjet.trim() ? { ideeProjet: ideeProjet.trim() } : {}),
          ...(dateLimiteDepot ? { dateLimiteDepot } : {}),
          ...(montantMax ? { montantMax: Number(montantMax) } : {}),
          ...(montantDemande ? { montantDemande: Number(montantDemande) } : {}),
        },
      });
      router.push(`/espace/dossiers/${cree.id}`);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La création a échoué.');
      setEnCours(false);
    }
  }

  const champ =
    'rounded-xl border border-[#D9D6EE] bg-white px-3 py-2 text-sm text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]';

  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4338CA]">
        Nouvelle demande
      </button>
    );
  }

  return (
    <form onSubmit={soumettre} className="grid gap-3 rounded-xl border border-[#E6E4F3] bg-white p-5 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-bold text-[#1D1B5C]">C&apos;est une subvention ou un appel à projet ?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['SUBVENTION', 'APPEL_A_PROJET'] as NatureDossier[]).map((n) => (
            <label
              key={n}
              className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-bold ${nature === n ? 'border-[#4F46E5] bg-[#ECEBFC] text-[#4338CA]' : 'border-[#D9D6EE] bg-white text-[#3B3A66]'}`}
            >
              <input type="radio" name="nature" checked={nature === n} onChange={() => setNature(n)} className="sr-only" />
              {LIBELLES_NATURE[n]}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-[#6B6A8A]">
          Une subvention : tu demandes de l&apos;aide pour ce que tu fais. Un appel à projet : un financeur ouvre un concours, tu candidates avant une date.
        </p>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Nom de la demande</span>
        <input type="text" required maxLength={200} value={intitule} onChange={(e) => setIntitule(e.target.value)} placeholder="Le nom que le financeur donne à son aide" className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Financeur</span>
        <input
          type="text"
          required
          maxLength={160}
          list="financeurs-connus"
          value={financeur}
          onChange={(e) => setFinanceur(e.target.value)}
          placeholder="Mairie de …, CAF, département, fondation…"
          className={champ}
        />
        {financeursConnus.length ? (
          <>
            <datalist id="financeurs-connus">
              {financeursConnus.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <span className="text-xs text-[#6B6A8A]">
              Tes financeurs et institutions déjà notés dans « Mes contacts » sont proposés dès les premières lettres.
            </span>
          </>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-bold">Description de la demande</span>
        <span className="text-xs text-[#6B6A8A]">Ce que le financeur cherche à soutenir, recopié de l&apos;annonce : pour qui, pour quoi, ce qu&apos;il exclut.</span>
        <textarea rows={3} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} className={champ} />
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-bold">Idée du projet à proposer</span>
        <span className="text-xs text-[#6B6A8A]">Ce que tu comptes lui présenter. Deux phrases suffisent pour commencer.</span>
        {projetsConnus.length ? (
          <span className="mb-1 flex flex-wrap gap-1.5">
            {projetsConnus.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setIdeeProjet((t) => (t.includes(p) ? t : `${t}${t.trim() ? '\n' : ''}${p}`))}
                className="rounded-full bg-[#ECEBFC] px-3 py-1 text-xs font-bold text-[#4338CA] hover:bg-[#D9D6EE]"
              >
                + {p}
              </button>
            ))}
          </span>
        ) : null}
        <textarea rows={3} maxLength={4000} value={ideeProjet} onChange={(e) => setIdeeProjet(e.target.value)} className={champ} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Date limite</span>
        <input type="date" value={dateLimiteDepot} onChange={(e) => setDateLimiteDepot(e.target.value)} className={champ} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Montant max (€)</span>
          <input type="number" min={0} step={1} value={montantMax} onChange={(e) => setMontantMax(e.target.value)} placeholder="Le plafond annoncé" className={champ} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Montant à demander (€)</span>
          <input type="number" min={0} step={1} value={montantDemande} onChange={(e) => setMontantDemande(e.target.value)} className={champ} />
        </label>
      </div>

      {erreur ? <p className="text-sm text-[#7C3E06] sm:col-span-2">{erreur}</p> : null}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
          {enCours ? 'Création…' : 'Créer la demande'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="rounded-xl px-4 py-2 text-sm text-[#6B6A8A] hover:bg-[#F5F4FC]">
          Annuler
        </button>
      </div>
    </form>
  );
}
