'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, formaterDate } from '../_ui';

/**
 * LES SESSIONS — QUAND LA FORMATION A LIEU POUR DE VRAI.
 *
 * Une formation au catalogue ne prouve rien : ce sont les sessions qui portent
 * les preuves d'un audit — la convention, la feuille d'émargement, les
 * évaluations à chaud et à froid. Une session sans date de fin ni lieu est
 * une session qu'on ne peut pas défendre.
 */

export interface Programme {
  id: string;
  title: string;
  status?: string;
}

export interface Session {
  id: string;
  title?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  maxSeats?: number | null;
  status?: string;
  formation?: { id?: string; title?: string } | null;
  _count?: { inscriptions: number };
}

const NOM_STATUT: Record<string, string> = {
  DRAFT: 'Brouillon',
  PLANNED: 'Planifiée',
  OPEN: 'Ouverte aux inscriptions',
  CONFIRMED: 'Confirmée',
  RUNNING: 'En cours',
  DONE: 'Terminée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const TEINTE: Record<string, string> = {
  CANCELLED: 'bg-[#FDE7EC] text-[#8A1B3D]',
  DONE: 'bg-[#F2F7F5] text-[#5E7A6E]',
  COMPLETED: 'bg-[#F2F7F5] text-[#5E7A6E]',
};

const maintenant = () => new Date();

export function Sessions({ initiales, programmes }: { initiales: Session[]; programmes: Programme[] }) {
  const [liste, setListe] = useState(initiales);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [formationId, setFormationId] = useState(programmes[0]?.id ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [maxSeats, setMaxSeats] = useState('');

  const aVenir = liste.filter((s) => new Date(s.startDate) >= maintenant());
  const passees = liste.filter((s) => new Date(s.startDate) < maintenant());

  async function creer(e: FormEvent) {
    e.preventDefault();
    if (!formationId) {
      setErreur("Choisis d'abord la formation dont c'est une session.");
      return;
    }
    if (!startDate) {
      setErreur('Donne la date de début.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const places = Number.parseInt(maxSeats, 10);
      const creee = await appel<Session>(`/formations/${formationId}/sessions`, {
        method: 'POST',
        body: {
          startDate: new Date(startDate).toISOString(),
          ...(endDate ? { endDate: new Date(endDate).toISOString() } : {}),
          ...(title.trim() ? { title: title.trim() } : {}),
          ...(location.trim() ? { location: location.trim() } : {}),
          ...(Number.isFinite(places) && places > 0 ? { maxSeats: places } : {}),
        },
      });
      setListe((l) => [creee, ...l]);
      setStartDate('');
      setEndDate('');
      setTitle('');
      setLocation('');
      setMaxSeats('');
      setOuvert(false);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La session n'a pas pu être créée.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        {!programmes.length ? (
          <Encart ton="attention">
            Il faut d&apos;abord une formation au catalogue : une session est toujours la session de quelque chose.
          </Encart>
        ) : !liste.length ? (
          <Encart ton="info">
            Aucune session pour l&apos;instant. C&apos;est la session qui porte les preuves d&apos;un audit — la
            convention, l&apos;émargement, les évaluations. Une formation qui n&apos;a jamais eu de session ne prouve
            rien.
          </Encart>
        ) : (
          <Encart ton="ok">
            {aVenir.length} session{aVenir.length > 1 ? 's' : ''} à venir · {passees.length} passée{passees.length > 1 ? 's' : ''}
          </Encart>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={() => setOuvert((o) => !o)} disabled={!programmes.length} className={BTN_PRIMAIRE}>
          {ouvert ? 'Fermer' : 'Programmer une session'}
        </button>
      </div>

      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {ouvert ? (
        <form onSubmit={creer} className={`${CARTE} mb-6 space-y-4 p-5 sm:p-6`}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">De quelle formation</span>
            <select value={formationId} onChange={(e) => setFormationId(e.target.value)} className={CHAMP}>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Début</span>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={CHAMP} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Fin</span>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={CHAMP} />
              <span className="mt-1 block text-xs text-[#5E7A6E]">Une date de fin rend la convention défendable.</span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Où</span>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} placeholder="Adresse, ou « à distance »" className={CHAMP} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Places</span>
              <input type="number" min={1} value={maxSeats} onChange={(e) => setMaxSeats(e.target.value)} className={CHAMP} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Un nom pour cette session</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Facultatif — sinon c'est le titre de la formation." className={CHAMP} />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Création…' : 'Programmer'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className={BTN_SECONDAIRE}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {aVenir.length ? (
        <>
          <h2 className="mb-3 text-[17px] font-extrabold text-[#12312A]">À venir</h2>
          <ul className="mb-8 space-y-3">
            {aVenir.map((s) => (
              <LigneSession key={s.id} s={s} />
            ))}
          </ul>
        </>
      ) : null}

      {passees.length ? (
        <>
          <h2 className="mb-3 text-[17px] font-extrabold text-[#12312A]">Déjà passées</h2>
          <ul className="space-y-3">
            {passees.map((s) => (
              <LigneSession key={s.id} s={s} />
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

function LigneSession({ s }: { s: Session }) {
  const manque: string[] = [];
  if (!s.endDate) manque.push('la date de fin');
  if (!s.location?.trim()) manque.push('le lieu');

  return (
    <li className={`${CARTE} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {s.status ? (
              <span className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold ${TEINTE[s.status] ?? 'bg-[#E3F5EC] text-[#0F5F3E]'}`}>
                {NOM_STATUT[s.status] ?? s.status}
              </span>
            ) : null}
            <span className="text-[13px] text-[#5E7A6E]">
              {formaterDate(s.startDate)}
              {s.endDate ? ` → ${formaterDate(s.endDate)}` : ''}
            </span>
            {s.location ? <span className="text-[13px] text-[#5E7A6E]">· {s.location}</span> : null}
          </div>
          <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-[#12312A]">
            {s.title || s.formation?.title || 'Session'}
          </p>
          <p className="mt-1 text-[14px] text-[#334A42]">
            {s._count?.inscriptions ?? 0} inscrit{(s._count?.inscriptions ?? 0) > 1 ? 's' : ''}
            {s.maxSeats ? ` sur ${s.maxSeats} places` : ''}
          </p>
        </div>
      </div>
      {manque.length ? (
        <p className="mt-3 rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-[14px] text-[#7C3E06]">
          Il manque {manque.join(' et ')} : une convention se défend mal sans.
        </p>
      ) : null}
    </li>
  );
}
