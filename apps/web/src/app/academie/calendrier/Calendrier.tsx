'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { appel, messageDe } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import type { Evenement } from '../_ecole/suite-types';
import type { CoursResume } from '../_ecole/types';

function quand(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}
function versChamp(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const VIDE = { titre: '', description: '', debut: '', fin: '', lieu: '', lien: '', coursIds: [] as string[] };

export function Calendrier({ initiaux, visible: visibleInitial, cours }: { initiaux: Evenement[]; visible: boolean; cours: CoursResume[] }) {
  const [evenements, setEvenements] = useState(initiaux);
  const [visible, setVisible] = useState(visibleInitial);
  const [edite, setEdite] = useState<string | 'nouveau' | null>(null);
  const [f, setF] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const trie = [...evenements].sort((a, b) => +new Date(a.debut) - +new Date(b.debut));
  const maintenant = Date.now();
  const aVenir = trie.filter((e) => new Date(e.fin ?? e.debut).getTime() >= maintenant);
  const passes = trie.filter((e) => new Date(e.fin ?? e.debut).getTime() < maintenant).reverse();

  function ouvrir(e?: Evenement) {
    setErreur(null);
    if (!e) {
      setF(VIDE);
      setEdite('nouveau');
      return;
    }
    setF({ titre: e.titre, description: e.description ?? '', debut: versChamp(e.debut), fin: versChamp(e.fin), lieu: e.lieu ?? '', lien: e.lien ?? '', coursIds: e.coursIds });
    setEdite(e.id);
  }

  async function enregistrer(ev: FormEvent) {
    ev.preventDefault();
    if (!f.debut) return setErreur('Indique la date et l’heure de début.');
    setOccupe(true);
    setErreur(null);
    try {
      const corps = {
        titre: f.titre.trim(),
        description: f.description.trim(),
        debut: new Date(f.debut).toISOString(),
        fin: f.fin ? new Date(f.fin).toISOString() : null,
        lieu: f.lieu.trim(),
        lien: f.lien.trim(),
        coursIds: f.coursIds,
      };
      if (edite === 'nouveau') {
        const e = await appel<Evenement>('/ecole/evenements', { methode: 'POST', corps });
        setEvenements((l) => [...l, e]);
      } else if (edite) {
        const e = await appel<Evenement>(`/ecole/evenements/${edite}`, { methode: 'PATCH', corps });
        setEvenements((l) => l.map((x) => (x.id === e.id ? e : x)));
      }
      setEdite(null);
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  async function supprimer(id: string) {
    if (!window.confirm('Supprimer cet événement ?')) return;
    try {
      await appel(`/ecole/evenements/${id}`, { methode: 'DELETE' });
      setEvenements((l) => l.filter((x) => x.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  async function basculerVisible() {
    try {
      await appel('/ecole/reglages-suite', { methode: 'PATCH', corps: { calendrierVisible: !visible } });
      setVisible(!visible);
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  const ligne = (e: Evenement) => (
    <li key={e.id} className={`${CARTE} flex flex-wrap items-start gap-3 p-4`}>
      <div className="min-w-[220px] flex-1">
        <p className="text-[16px] font-extrabold text-[#12312A]">{e.titre}</p>
        <p className="text-[14px] text-[#5E7A6E] first-letter:uppercase">{quand(e.debut)}</p>
        {e.lieu ? <p className="text-[14px] text-[#5E7A6E]">{e.lieu}</p> : null}
        {e.coursIds.length ? (
          <p className="text-[13px] text-[#5E7A6E]">Pour : {e.coursIds.map((id) => cours.find((c) => c.id === id)?.titre ?? '').filter(Boolean).join(', ')}</p>
        ) : (
          <p className="text-[13px] text-[#5E7A6E]">Pour tous les apprenants</p>
        )}
      </div>
      <button type="button" onClick={() => ouvrir(e)} className={BTN_DISCRET}>
        Modifier
      </button>
      <button type="button" onClick={() => supprimer(e.id)} className={BTN_DISCRET}>
        Supprimer
      </button>
    </li>
  );

  return (
    <>
      <div className={`${CARTE} mb-6 flex flex-wrap items-center gap-3 p-5`}>
        <div className="min-w-[240px] flex-1">
          <p className="font-extrabold text-[#12312A]">Calendrier dans l&apos;espace apprenant</p>
          <p className="text-[15px] text-[#5E7A6E]">
            {visible ? 'Affiché : tes apprenants voient l’onglet « Calendrier ».' : 'Masqué : l’onglet n’apparaît pas dans leur espace.'}
          </p>
        </div>
        <Pastille ton={visible ? 'ok' : 'neutre'}>{visible ? 'Visible' : 'Masqué'}</Pastille>
        <button type="button" onClick={basculerVisible} className={BTN_SECONDAIRE}>
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#12312A]">
          Événements à venir <span className="text-[#5E7A6E]">({aVenir.length})</span>
        </h2>
        <Link href="/academie/classes-virtuelles" className={BTN_DISCRET}>
          Classes virtuelles
        </Link>
        <button type="button" onClick={() => (edite ? setEdite(null) : ouvrir())} className={`${BTN_PRIMAIRE} ml-auto`}>
          {edite ? 'Fermer' : 'Ajouter un événement'}
        </button>
      </div>

      {erreur ? (
        <div className="mb-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {edite ? (
        <form onSubmit={enregistrer} className={`${CARTE} mb-6 grid gap-4 p-5 sm:grid-cols-2`}>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Titre</span>
            <input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} className={CHAMP} maxLength={200} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Début</span>
            <input type="datetime-local" value={f.debut} onChange={(e) => setF({ ...f, debut: e.target.value })} className={CHAMP} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Fin</span>
            <input type="datetime-local" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} className={CHAMP} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Lieu</span>
            <input value={f.lieu} onChange={(e) => setF({ ...f, lieu: e.target.value })} className={CHAMP} maxLength={300} placeholder="Salle, adresse…" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Lien</span>
            <input value={f.lien} onChange={(e) => setF({ ...f, lien: e.target.value })} className={CHAMP} maxLength={500} placeholder="https://…" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Description</span>
            <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={`${CHAMP} min-h-[90px]`} maxLength={4000} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-[13px] font-bold text-[#12312A]">Visible par (aucune case : tous les apprenants)</legend>
            <div className="flex flex-wrap gap-2">
              {cours.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded-lg border border-[#CFE4D9] px-3 py-1.5 text-[14px]">
                  <input
                    type="checkbox"
                    checked={f.coursIds.includes(c.id)}
                    onChange={() => setF({ ...f, coursIds: f.coursIds.includes(c.id) ? f.coursIds.filter((x) => x !== c.id) : [...f.coursIds, c.id] })}
                  />
                  {c.titre}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={occupe} className={BTN_PRIMAIRE}>
              {occupe ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setEdite(null)} className={BTN_DISCRET}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {aVenir.length ? <ul className="grid gap-3">{aVenir.map(ligne)}</ul> : <Encart ton="info">Aucun événement à venir. Un webinaire, une permanence, une date d&apos;examen : tout ce que tes apprenants doivent avoir en tête.</Encart>}

      {passes.length ? (
        <>
          <h2 className="mb-3 mt-9 text-[19px] font-extrabold text-[#12312A]">Passés</h2>
          <ul className="grid gap-3">{passes.slice(0, 20).map(ligne)}</ul>
        </>
      ) : null}
    </>
  );
}
