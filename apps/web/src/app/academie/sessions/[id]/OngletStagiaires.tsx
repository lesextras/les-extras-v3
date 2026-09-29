'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CHAMP, Encart, Pastille } from '../../_ui';
import { ORIGINE, TYPE_STAGIAIRE } from '../../_gestion/outils';
import type { InscriptionAdmin } from '../../_gestion/types';
import { Bloc, Champ } from './OngletApercu';
import type { ContexteFiche } from './Fiche';

const FINANCEMENT_PAR_TYPE: Record<string, string> = {
  SALARIE_PRIVE: 'ENTREPRISE',
  APPRENTI: 'OPCO_APPRENTISSAGE',
  DEMANDEUR_EMPLOI: 'FRANCE_TRAVAIL',
  PARTICULIER: 'PARTICULIER',
  AUTRE: 'AUTRES',
};

interface Saisie {
  nom: string;
  email: string;
  telephone: string;
  typeStagiaire: string;
  origineFinancement: string;
  entrepriseNom: string;
  entrepriseSiret: string;
  entrepriseAdresse: string;
  entrepriseContact: string;
  entrepriseEmail: string;
  financeurNom: string;
  numeroDossier: string;
  prixHt: string;
}

const VIDE: Saisie = {
  nom: '',
  email: '',
  telephone: '',
  typeStagiaire: 'SALARIE_PRIVE',
  origineFinancement: 'ENTREPRISE',
  entrepriseNom: '',
  entrepriseSiret: '',
  entrepriseAdresse: '',
  entrepriseContact: '',
  entrepriseEmail: '',
  financeurNom: '',
  numeroDossier: '',
  prixHt: '',
};

const depuis = (i: InscriptionAdmin): Saisie => ({
  nom: i.learnerName ?? '',
  email: i.learnerEmail ?? '',
  telephone: i.telephone ?? '',
  typeStagiaire: i.typeStagiaire,
  origineFinancement: i.origineFinancement ?? FINANCEMENT_PAR_TYPE[i.typeStagiaire] ?? 'ENTREPRISE',
  entrepriseNom: i.entrepriseNom ?? '',
  entrepriseSiret: i.entrepriseSiret ?? '',
  entrepriseAdresse: i.entrepriseAdresse ?? '',
  entrepriseContact: i.entrepriseContact ?? '',
  entrepriseEmail: i.entrepriseEmail ?? '',
  financeurNom: i.financeurNom ?? '',
  numeroDossier: i.numeroDossier ?? '',
  prixHt: i.prixHt !== null && i.prixHt !== undefined ? String(i.prixHt) : '',
});

function corps(v: Saisie, creation: boolean) {
  const t = (x: string) => (x.trim() ? x.trim() : creation ? undefined : null);
  const particulier = v.typeStagiaire === 'PARTICULIER';
  const prix = v.prixHt.trim() ? Number(v.prixHt.replace(',', '.')) : creation ? undefined : null;
  return {
    nom: v.nom.trim(),
    email: t(v.email),
    telephone: t(v.telephone),
    typeStagiaire: v.typeStagiaire,
    financing: particulier ? 'PERSONAL' : v.origineFinancement === 'OPCO_CPF' ? 'CPF' : v.origineFinancement.startsWith('OPCO') ? 'OPCO' : v.origineFinancement === 'FRANCE_TRAVAIL' ? 'POLE_EMPLOI' : 'ESTABLISHMENT',
    origineFinancement: v.origineFinancement || (creation ? undefined : null),
    entrepriseNom: particulier ? (creation ? undefined : null) : t(v.entrepriseNom),
    entrepriseSiret: particulier ? (creation ? undefined : null) : t(v.entrepriseSiret.replace(/\s/g, '')),
    entrepriseAdresse: particulier ? (creation ? undefined : null) : t(v.entrepriseAdresse),
    entrepriseContact: particulier ? (creation ? undefined : null) : t(v.entrepriseContact),
    entrepriseEmail: particulier ? (creation ? undefined : null) : t(v.entrepriseEmail),
    financeurNom: t(v.financeurNom),
    numeroDossier: t(v.numeroDossier),
    prixHt: prix,
  };
}

