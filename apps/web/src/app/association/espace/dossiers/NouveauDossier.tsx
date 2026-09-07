'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import type { Dispositif } from '../_types';

/** Créer un dossier : depuis un dispositif connu (pièces pré-remplies) ou à la main. */
export function NouveauDossier({ dispositifs }: { dispositifs: Dispositif[] }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [dispositifCode, setDispositifCode] = useState('');
  const [financeur, setFinanceur] = useState('');
  const [intitule, setIntitule] = useState('');
  const [dateLimiteDepot, setDateLimiteDepot] = useState('');
  const [montantDemande, setMontantDemande] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function choisirDispositif(code: string) {
    setDispositifCode(code);
    const d = dispositifs.find((x) => x.code === code);
    if (d) {
      setFinanceur(d.financeur);
      if (!intitule) setIntitule(d.nom);
    }
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const cree = await appel<{ id: string }>('/association/dossiers', {
        method: 'POST',
        body: {
          ...(dispositifCode ? { dispositifCode } : {}),
          financeur: financeur.trim(),
          intitule: intitule.trim(),
          ...(dateLimiteDepot ? { dateLimiteDepot } : {}),
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
    'rounded-xl border border-[#D9D6EE] bg-white px-3 py-2 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]';

  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4338CA]">
        Nouveau dossier
      </button>
    );
  }

  return (
    <form onSubmit={soumettre} className="grid gap-3 rounded-xl border border-[#E6E4F3] bg-white p-5 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-bold">Dispositif connu (facultatif)</span>
        <select value={dispositifCode} onChange={(e) => choisirDispositif(e.target.value)} className={champ}>
          <option value="">— À la main —</option>
          {dispositifs.map((d) => (
            <option key={d.code} value={d.code}>
              {d.nom}
            </option>
          ))}
        </select>
        <span className="text-xs text-[#6B6A8A]">Un dispositif connu apporte sa liste de pièces exigées.</span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Financeur</span>
        <input type="text" required maxLength={160} value={financeur} onChange={(e) => setFinanceur(e.target.value)} placeholder="Mairie de …, CAF, Département…" className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Intitulé du dossier</span>
        <input type="text" required maxLength={200} value={intitule} onChange={(e) => setIntitule(e.target.value)} placeholder="Subvention de fonctionnement 2026" className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Date limite de dépôt</span>
        <input type="date" value={dateLimiteDepot} onChange={(e) => setDateLimiteDepot(e.target.value)} className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Montant demandé (€)</span>
        <input type="number" min={0} step={1} value={montantDemande} onChange={(e) => setMontantDemande(e.target.value)} className={champ} />
      </label>
      {erreur ? <p className="text-sm text-[#7C3E06] sm:col-span-2">{erreur}</p> : null}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
          {enCours ? 'Création…' : 'Créer le dossier'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="rounded-xl px-4 py-2 text-sm text-[#6B6A8A] hover:bg-[#F5F4FC]">
          Annuler
        </button>
      </div>
    </form>
  );
}
