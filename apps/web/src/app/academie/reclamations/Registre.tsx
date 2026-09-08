'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, formaterDate } from '../_ui';
import type { OrigineReclamation, StatutReclamation } from '../_types';

/**
 * LE REGISTRE DES RÉCLAMATIONS — critère 7 du référentiel national qualité.
 *
 * Un registre vide n'est pas une bonne nouvelle pour un auditeur : il signifie
 * le plus souvent qu'aucun canal n'existe. Ce qui compte, c'est la trace —
 * quand c'est arrivé, ce qui a été fait, quand c'est clos. Une réclamation
 * traitée et écrite vaut mieux que zéro réclamation.
 */

export interface Reclamation {
  id: string;
  recueLe: string;
  origine: OrigineReclamation;
  auteur: string | null;
  objet: string;
  detail: string | null;
  traitement: string | null;
  clotureeLe: string | null;
  statut: StatutReclamation;
}

const STATUTS: StatutReclamation[] = ['OUVERTE', 'EN_COURS', 'RESOLUE', 'CLASSEE'];
const ORIGINES: OrigineReclamation[] = ['APPRENANT', 'ENTREPRISE', 'FINANCEUR', 'FORMATEUR', 'AUTRE'];

const NOM_STATUT: Record<StatutReclamation, string> = {
  OUVERTE: 'Ouverte',
  EN_COURS: 'En cours de traitement',
  RESOLUE: 'Résolue',
  CLASSEE: 'Classée sans suite',
};

const NOM_ORIGINE: Record<OrigineReclamation, string> = {
  APPRENANT: 'Un apprenant',
  ENTREPRISE: 'Une entreprise',
  FINANCEUR: 'Un financeur',
  FORMATEUR: 'Un formateur',
  AUTRE: 'Quelqu’un d’autre',
};

