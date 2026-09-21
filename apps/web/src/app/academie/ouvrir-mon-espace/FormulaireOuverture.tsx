'use client';

import { useState, type FormEvent } from 'react';
import { ouvrirAcademie } from '../_client';
import { BTN_PRIMAIRE, CHAMP } from '../_ui';
import { LIBELLES_QUALIOPI, type EtatQualiopi } from '../_types';
import { ChoixAcademie, type OrganismeTrouve } from '../ChoixAcademie';

/** Nommer son organisme, et l'espace s'ouvre. Le reste se complète après. */
export function FormulaireOuverture({ autre = false }: { autre?: boolean }) {
  const [nom, setNom] = useState('');
  const [choisi, setChoisi] = useState<OrganismeTrouve | null>(null);
  const [siret, setSiret] = useState('');
  const [nda, setNda] = useState('');
  const [qualiopi, setQualiopi] = useState<EtatQualiopi>('PAS_ENGAGE');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (nom.trim().length < 2) {
      setErreur("Écris le nom de ton académie.");
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      const r = await ouvrirAcademie(choisi?.nom ?? nom, {
        // Le SIREN retrouvé dans les répertoires : c'est lui qui pré-remplit la
        // fiche côté serveur (SIRET, adresse, NDA, DREETS).
        siren: choisi?.siren,
        siret: siret.replace(/\s/g, '') || choisi?.siret || undefined,
        nda: nda.trim() || choisi?.declaration?.nda || undefined,
        qualiopi,
        autre,
      });
      window.location.href = r.existant ? '/academie/mon-academie' : '/academie?bienvenue=1';
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'espace n'a pas pu être ouvert.");
      setEnCours(false);
    }
  }

  const etats: EtatQualiopi[] = ['PAS_ENGAGE', 'EN_PREPARATION', 'AUDIT_PLANIFIE', 'CERTIFIE'];

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <ChoixAcademie nom={nom} onNom={setNom} choisi={choisi} onChoisi={setChoisi} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#12312A]">SIRET</span>
          <input type="text" inputMode="numeric" maxLength={17} value={siret} onChange={(e) => setSiret(e.target.value)} className={CHAMP} />
          <span className="mt-1 block text-xs text-[#5E7A6E]">
            {choisi?.siret ? `Facultatif, trouvé : ${choisi.siret}` : 'Facultatif.'}
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Numéro de déclaration (NDA)</span>
          <input type="text" maxLength={20} value={nda} onChange={(e) => setNda(e.target.value)} className={CHAMP} />
          <span className="mt-1 block text-xs text-[#5E7A6E]">
            {choisi?.declaration?.nda ? `Facultatif, trouvé : ${choisi.declaration.nda}` : 'Facultatif.'}
          </span>
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Où en es-tu avec Qualiopi ?</span>
        <select value={qualiopi} onChange={(e) => setQualiopi(e.target.value as EtatQualiopi)} className={CHAMP}>
          {etats.map((x) => (
            <option key={x} value={x}>
              {LIBELLES_QUALIOPI[x]}
            </option>
          ))}
        </select>
      </label>

      {erreur ? <p className="rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3 text-sm font-bold text-[#8A1B3D]">{erreur}</p> : null}

      <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
        {enCours ? 'Ouverture…' : "Ouvrir l'espace de mon académie"}
      </button>
    </form>
  );
}
