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
      const fichier = fichierRef.current?.files?.[0];
      if (fichier) {
        const form = new FormData();
        form.append('file', fichier);
        if (dateEmission) form.append('dateEmission', dateEmission);
        if (dateExpiration) form.append('dateExpiration', dateExpiration);
        if (exercice) form.append('exercice', exercice);
        if (note) form.append('note', note);
        await appel(`/association/classeur/${type.code}`, { method: 'POST', form });
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
    if (!window.confirm('Retirer ce fichier du classeur ? Vous pourrez en déposer un autre.')) return;
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
    'rounded-md border border-[#C9C3B5] bg-white px-3 py-2 text-sm focus:border-[#1F6A4E] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]';

  return (
    <li className="rounded-md border border-[#DDD8CC] bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pastille ton={ton}>{LIBELLES_SITUATION[situation]}</Pastille>
            <span className="font-semibold">{type.libelle}</span>
            {type.dureeValiditeMois ? <span className="text-xs text-[#5C6B63]">valable {type.dureeValiditeMois} mois</span> : null}
            {type.parExercice ? <span className="text-xs text-[#5C6B63]">chaque année</span> : null}
          </div>
          <p className="mt-1 text-sm text-[#3E4A44]">{type.pourquoi}</p>
          {piece?.preuve && situation === 'DEDUITE' ? <p className="mt-1 text-sm text-[#5C6B63]">Prouvée par : {piece.preuve}</p> : null}
          {piece?.fileId ? (
            <p className="mt-1 text-sm text-[#5C6B63]">
              <a href={`/api/proxy/files/${piece.fileId}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                Voir le fichier
              </a>
              {piece.dateExpiration ? ` · expire le ${dateCourte(piece.dateExpiration)}` : ''}
              {piece.exercice ? ` · exercice ${piece.exercice}` : ''}
            </p>
          ) : null}
          {situation === 'MANQUANTE' ? (
            <p className="mt-1 text-sm">
              <span className="text-[#5C6B63]">Où la trouver : </span>
              {type.ouLaTrouver}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          {situation !== 'DEDUITE' || piece?.fileId ? (
            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              className="rounded-md border border-[#1F6A4E] px-3 py-1.5 text-sm font-medium text-[#1F6A4E] hover:bg-[#E4EFE8]"
            >
              {piece?.fileId ? 'Remplacer ou corriger' : 'Déposer'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              className="rounded-md border border-[#DDD8CC] px-3 py-1.5 text-sm text-[#5C6B63] hover:bg-[#F6F4EE]"
            >
              Ajouter le document quand même
            </button>
          )}
        </div>
      </div>

      {ouvert ? (
        <form onSubmit={enregistrer} className="mt-4 grid gap-3 border-t border-[#EEEAE0] pt-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Fichier (PDF, JPEG, PNG ou WEBP)</span>
            <input ref={fichierRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Date du document</span>
            <input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} className={champ} />
          </label>
          {type.dureeValiditeMois || type.code === 'AGREMENT' ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Date d&apos;expiration</span>
              <input type="date" value={dateExpiration} onChange={(e) => setDateExpiration(e.target.value)} className={champ} />
              <span className="text-xs text-[#5C6B63]">Laissez vide : elle sera calculée depuis la date du document.</span>
            </label>
          ) : null}
          {type.parExercice ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Exercice (année)</span>
              <input type="number" min={2000} max={2100} value={exercice} onChange={(e) => setExercice(e.target.value)} className={champ} />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Note (facultatif)</span>
            <input type="text" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={champ} />
          </label>
          {erreur ? <p className="text-sm text-[#7A4A0E] sm:col-span-2">{erreur}</p> : null}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" disabled={enCours} className="rounded-md bg-[#1F6A4E] px-4 py-2 text-sm font-medium text-white hover:bg-[#185540] disabled:opacity-60">
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className="rounded-md px-4 py-2 text-sm text-[#5C6B63] hover:bg-[#F6F4EE]">
              Annuler
            </button>
            {piece?.fileId ? (
              <button type="button" onClick={retirer} disabled={enCours} className="ml-auto rounded-md px-4 py-2 text-sm text-[#7A4A0E] hover:bg-[#F7EBD6]">
                Retirer le fichier
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </li>
  );
}
