'use client';

import { useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { CARTE } from '../../_ui';
import { LIBELLES_ETAT_ACTION, dateCourte, formaterEuros, type ActionAssociation, type EtatAction } from '../_types';
import { FicheProjet } from './FicheProjet';

/**
 * MES PROJETS EN COLONNES.
 *
 * Prévu, en cours, terminé : on attrape une carte et on la pose dans la
 * colonne suivante. Sur téléphone, le menu « Déplacer vers » fait pareil.
 */
const COLONNES: { etat: EtatAction; titre: string; aide: string }[] = [
  { etat: 'PREVUE', titre: 'Prévus', aide: 'Ce qu’on veut faire' },
  { etat: 'EN_COURS', titre: 'En cours', aide: 'Ce qui tourne en ce moment' },
  { etat: 'TERMINEE', titre: 'Terminés', aide: 'À raconter dans le rapport' },
];

export function Kanban({ projets }: { projets: ActionAssociation[] }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState<ActionAssociation | null | 'nouveau'>(null);
  const [attrape, setAttrape] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<EtatAction | null>(null);
  const [deplaces, setDeplaces] = useState<Record<string, EtatAction>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  const etatDe = (p: ActionAssociation) => deplaces[p.id] ?? p.etat;

  async function deplacer(id: string, etat: EtatAction) {
    const projet = projets.find((p) => p.id === id);
    if (!projet || etatDe(projet) === etat) return;
    setErreur(null);
    setDeplaces((x) => ({ ...x, [id]: etat }));
    try {
      await appel(`/association/actions/${id}`, { method: 'PATCH', body: { etat } });
      router.refresh();
    } catch (err) {
      setDeplaces((x) => {
        const suite = { ...x };
        delete suite[id];
        return suite;
      });
      setErreur(err instanceof Error ? err.message : 'Le déplacement a échoué.');
    }
  }

  function surDepot(e: DragEvent<HTMLDivElement>, etat: EtatAction) {
    e.preventDefault();
    setSurvolee(null);
    const id = e.dataTransfer.getData('text/plain') || attrape;
    setAttrape(null);
    if (id) void deplacer(id, etat);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-[#6B6A8A]">Attrape une carte et pose-la dans une autre colonne. Sur téléphone, utilise « Déplacer vers ».</p>
        <button type="button" onClick={() => setOuvert('nouveau')} className="ml-auto rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4338CA]">
          + Ajouter un projet
        </button>
      </div>

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}
      {ouvert === 'nouveau' ? <FicheProjet projet={null} onFermer={() => setOuvert(null)} /> : null}
      {ouvert && ouvert !== 'nouveau' ? <FicheProjet projet={ouvert} onFermer={() => setOuvert(null)} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        {COLONNES.map((col) => {
          const siens = projets.filter((p) => etatDe(p) === col.etat);
          const cible = survolee === col.etat;
          return (
            <div
              key={col.etat}
              onDragOver={(e) => {
                e.preventDefault();
                setSurvolee(col.etat);
              }}
              onDragLeave={() => setSurvolee((s) => (s === col.etat ? null : s))}
              onDrop={(e) => surDepot(e, col.etat)}
              className={`rounded-2xl p-3 transition ${cible ? 'bg-[#ECEBFC] ring-2 ring-[#4F46E5]' : 'bg-[#ECEBFC]/60'}`}
            >
              <p className="px-2 font-extrabold text-[#1D1B5C]">
                {col.titre} <span className="text-[#6B6A8A]">{siens.length}</span>
              </p>
              <p className="px-2 text-xs text-[#6B6A8A]">{col.aide}</p>

              <ul className="mt-3 space-y-2">
                {siens.map((p) => (
                  <li key={p.id}>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', p.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setAttrape(p.id);
                      }}
                      onDragEnd={() => setAttrape(null)}
                      className={`${CARTE} cursor-grab p-3 active:cursor-grabbing ${attrape === p.id ? 'opacity-50' : ''}`}
                    >
                      <button type="button" onClick={() => setOuvert(p)} className="block w-full text-left">
                        <span className="block font-extrabold leading-snug text-[#1D1B5C]">{p.intitule}</span>
                        <span className="mt-0.5 block text-sm text-[#6B6A8A]">
                          {p.dateDebut ? dateCourte(p.dateDebut) : 'Pas encore de date'}
                          {p.lieu ? ` · ${p.lieu}` : ''}
                        </span>
                        {p.resume ? <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-[#3B3A66]">{p.resume}</span> : null}
                        <span className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold text-[#6B6A8A]">
                          {p.beneficiaires !== null ? <span className="rounded-full bg-[#F0EFF7] px-2 py-0.5">{p.beneficiaires} personnes</span> : null}
                          {p.benevoles !== null ? <span className="rounded-full bg-[#F0EFF7] px-2 py-0.5">{p.benevoles} bénévoles</span> : null}
                          {p.cout !== null ? <span className="rounded-full bg-[#F0EFF7] px-2 py-0.5">{formaterEuros(p.cout)}</span> : null}
                          {etatDe(p) === 'TERMINEE' && !p.bilan ? <span className="rounded-full bg-[#FEF3E2] px-2 py-0.5 text-[#7C3E06]">Bilan à écrire</span> : null}
                        </span>
                      </button>

                      <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#6B6A8A]">
                        Déplacer vers
                        <select
                          value={etatDe(p)}
                          onChange={(e) => void deplacer(p.id, e.target.value as EtatAction)}
                          className="flex-1 rounded-lg border border-[#D9D6EE] bg-white px-2 py-1 text-xs font-bold text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none"
                        >
                          {COLONNES.map((c) => (
                            <option key={c.etat} value={c.etat}>
                              {LIBELLES_ETAT_ACTION[c.etat]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </li>
                ))}
                {siens.length === 0 ? (
                  <li className="px-2 py-6 text-center text-sm text-[#9A99B5]">{cible ? 'Pose la carte ici' : 'Rien ici'}</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
