'use client';

import { useState, type DragEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { CARTE, Pastille } from '../../_ui';
import { LIBELLES_ETAT, LIBELLES_NATURE, dateCourte, formaterEuros, type Dossier, type EtatDossier } from '../_types';

/**
 * LE TABLEAU DES DEMANDES, EN COLONNES.
 *
 * On attrape une carte et on la pose dans une autre colonne : l'état change
 * tout de suite. Sur téléphone, où le glisser-déposer ne marche pas, chaque
 * carte porte un menu « Déplacer vers » qui fait la même chose.
 */
const COLONNES: { code: string; titre: string; aide: string; etats: EtatDossier[]; deposeVers: EtatDossier }[] = [
  { code: 'preparer', titre: 'À préparer', aide: 'Repérées ou en cours d’écriture', etats: ['REPERE', 'EN_ECRITURE'], deposeVers: 'EN_ECRITURE' },
  { code: 'deposes', titre: 'Déposées', aide: 'En attente de réponse', etats: ['DEPOSE'], deposeVers: 'DEPOSE' },
  { code: 'accordes', titre: 'Accordées', aide: 'À justifier par un compte rendu', etats: ['ACCORDE'], deposeVers: 'ACCORDE' },
  { code: 'termines', titre: 'Terminées', aide: 'Soldées ou refusées', etats: ['SOLDE', 'REFUSE'], deposeVers: 'SOLDE' },
];

const TOUS_ETATS: EtatDossier[] = ['REPERE', 'EN_ECRITURE', 'DEPOSE', 'ACCORDE', 'REFUSE', 'SOLDE'];

export function Tableau({ dossiers, montrerNature }: { dossiers: Dossier[]; montrerNature: boolean }) {
  const router = useRouter();
  const [attrapee, setAttrapee] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // Ce que l'écran montre pendant que l'API répond : la carte bouge sans attendre.
  const [deplacees, setDeplacees] = useState<Record<string, EtatDossier>>({});

  const etatDe = (d: Dossier) => deplacees[d.id] ?? d.etat;

  async function deplacer(id: string, etat: EtatDossier) {
    const dossier = dossiers.find((d) => d.id === id);
    if (!dossier || etatDe(dossier) === etat) return;
    setErreur(null);
    setEnCours(id);
    setDeplacees((x) => ({ ...x, [id]: etat }));
    try {
      await appel(`/association/dossiers/${id}`, { method: 'PATCH', body: { etat } });
      router.refresh();
    } catch (err) {
      setDeplacees((x) => {
        const suite = { ...x };
        delete suite[id];
        return suite;
      });
      setErreur(err instanceof Error ? err.message : 'Le déplacement a échoué.');
    } finally {
      setEnCours(null);
    }
  }

  function surDepot(e: DragEvent<HTMLDivElement>, etat: EtatDossier) {
    e.preventDefault();
    setSurvolee(null);
    const id = e.dataTransfer.getData('text/plain') || attrapee;
    setAttrapee(null);
    if (id) void deplacer(id, etat);
  }

  return (
    <div className="space-y-3">
      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">{erreur}</p> : null}
      <p className="text-sm text-[#6B6A8A]">Attrape une carte et pose-la dans une autre colonne. Sur téléphone, utilise « Déplacer vers » en bas de la carte.</p>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLONNES.map((col) => {
          const siennes = dossiers.filter((d) => col.etats.includes(etatDe(d)));
          const cible = survolee === col.code;
          return (
            <div
              key={col.code}
              onDragOver={(e) => {
                e.preventDefault();
                setSurvolee(col.code);
              }}
              onDragLeave={() => setSurvolee((s) => (s === col.code ? null : s))}
              onDrop={(e) => surDepot(e, col.deposeVers)}
              className={`rounded-2xl p-3 transition ${cible ? 'bg-[#ECEBFC] ring-2 ring-[#4F46E5]' : 'bg-[#ECEBFC]/60'}`}
            >
              <p className="px-2 font-extrabold text-[#1D1B5C]">
                {col.titre} <span className="text-[#6B6A8A]">{siennes.length}</span>
              </p>
              <p className="px-2 text-xs text-[#6B6A8A]">{col.aide}</p>

              <ul className="mt-3 space-y-2">
                {siennes.map((d) => {
                  const etat = etatDe(d);
                  return (
                    <li key={d.id}>
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', d.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setAttrapee(d.id);
                        }}
                        onDragEnd={() => setAttrapee(null)}
                        className={`${CARTE} block cursor-grab p-3 active:cursor-grabbing ${attrapee === d.id ? 'opacity-50' : ''} ${enCours === d.id ? 'animate-pulse' : ''}`}
                      >
                        <Link href={`/espace/dossiers/${d.id}`} className="block no-underline">
                          <span className="block font-extrabold leading-snug text-[#1D1B5C]">{d.intitule}</span>
                          <span className="block text-sm text-[#6B6A8A]">{d.financeur}</span>
                          {montrerNature ? (
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${d.nature === 'APPEL_A_PROJET' ? 'bg-[#FEF3E2] text-[#7C3E06]' : 'bg-[#ECEBFC] text-[#4338CA]'}`}>
                              {LIBELLES_NATURE[d.nature ?? 'SUBVENTION']}
                            </span>
                          ) : null}
                          <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                            <Pastille ton={etat === 'ACCORDE' || etat === 'SOLDE' ? 'ok' : etat === 'REFUSE' ? 'alerte' : etat === 'DEPOSE' ? 'accent' : 'neutre'}>
                              {LIBELLES_ETAT[etat]}
                            </Pastille>
                            {d.dateLimiteDepot && (etat === 'REPERE' || etat === 'EN_ECRITURE') ? (
                              <span className="text-[#6B6A8A]">avant le {dateCourte(d.dateLimiteDepot)}</span>
                            ) : null}
                            {d.dateCompteRendu && etat === 'ACCORDE' ? <span className="text-[#6B6A8A]">compte rendu le {dateCourte(d.dateCompteRendu)}</span> : null}
                            {d.montantAccorde !== null ? (
                              <span className="font-bold text-[#0F5F3E]">{formaterEuros(d.montantAccorde)}</span>
                            ) : d.montantDemande !== null ? (
                              <span className="text-[#6B6A8A]">{formaterEuros(d.montantDemande)}</span>
                            ) : null}
                          </span>
                        </Link>

                        <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#6B6A8A]">
                          Déplacer vers
                          <select
                            value={etat}
                            onChange={(e) => void deplacer(d.id, e.target.value as EtatDossier)}
                            className="flex-1 rounded-lg border border-[#D9D6EE] bg-white px-2 py-1 text-xs font-bold text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none"
                          >
                            {TOUS_ETATS.map((e) => (
                              <option key={e} value={e}>
                                {LIBELLES_ETAT[e]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </li>
                  );
                })}
                {siennes.length === 0 ? <li className="px-2 py-6 text-center text-sm text-[#9A99B5]">{cible ? 'Pose la carte ici' : 'Rien ici'}</li> : null}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
