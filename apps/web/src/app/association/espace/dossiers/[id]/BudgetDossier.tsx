'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../../_client';
import { formaterEuros, type Dossier, type LigneBudget } from '../../_types';

const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-3 py-2 text-sm text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

const LIGNES_DEPART: LigneBudget[] = [
  { libelle: 'Achats (matériel, fournitures)', montant: 0, sens: 'DEPENSE' },
  { libelle: 'Location de salle', montant: 0, sens: 'DEPENSE' },
  { libelle: 'Transport', montant: 0, sens: 'DEPENSE' },
  { libelle: 'Assurance', montant: 0, sens: 'DEPENSE' },
  { libelle: 'Cotisations', montant: 0, sens: 'RECETTE' },
  { libelle: 'Subvention demandée', montant: 0, sens: 'RECETTE' },
  { libelle: "Fonds propres de l'association", montant: 0, sens: 'RECETTE' },
];

function totaux(lignes: LigneBudget[]) {
  const depenses = lignes.filter((l) => l.sens === 'DEPENSE').reduce((s, l) => s + (Number(l.montant) || 0), 0);
  const recettes = lignes.filter((l) => l.sens === 'RECETTE').reduce((s, l) => s + (Number(l.montant) || 0), 0);
  return { depenses, recettes, equilibre: Math.abs(depenses - recettes) < 0.005 };
}

function Tableau({
  titre,
  lignes,
  onChange,
  compare,
}: {
  titre: string;
  lignes: LigneBudget[];
  onChange: (l: LigneBudget[]) => void;
  /** Le budget prévu, pour afficher l'écart à côté du réalisé. */
  compare?: LigneBudget[];
}) {
  const t = totaux(lignes);
  const colonne = (sens: 'DEPENSE' | 'RECETTE') => (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6B6A8A]">{sens === 'DEPENSE' ? 'Dépenses (ce que ça coûte)' : "Recettes (d'où vient l'argent)"}</p>
      <ul className="space-y-2">
        {lignes.map((l, i) =>
          l.sens === sens ? (
            <li key={i} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_110px_auto] items-center gap-2">
              <input type="text" maxLength={160} value={l.libelle} onChange={(e) => onChange(lignes.map((x, j) => (j === i ? { ...x, libelle: e.target.value } : x)))} className={CHAMP} placeholder="Quoi ?" />
              <input type="number" min={0} step={1} value={l.montant || ''} onChange={(e) => onChange(lignes.map((x, j) => (j === i ? { ...x, montant: Number(e.target.value) } : x)))} className={`${CHAMP} text-right tabular-nums`} placeholder="€" />
              <button type="button" onClick={() => onChange(lignes.filter((_, j) => j !== i))} className="rounded-lg px-2 py-1 text-sm text-[#8A2419] hover:bg-[#FDE8E6]" aria-label="Retirer la ligne">
                ×
              </button>
            </li>
          ) : null,
        )}
      </ul>
      <button type="button" onClick={() => onChange([...lignes, { libelle: '', montant: 0, sens }])} className="mt-2 text-sm font-bold text-[#4F46E5] hover:underline">
        + Ajouter une ligne
      </button>
      <p className="mt-3 flex items-center justify-between border-t border-[#E6E4F3] pt-2 text-sm font-extrabold text-[#1D1B5C]">
        <span>Total</span>
        <span className="tabular-nums">{formaterEuros(sens === 'DEPENSE' ? t.depenses : t.recettes)}</span>
      </p>
      {compare ? (
        <p className="mt-1 flex items-center justify-between text-xs text-[#6B6A8A]">
          <span>Prévu</span>
          <span className="tabular-nums">{formaterEuros(sens === 'DEPENSE' ? totaux(compare).depenses : totaux(compare).recettes)}</span>
        </p>
      ) : null}
    </div>
  );
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-extrabold text-[#1D1B5C]">{titre}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.equilibre ? 'bg-[#E3F5EC] text-[#0F5F3E]' : 'bg-[#FEF3E2] text-[#7C3E06]'}`}>
          {t.equilibre ? 'Équilibré : les deux totaux sont égaux' : `Pas équilibré : ${formaterEuros(Math.abs(t.depenses - t.recettes))} d'écart`}
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {colonne('DEPENSE')}
        {colonne('RECETTE')}
      </div>
    </div>
  );
}

