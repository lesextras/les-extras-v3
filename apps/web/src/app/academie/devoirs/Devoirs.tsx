'use client';

import { useState } from 'react';
import { appel, messageDe, telecharger } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille, formaterDate } from '../_ui';
import type { CoursResume } from '../_ecole/types';

type Statut = 'A_CORRIGER' | 'VALIDE' | 'A_REPRENDRE';

export interface Rendu {
  id: string;
  texte: string | null;
  fichiers: { n: number; nom: string; taille: number; type: string }[];
  statut: Statut;
  note: number | null;
  commentaire: string | null;
  corrigeLe: string | null;
  tentative: number;
  renduLe?: string;
  apprenant: { email: string; nom: string | null };
  cours: { id: string; titre: string };
  lecon: { id: string; titre: string };
}

export interface ListeDevoirs {
  compteurs: { aCorriger: number; valides: number; aReprendre: number };
  rendus: Rendu[];
}

const LIBELLE: Record<Statut, { texte: string; ton: 'attention' | 'ok' | 'alerte' }> = {
  A_CORRIGER: { texte: 'À corriger', ton: 'attention' },
  VALIDE: { texte: 'Validé', ton: 'ok' },
  A_REPRENDRE: { texte: 'À reprendre', ton: 'alerte' },
};

export function Devoirs({ initiale, formations, coursInitial }: { initiale: ListeDevoirs; formations: CoursResume[]; coursInitial: string }) {
  const [liste, setListe] = useState(initiale);
  const [filtre, setFiltre] = useState<Statut | 'TOUS'>('A_CORRIGER');
  const [cours, setCours] = useState(coursInitial);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function recharger(c = cours) {
    const l = await appel<ListeDevoirs>(`/ecole/devoirs${c ? `?coursId=${encodeURIComponent(c)}` : ''}`);
    setListe(l);
  }

  async function corriger(id: string, statut: Statut) {
    setOccupe(true);
    setErreur(null);
    try {
      await appel(`/ecole/devoirs/${id}`, {
        methode: 'PATCH',
        corps: { statut, ...(note.trim() ? { note: Number(note) } : { note: null }), ...(commentaire.trim() ? { commentaire: commentaire.trim() } : {}) },
      });
      await recharger();
      setOuvert(null);
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  const affiches = liste.rendus.filter((r) => filtre === 'TOUS' || r.statut === filtre);
  const onglets: { cle: Statut | 'TOUS'; libelle: string; n?: number }[] = [
    { cle: 'A_CORRIGER', libelle: 'À corriger', n: liste.compteurs.aCorriger },
    { cle: 'A_REPRENDRE', libelle: 'À reprendre', n: liste.compteurs.aReprendre },
    { cle: 'VALIDE', libelle: 'Validés', n: liste.compteurs.valides },
    { cle: 'TOUS', libelle: 'Tous' },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {onglets.map((o) => (
          <button
            key={o.cle}
            type="button"
            onClick={() => setFiltre(o.cle)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${filtre === o.cle ? 'bg-[#1E9E6A] text-white' : 'border border-[#CFE4D9] bg-white text-[#12312A]'}`}
          >
            {o.libelle}
            {o.n !== undefined ? ` (${o.n})` : ''}
          </button>
        ))}
        <select
          value={cours}
          onChange={(e) => {
            setCours(e.target.value);
            void recharger(e.target.value);
          }}
          className={`${CHAMP} ml-auto w-auto py-2`}
          aria-label="Formation"
        >
          <option value="">Toutes les formations</option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.titre}
            </option>
          ))}
        </select>
      </div>

      {erreur ? (
        <div className="mb-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {affiches.length === 0 ? (
        <Encart ton="info">
          {filtre === 'A_CORRIGER'
            ? "Rien à corriger. Pour recevoir des devoirs, ajoute une leçon de type « Devoir » dans le sommaire d'une formation."
            : 'Aucun devoir dans cette liste.'}
        </Encart>
      ) : (
        <ul className="grid gap-3">
          {affiches.map((r) => {
            const l = LIBELLE[r.statut];
            const estOuvert = ouvert === r.id;
            return (
              <li key={r.id} className={`${CARTE} p-5`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[220px] flex-1">
                    <p className="text-[16px] font-extrabold text-[#12312A]">{r.apprenant.nom || r.apprenant.email}</p>
                    <p className="text-[14px] text-[#5E7A6E]">
                      {r.cours.titre} · {r.lecon.titre}
                      {r.renduLe ? ` · rendu le ${formaterDate(r.renduLe)}` : ''}
                      {r.tentative > 1 ? ` · version ${r.tentative}` : ''}
                    </p>
                  </div>
                  <Pastille ton={l.ton}>{l.texte}</Pastille>
                  {r.note !== null ? <Pastille ton="neutre">{r.note}/100</Pastille> : null}
                </div>
                {r.texte ? <p className="mt-3 whitespace-pre-line rounded-xl bg-[#F7F8F7] px-4 py-3 text-[15px] leading-relaxed">{r.texte}</p> : null}
                {r.fichiers.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {r.fichiers.map((f) => (
                      <li key={f.n}>
                        <button
                          type="button"
                          onClick={() => telecharger(`/ecole/devoirs/${r.id}/fichiers/${f.n}`, f.nom).catch((e) => setErreur(messageDe(e)))}
                          className={BTN_SECONDAIRE}
                        >
                          {f.nom}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r.commentaire && !estOuvert ? <p className="mt-3 text-[15px] text-[#334A42]"><strong>Ton commentaire :</strong> {r.commentaire}</p> : null}

                {estOuvert ? (
                  <div className="mt-4 grid gap-3 border-t border-[#EDF4F1] pt-4 sm:grid-cols-[140px_1fr]">
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Note sur 100</span>
                      <input value={note} onChange={(e) => setNote(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="facultatif" className={CHAMP} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Commentaire à l&apos;apprenant</span>
                      <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} maxLength={5000} className={`${CHAMP} min-h-[90px]`} />
                    </label>
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <button type="button" disabled={occupe} onClick={() => corriger(r.id, 'VALIDE')} className={BTN_PRIMAIRE}>
                        Valider
                      </button>
                      <button type="button" disabled={occupe} onClick={() => corriger(r.id, 'A_REPRENDRE')} className={BTN_SECONDAIRE}>
                        À reprendre
                      </button>
                      <button type="button" onClick={() => setOuvert(null)} className={BTN_DISCRET}>
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setOuvert(r.id);
                        setNote(r.note === null ? '' : String(r.note));
                        setCommentaire(r.commentaire ?? '');
                      }}
                      className={r.statut === 'A_CORRIGER' ? BTN_PRIMAIRE : BTN_DISCRET}
                    >
                      {r.statut === 'A_CORRIGER' ? 'Corriger' : 'Modifier la correction'}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
