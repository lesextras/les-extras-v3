'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { Pastille } from '../../_ui';
import { LIBELLES_SITUATION, dateCourte, pourInput, type LigneClasseur } from '../_types';

/**
 * Une pièce du classeur : son état, et tout ce qu'on peut en faire — déposer
 * un fichier, corriger ses dates, la retirer. Les champs vides ne sont pas
 * envoyés : l'API refuse ce qu'elle ne connaît pas, et une date vide n'est
 * pas une date.
 */
export function PieceDuClasseur({ ligne }: { ligne: LigneClasseur }) {
  const router = useRouter();
  const { type, piece, situation } = ligne;
  const [ouvert, setOuvert] = useState(false);
  const [dateEmission, setDateEmission] = useState(pourInput(piece?.dateEmission));
  const [dateExpiration, setDateExpiration] = useState(pourInput(piece?.dateExpiration));
  const [exercice, setExercice] = useState(piece?.exercice ? String(piece.exercice) : '');
  const [note, setNote] = useState(piece?.note ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);

  const ton = situation === 'A_JOUR' || situation === 'DEDUITE' ? 'ok' : situation === 'MANQUANTE' ? 'neutre' : 'attention';

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const fichiers = Array.from(fichierRef.current?.files ?? []);
      if (fichiers.length) {
        // Le premier fichier est la pièce ; les suivants sont rangés à côté, dans « Mes documents ».
        const form = new FormData();
        form.append('file', fichiers[0]);
        if (dateEmission) form.append('dateEmission', dateEmission);
        if (dateExpiration) form.append('dateExpiration', dateExpiration);
        if (exercice) form.append('exercice', exercice);
        if (note) form.append('note', note);
        await appel(`/association/classeur/${type.code}`, { method: 'POST', form });
        for (const f of fichiers.slice(1)) {
          const autre = new FormData();
          autre.append('file', f);
          autre.append('titre', f.name);
          autre.append('categorie', 'Autre');
          await appel('/association/documents', { method: 'POST', form: autre });
        }
      } else {
        await appel(`/association/classeur/${type.code}`, {
          method: 'PATCH',
          body: {
            dateEmission: dateEmission || null,
            dateExpiration: dateExpiration || null,
            exercice: exercice ? Number(exercice) : null,
            note: note || null,
          },
        });
      }
      setOuvert(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  async function retirer() {
    if (!window.confirm('Retirer ce fichier du classeur ? Tu pourras en déposer un autre.')) return;
    setEnCours(true);
    try {
      await appel(`/association/classeur/${type.code}/fichier`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le retrait a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  const champ =
    'rounded-xl border border-[#D9D6EE] bg-white px-3 py-2 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#ECEBFC]';

  return (
    <li id={type.code} className="scroll-mt-24 rounded-2xl border border-[#E6E4F3] bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pastille ton={ton}>{LIBELLES_SITUATION[situation]}</Pastille>
            <span className="font-extrabold text-[#1D1B5C]">{type.libelle}</span>
            {type.dureeValiditeMois ? <span className="text-xs text-[#6B6A8A]">valable {type.dureeValiditeMois} mois</span> : null}
            {type.parExercice ? <span className="text-xs text-[#6B6A8A]">chaque année</span> : null}
          </div>
          <p className="mt-1 text-sm text-[#3B3A66]">{type.pourquoi}</p>
          {piece?.preuve && situation === 'DEDUITE' ? <p className="mt-1 text-sm text-[#6B6A8A]">Prouvée par : {piece.preuve}</p> : null}
          {piece?.fileId ? (
            <p className="mt-1 text-sm text-[#6B6A8A]">
              <a href={`/api/proxy/files/${piece.fileId}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                Voir le fichier
              </a>
              {piece.dateExpiration ? ` · expire le ${dateCourte(piece.dateExpiration)}` : ''}
              {piece.exercice ? ` · exercice ${piece.exercice}` : ''}
            </p>
          ) : null}
          {situation === 'MANQUANTE' ? (
            <p className="mt-1 text-sm">
              <span className="text-[#6B6A8A]">Où la trouver : </span>
              {type.ouLaTrouver}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          {situation !== 'DEDUITE' || piece?.fileId ? (
            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              className="rounded-xl border border-[#4F46E5] px-3 py-1.5 text-sm font-bold text-[#4F46E5] hover:bg-[#ECEBFC]"
            >
              {piece?.fileId ? 'Remplacer ou corriger' : 'Déposer des fichiers'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              className="rounded-xl border border-[#E6E4F3] px-3 py-1.5 text-sm text-[#6B6A8A] hover:bg-[#F5F4FC]"
            >
              Ajouter le document quand même
            </button>
          )}
        </div>
      </div>

      {ouvert ? (
        <form onSubmit={enregistrer} className="mt-4 grid gap-3 border-t border-[#E6E4F3] pt-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-bold">Fichiers (PDF, JPEG, PNG ou WEBP)</span>
            <input ref={fichierRef} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm" />
            <span className="text-xs text-[#6B6A8A]">
              Tu peux en déposer plusieurs : le premier prend la place du papier, les autres sont rangés dans « Mes documents ».
            </span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-bold">Date du document</span>
            <input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} className={champ} />
          </label>
          {type.dureeValiditeMois || type.code === 'AGREMENT' ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-bold">Date d&apos;expiration</span>
              <input type="date" value={dateExpiration} onChange={(e) => setDateExpiration(e.target.value)} className={champ} />
              <span className="text-xs text-[#6B6A8A]">Laisse vide : elle sera calculée depuis la date du document.</span>
            </label>
          ) : null}
          {type.parExercice ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-bold">Exercice (année)</span>
              <input type="number" min={2000} max={2100} value={exercice} onChange={(e) => setExercice(e.target.value)} className={champ} />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-bold">Note (facultatif)</span>
            <input type="text" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={champ} />
          </label>
          {erreur ? <p className="text-sm text-[#7C3E06] sm:col-span-2">{erreur}</p> : null}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" disabled={enCours} className="rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className="rounded-xl px-4 py-2 text-sm text-[#6B6A8A] hover:bg-[#F5F4FC]">
              Annuler
            </button>
            {piece?.fileId ? (
              <button type="button" onClick={retirer} disabled={enCours} className="ml-auto rounded-xl px-4 py-2 text-sm text-[#7C3E06] hover:bg-[#FEF3E2]">
                Retirer le fichier
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </li>
  );
}