/**
 * Le budget d'un dossier : prévu (pour la demande), puis réalisé (pour le
 * compte rendu), avec ce que l'action a produit. Les lignes suivent le CERFA.
 */
export function BudgetDossier({ dossier }: { dossier: Dossier }) {
  const router = useRouter();
  const [prevu, setPrevu] = useState<LigneBudget[]>(dossier.budgetPrevu.length ? dossier.budgetPrevu : LIGNES_DEPART);
  const [realise, setRealise] = useState<LigneBudget[]>(dossier.budgetRealise);
  const [bilan, setBilan] = useState(dossier.bilanAction ?? '');
  const [beneficiaires, setBeneficiaires] = useState(dossier.nombreBeneficiaires?.toString() ?? '');
  const [onglet, setOnglet] = useState<'PREVU' | 'REALISE'>(dossier.etat === 'ACCORDE' || dossier.etat === 'SOLDE' ? 'REALISE' : 'PREVU');
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const propre = (l: LigneBudget[]) => l.filter((x) => x.libelle.trim()).map((x) => ({ libelle: x.libelle.trim(), montant: Number(x.montant) || 0, sens: x.sens }));

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);
    try {
      await appel(`/association/dossiers/${dossier.id}`, {
        method: 'PATCH',
        body: {
          budgetPrevu: propre(prevu),
          budgetRealise: propre(realise),
          bilanAction: bilan.trim() || null,
          nombreBeneficiaires: beneficiaires ? Number(beneficiaires) : null,
        },
      });
      setMessage('Enregistré.');
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOnglet('PREVU')} className={`rounded-full px-4 py-2 text-sm font-bold ${onglet === 'PREVU' ? 'bg-[#1D1B5C] text-white' : 'bg-[#F5F4FC] text-[#3B3A66]'}`}>
          1. Le budget prévu (pour demander)
        </button>
        <button type="button" onClick={() => setOnglet('REALISE')} className={`rounded-full px-4 py-2 text-sm font-bold ${onglet === 'REALISE' ? 'bg-[#1D1B5C] text-white' : 'bg-[#F5F4FC] text-[#3B3A66]'}`}>
          2. Le réalisé (pour rendre compte)
        </button>
      </div>

      {onglet === 'PREVU' ? (
        <>
          <p className="text-sm text-[#6B6A8A]">
            À gauche ce que le projet va coûter, à droite d&apos;où vient l&apos;argent. Les deux totaux doivent être égaux. Ces lignes se
            recopient dans les cases budget du CERFA 12156.
          </p>
          <Tableau titre="Budget prévisionnel" lignes={prevu} onChange={setPrevu} />
        </>
      ) : (
        <>
          <p className="text-sm text-[#6B6A8A]">
            Quand l&apos;action est faite : les vrais chiffres en face des chiffres prévus, et ce que ça a produit. C&apos;est le
            contenu du CERFA 15059, le compte rendu financier.
          </p>
          {realise.length === 0 ? (
            <button type="button" onClick={() => setRealise(prevu.map((l) => ({ ...l })))} className="rounded-xl border-2 border-[#D9D6EE] bg-white px-4 py-2 text-sm font-bold text-[#1D1B5C] hover:border-[#4F46E5]">
              Partir du budget prévu
            </button>
          ) : null}
          <Tableau titre="Réalisé" lignes={realise} onChange={setRealise} compare={prevu} />
          <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-bold text-[#1D1B5C]">Personnes touchées</span>
              <input type="number" min={0} value={beneficiaires} onChange={(e) => setBeneficiaires(e.target.value)} className={CHAMP} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-bold text-[#1D1B5C]">Ce que l&apos;action a produit</span>
              <textarea rows={3} maxLength={4000} value={bilan} onChange={(e) => setBilan(e.target.value)} className={CHAMP} placeholder="Combien de séances, combien de personnes, ce qui a changé. Des phrases simples." />
            </label>
          </div>
        </>
      )}

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}
      {message ? <p className="rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-3 text-sm text-[#0F5F3E]">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
          {enCours ? 'Enregistrement…' : 'Enregistrer le budget'}
        </button>
        <a href="/association/modeles/exemple-budget-previsionnel.xlsx" download className="rounded-xl border-2 border-[#D9D6EE] bg-white px-5 py-[10px] text-base font-bold text-[#1D1B5C] no-underline hover:border-[#4F46E5]">
          Voir un exemple ↓
        </a>
      </div>
    </form>
  );
}
