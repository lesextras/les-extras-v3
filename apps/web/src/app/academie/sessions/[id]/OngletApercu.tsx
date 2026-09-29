'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../../_client';
import { BTN_PRIMAIRE, CARTE, CHAMP } from '../../_ui';
import type { ContexteFiche } from './Fiche';

const NATURES: Record<string, string> = {
  ACTION_FORMATION: 'Action de formation',
  BILAN_COMPETENCES: 'Bilan de compétences',
  VAE: 'Validation des acquis de l’expérience',
  APPRENTISSAGE: 'Action par apprentissage',
};
const OBJECTIFS: Record<string, string> = {
  AUTRE: 'Autre formation professionnelle',
  RNCP_6_8: 'Diplôme ou titre RNCP, niveau 6 à 8',
  RNCP_5: 'Diplôme ou titre RNCP, niveau 5',
  RNCP_4: 'Diplôme ou titre RNCP, niveau 4',
  RNCP_3: 'Diplôme ou titre RNCP, niveau 3',
  RNCP_2: 'Diplôme ou titre RNCP, niveau 2',
  RS: 'Certification du répertoire spécifique',
  CQP_SANS_NIVEAU: 'CQP sans niveau',
  CQP_NON_ENREGISTRE: 'CQP non enregistré',
  BILAN: 'Bilan de compétences',
  VAE: 'Accompagnement VAE',
};

