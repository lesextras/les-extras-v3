'use client';

import { useState } from 'react';
import { LIBELLES_ETAT_ACTION, dateCourte, formaterEuros, type ActionAssociation, type EtatAction } from '../_types';
import { FicheAction } from './FicheAction';

type Onglet = 'TOUTES' | EtatAction;

const TONS: Record<EtatAction, string> = {
  PREVUE: 'bg-[#ECEBFC] text-[#4338CA]',
  EN_COURS: 'bg-[#FEF3E2] text-[#7C3E06]',
  TERMINEE: 'bg-[#E3F5EC] text-[#0F5F3E]',
};

function quand(a: ActionAssociation) {
  if (a.dateDebut && a.dateFin) return `${dateCourte(a.dateDebut)} → ${dateCourte(a.dateFin)}`;
  if (a.dateDebut) return dateCourte(a.dateDebut);
  if (a.dateFin) return `jusqu'au ${dateCourte(a.dateFin)}`;
  return 'Pas encore de date';
}

/** La liste des actions : des onglets, une carte par action, une fiche qui s'ouvre en place. */
export function Actions({ actions }: { actions: ActionAssociation[] }) {
  const [onglet, setOnglet] = useState<Onglet>('TOUTES');
  const [ouverte, setOuverte] = useState<ActionAssociation | null | 'nouvelle'>(null);

  const liste = onglet === 'TOUTES' ? actions : actions.filter((a) => a.etat === onglet);
  const onglets: { code: Onglet; libelle: string; nombre: number }[] = [
    { code: 'TOUTES', libelle: 'Toutes', nombre: actions.length },
    { code: 'PREVUE', libelle: 'Prévues', nombre: actions.filter((a) => a.etat === 'PREVUE').length },
    { code: 'EN_COURS', libelle: 'En cours', nombre: actions.filter((a) => a.etat === 'EN_COURS').length },
    { code: 'TERMINEE', libelle: 'Terminées', nombre: actions.filter((a) => a.etat === 'TERMINEE').length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {onglets.map((o) => (
          <button
            key={o.code}
            type="button"
            onClick={() => {
              setOnglet(o.code);
              setOuverte(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold ${onglet === o.code ? 'bg-[#1D1B5C] text-white' : 'bg-white text-[#3B3A66] hover:bg-[#ECEBFC]'}`}
          >
            {o.libelle} <span className={onglet === o.code ? 'text-[#C7C4F2]' : 'text-[#9A99B5]'}>{o.nombre}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOuverte('nouvelle')}
          className="ml-auto rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4338CA]"
        >
          + Ajouter une action
        </button>
      </div>

      {ouverte === 'nouvelle' ? <FicheAction action={null} onFermer={() => setOuverte(null)} /> : null}

      {liste.length === 0 ? (
        <div className="rounded-2xl border border-[#E6E4F3] bg-white px-6 py-10 text-center">
          <p className="font-bold text-[#1D1B5C]">
            {onglet === 'TOUTES' ? 'Aucune action pour l’instant.' : 'Aucune action dans cette liste.'}
          </p>
          <p className="mt-1 text-sm text-[#6B6A8A]">
            Note ce que vous faites : une sortie, un atelier, un tournoi. C&apos;est ça qu&apos;on raconte dans un dossier de subvention et dans le rapport d&apos;activité.
          </p>
          <button type="button" onClick={() => setOuverte('nouvelle')} className="mt-4 rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white hover:bg-[#4338CA]">
            Ajouter une action
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {liste.map((a) =>
            ouverte && ouverte !== 'nouvelle' && ouverte.id === a.id ? (
              <li key={a.id} className="md:col-span-2">
                <FicheAction action={a} onFermer={() => setOuverte(null)} />
              </li>
            ) : (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setOuverte(a)}
                  className="flex h-full w-full flex-col rounded-2xl border border-[#E6E4F3] bg-white p-5 text-left transition hover:border-[#4F46E5] hover:shadow-[0_10px_24px_-18px_rgba(29,27,92,0.6)]"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-extrabold text-[#1D1B5C]">{a.intitule}</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${TONS[a.etat]}`}>{LIBELLES_ETAT_ACTION[a.etat]}</span>
                  </span>
                  <span className="mt-1 text-sm text-[#6B6A8A]">
                    {quand(a)}
                    {a.lieu ? ` · ${a.lieu}` : ''}
                  </span>
                  {a.resume ? <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#3B3A66]">{a.resume}</span> : null}
                  <span className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold text-[#6B6A8A]">
                    {a.beneficiaires !== null ? <span className="rounded-full bg-[#F0EFF7] px-2 py-0.5">{a.beneficiaires} personnes</span> : null}
                    {a.benevoles !== null ? <span className="rounded-full bg-[#F0EFF7] px-2 py-0.5">{a.benevoles} bénévoles</span> : null}
                    {a.cout !== null ? <span className="rounded-full bg-[#F0EFF7] px-2 py-0.5">{formaterEuros(a.cout)}</span> : null}
                    {a.etat === 'TERMINEE' && !a.bilan ? <span className="rounded-full bg-[#FEF3E2] px-2 py-0.5 text-[#7C3E06]">Bilan à écrire</span> : null}
                  </span>
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
