'use client';

import { useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import { NOM_STATUT_COURS, euros, type CoursResume, type Pack } from '../_ecole/types';

/**
 * MES PACKS — plusieurs cours vendus ensemble.
 *
 * Le seul vrai réglage est la liste des cours inclus : tout le reste (titre,
 * prix, image) se change en deux clics. Un pack vide ne se publie pas, et
 * l'écran le dit avant qu'on s'en aperçoive sur la boutique.
 */

export function Packs({ initiaux, cours }: { initiaux: Pack[]; cours: CoursResume[] }) {
  const [packs, setPacks] = useState(initiaux);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [choisis, setChoisis] = useState<string[]>([]);

  function basculer(id: string) {
    setChoisis((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  async function creer(e: FormEvent) {
    e.preventDefault();
    if (titre.trim().length < 2) {
      setErreur('Donne un titre à ce pack.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const cree = await appel<Pack>('/ecole/packs', {
        methode: 'POST',
        corps: {
          titre: titre.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          prixCents: Math.round(Number(prix.replace(',', '.') || 0) * 100),
          coursIds: choisis,
        },
      });
      setPacks((l) => [cree, ...l]);
      setTitre('');
      setDescription('');
      setPrix('');
      setChoisis([]);
      setOuvert(false);
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setEnCours(false);
    }
  }

  async function publier(p: Pack) {
    setErreur(null);
    const vers = p.statut === 'PUBLIE' ? 'BROUILLON' : 'PUBLIE';
    if (vers === 'PUBLIE' && !p.coursIds.length) {
      setErreur('Ce pack ne contient aucun cours : ajoute-lui au moins un cours avant de le publier.');
      return;
    }
    try {
      const maj = await appel<Pack>(`/ecole/packs/${p.id}`, { methode: 'PATCH', corps: { statut: vers } });
      setPacks((l) => l.map((x) => (x.id === p.id ? maj : x)));
    } catch (err) {
      setErreur(messageDe(err));
    }
  }

  async function supprimer(id: string) {
    setErreur(null);
    try {
      await appel(`/ecole/packs/${id}`, { methode: 'DELETE' });
      setPacks((l) => l.filter((x) => x.id !== id));
    } catch (err) {
      setErreur(messageDe(err));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#12312A]">
          Tes packs <span className="text-[#5E7A6E]">({packs.length})</span>
        </h2>
        <button type="button" onClick={() => setOuvert((o) => !o)} className={`${BTN_PRIMAIRE} ml-auto`}>
          {ouvert ? 'Fermer' : 'Ajouter un pack'}
        </button>
      </div>

      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {ouvert ? (
        <form onSubmit={creer} className={`${CARTE} mb-6 p-5`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Titre du pack</span>
              <input value={titre} onChange={(e) => setTitre(e.target.value)} className={CHAMP} maxLength={200} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Prix de l&apos;ensemble</span>
              <input
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className={CHAMP}
                inputMode="decimal"
                placeholder="390"
              />
              <span className="mt-1 block text-[13px] text-[#5E7A6E]">En euros. Laisse vide pour un pack gratuit.</span>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${CHAMP} min-h-[110px]`}
              maxLength={4000}
              placeholder="Ce que la personne obtient, et pourquoi c'est cohérent ensemble."
            />
          </label>

          <fieldset className="mt-4">
            <legend className="mb-2 text-[13px] font-bold text-[#12312A]">Les cours inclus</legend>
            {cours.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {cours.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-[#DDEBE4] bg-white px-3.5 py-2.5 transition hover:border-[#1E9E6A]">
                      <input
                        type="checkbox"
                        checked={choisis.includes(c.id)}
                        onChange={() => basculer(c.id)}
                        className="h-4 w-4 accent-[#1E9E6A]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold text-[#12312A]">{c.titre}</span>
                        <span className="block text-[13px] text-[#5E7A6E]">
                          {c.gratuit ? 'Gratuit' : euros(c.prixCents)} · {c.nbLecons} leçons
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-[#5E7A6E]">
                Aucun cours à mettre dans un pack pour l&apos;instant. Crée d&apos;abord un cours en ligne.
              </p>
            )}
          </fieldset>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Création…' : 'Créer le pack'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className={BTN_DISCRET}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {packs.length ? (
        <ul className="grid gap-3">
          {packs.map((p) => (
            <li key={p.id} className={`${CARTE} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-[220px] flex-1">
                  <p className="text-[16px] font-extrabold text-[#12312A]">{p.titre}</p>
                  <p className="text-[14px] text-[#5E7A6E]">
                    {p.coursIds.length} cours inclus · {p.prixCents ? euros(p.prixCents) : 'Gratuit'}
                  </p>
                  {p.description ? (
                    <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">{p.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pastille ton={p.statut === 'PUBLIE' ? 'ok' : 'neutre'}>{NOM_STATUT_COURS[p.statut]}</Pastille>
                  {!p.coursIds.length ? <Pastille ton="attention">Pack vide</Pastille> : null}
                </div>
              </div>

              {p.coursIds.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {p.coursIds.map((id) => {
                    const c = cours.find((x) => x.id === id);
                    return (
                      <li key={id} className="rounded-full bg-[#E3F5EC] px-3 py-1 text-[13px] font-bold text-[#0F5F3E]">
                        {c ? c.titre : 'Cours retiré'}
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#EDF4F1] pt-3">
                <button type="button" onClick={() => publier(p)} className={BTN_DISCRET}>
                  {p.statut === 'PUBLIE' ? 'Remettre en brouillon' : 'Publier'}
                </button>
                <button type="button" onClick={() => supprimer(p.id)} className={`${BTN_DISCRET} ml-auto`}>
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Encart ton="info">
          Tu n&apos;as pas encore de pack. Un pack sert quand deux ou trois cours se suivent naturellement : on les
          vend ensemble, à un prix qui donne envie de tout prendre.
        </Encart>
      )}
    </>
  );
}