export const Champ = ({ libelle, aide, children }: { libelle: string; aide?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-bold text-[#12312A]">{libelle}</span>
    {children}
    {aide ? <span className="mt-1 block text-xs text-[#5E7A6E]">{aide}</span> : null}
  </label>
);

export function Bloc({ titre, children, aide }: { titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
      <h2 className="text-[19px] font-extrabold text-[#12312A]">{titre}</h2>
      {aide ? <p className="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-[#5E7A6E]">{aide}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** L'état de préparation : ce qu'un contrôle demandera, coché par ce qui existe. */
function Preparation({ ctx, aller }: { ctx: ContexteFiche; aller: (o: 'planning' | 'stagiaires' | 'documents' | 'emargement' | 'qualite' | 'facturation') => void }) {
  const s = ctx.session;
  const actifs = s.inscriptions.filter((i) => i.status !== 'CANCELLED');
  const passee = new Date(s.endDate ?? s.startDate).getTime() < Date.now();
  const points: { ok: boolean; libelle: string; o: Parameters<typeof aller>[0] }[] = [
    { ok: s.creneaux.length > 0, libelle: 'Le planning est posé (créneaux, formateur, salle)', o: 'planning' },
    { ok: actifs.length > 0, libelle: 'Les stagiaires sont inscrits', o: 'stagiaires' },
    { ok: actifs.length > 0 && actifs.every((i) => i.convocationEnvoyeeLe), libelle: 'Chaque stagiaire a reçu sa convocation', o: 'documents' },
    { ok: s.seances.length > 0, libelle: "L'émargement est ouvert à chaque demi-journée", o: 'emargement' },
    { ok: passee && actifs.length > 0 && actifs.every((i) => i.heuresRealisees > 0), libelle: 'Chaque stagiaire a des heures réalisées', o: 'emargement' },
    { ok: actifs.length > 0 && actifs.every((i) => i.satisfactionAt), libelle: 'Les enquêtes de fin sont revenues', o: 'qualite' },
  ];
  const faits = points.filter((p) => p.ok).length;
  return (
    <Bloc titre={`Préparation de la session : ${faits} sur ${points.length}`} aide="Ce que demanderont un OPCO, la Caisse des dépôts ou un auditeur Qualiopi, dans l'ordre où cela se fait.">
      <ul className="grid gap-2">
        {points.map((p) => (
          <li key={p.libelle}>
            <button type="button" onClick={() => aller(p.o)} className="flex w-full items-center gap-3 rounded-xl border border-[#DDEBE4] bg-white px-4 py-3 text-left text-[15px] hover:border-[#B7E4CE]">
              <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${p.ok ? 'bg-[#1E9E6A] text-white' : 'border-2 border-[#CFE4D9] text-transparent'}`}>
                ✓
              </span>
              <span className={p.ok ? 'text-[#334A42]' : 'font-bold text-[#12312A]'}>{p.libelle}</span>
              <span className="sr-only">{p.ok ? 'fait' : 'à faire'}</span>
            </button>
          </li>
        ))}
      </ul>
    </Bloc>
  );
}

export function OngletApercu({ ctx, aller }: { ctx: ContexteFiche; aller: (o: 'planning' | 'stagiaires' | 'documents' | 'emargement' | 'qualite' | 'facturation') => void }) {
  const s = ctx.session;
  const [v, setV] = useState({
    title: s.title ?? '',
    location: s.location ?? '',
    maxSeats: s.maxSeats ? String(s.maxSeats) : '',
    priceHt: s.priceHt !== null && s.priceHt !== undefined ? String(s.priceHt) : '',
    formateurOrganismeId: s.formateurOrganismeId ?? '',
    salleId: s.salleId ?? '',
    modalite: s.modalite,
    tauxDistanciel: s.tauxDistanciel !== null ? String(s.tauxDistanciel) : '',
    intra: s.intra,
    sousTraitance: s.sousTraitance,
    organismePartenaire: s.organismePartenaire ?? '',
    dureeHeures: s.dureeHeures !== null && s.dureeHeures !== undefined ? String(s.dureeHeures) : '',
    infosPratiques: s.infosPratiques ?? '',
    convocationsAuto: s.convocationsAuto,
    enquetesAuto: s.enquetesAuto,
    delaiFroidJours: String(s.delaiFroidJours),
  });
  const [bpf, setBpf] = useState({
    natureAction: s.formation.natureAction,
    objectifBpf: s.formation.objectifBpf,
    codeNsf: s.formation.codeNsf ?? '',
    codeCertification: s.formation.codeCertification ?? '',
  });
  const maj = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const nombre = (t: string) => (t.trim() === '' ? null : Number(t.replace(',', '.')));

  const enregistrer = (e: FormEvent) => {
    e.preventDefault();
    void ctx.agir(
      () =>
        appel(`/academie/gestion/sessions/${s.id}`, {
          method: 'PATCH',
          body: {
            title: v.title,
            location: v.location,
            ...(nombre(v.maxSeats) ? { maxSeats: nombre(v.maxSeats) } : {}),
            ...(nombre(v.priceHt) !== null ? { priceHt: nombre(v.priceHt) } : {}),
            formateurOrganismeId: v.formateurOrganismeId || null,
            salleId: v.salleId || null,
            modalite: v.modalite,
            tauxDistanciel: v.modalite === 'MIXTE' ? nombre(v.tauxDistanciel) : null,
            intra: v.intra,
            sousTraitance: v.sousTraitance,
            organismePartenaire: v.sousTraitance === 'AUCUNE' ? null : v.organismePartenaire,
            dureeHeures: nombre(v.dureeHeures),
            infosPratiques: v.infosPratiques,
            convocationsAuto: v.convocationsAuto,
            enquetesAuto: v.enquetesAuto,
            delaiFroidJours: Number(v.delaiFroidJours) || 60,
          },
        }),
      'Réglages de la session enregistrés.',
    );
  };

  const enregistrerBpf = (e: FormEvent) => {
    e.preventDefault();
    void ctx.agir(
      () =>
        appel(`/academie/gestion/formations/${s.formation.id}/bpf`, {
          method: 'PATCH',
          body: { natureAction: bpf.natureAction, objectifBpf: bpf.objectifBpf, codeNsf: bpf.codeNsf.trim() || null, codeCertification: bpf.codeCertification.trim() || null },
        }),
      'Classement du programme enregistré : il vaut pour toutes ses sessions.',
    );
  };

  const formateursActifs = ctx.formateurs.filter((f) => f.actif || f.id === s.formateurOrganismeId);
  const sallesActives = ctx.salles.filter((x) => x.actif || x.id === s.salleId);

  return (
    <>
      <Preparation ctx={ctx} aller={aller} />

      <Bloc titre="Réglages de la session" aide="Ces informations sont imprimées sur la convention, la convocation et le certificat de réalisation.">
        <form onSubmit={enregistrer} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ libelle="Nom de la session" aide="Facultatif : sinon, le titre de la formation.">
              <input className={CHAMP} value={v.title} onChange={maj('title')} maxLength={160} />
            </Champ>
            <Champ libelle="Lieu">
              <input className={CHAMP} value={v.location} onChange={maj('location')} maxLength={300} placeholder="Adresse, ou à distance" />
            </Champ>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Champ libelle="Formateur principal">
              <select className={CHAMP} value={v.formateurOrganismeId} onChange={maj('formateurOrganismeId')}>
                <option value="">Aucun</option>
                {formateursActifs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.prenom} {f.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ libelle="Salle principale">
              <select className={CHAMP} value={v.salleId} onChange={maj('salleId')}>
                <option value="">Aucune</option>
                {sallesActives.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ libelle="Places">
              <input className={CHAMP} type="number" min={1} value={v.maxSeats} onChange={maj('maxSeats')} />
            </Champ>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Champ libelle="Modalité">
              <select className={CHAMP} value={v.modalite} onChange={maj('modalite')}>
                <option value="PRESENTIEL">En présentiel</option>
                <option value="DISTANCIEL">À distance</option>
                <option value="MIXTE">Mixte</option>
              </select>
            </Champ>
            {v.modalite === 'MIXTE' ? (
              <Champ libelle="Part à distance (%)">
                <input className={CHAMP} type="number" min={0} max={100} value={v.tauxDistanciel} onChange={maj('tauxDistanciel')} />
              </Champ>
            ) : null}
            <Champ libelle="Durée par stagiaire (heures)" aide={`Vide : ${s.dureePrevue ? `${String(s.dureePrevue).replace('.', ',')} h, calculée d'après le planning ou le programme` : "calculée d'après le planning"}.`}>
              <input className={CHAMP} inputMode="decimal" value={v.dureeHeures} onChange={maj('dureeHeures')} />
            </Champ>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Champ libelle="Prix HT par stagiaire (€)" aide="Repris par les conventions et les factures. Un prix propre à un stagiaire se règle sur sa fiche.">
              <input className={CHAMP} inputMode="decimal" value={v.priceHt} onChange={maj('priceHt')} />
            </Champ>
            <Champ libelle="Type de session">
              <select className={CHAMP} value={v.intra ? 'intra' : 'inter'} onChange={(e) => setV((x) => ({ ...x, intra: e.target.value === 'intra' }))}>
                <option value="inter">Inter (plusieurs entreprises)</option>
                <option value="intra">Intra (un seul client)</option>
              </select>
            </Champ>
            <Champ libelle="Sous-traitance" aide="Elle change la ligne du BPF où la session est comptée.">
              <select className={CHAMP} value={v.sousTraitance} onChange={maj('sousTraitance')}>
                <option value="AUCUNE">Aucune</option>
                <option value="RECUE">Je réalise pour un autre organisme</option>
                <option value="CONFIEE">Je confie à un autre organisme</option>
              </select>
            </Champ>
          </div>
          {v.sousTraitance !== 'AUCUNE' ? (
            <Champ libelle="Organisme partenaire">
              <input className={CHAMP} value={v.organismePartenaire} onChange={maj('organismePartenaire')} maxLength={200} />
            </Champ>
          ) : null}
          <Champ libelle="Informations pratiques" aide="Accès, stationnement, repas, matériel à apporter : elles figurent sur la convocation.">
            <textarea className={`${CHAMP} min-h-[90px]`} value={v.infosPratiques} onChange={maj('infosPratiques')} maxLength={2000} />
          </Champ>
          <fieldset className="grid gap-3 rounded-xl border border-[#DDEBE4] p-4">
            <legend className="px-1 text-sm font-bold text-[#12312A]">Envois automatiques</legend>
            <label className="flex items-start gap-3 text-[15px]">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#1E9E6A]" checked={v.convocationsAuto} onChange={(e) => setV((x) => ({ ...x, convocationsAuto: e.target.checked }))} />
              <span>Envoyer les convocations sept jours avant, avec le programme</span>
            </label>
            <label className="flex items-start gap-3 text-[15px]">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#1E9E6A]" checked={v.enquetesAuto} onChange={(e) => setV((x) => ({ ...x, enquetesAuto: e.target.checked }))} />
              <span>Envoyer les enquêtes : de fin le lendemain, au commanditaire, puis à froid</span>
            </label>
            {v.enquetesAuto ? (
              <label className="flex flex-wrap items-center gap-2 pl-8 text-[15px]">
                Enquête à froid
                <input className="w-20 rounded-lg border border-[#CFE4D9] px-2 py-1" type="number" min={14} max={365} value={v.delaiFroidJours} onChange={maj('delaiFroidJours')} />
                jours après la fin
              </label>
            ) : null}
          </fieldset>
          <button type="submit" disabled={ctx.occupe} className={BTN_PRIMAIRE}>
            {ctx.occupe ? 'Enregistrement…' : 'Enregistrer les réglages'}
          </button>
        </form>
      </Bloc>

      <Bloc titre="Classement du programme (BPF et CPF)" aide="Il vaut pour toutes les sessions de cette formation : il range les stagiaires et les heures dans les bons cadres du bilan pédagogique et financier.">
        <form onSubmit={enregistrerBpf} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ libelle="Nature de l'action (art. L6313-1)">
              <select className={CHAMP} value={bpf.natureAction} onChange={(e) => setBpf((x) => ({ ...x, natureAction: e.target.value }))}>
                {Object.entries(NATURES).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ libelle="Objectif général (cadre F-3)">
              <select className={CHAMP} value={bpf.objectifBpf} onChange={(e) => setBpf((x) => ({ ...x, objectifBpf: e.target.value }))}>
                {Object.entries(OBJECTIFS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ libelle="Code NSF (cadre F-4)" aide="Trois chiffres et une lettre, par exemple 332t (travail social).">
              <input className={CHAMP} value={bpf.codeNsf} onChange={(e) => setBpf((x) => ({ ...x, codeNsf: e.target.value }))} maxLength={8} />
            </Champ>
            <Champ libelle="Code RNCP ou RS" aide="Seulement si la formation prépare une certification enregistrée.">
              <input className={CHAMP} value={bpf.codeCertification} onChange={(e) => setBpf((x) => ({ ...x, codeCertification: e.target.value }))} maxLength={30} placeholder="RNCP12345 ou RS1234" />
            </Champ>
          </div>
          <button type="submit" disabled={ctx.occupe} className={BTN_PRIMAIRE}>
            Enregistrer le classement
          </button>
        </form>
      </Bloc>
    </>
  );
}
