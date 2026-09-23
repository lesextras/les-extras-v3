'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import type { CoursResume } from '../_ecole/types';

interface Collection {
  id: string;
  titre: string;
  ordre: number;
}
interface Espace {
  id: string;
  titre: string;
  description: string | null;
  icone: string | null;
  collectionId: string | null;
  coursIds: string[];
  ecritureApprenants: boolean;
  ordre: number;
  publications: number;
}
export interface VueCommunaute {
  active: boolean;
  description: string | null;
  membres: number;
  collections: Collection[];
  espaces: Espace[];
}

const ESPACE_VIDE = { titre: '', description: '', icone: '💬', collectionId: '', coursIds: [] as string[], ecritureApprenants: true };

export function Communaute({ initiale, cours }: { initiale: VueCommunaute; cours: CoursResume[] }) {
  const [vue, setVue] = useState(initiale);
  const [description, setDescription] = useState(initiale.description ?? '');
  const [nouvelleCollection, setNouvelleCollection] = useState('');
  const [edite, setEdite] = useState<string | 'nouveau' | null>(null);
  const [f, setF] = useState(ESPACE_VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function recharger() {
    setVue(await appel<VueCommunaute>('/ecole/communaute'));
  }
  async function agir(fn: () => Promise<unknown>, ok?: string) {
    setOccupe(true);
    setErreur(null);
    setInfo(null);
    try {
      await fn();
      await recharger();
      if (ok) setInfo(ok);
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  function ouvrir(e?: Espace) {
    if (!e) {
      setF(ESPACE_VIDE);
      setEdite('nouveau');
      return;
    }
    setF({ titre: e.titre, description: e.description ?? '', icone: e.icone ?? '', collectionId: e.collectionId ?? '', coursIds: e.coursIds, ecritureApprenants: e.ecritureApprenants });
    setEdite(e.id);
  }

  const enregistrerEspace = (ev: FormEvent) => {
    ev.preventDefault();
    const corps = { titre: f.titre.trim(), description: f.description.trim(), icone: f.icone.trim(), collectionId: f.collectionId || null, coursIds: f.coursIds, ecritureApprenants: f.ecritureApprenants };
    void agir(async () => {
      if (edite === 'nouveau') await appel('/ecole/communaute/espaces', { methode: 'POST', corps });
      else await appel(`/ecole/communaute/espaces/${edite}`, { methode: 'PATCH', corps });
      setEdite(null);
    }, 'Espace enregistré.');
  };

  const groupes: { collection: Collection | null; espaces: Espace[] }[] = [
    ...vue.collections.map((c) => ({ collection: c, espaces: vue.espaces.filter((e) => e.collectionId === c.id) })),
    { collection: null, espaces: vue.espaces.filter((e) => !e.collectionId || !vue.collections.some((c) => c.id === e.collectionId)) },
  ];

  return (
    <div className="grid gap-6">
      <section className={`${CARTE} p-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <p className="text-[18px] font-extrabold text-[#12312A]">La communauté est {vue.active ? 'ouverte' : 'fermée'}</p>
            <p className="text-[15px] text-[#5E7A6E]">
              {vue.active
                ? `Tes apprenants la trouvent dans leur espace, onglet « Communauté ». ${vue.membres} compte${vue.membres > 1 ? 's' : ''} apprenant${vue.membres > 1 ? 's' : ''}.`
                : 'Rien n’apparaît côté apprenant tant qu’elle est fermée : prépare tes espaces, puis ouvre-la.'}
            </p>
          </div>
          <Pastille ton={vue.active ? 'ok' : 'neutre'}>{vue.active ? 'Ouverte' : 'Fermée'}</Pastille>
          <button type="button" disabled={occupe} onClick={() => agir(() => appel('/ecole/reglages-suite', { methode: 'PATCH', corps: { communauteActive: !vue.active } }))} className={vue.active ? BTN_SECONDAIRE : BTN_PRIMAIRE}>
            {vue.active ? 'Fermer' : 'Ouvrir la communauté'}
          </button>
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Le mot d&apos;accueil (affiché en tête de la communauté)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} className={`${CHAMP} min-h-[80px]`} placeholder="Bienvenue ! Ici on s'entraide entre apprenants…" />
        </label>
        <button type="button" disabled={occupe} onClick={() => agir(() => appel('/ecole/reglages-suite', { methode: 'PATCH', corps: { communauteDescription: description } }), 'Mot d’accueil enregistré.')} className={`${BTN_DISCRET} mt-2`}>
          Enregistrer le mot d&apos;accueil
        </button>
      </section>

      {erreur ? <Encart ton="alerte">{erreur}</Encart> : null}
      {info ? <Encart ton="ok">{info}</Encart> : null}

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-[19px] font-extrabold text-[#12312A]">Les espaces</h2>
          <button type="button" onClick={() => (edite ? setEdite(null) : ouvrir())} className={`${BTN_PRIMAIRE} ml-auto`}>
            {edite ? 'Fermer' : 'Créer un espace'}
          </button>
        </div>

        {edite ? (
          <form onSubmit={enregistrerEspace} className={`${CARTE} mb-5 grid gap-4 p-5 sm:grid-cols-[90px_1fr]`}>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Icône</span>
              <input value={f.icone} onChange={(e) => setF({ ...f, icone: e.target.value.slice(0, 8) })} className={`${CHAMP} text-center text-xl`} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Nom de l&apos;espace</span>
              <input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} className={CHAMP} maxLength={120} required placeholder="Questions sur le module 1" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Description</span>
              <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={CHAMP} maxLength={2000} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Collection</span>
              <select value={f.collectionId} onChange={(e) => setF({ ...f, collectionId: e.target.value })} className={CHAMP}>
                <option value="">Hors collection</option>
                {vue.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titre}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-[13px] font-bold text-[#12312A]">Réservé aux apprenants de (aucune case : ouvert à tous)</legend>
              <div className="flex flex-wrap gap-2">
                {cours.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-lg border border-[#CFE4D9] px-3 py-1.5 text-[14px]">
                    <input type="checkbox" checked={f.coursIds.includes(c.id)} onChange={() => setF({ ...f, coursIds: f.coursIds.includes(c.id) ? f.coursIds.filter((x) => x !== c.id) : [...f.coursIds, c.id] })} />
                    {c.titre}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-[15px] sm:col-span-2">
              <input type="checkbox" checked={f.ecritureApprenants} onChange={(e) => setF({ ...f, ecritureApprenants: e.target.checked })} />
              Les apprenants peuvent publier (sinon ils commentent et aiment seulement)
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={occupe} className={BTN_PRIMAIRE}>
                Enregistrer
              </button>
              {edite !== 'nouveau' ? (
                <button
                  type="button"
                  disabled={occupe}
                  onClick={() => {
                    if (window.confirm('Supprimer cet espace, ses publications et leurs commentaires ?')) void agir(async () => { await appel(`/ecole/communaute/espaces/${edite}`, { methode: 'DELETE' }); setEdite(null); }, 'Espace supprimé.');
                  }}
                  className={`${BTN_DISCRET} ml-auto text-[#8A1B3D]`}
                >
                  Supprimer l&apos;espace
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        {vue.espaces.length === 0 ? (
          <Encart ton="info">Aucun espace pour l&apos;instant. Commence par un espace « Présentez-vous » ouvert à tous : c&apos;est celui qui fait démarrer les échanges.</Encart>
        ) : (
          <div className="grid gap-5">
            {groupes
              .filter((g) => g.espaces.length || g.collection)
              .map((g) => (
                <div key={g.collection?.id ?? 'hors'}>
                  <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.1em] text-[#5E7A6E]">{g.collection?.titre ?? 'Hors collection'}</p>
                  {g.espaces.length ? (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {g.espaces.map((e) => (
                        <li key={e.id} className={`${CARTE} p-4`}>
                          <div className="flex items-start gap-3">
                            <span className="text-2xl" aria-hidden="true">{e.icone || '💬'}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-[#12312A]">{e.titre}</p>
                              <p className="text-[14px] text-[#5E7A6E]">
                                {e.publications} publication{e.publications > 1 ? 's' : ''} · {e.coursIds.length ? `${e.coursIds.length} formation${e.coursIds.length > 1 ? 's' : ''}` : 'tous les apprenants'}
                                {e.ecritureApprenants ? '' : ' · annonces'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link href={`/academie/communaute/${e.id}`} className={BTN_SECONDAIRE}>
                              Ouvrir le fil
                            </Link>
                            <button type="button" onClick={() => ouvrir(e)} className={BTN_DISCRET}>
                              Réglages
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[15px] text-[#5E7A6E]">Aucun espace dans cette collection.</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </section>

      <section className={`${CARTE} p-5`}>
        <h2 className="text-[17px] font-extrabold text-[#12312A]">Les collections</h2>
        <p className="text-[15px] text-[#5E7A6E]">Pour ranger les espaces par thème ou par formation. Supprimer une collection ne supprime pas ses espaces.</p>
        <ul className="mt-3 grid gap-2">
          {vue.collections.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span className="flex-1 font-bold text-[#12312A]">{c.titre}</span>
              <button
                type="button"
                onClick={() => {
                  const t = window.prompt('Nouveau nom de la collection', c.titre);
                  if (t && t.trim().length >= 2) void agir(() => appel(`/ecole/communaute/collections/${c.id}`, { methode: 'PATCH', corps: { titre: t.trim() } }));
                }}
                className={BTN_DISCRET}
              >
                Renommer
              </button>
              <button type="button" onClick={() => window.confirm('Supprimer cette collection ?') && void agir(() => appel(`/ecole/communaute/collections/${c.id}`, { methode: 'DELETE' }))} className={BTN_DISCRET}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nouvelleCollection.trim().length < 2) return;
            void agir(async () => {
              await appel('/ecole/communaute/collections', { methode: 'POST', corps: { titre: nouvelleCollection.trim(), ordre: vue.collections.length } });
              setNouvelleCollection('');
            });
          }}
          className="mt-3 flex gap-2"
        >
          <input value={nouvelleCollection} onChange={(e) => setNouvelleCollection(e.target.value)} maxLength={120} placeholder="Nom de la collection" className={CHAMP} />
          <button type="submit" disabled={occupe} className={BTN_SECONDAIRE}>
            Ajouter
          </button>
        </form>
      </section>
    </div>
  );
}
