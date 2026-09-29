'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_PRIMAIRE, CHAMP, Encart } from '../_ui';
import type { FicheAcademie } from '../_types';

/** ⚠ Hors du composant : défini dedans, il serait recréé à chaque frappe et le champ perdrait le focus. */
function L({ t, aide, children }: { t: string; aide?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#12312A]">{t}</span>
      {children}
      {aide ? <span className="mt-1 block text-xs text-[#5E7A6E]">{aide}</span> : null}
    </label>
  );
}

/**
 * CE QUE LES DOCUMENTS ET LES FACTURES IMPRIMENT, EN PLUS DE LA FICHE.
 *
 * Le représentant signe les conventions et les certificats de réalisation ;
 * la TVA décide de la mention imprimée sur chaque facture. ⚠ L'exonération de
 * l'article 261-4-4° a du CGI se demande : un organisme ne se déclare pas
 * exonéré de lui-même, il l'est sur attestation de la DREETS.
 */
export function ReglagesAdministration({ fiche }: { fiche: FicheAcademie }) {
  const [v, setV] = useState({
    representantNom: fiche.representantNom ?? '',
    representantQualite: fiche.representantQualite ?? '',
    exonereTva: fiche.exonereTva ?? false,
    tauxTva: String(fiche.tauxTva ?? 20),
    numeroTva: fiche.numeroTva ?? '',
    delaiPaiementJours: String(fiche.delaiPaiementJours ?? 30),
    coordonneesBancaires: fiche.coordonneesBancaires ?? '',
    reglementInterieurUrl: fiche.reglementInterieurUrl ?? '',
  });
  const [etat, setEtat] = useState<{ ok?: string; erreur?: string }>({});
  const [occupe, setOccupe] = useState(false);
  const maj = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setOccupe(true);
    setEtat({});
    try {
      await appel('/academie/gestion/reglages', {
        method: 'PATCH',
        body: {
          representantNom: v.representantNom,
          representantQualite: v.representantQualite,
          exonereTva: v.exonereTva,
          tauxTva: Number(v.tauxTva) || 0,
          numeroTva: v.numeroTva,
          delaiPaiementJours: Number(v.delaiPaiementJours) || 30,
          coordonneesBancaires: v.coordonneesBancaires,
          reglementInterieurUrl: v.reglementInterieurUrl,
        },
      });
      setEtat({ ok: 'Enregistré : les prochains documents et factures les reprendront.' });
    } catch (err) {
      setEtat({ erreur: err instanceof Error ? err.message : "L'enregistrement a échoué." });
    } finally {
      setOccupe(false);
    }
  };

  return (
    <form onSubmit={envoyer} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <L t="Représentant légal" aide="Il signe les conventions, les attestations et les certificats de réalisation.">
          <input className={CHAMP} value={v.representantNom} onChange={maj('representantNom')} maxLength={120} />
        </L>
        <L t="Sa qualité">
          <input className={CHAMP} value={v.representantQualite} onChange={maj('representantQualite')} maxLength={120} placeholder="Présidente, gérant, directrice…" />
        </L>
      </div>
      <fieldset className="rounded-xl border border-[#DDEBE4] p-4">
        <legend className="px-1 text-sm font-bold text-[#12312A]">TVA</legend>
        <label className="flex items-start gap-3 text-[15px]">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-[#1E9E6A]" checked={v.exonereTva} onChange={(e) => setV((x) => ({ ...x, exonereTva: e.target.checked }))} />
          <span>Mon organisme est exonéré de TVA pour ses formations (article 261-4-4° a du CGI, sur attestation de la DREETS)</span>
        </label>
        {!v.exonereTva ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <L t="Taux de TVA (%)">
              <input className={CHAMP} type="number" min={0} max={30} value={v.tauxTva} onChange={maj('tauxTva')} />
            </L>
            <L t="N° de TVA intracommunautaire">
              <input className={CHAMP} value={v.numeroTva} onChange={maj('numeroTva')} maxLength={20} placeholder="FR00123456789" />
            </L>
          </div>
        ) : null}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <L t="Délai de paiement (jours)">
          <input className={CHAMP} type="number" min={0} max={60} value={v.delaiPaiementJours} onChange={maj('delaiPaiementJours')} />
        </L>
        <L t="Coordonnées bancaires" aide="Imprimées sur les factures : IBAN et BIC.">
          <input className={CHAMP} value={v.coordonneesBancaires} onChange={maj('coordonneesBancaires')} maxLength={300} />
        </L>
      </div>
      <L t="Lien vers le règlement intérieur" aide="Il doit être remis au stagiaire avant l'entrée en formation (L6352-3) : la convocation le cite.">
        <input className={CHAMP} type="url" value={v.reglementInterieurUrl} onChange={maj('reglementInterieurUrl')} maxLength={500} placeholder="https://" />
      </L>
      {etat.ok ? <Encart ton="ok">{etat.ok}</Encart> : null}
      {etat.erreur ? <Encart ton="alerte">{etat.erreur}</Encart> : null}
      <button type="submit" className={BTN_PRIMAIRE} disabled={occupe}>
        {occupe ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
