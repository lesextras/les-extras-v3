'use client';

import { useMemo, useState } from 'react';
import { appel } from '../_client';
import { BTN_SECONDAIRE, CARTE, CHAMP, Encart } from '../_ui';

/**
 * LES SEPT CRITÈRES, INDICATEUR PAR INDICATEUR.
 *
 * Un audit Qualiopi ne demande pas des intentions : il demande, pour chaque
 * indicateur qui te concerne, UNE preuve qu'on peut montrer. Cet écran tient
 * la liste, dit où en est chacune, et laisse écrire en une ligne quelle pièce
 * répond — avec son lien si elle est quelque part.
 *
 * « Sans objet » est un choix normal : l'alternance, la sous-traitance ou les
 * stages ne concernent pas tout le monde. Marqué ainsi, l'indicateur sort du
 * compte plutôt que de rester rouge à vie.
 */

export type EtatPreuve = 'A_FAIRE' | 'DEPOSEE' | 'VALIDEE' | 'SANS_OBJET';

export interface Indicateur {
  id: string;
  numero: number;
  libelle: string;
  etat: EtatPreuve;
  intitule: string | null;
  lien: string | null;
}

export interface Critere {
  numero: number;
  titre: string;
  indicateurs: Indicateur[];
}

export interface Referentiel {
  criteres: Critere[];
  total: number;
  concernes: number;
  couverts: number;
  pourcentage: number;
}

const NOM_ETAT: Record<EtatPreuve, string> = {
  A_FAIRE: 'À faire',
  DEPOSEE: 'Preuve notée',
  VALIDEE: 'Vérifiée',
  SANS_OBJET: 'Sans objet',
};

const TEINTE_ETAT: Record<EtatPreuve, string> = {
  A_FAIRE: 'bg-[#FDE7EC] text-[#8A1B3D]',
  DEPOSEE: 'bg-[#FEF3E2] text-[#7C3E06]',
  VALIDEE: 'bg-[#E3F5EC] text-[#0F5F3E]',
  SANS_OBJET: 'bg-[#F2F7F5] text-[#5E7A6E]',
};

