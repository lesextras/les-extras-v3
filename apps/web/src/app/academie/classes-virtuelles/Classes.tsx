'use client';

import { useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart, Pastille, formaterDate } from '../_ui';
import type { Classe, CoursResume } from '../_ecole/types';

/**
 * MES CLASSES VIRTUELLES.
 *
 * Trois choses suffisent : quand, où (le lien), et à quel cours ça se rattache.
 * Une classe sans lien est signalée : c'est l'oubli qui coûte le plus cher,
 * parce qu'on s'en aperçoit cinq minutes avant.
 */

function heureDe(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function Classes({ initiales, cours }: { initiales: Classe[]; cours: CoursResume[] }) {
  const [classes, setClasses] = useState(initiales);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [lien, setLien] = useState('');
  const [placesMax, setPlacesMax] = useState('');
  const [coursId, setCoursId] = useState('');

  const maintenant = Date.now();
  const aVenir = classes
    .filter((c) => new Date(c.debut).getTime() >= maintenant)
    .sort((a, b) => +new Date(a.debut) - +new Date(b.debut));
  const passees = classes
    .filter((c) => new Date(c.debut).getTime() < maintenant)
    .sort((a, b) => +new Date(b.debut) - +new Date(a.debut));

  async function creer(e: FormEvent) {
    e.preventDefault();
    if (titre.trim().length < 2) {
      setErreur('Donne un titre à cette classe.');
      return;
    }
    if (!debut) {
      setErreur('Indique la date et l’heure de début.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const creee = await appel<Classe>('/ecole/classes', {
        methode: 'POST',
        corps: {
          titre: titre.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          debut: new Date(debut).toISOString(),
          ...(fin ? { fin: new Date(fin).toISOString() } : {}),
          ...(lien.trim() ? { lien: lien.trim() } : {}),
          ...(placesMax ? { placesMax: Number(placesMax) } : {}),
          ...(coursId ? { coursId } : {}),
        },
      });
      setClasses((l) => [creee, ...l]);
      setTitre('');
      setDescription('');
      setDebut('');
      setFin('');
      setLien('');
      setPlacesMax('');
      setCoursId('');
      setOuvert(false);
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(id: string) {
    setErreur(null);
    try {
      await appel(`/ecole/classes/${id}`, { methode: 'DELETE' });
      setClasses((l) => l.filter((x) => x.id !== id));
    } catch (err) {
      setErreur(messageDe(err));
    }
  }

  function Carte({ c, future }: { c: Classe; future: boolean }) {
    return (
      <li className={`${CARTE} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[220px] flex-1">
            <p className="text-[16px] font-extrabold text-[#12312A]">{c.titre}</p>
            <p className="text-[14px] text-[#5E7A6E]">
              {formaterDate(c.debut)} à {heureDe(c.debut)}
              {c.fin ? ` — ${heureDe(c.fin)}` : ''}
              {c.cours?.titre ? ` · ${c.cours.titre}` : ''}
            </p>
            {c.description ? (
              <p className="mt-1 text-[15px] leading-relaxed text-[#334A42]">{c.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {c.placesMax ? <Pastille ton="neutre">{c.placesMax} places</Pastille> : null}
            {c.lien ? null : <Pastille ton="attention">Lien manquant</Pastille>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#EDF4F1] pt-3">
          {c.lien ? (
            <a href={c.lien} target="_blank" rel="noreferrer" className={future ? BTN_PRIMAIRE : BTN_DISCRET}>
              {future ? 'Rejoindre la classe' : 'Ouvrir le lien'}
            </a>
          ) : (
            <span className="text-[14px] text-[#8A1B3D]">
              Ajoute le lien de visio : sans lui, personne ne peut entrer.
            </span>
          )}
          <button type="button" onClick={() => supprimer(c.id)} className={`${BTN_DISCRET} ml-auto`}>
            Supprimer
          </button>
        </div>
      </li>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#12312A]">
          À venir <span className="text-[#5E7A6E]">({aVenir.length})</span>
        </h2>
        <button type="button" onClick={() => setOuvert((o) => !o)} className={`${BTN_PRIMAIRE} ml-auto`}>
          {ouvert ? 'Fermer' : 'Programmer une classe'}
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
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Titre</span>
              <input value={titre} onChange={(e) => setTitre(e.target.value)} className={CHAMP} maxLength={200} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Début</span>
              <input type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} className={CHAMP} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Fin</span>
              <input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} className={CHAMP} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Lien de la visio</span>
              <input
                value={lien}
                onChange={(e) => setLien(e.target.value)}
                className={CHAMP}
                maxLength={600}
                placeholder="https://meet.jit.si/…"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Cours rattaché</span>
              <select value={coursId} onChange={(e) => setCoursId(e.target.value)} className={CHAMP}>
                <option value="">Aucun</option>
                {cours.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Places</span>
              <input
                value={placesMax}
                onChange={(e) => setPlacesMax(e.target.value.replace(/\D/g, ''))}
                className={CHAMP}
                inputMode="numeric"
                placeholder="illimité"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${CHAMP} min-h-[100px]`}
                maxLength={4000}
                placeholder="Ce qu'on y fait, ce qu'il faut avoir préparé."
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Création…' : 'Programmer'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className={BTN_DISCRET}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {aVenir.length ? (
        <ul className="grid gap-3">
          {aVenir.map((c) => (
            <Carte key={c.id} c={c} future />
          ))}
        </ul>
      ) : (
        <Encart ton="info">
          Aucune classe programmée. Une classe virtuelle sert à ce que le e-learning ne fait pas : répondre aux
          questions, corriger un exercice ensemble, remettre le groupe en mouvement.
        </Encart>
      )}

      {passees.length ? (
        <>
          <h2 className="mb-3 mt-9 text-[19px] font-extrabold text-[#12312A]">
            Déjà passées <span className="text-[#5E7A6E]">({passees.length})</span>
          </h2>
          <ul className="grid gap-3">
            {passees.slice(0, 12).map((c) => (
              <Carte key={c.id} c={c} future={false} />
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
