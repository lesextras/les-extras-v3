'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../_client';
import { BTN_PRIMAIRE, CHAMP } from '../_ui';
import { LIBELLES_QUALIOPI, type EtatQualiopi, type FicheAcademie } from '../_types';

/**
 * LA FICHE DE L'ORGANISME.
 *
 * Aucun champ n'est obligatoire à part le nom : on ne bloque personne. Ce qui
 * est rempli sert ailleurs — le SIRET, le NDA, le référent handicap et la date
 * d'audit cochent chacun une étape du chemin, tout seuls.
 */
export function FormulaireFiche({ fiche }: { fiche: FicheAcademie }) {
  const router = useRouter();
  const [v, setV] = useState({
    nom: fiche.nom ?? '',
    sigle: fiche.sigle ?? '',
    nda: fiche.nda ?? '',
    dreets: fiche.dreets ?? '',
    siren: fiche.siren ?? '',
    siret: fiche.siret ?? '',
    ape: fiche.ape ?? '',
    adresse: fiche.adresse ?? '',
    codePostal: fiche.codePostal ?? '',
    commune: fiche.commune ?? '',
    telephone: fiche.telephone ?? '',
    courriel: fiche.courriel ?? '',
    siteWeb: fiche.siteWeb ?? '',
    qualiopi: fiche.qualiopi,
    certificateur: fiche.certificateur ?? '',
    auditPrevuLe: (fiche.auditPrevuLe ?? '').slice(0, 10),
    certifieDu: (fiche.certifieDu ?? '').slice(0, 10),
    certifieAu: (fiche.certifieAu ?? '').slice(0, 10),
    referentHandicap: fiche.referentHandicap ?? '',
    referentPedagogique: fiche.referentPedagogique ?? '',
    resume: fiche.resume ?? '',
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!v.nom.trim()) {
      setErreur("Le nom de l'organisme est nécessaire.");
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      // On n'envoie que ce qui est rempli : un champ vidé se remet à vide côté API.
      const corps: Record<string, unknown> = {};
      for (const [cle, valeur] of Object.entries(v)) {
        if (cle === 'qualiopi') {
          corps.qualiopi = valeur;
          continue;
        }
        const texte = String(valeur ?? '').trim();
        // Les dates partent en ISO ; les champs vides ne partent pas du tout,
        // faute de quoi la validation refuse une chaîne vide là où elle attend une date.
        if (['auditPrevuLe', 'certifieDu', 'certifieAu'].includes(cle)) {
          if (texte) corps[cle] = new Date(`${texte}T00:00:00`).toISOString();
          continue;
        }
        if (texte) corps[cle] = texte;
      }
      await appel('/academie/fiche', { method: 'PATCH', body: corps });
      setEnregistre(true);
      setTimeout(() => setEnregistre(false), 4000);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  const etats: EtatQualiopi[] = ['PAS_ENGAGE', 'EN_PREPARATION', 'AUDIT_PLANIFIE', 'CERTIFIE', 'SUSPENDU'];

  return (
    <form onSubmit={enregistrer} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5F3E]">L&apos;organisme</legend>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Champ label="Nom" value={v.nom} onChange={set('nom')} required maxLength={160} />
          <Champ label="Sigle" value={v.sigle} onChange={set('sigle')} maxLength={30} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Champ label="SIREN" value={v.siren} onChange={set('siren')} maxLength={9} aide="Neuf chiffres" />
          <Champ label="SIRET" value={v.siret} onChange={set('siret')} maxLength={14} aide="Quatorze chiffres · coche l'étape 3" />
          <Champ label="Code APE" value={v.ape} onChange={set('ape')} maxLength={10} aide="85.59A pour la formation continue" />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5F3E]">La déclaration d&apos;activité</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Numéro de déclaration (NDA)" value={v.nda} onChange={set('nda')} maxLength={20} aide="Onze chiffres · coche l'étape 5" />
          <Champ label="DREETS de rattachement" value={v.dreets} onChange={set('dreets')} maxLength={80} aide="La région qui a instruit le dossier" />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5F3E]">La certification</legend>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Où en es-tu ?</span>
          <select value={v.qualiopi} onChange={set('qualiopi')} className={CHAMP}>
            {etats.map((e) => (
              <option key={e} value={e}>
                {LIBELLES_QUALIOPI[e]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Organisme certificateur" value={v.certificateur} onChange={set('certificateur')} maxLength={120} />
          <Champ label="Audit prévu le" type="date" value={v.auditPrevuLe} onChange={set('auditPrevuLe')} aide="Coche l'étape 10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Certifiée depuis le" type="date" value={v.certifieDu} onChange={set('certifieDu')} aide="Coche l'étape 11" />
          <Champ label="Certificat valable jusqu'au" type="date" value={v.certifieAu} onChange={set('certifieAu')} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5F3E]">Les référents</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ
            label="Référent handicap"
            value={v.referentHandicap}
            onChange={set('referentHandicap')}
            maxLength={120}
            aide="Obligatoire, et son nom doit être publié · coche l'étape 7"
          />
          <Champ label="Référent pédagogique" value={v.referentPedagogique} onChange={set('referentPedagogique')} maxLength={120} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5F3E]">Où te joindre</legend>
        <Champ label="Adresse" value={v.adresse} onChange={set('adresse')} maxLength={200} />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Champ label="Code postal" value={v.codePostal} onChange={set('codePostal')} maxLength={5} />
          <Champ label="Commune" value={v.commune} onChange={set('commune')} maxLength={120} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Champ label="Téléphone" type="tel" value={v.telephone} onChange={set('telephone')} maxLength={30} />
          <Champ label="Courriel" type="email" value={v.courriel} onChange={set('courriel')} />
          <Champ label="Site web" value={v.siteWeb} onChange={set('siteWeb')} maxLength={200} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#12312A]">En une phrase</span>
          <textarea
            value={v.resume}
            onChange={set('resume')}
            maxLength={300}
            rows={3}
            className={CHAMP}
            placeholder="Ce que ton organisme fait, en une phrase."
          />
          <span className="mt-1 block text-xs text-[#5E7A6E]">{v.resume.length}/300</span>
        </label>
      </fieldset>

      {erreur ? <p className="rounded-xl border border-[#F3B0C2] bg-[#FDE7EC] px-4 py-3 text-sm font-bold text-[#8A1B3D]">{erreur}</p> : null}
      {enregistre ? <p className="rounded-xl border border-[#BFE6D2] bg-[#E3F5EC] px-4 py-3 text-sm font-bold text-[#0F5F3E]">C&apos;est enregistré.</p> : null}

      <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
        {enCours ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

function Champ({
  label,
  value,
  onChange,
  type = 'text',
  maxLength,
  required,
  aide,
}: {
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  type?: string;
  maxLength?: number;
  required?: boolean;
  aide?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-[#12312A]">
        {label} {required ? <span className="text-[#1E9E6A]">*</span> : null}
      </span>
      <input type={type} value={value} onChange={onChange} maxLength={maxLength} required={required} className={CHAMP} />
      {aide ? <span className="mt-1 block text-xs text-[#5E7A6E]">{aide}</span> : null}
    </label>
  );
}
