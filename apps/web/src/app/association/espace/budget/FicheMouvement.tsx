'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import {
  LIBELLES_MOYEN,
  LIBELLES_NATURE_MOUVEMENT,
  NATURES_DEPENSE,
  NATURES_RECETTE,
  pourInput,
  type MoyenPaiement,
  type Mouvement,
  type NatureMouvement,
  type SensMouvement,
} from '../_types';

const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

const MOYENS: MoyenPaiement[] = ['ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'EN_LIGNE', 'AUTRE'];

interface Valeurs {
  sens: SensMouvement;
  nature: NatureMouvement;
  libelle: string;
  montant: string;
  date: string;
  tiers: string;
  moyen: MoyenPaiement | '';
  recuFiscal: boolean;
}

function depuis(m: Mouvement | null): Valeurs {
  return {
    sens: m?.sens ?? 'RECETTE',
    nature: m?.nature ?? 'DON',
    libelle: m?.libelle ?? '',
    montant: m ? String(m.montant) : '',
    date: pourInput(m?.date) || new Date().toISOString().slice(0, 10),
    tiers: m?.tiers ?? '',
    moyen: m?.moyen ?? '',
    recuFiscal: m?.recuFiscal ?? false,
  };
}

/** Une ligne du cahier de comptes : ce qui entre ou ce qui sort, en six champs. */
export function FicheMouvement({ mouvement, onFermer }: { mouvement: Mouvement | null; onFermer: () => void }) {
  const router = useRouter();
  const [v, setV] = useState<Valeurs>(depuis(mouvement));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const natures = v.sens === 'RECETTE' ? NATURES_RECETTE : NATURES_DEPENSE;

  function changerSens(sens: SensMouvement) {
    const liste = sens === 'RECETTE' ? NATURES_RECETTE : NATURES_DEPENSE;
    setV((x) => ({ ...x, sens, nature: liste.includes(x.nature) ? x.nature : liste[0] }));
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const body = {
      sens: v.sens,
      nature: v.nature,
      libelle: v.libelle.trim(),
      montant: Number(v.montant.replace(',', '.')) || 0,
      date: v.date,
      tiers: v.tiers.trim() || null,
      moyen: v.moyen || null,
      recuFiscal: v.nature === 'DON' ? v.recuFiscal : false,
    };
    try {
      if (mouvement) await appel(`/association/mouvements/${mouvement.id}`, { method: 'PATCH', body });
      else await appel('/association/mouvements', { method: 'POST', body });
      router.refresh();
      onFermer();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!mouvement) return;
    if (!window.confirm(`Supprimer « ${mouvement.libelle} » du cahier de comptes ?`)) return;
    setEnCours(true);
    try {
      await appel(`/association/mouvements/${mouvement.id}`, { method: 'DELETE' });
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
        <h3 className="text-lg font-extrabold text-[#1D1B5C]">{mouvement ? mouvement.libelle : 'Une nouvelle ligne'}</h3>
        <button type="button" onClick={onFermer} className="text-sm font-bold text-[#6B6A8A] hover:text-[#1D1B5C]">
          Fermer
        </button>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-[#1D1B5C]">L&apos;argent entre ou sort ?</legend>
        <div className="flex flex-wrap gap-2">
          {(['RECETTE', 'DEPENSE'] as SensMouvement[]).map((sens) => (
            <label
              key={sens}
              className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold ${
                v.sens === sens
                  ? sens === 'RECETTE'
                    ? 'border-[#1E9E6A] bg-[#E3F5EC] text-[#0F5F3E]'
                    : 'border-[#C0392B] bg-[#FDE8E6] text-[#8A2419]'
                  : 'border-[#D9D6EE] bg-white text-[#3B3A66]'
              }`}
            >
              <input type="radio" name="sens" checked={v.sens === sens} onChange={() => changerSens(sens)} className="sr-only" />
              {sens === 'RECETTE' ? 'Une entrée d’argent' : 'Une dépense'}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">De quoi s&apos;agit-il ? *</span>
          <select value={v.nature} onChange={(e) => setV({ ...v, nature: e.target.value as NatureMouvement })} className={CHAMP}>
            {natures.map((n) => (
              <option key={n} value={n}>
                {LIBELLES_NATURE_MOUVEMENT[n]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Montant (euros) *</span>
          <input type="number" min={0} step="0.01" required value={v.montant} onChange={(e) => setV({ ...v, montant: e.target.value })} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-bold text-[#1D1B5C]">Libellé *</span>
          <input type="text" required maxLength={200} value={v.libelle} onChange={(e) => setV({ ...v, libelle: e.target.value })} placeholder="Don de Mme Martin, buvette du tournoi, achat de ballons…" className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Date *</span>
          <input type="date" required value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">{v.sens === 'RECETTE' ? 'De qui' : 'À qui'}</span>
          <input type="text" maxLength={160} value={v.tiers} onChange={(e) => setV({ ...v, tiers: e.target.value })} placeholder="Un nom, une mairie, un magasin…" className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Comment</span>
          <select value={v.moyen} onChange={(e) => setV({ ...v, moyen: e.target.value as MoyenPaiement | '' })} className={CHAMP}>
            <option value="">—</option>
            {MOYENS.map((m) => (
              <option key={m} value={m}>
                {LIBELLES_MOYEN[m]}
              </option>
            ))}
          </select>
        </label>
        {v.nature === 'DON' ? (
          <label className="flex items-center gap-3 self-end rounded-xl border border-[#D9D6EE] px-4 py-3 text-sm font-bold text-[#1D1B5C]">
            <input type="checkbox" checked={v.recuFiscal} onChange={(e) => setV({ ...v, recuFiscal: e.target.checked })} className="h-5 w-5 accent-[#4F46E5]" />
            Reçu fiscal envoyé
          </label>
        ) : null}
      </div>

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
          {enCours ? 'Enregistrement…' : mouvement ? 'Enregistrer' : 'Ajouter la ligne'}
        </button>
        {mouvement ? (
          <button type="button" onClick={supprimer} disabled={enCours} className="rounded-xl px-4 py-3 text-sm font-bold text-[#8A2419] hover:bg-[#FDE8E6]">
            Supprimer
          </button>
        ) : null}
      </div>
    </form>
  );
}