export function ReferentielQualiopi({ initial }: { initial: Referentiel }) {
  const [criteres, setCriteres] = useState(initial.criteres);
  const [filtre, setFiltre] = useState<'TOUT' | 'RESTE'>('TOUT');
  const [erreur, setErreur] = useState<string | null>(null);

  const tous = useMemo(() => criteres.flatMap((c) => c.indicateurs), [criteres]);
  const concernes = tous.filter((i) => i.etat !== 'SANS_OBJET');
  const couverts = concernes.filter((i) => i.etat === 'DEPOSEE' || i.etat === 'VALIDEE');
  const pourcentage = concernes.length ? Math.round((couverts.length / concernes.length) * 100) : 0;

  function remplacer(maj: Indicateur) {
    setCriteres((cs) => cs.map((c) => ({ ...c, indicateurs: c.indicateurs.map((i) => (i.id === maj.id ? maj : i)) })));
  }

  async function noter(id: string, corps: Record<string, unknown>) {
    try {
      const maj = await appel<Indicateur>(`/academie/qualiopi/${id}`, { method: 'PATCH', body: corps });
      remplacer(maj);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La preuve n'a pas pu être enregistrée.");
    }
  }

  return (
    <>
      {/* ------------------------------------------------------- où on en est */}
      <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">Couverture du référentiel</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#12312A]">{pourcentage} %</p>
            <p className="mt-0.5 text-[14px] text-[#334A42]">
              {couverts.length} indicateur{couverts.length > 1 ? 's' : ''} sur {concernes.length} qui te concernent
              {tous.length - concernes.length > 0 ? ` · ${tous.length - concernes.length} marqué${tous.length - concernes.length > 1 ? 's' : ''} sans objet` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFiltre((f) => (f === 'TOUT' ? 'RESTE' : 'TOUT'))}
            className={BTN_SECONDAIRE}
          >
            {filtre === 'TOUT' ? 'Ne montrer que ce qui manque' : 'Montrer tout le référentiel'}
          </button>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#E3F5EC]">
          <div className="h-full rounded-full bg-[#1E9E6A] transition-all" style={{ width: `${pourcentage}%` }} />
        </div>
      </section>

      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------------- les critères */}
      <div className="space-y-4">
        {criteres.map((c) => {
          const visibles = filtre === 'TOUT' ? c.indicateurs : c.indicateurs.filter((i) => i.etat === 'A_FAIRE');
          if (!visibles.length) return null;
          const faits = c.indicateurs.filter((i) => i.etat === 'DEPOSEE' || i.etat === 'VALIDEE').length;
          const aTraiter = c.indicateurs.filter((i) => i.etat !== 'SANS_OBJET').length;

          return (
            <section key={c.numero} className={`${CARTE} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDEBE4] bg-[#F2F7F5] px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">Critère {c.numero}</p>
                  <h2 className="mt-0.5 text-[17px] font-extrabold leading-snug text-[#12312A]">{c.titre}</h2>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-extrabold ${
                    aTraiter && faits === aTraiter ? 'bg-[#E3F5EC] text-[#0F5F3E]' : 'bg-white text-[#334A42]'
                  }`}
                >
                  {faits} / {aTraiter}
                </span>
              </div>

              <ul className="divide-y divide-[#DDEBE4]">
                {visibles.map((i) => (
                  <LigneIndicateur key={i.id} indicateur={i} onNoter={noter} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

/** Un indicateur : son état, la pièce qui y répond, et de quoi la corriger. */
function LigneIndicateur({
  indicateur: i,
  onNoter,
}: {
  indicateur: Indicateur;
  onNoter: (id: string, corps: Record<string, unknown>) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [intitule, setIntitule] = useState(i.intitule ?? '');
  const [lien, setLien] = useState(i.lien ?? '');

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#F2F7F5] px-2 py-0.5 text-[12px] font-extrabold tabular-nums text-[#0F5F3E]">
              Indicateur {i.numero}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold ${TEINTE_ETAT[i.etat]}`}>{NOM_ETAT[i.etat]}</span>
          </div>
          <p className="mt-1.5 max-w-[80ch] text-[15px] leading-relaxed text-[#334A42]">{i.libelle}</p>
          {i.intitule ? (
            <p className="mt-1.5 text-[14px] font-bold text-[#12312A]">
              Preuve : {i.intitule}
              {i.lien ? (
                <>
                  {' · '}
                  <a href={i.lien} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0F5F3E] underline underline-offset-4">
                    ouvrir ↗
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => setOuvert((o) => !o)} className="rounded-lg border border-[#DDEBE4] bg-white px-3 py-1.5 text-[13px] font-bold text-[#334A42] transition hover:border-[#1E9E6A] hover:text-[#0F5F3E]">
            {i.intitule ? 'Corriger' : 'Noter la preuve'}
          </button>
          {i.etat !== 'SANS_OBJET' ? (
            <button type="button" onClick={() => onNoter(i.id, { etat: 'SANS_OBJET' })} className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-[#5E7A6E] hover:bg-[#F2F7F5]">
              Sans objet
            </button>
          ) : (
            <button type="button" onClick={() => onNoter(i.id, { etat: 'A_FAIRE' })} className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-[#5E7A6E] hover:bg-[#F2F7F5]">
              Me concerne finalement
            </button>
          )}
          {i.etat === 'DEPOSEE' ? (
            <button type="button" onClick={() => onNoter(i.id, { etat: 'VALIDEE' })} className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-[#0F5F3E] hover:bg-[#E3F5EC]">
              Vérifiée
            </button>
          ) : null}
        </div>
      </div>

      {ouvert ? (
        <div className="mt-3 grid gap-3 rounded-xl border border-[#DDEBE4] bg-[#F2F7F5] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <input
            type="text"
            value={intitule}
            onChange={(e) => setIntitule(e.target.value)}
            maxLength={300}
            placeholder="Quelle pièce répond ? « Fiche programme CM IA », « CV du formateur »…"
            className={CHAMP}
          />
          <input
            type="url"
            value={lien}
            onChange={(e) => setLien(e.target.value)}
            maxLength={500}
            placeholder="Son lien, si elle est en ligne (facultatif)"
            className={CHAMP}
          />
          <button
            type="button"
            onClick={() => {
              onNoter(i.id, { intitule, lien, etat: intitule.trim() || lien.trim() ? 'DEPOSEE' : 'A_FAIRE' });
              setOuvert(false);
            }}
            className="rounded-xl bg-[#1E9E6A] px-4 py-3 text-[15px] font-bold text-white transition hover:bg-[#17845A]"
          >
            Enregistrer
          </button>
        </div>
      ) : null}
    </li>
  );
}
