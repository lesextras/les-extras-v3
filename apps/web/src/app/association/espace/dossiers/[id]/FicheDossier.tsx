'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../../_client';
import { LIBELLES_ETAT, pourInput, type Dossier, type EtatDossier } from '../../_types';

const ETATS: EtatDossier[] = ['REPERE', 'EN_ECRITURE', 'DEPOSE', 'ACCORDE', 'REFUSE', 'SOLDE'];

const PIECES = [
  ['STATUTS', 'Statuts'],
  ['RECEPISSE_PREFECTURE', 'Récépissé de préfecture (RNA)'],
  ['JOAFE', 'Publication au Journal officiel'],
  ['SIRET', 'Avis de situation SIRENE (SIRET)'],
  ['LISTE_DIRIGEANTS', 'Liste des dirigeants'],
  ['RIB', 'RIB'],
  ['ASSURANCE_RC', 'Attestation d’assurance RC'],
  ['RAPPORT_ACTIVITE', 'Rapport d’activité'],
  ['COMPTES_ANNUELS', 'Comptes annuels'],
  ['BUDGET_PREVISIONNEL', 'Budget prévisionnel'],
  ['PV_DERNIERE_AG', 'PV de la dernière AG'],
  ['ATTESTATION_URSSAF', 'Attestation URSSAF'],
  ['AGREMENT', 'Agréments'],
] as const;

/** Les dates, montants, état et pièces exigées d'un dossier, modifiables en place. */
export function FicheDossier({ dossier }: { dossier: Dossier }) {
  const router = useRouter();
  const [etat, setEtat] = useState<EtatDossier>(dossier.etat);
  const [financeur, setFinanceur] = useState(dossier.financeur);
  const [intitule, setIntitule] = useState(dossier.intitule);
  const [montantDemande, setMontantDemande] = useState(dossier.montantDemande?.toString() ?? '');
  const [montantAccorde, setMontantAccorde] = useState(dossier.montantAccorde?.toString() ?? '');
  const [dateLimiteDepot, setDateLimiteDepot] = useState(pourInput(dossier.dateLimiteDepot));
  const [dateDepot, setDateDepot] = useState(pourInput(dossier.dateDepot));
  const [dateDecision, setDateDecision] = useState(pourInput(dossier.dateDecision));
  const [dateCompteRendu, setDateCompteRendu] = useState(pourInput(dossier.dateCompteRendu));
  const [pieces, setPieces] = useState<string[]>(dossier.piecesExigees);
  const [notes, setNotes] = useState(dossier.notes ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);
    try {
      await appel(`/association/dossiers/${dossier.id}`, {
        method: 'PATCH',
        body: {
          etat,
          financeur: financeur.trim(),
          intitule: intitule.trim(),
          montantDemande: montantDemande ? Number(montantDemande) : null,
          montantAccorde: montantAccorde ? Number(montantAccorde) : null,
          dateLimiteDepot: dateLimiteDepot || null,
          dateDepot: dateDepot || null,
          dateDecision: dateDecision || null,
          dateCompteRendu: dateCompteRendu || null,
          piecesExigees: pieces,
          notes: notes || null,
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

  async function supprimer() {
    if (!window.confirm('Supprimer ce dossier ? Les pièces du classeur ne sont pas touchées.')) return;
    setEnCours(true);
    try {
      await appel(`/association/dossiers/${dossier.id}`, { method: 'DELETE' });
      router.push('/espace/dossiers');
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La suppression a échoué.');
      setEnCours(false);
    }
  }

  const champ =
    'rounded-xl border border-[#D9D6EE] bg-white px-3 py-2 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]';

  return (
    <form onSubmit={enregistrer} className="grid gap-3 rounded-xl border border-[#E6E4F3] bg-white p-5 sm:grid-cols-2">
      <h2 className="text-sm uppercase tracking-[0.12em] text-[#6B6A8A] sm:col-span-2">Le dossier</h2>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">État</span>
        <select value={etat} onChange={(e) => setEtat(e.target.value as EtatDossier)} className={champ}>
          {ETATS.map((x) => (
            <option key={x} value={x}>
              {LIBELLES_ETAT[x]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Financeur</span>
        <input type="text" required maxLength={160} value={financeur} onChange={(e) => setFinanceur(e.target.value)} className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-bold">Intitulé</span>
        <input type="text" required maxLength={200} value={intitule} onChange={(e) => setIntitule(e.target.value)} className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Date limite de dépôt</span>
        <input type="date" value={dateLimiteDepot} onChange={(e) => setDateLimiteDepot(e.target.value)} className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Date de dépôt</span>
        <input type="date" value={dateDepot} onChange={(e) => setDateDepot(e.target.value)} className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Date de décision</span>
        <input type="date" value={dateDecision} onChange={(e) => setDateDecision(e.target.value)} className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Compte rendu à rendre le</span>
        <input type="date" value={dateCompteRendu} onChange={(e) => setDateCompteRendu(e.target.value)} className={champ} />
        <span className="text-xs text-[#6B6A8A]">En général six mois après la fin de l&apos;action, ou la date fixée par la convention.</span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Montant demandé (€)</span>
        <input type="number" min={0} step={1} value={montantDemande} onChange={(e) => setMontantDemande(e.target.value)} className={champ} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-bold">Montant accordé (€)</span>
        <input type="number" min={0} step={1} value={montantAccorde} onChange={(e) => setMontantAccorde(e.target.value)} className={champ} />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-bold">Pièces exigées par ce financeur</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {PIECES.map(([code, libelle]) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pieces.includes(code)}
                onChange={(e) => setPieces((p) => (e.target.checked ? [...p, code] : p.filter((x) => x !== code)))}
              />
              {libelle}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-bold">Notes</span>
        <textarea rows={3} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} className={champ} />
      </label>
      {erreur ? <p className="text-sm text-[#7C3E06] sm:col-span-2">{erreur}</p> : null}
      {message ? <p className="text-sm text-[#4F46E5] sm:col-span-2">{message}</p> : null}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={supprimer} disabled={enCours} className="ml-auto rounded-xl px-4 py-2 text-sm text-[#7C3E06] hover:bg-[#FEF3E2]">
          Supprimer le dossier
        </button>
      </div>
    </form>
  );
}
