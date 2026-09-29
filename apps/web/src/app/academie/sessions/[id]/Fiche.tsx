'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { appel } from '../../_client';
import { BTN_DISCRET, Encart, Pastille, formaterDate } from '../../_ui';
import type { FormateurOrg, SalleOrg, SessionDetail } from '../../_gestion/types';
import { OngletApercu } from './OngletApercu';
import { OngletPlanning } from './OngletPlanning';
import { OngletStagiaires } from './OngletStagiaires';
import { OngletEmargement } from './OngletEmargement';
import { OngletDocuments } from './OngletDocuments';
import { OngletQualite } from './OngletQualite';
import { OngletFacturation } from './OngletFacturation';

const ONGLETS = [
  ['apercu', 'Aperçu'],
  ['planning', 'Planning'],
  ['stagiaires', 'Stagiaires'],
  ['emargement', 'Émargement'],
  ['documents', 'Documents'],
  ['qualite', 'Évaluations'],
  ['facturation', 'Facturation'],
] as const;
type Onglet = (typeof ONGLETS)[number][0];

export interface ContexteFiche {
  session: SessionDetail;
  formateurs: FormateurOrg[];
  salles: SalleOrg[];
  /** Recharge la session depuis l'API (après une écriture). */
  recharger: () => Promise<void>;
  /** Exécute une action, montre son erreur, recharge. */
  agir: (f: () => Promise<unknown>, message?: string) => Promise<boolean>;
  occupe: boolean;
}

/**
 * LA FICHE D'UNE SESSION : SEPT ONGLETS, DANS L'ORDRE OÙ L'ON S'EN SERT.
 *
 * Avant (réglages, planning, stagiaires), pendant (émargement), après
 * (documents, évaluations, facturation). Chaque onglet écrit par l'API puis
 * recharge la session entière : une seule source de vérité, pas d'état
 * recopié qui divergerait d'un onglet à l'autre.
 */
export function Fiche({
  initiale,
  formateurs,
  salles,
  ongletInitial,
}: {
  initiale: SessionDetail;
  formateurs: FormateurOrg[];
  salles: SalleOrg[];
  ongletInitial?: string;
}) {
  const [session, setSession] = useState(initiale);
  const [onglet, setOnglet] = useState<Onglet>((ONGLETS.find((o) => o[0] === ongletInitial)?.[0] as Onglet) ?? 'apercu');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setSession(await appel<SessionDetail>(`/academie/gestion/sessions/${session.id}`));
  }, [session.id]);

  const agir = useCallback(
    async (f: () => Promise<unknown>, message?: string) => {
      setOccupe(true);
      setErreur(null);
      setInfo(null);
      try {
        await f();
        await recharger();
        if (message) setInfo(message);
        return true;
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "L'action n'a pas abouti.");
        return false;
      } finally {
        setOccupe(false);
      }
    },
    [recharger],
  );

  const ctx: ContexteFiche = { session, formateurs, salles, recharger, agir, occupe };
  const actifs = session.inscriptions.filter((i) => i.status !== 'CANCELLED');
  const titre = session.title || session.formation.title;

  const choisir = (o: Onglet) => {
    setOnglet(o);
    setErreur(null);
    setInfo(null);
    const url = new URL(window.location.href);
    url.searchParams.set('onglet', o);
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <>
      <Link href="/academie/sessions" className={BTN_DISCRET}>
        ← Toutes les sessions
      </Link>
      <div className="mb-6 mt-3">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-[#5E7A6E]">Administrer la session</p>
        <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-[#12312A] [text-wrap:balance] sm:text-4xl">{titre}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[15px] text-[#334A42]">
          <Pastille ton={session.status === 'CANCELLED' ? 'alerte' : 'ok'}>
            {formaterDate(session.startDate)}
            {session.endDate && new Date(session.endDate).toDateString() !== new Date(session.startDate).toDateString() ? ` au ${formaterDate(session.endDate)}` : ''}
          </Pastille>
          <span>
            {actifs.length} stagiaire{actifs.length > 1 ? 's' : ''}
            {session.maxSeats ? ` sur ${session.maxSeats}` : ''}
          </span>
          {session.dureePrevue ? <span>· {String(session.dureePrevue).replace('.', ',')} h par stagiaire</span> : null}
          {session.conflits.length ? <Pastille ton="alerte">{session.conflits.length} conflit{session.conflits.length > 1 ? 's' : ''} de planning</Pastille> : null}
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-4 mb-6 overflow-x-auto border-b border-[#DDEBE4] bg-[#F2F7F5]/95 px-4 backdrop-blur" role="tablist" aria-label="Rubriques de la session">
        <div className="flex min-w-max gap-1">
          {ONGLETS.map(([cle, libelle]) => (
            <button
              key={cle}
              type="button"
              role="tab"
              aria-selected={onglet === cle}
              onClick={() => choisir(cle)}
              className={`border-b-[3px] px-4 py-3 text-[15px] font-bold transition ${onglet === cle ? 'border-[#1E9E6A] text-[#0F5F3E]' : 'border-transparent text-[#5E7A6E] hover:text-[#12312A]'}`}
            >
              {libelle}
            </button>
          ))}
        </div>
      </div>

      {erreur ? (
        <div className="mb-5" role="alert">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}
      {info ? (
        <div className="mb-5" role="status">
          <Encart ton="ok">{info}</Encart>
        </div>
      ) : null}

      {onglet === 'apercu' ? <OngletApercu ctx={ctx} aller={choisir} /> : null}
      {onglet === 'planning' ? <OngletPlanning ctx={ctx} /> : null}
      {onglet === 'stagiaires' ? <OngletStagiaires ctx={ctx} /> : null}
      {onglet === 'emargement' ? <OngletEmargement ctx={ctx} /> : null}
      {onglet === 'documents' ? <OngletDocuments ctx={ctx} /> : null}
      {onglet === 'qualite' ? <OngletQualite ctx={ctx} /> : null}
      {onglet === 'facturation' ? <OngletFacturation ctx={ctx} /> : null}
    </>
  );
}