const TEINTE_STATUT: Record<StatutReclamation, string> = {
  OUVERTE: 'bg-[#FDE7EC] text-[#8A1B3D]',
  EN_COURS: 'bg-[#FEF3E2] text-[#7C3E06]',
  RESOLUE: 'bg-[#E3F5EC] text-[#0F5F3E]',
  CLASSEE: 'bg-[#F2F7F5] text-[#5E7A6E]',
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function Registre({ reclamations: initiales }: { reclamations: Reclamation[] }) {
  const [liste, setListe] = useState(initiales);
  const [filtre, setFiltre] = useState<StatutReclamation | 'TOUT'>('TOUT');
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [recueLe, setRecueLe] = useState(aujourdhui());
  const [origine, setOrigine] = useState<OrigineReclamation>('APPRENANT');
  const [auteur, setAuteur] = useState('');
  const [objet, setObjet] = useState('');
  const [detail, setDetail] = useState('');

  const visibles = useMemo(
    () => (filtre === 'TOUT' ? liste : liste.filter((r) => r.statut === filtre)),
    [liste, filtre],
  );

  const ouvertes = liste.filter((r) => r.statut === 'OUVERTE' || r.statut === 'EN_COURS');
  const sansTraitement = ouvertes.filter((r) => !r.traitement?.trim()).length;

  async function ajouter(e: FormEvent) {
    e.preventDefault();
    if (objet.trim().length < 2) {
      setErreur('Dis en quelques mots de quoi il s’agit.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const creee = await appel<Reclamation>('/academie/reclamations', {
        method: 'POST',
        body: {
          recueLe,
          origine,
          objet: objet.trim(),
          ...(auteur.trim() ? { auteur: auteur.trim() } : {}),
          ...(detail.trim() ? { detail: detail.trim() } : {}),
        },
      });
      setListe((l) => [creee, ...l]);
      setRecueLe(aujourdhui());
      setOrigine('APPRENANT');
      setAuteur('');
      setObjet('');
      setDetail('');
      setOuvert(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La réclamation n'a pas pu être enregistrée.");
    } finally {
      setEnCours(false);
    }
  }

  async function modifier(id: string, corps: Record<string, unknown>) {
    try {
      const maj = await appel<Reclamation>(`/academie/reclamations/${id}`, { method: 'PATCH', body: corps });
      setListe((l) => l.map((r) => (r.id === id ? maj : r)));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La modification n'a pas pu être enregistrée.");
    }
  }

  async function supprimer(id: string) {
    try {
      await appel(`/academie/reclamations/${id}`, { method: 'DELETE' });
      setListe((l) => l.filter((r) => r.id !== id));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La réclamation n'a pas pu être retirée.");
    }
  }

  return (
    <>
      <div className="mb-6">
        {sansTraitement ? (
          <Encart ton="attention">
            {sansTraitement} réclamation{sansTraitement > 1 ? 's' : ''} ouverte{sansTraitement > 1 ? 's' : ''} sans
            traitement écrit. C&apos;est ce que l&apos;auditeur cherche : pas l&apos;absence de réclamation, mais la
            preuve qu&apos;elle a été traitée.
          </Encart>
        ) : liste.length ? (
          <Encart ton="ok">
            Chaque réclamation ouverte porte son traitement. Le registre tient debout devant un auditeur.
          </Encart>
        ) : (
          <Encart ton="info">
            Le registre est vide. Ce n&apos;est pas rassurant pour un auditeur : cela veut souvent dire qu&apos;aucun
            canal n&apos;existe. Annonce une adresse de réclamation dans tes documents, et note ici même les remarques
            orales — une réclamation traitée vaut mieux que zéro réclamation.
          </Encart>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltre('TOUT')}
          className={`rounded-full border-2 px-3.5 py-1.5 text-[14px] font-bold transition ${
            filtre === 'TOUT' ? 'border-[#0F5F3E] bg-[#0F5F3E] text-white' : 'border-[#DDEBE4] bg-white text-[#334A42] hover:border-[#1E9E6A]'
          }`}
        >
          Tout ({liste.length})
        </button>
        {STATUTS.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFiltre(st)}
            className={`rounded-full border-2 px-3.5 py-1.5 text-[14px] font-bold transition ${
              filtre === st ? 'border-[#0F5F3E] bg-[#0F5F3E] text-white' : 'border-[#DDEBE4] bg-white text-[#334A42] hover:border-[#1E9E6A]'
            }`}
          >
            {NOM_STATUT[st]} ({liste.filter((r) => r.statut === st).length})
          </button>
        ))}
        <button type="button" onClick={() => setOuvert((o) => !o)} className={`${BTN_PRIMAIRE} ml-auto`}>
          {ouvert ? 'Fermer' : 'Enregistrer une réclamation'}
        </button>
      </div>

      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {ouvert ? (
        <form onSubmit={ajouter} className={`${CARTE} mb-6 space-y-4 p-5 sm:p-6`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Reçue le</span>
              <input type="date" value={recueLe} onChange={(e) => setRecueLe(e.target.value)} className={CHAMP} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">De qui</span>
              <select value={origine} onChange={(e) => setOrigine(e.target.value as OrigineReclamation)} className={CHAMP}>
                {ORIGINES.map((o) => (
                  <option key={o} value={o}>
                    {NOM_ORIGINE[o]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Son nom</span>
              <input type="text" value={auteur} onChange={(e) => setAuteur(e.target.value)} maxLength={160} placeholder="Facultatif" className={CHAMP} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">De quoi il s&apos;agit</span>
            <input type="text" value={objet} onChange={(e) => setObjet(e.target.value)} maxLength={200} required placeholder="En une ligne" className={CHAMP} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Ce qui a été dit</span>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} maxLength={4000} placeholder="Les faits, sans interprétation." className={CHAMP} />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className={BTN_SECONDAIRE}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {visibles.length ? (
        <ul className="space-y-3">
          {visibles.map((r) => (
            <li key={r.id} className={`${CARTE} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold ${TEINTE_STATUT[r.statut]}`}>{NOM_STATUT[r.statut]}</span>
                    <span className="text-[13px] text-[#5E7A6E]">Reçue le {formaterDate(r.recueLe)}</span>
                    <span className="text-[13px] text-[#5E7A6E]">· {NOM_ORIGINE[r.origine]}{r.auteur ? ` — ${r.auteur}` : ''}</span>
                  </div>
                  <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-[#12312A]">{r.objet}</p>
                  {r.detail ? <p className="mt-1 max-w-[75ch] text-[15px] leading-relaxed text-[#334A42]">{r.detail}</p> : null}
                  {r.clotureeLe ? <p className="mt-1 text-[13px] text-[#5E7A6E]">Close le {formaterDate(r.clotureeLe)}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => supprimer(r.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-bold text-[#8A1B3D] hover:bg-[#FDE7EC]"
                >
                  Retirer
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-[#DDEBE4] bg-[#F2F7F5] p-3">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">Ce qui a été fait</p>
                {r.traitement ? (
                  <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">{r.traitement}</p>
                ) : (
                  <ChampTraitement onValider={(t) => modifier(r.id, { traitement: t, statut: 'EN_COURS' })} />
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {STATUTS.filter((st) => st !== r.statut).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() =>
                      modifier(r.id, {
                        statut: st,
                        ...(st === 'RESOLUE' || st === 'CLASSEE' ? { clotureeLe: aujourdhui() } : {}),
                      })
                    }
                    className="rounded-lg border border-[#DDEBE4] bg-white px-3 py-1.5 text-[13px] font-bold text-[#334A42] transition hover:border-[#1E9E6A] hover:text-[#0F5F3E]"
                  >
                    Marquer {NOM_STATUT[st].toLowerCase()}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={`${CARTE} p-8 text-center`}>
          <p className="text-[15px] text-[#334A42]">Aucune réclamation dans cet état.</p>
        </div>
      )}
    </>
  );
}

/** Le champ de traitement, là où il manque : on écrit et on passe en cours. */
function ChampTraitement({ onValider }: { onValider: (texte: string) => void }) {
  const [texte, setTexte] = useState('');
  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Qui a répondu, quoi, quand. Une phrase suffit."
        className={`flex-1 ${CHAMP}`}
      />
      <button type="button" onClick={() => onValider(texte.trim())} disabled={!texte.trim()} className={BTN_SECONDAIRE}>
        Noter
      </button>
    </div>
  );
}