function Formulaire({ initiale, valider, annuler, occupe, titre }: { initiale: Saisie; valider: (v: Saisie) => void; annuler: () => void; occupe: boolean; titre: string }) {
  const [v, setV] = useState(initiale);
  const maj = (k: keyof Saisie) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const particulier = v.typeStagiaire === 'PARTICULIER';
  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    valider(v);
  };
  return (
    <form onSubmit={envoyer} className="space-y-4 rounded-2xl border border-[#DDEBE4] bg-[#F7FBF9] p-4 sm:p-5">
      <p className="text-[16px] font-extrabold text-[#12312A]">{titre}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Champ libelle="Prénom et nom">
          <input className={CHAMP} value={v.nom} onChange={maj('nom')} required minLength={2} maxLength={160} autoComplete="off" />
        </Champ>
        <Champ libelle="E-mail" aide="Pour la convocation, l'émargement et les enquêtes.">
          <input className={CHAMP} type="email" value={v.email} onChange={maj('email')} maxLength={200} autoComplete="off" />
        </Champ>
        <Champ libelle="Téléphone">
          <input className={CHAMP} value={v.telephone} onChange={maj('telephone')} maxLength={30} autoComplete="off" />
        </Champ>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ libelle="Situation (BPF, cadre F-1)">
          <select
            className={CHAMP}
            value={v.typeStagiaire}
            onChange={(e) => setV((x) => ({ ...x, typeStagiaire: e.target.value, origineFinancement: FINANCEMENT_PAR_TYPE[e.target.value] ?? x.origineFinancement }))}
          >
            {Object.entries(TYPE_STAGIAIRE).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Champ>
        <Champ libelle="Qui finance (BPF, cadre C)">
          <select className={CHAMP} value={v.origineFinancement} onChange={maj('origineFinancement')}>
            {Object.entries(ORIGINE).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Champ>
      </div>
      {particulier ? (
        <p className="rounded-xl bg-white px-4 py-3 text-[14px] text-[#334A42]">
          La personne paie elle-même : elle signera un <strong>contrat de formation professionnelle</strong>, avec dix jours de rétractation, plutôt qu&apos;une convention.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="Entreprise ou employeur" aide="C'est lui qui signe la convention.">
            <input className={CHAMP} value={v.entrepriseNom} onChange={maj('entrepriseNom')} maxLength={200} />
          </Champ>
          <Champ libelle="SIRET de l'entreprise">
            <input className={CHAMP} value={v.entrepriseSiret} onChange={maj('entrepriseSiret')} maxLength={17} inputMode="numeric" />
          </Champ>
          <Champ libelle="Adresse de l'entreprise">
            <input className={CHAMP} value={v.entrepriseAdresse} onChange={maj('entrepriseAdresse')} maxLength={300} />
          </Champ>
          <Champ libelle="Contact à l'entreprise">
            <input className={CHAMP} value={v.entrepriseContact} onChange={maj('entrepriseContact')} maxLength={160} placeholder="Nom de la personne qui signe" />
          </Champ>
          <Champ libelle="E-mail de l'entreprise" aide="La convention à signer et l'enquête commanditaire y partent.">
            <input className={CHAMP} type="email" value={v.entrepriseEmail} onChange={maj('entrepriseEmail')} maxLength={200} />
          </Champ>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Champ libelle="Financeur (OPCO, France Travail…)" aide="S'il paie directement l'organisme (subrogation).">
          <input className={CHAMP} value={v.financeurNom} onChange={maj('financeurNom')} maxLength={160} />
        </Champ>
        <Champ libelle="N° de dossier ou d'accord">
          <input className={CHAMP} value={v.numeroDossier} onChange={maj('numeroDossier')} maxLength={80} />
        </Champ>
        <Champ libelle="Prix HT propre à ce stagiaire (€)" aide="Vide : le prix de la session.">
          <input className={CHAMP} inputMode="decimal" value={v.prixHt} onChange={maj('prixHt')} />
        </Champ>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={occupe} className={BTN_PRIMAIRE}>
          Enregistrer
        </button>
        <button type="button" onClick={annuler} className={BTN_SECONDAIRE}>
          Annuler
        </button>
      </div>
    </form>
  );
}

export function OngletStagiaires({ ctx }: { ctx: ContexteFiche }) {
  const s = ctx.session;
  const [ajout, setAjout] = useState(false);
  const [edition, setEdition] = useState<string | null>(null);
  const [copie, setCopie] = useState<string | null>(null);
  const actifs = s.inscriptions.filter((i) => i.status !== 'CANCELLED');
  const annules = s.inscriptions.filter((i) => i.status === 'CANCELLED');
  const complet = s.maxSeats !== null && actifs.length >= s.maxSeats;

  const lien = (i: InscriptionAdmin) => (i.jetonStagiaire ? `${window.location.origin}/stagiaire/${i.jetonStagiaire}` : null);

  return (
    <Bloc
      titre={`Stagiaires : ${actifs.length}${s.maxSeats ? ` sur ${s.maxSeats}` : ''}`}
      aide="Chaque stagiaire reçoit un lien personnel, sans compte à créer : sa convocation, ses signatures d'émargement, ses enquêtes et ses documents."
    >
      <div className="mb-4">
        {ajout ? (
          <Formulaire
            titre="Inscrire un stagiaire"
            initiale={VIDE}
            occupe={ctx.occupe}
            annuler={() => setAjout(false)}
            valider={(v) =>
              void ctx
                .agir(() => appel(`/academie/gestion/sessions/${s.id}/stagiaires`, { method: 'POST', body: corps(v, true) }), `${v.nom.trim()} est inscrit à la session.`)
                .then((ok) => ok && setAjout(false))
            }
          />
        ) : (
          <button type="button" className={BTN_PRIMAIRE} disabled={complet} onClick={() => setAjout(true)}>
            {complet ? 'Session complète' : 'Inscrire un stagiaire'}
          </button>
        )}
      </div>

      {!actifs.length ? <Encart ton="info">Personne n&apos;est encore inscrit.</Encart> : null}

      <ul className="grid gap-3">
        {actifs.map((i) =>
          edition === i.id ? (
            <li key={i.id}>
              <Formulaire
                titre={`Modifier ${i.learnerName ?? 'le stagiaire'}`}
                initiale={depuis(i)}
                occupe={ctx.occupe}
                annuler={() => setEdition(null)}
                valider={(v) =>
                  void ctx
                    .agir(() => appel(`/academie/gestion/stagiaires/${i.id}`, { method: 'PATCH', body: corps(v, false) }), 'Fiche du stagiaire enregistrée.')
                    .then((ok) => ok && setEdition(null))
                }
              />
            </li>
          ) : (
            <li key={i.id} className="rounded-2xl border border-[#DDEBE4] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] font-extrabold text-[#12312A]">{i.learnerName ?? 'Stagiaire'}</p>
                  <p className="text-[14px] text-[#5E7A6E]">
                    {[i.learnerEmail, TYPE_STAGIAIRE[i.typeStagiaire], i.entrepriseNom, i.financeurNom ? `financé par ${i.financeurNom}` : null].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {i.convocationEnvoyeeLe ? <Pastille ton="ok">Convoqué</Pastille> : <Pastille ton="attention">Pas encore convoqué</Pastille>}
                    <Pastille ton={i.heuresRealisees ? 'ok' : 'neutre'}>
                      {String(i.heuresRealisees).replace('.', ',')} h réalisées{i.heuresEstimees ? ' (estimées)' : ''}
                    </Pastille>
                    {i.positionnementEntree ? <Pastille ton="ok">Positionné à l&apos;entrée</Pastille> : null}
                    {i.satisfactionAt ? <Pastille ton="ok">Enquête de fin</Pastille> : null}
                    {i.coldAt ? <Pastille ton="ok">Enquête à froid</Pastille> : null}
                    {!i.learnerEmail ? <Pastille ton="alerte">Sans e-mail</Pastille> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {lien(i) ? (
                    <button
                      type="button"
                      className={BTN_DISCRET}
                      onClick={() => {
                        void navigator.clipboard?.writeText(lien(i)!);
                        setCopie(i.id);
                        setTimeout(() => setCopie(null), 2500);
                      }}
                    >
                      {copie === i.id ? 'Lien copié' : 'Copier son lien'}
                    </button>
                  ) : null}
                  <button type="button" className={BTN_DISCRET} onClick={() => setEdition(i.id)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className={BTN_DISCRET}
                    disabled={ctx.occupe}
                    onClick={() => {
                      if (!window.confirm('Le lien actuel ne fonctionnera plus. Créer un nouveau lien personnel ?')) return;
                      void ctx.agir(() => appel(`/academie/gestion/stagiaires/${i.id}/lien`, { method: 'POST' }), 'Nouveau lien créé : renvoie la convocation pour le transmettre.');
                    }}
                  >
                    Nouveau lien
                  </button>
                  <button
                    type="button"
                    className={`${BTN_DISCRET} text-[#8A1B3D]`}
                    disabled={ctx.occupe}
                    onClick={() => {
                      if (!window.confirm(`Retirer ${i.learnerName ?? 'ce stagiaire'} de la session ? S'il a déjà signé ou reçu des documents, l'inscription est annulée et gardée.`)) return;
                      void ctx.agir(() => appel(`/academie/gestion/stagiaires/${i.id}`, { method: 'DELETE' }), 'Stagiaire retiré de la session.');
                    }}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ),
        )}
      </ul>

      {annules.length ? (
        <details className="mt-5">
          <summary className="cursor-pointer text-[15px] font-bold text-[#5E7A6E]">
            {annules.length} inscription{annules.length > 1 ? 's' : ''} annulée{annules.length > 1 ? 's' : ''}
          </summary>
          <ul className="mt-2 grid gap-1 text-[14px] text-[#5E7A6E]">
            {annules.map((i) => (
              <li key={i.id}>{i.learnerName}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </Bloc>
  );
}
