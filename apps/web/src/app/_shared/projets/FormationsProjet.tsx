'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionAssociation, FormationProjet } from '../../association/espace/_types';
import { useProjets } from './contexte';
import { Icone } from './_taches';

/**
 * LES FORMATIONS D'UN PROJET : celles de l'académie (ou des académies
 * reliées) qui servent ce projet. Le lien est le même vu des deux espaces.
 */
export function FormationsProjet({ projet }: { projet: ActionAssociation }) {
  const router = useRouter();
  const { appel, chemins, formations: catalogue, lienFormation, aideSansFormations } = useProjets();
  const [liees, setLiees] = useState<FormationProjet[]>(projet.formations ?? []);
  const [choix, setChoix] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /* Les données du serveur font foi dès qu'elles changent (après router.refresh). */
  const signature = JSON.stringify(projet.formations ?? []);
  const [vue, setVue] = useState(signature);
  if (vue !== signature) {
    setVue(signature);
    setLiees(projet.formations ?? []);
  }

  const libres = (catalogue ?? []).filter((c) => !liees.some((l) => l.id === c.id));
  const plusieursAcademies = new Set((catalogue ?? []).map((c) => c.academieId)).size > 1;

  async function lier() {
    const f = libres.find((c) => c.id === choix);
    if (!f) return;
    setErreur(null);
    setEnCours(true);
    try {
      await appel(`${chemins.projets}/${projet.id}/formations`, { method: 'POST', body: { coursId: f.id } });
      setLiees((l) => [...l, f]);
      setChoix('');
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La formation n'a pas pu être reliée.");
    } finally {
      setEnCours(false);
    }
  }

  async function delier(f: FormationProjet) {
    setErreur(null);
    const avant = liees;
    setLiees((l) => l.filter((x) => x.id !== f.id));
    try {
      await appel(`${chemins.projets}/${projet.id}/formations/${f.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      setLiees(avant);
      setErreur(err instanceof Error ? err.message : "La formation n'a pas pu être retirée.");
    }
  }

  if (!catalogue?.length && !liees.length) {
    return <div className="text-sm text-[var(--pj-gris,#6B6A8A)]">{aideSansFormations ?? 'Aucune formation pour le moment.'}</div>;
  }

  return (
    <div className="space-y-3">
      {liees.length ? (
        <ul className="flex flex-wrap gap-2">
          {liees.map((f) => {
            const href = lienFormation?.(f) ?? null;
            return (
              <li key={f.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#E3F5EC] py-1 pl-3 pr-1 text-sm font-bold text-[#0F5F3E]">
                <Icone nom="toque" className="h-3.5 w-3.5 shrink-0" />
                {href ? (
                  <Link href={href} className="truncate underline-offset-2 hover:underline">
                    {f.titre}
                  </Link>
                ) : (
                  <span className="truncate">{f.titre}</span>
                )}
                {plusieursAcademies ? <span className="shrink-0 font-normal opacity-70">· {f.academieNom}</span> : null}
                <button type="button" onClick={() => void delier(f)} aria-label={`Retirer ${f.titre}`} className="rounded-full p-1 hover:bg-white/70">
                  <Icone nom="croix" className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-[var(--pj-gris,#6B6A8A)]">Aucune formation reliée.</p>
      )}

      {libres.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={choix}
            onChange={(e) => setChoix(e.target.value)}
            aria-label="Formation à relier"
            className="min-w-0 flex-1 rounded-xl border border-[var(--pj-bord-champ,#D9D6EE)] bg-white px-3 py-2 text-sm text-[var(--pj-encre,#1D1B5C)] focus:border-[var(--pj-accent,#4F46E5)] focus:outline-none"
          >
            <option value="">Relier une formation…</option>
            {libres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titre}
                {plusieursAcademies ? ` · ${c.academieNom}` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void lier()}
            disabled={!choix || enCours}
            className="inline-flex items-center gap-1 rounded-xl bg-[var(--pj-accent,#4F46E5)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--pj-accent-fonce,#4338CA)] disabled:opacity-50"
          >
            <Icone nom="plus" /> Relier
          </button>
        </div>
      ) : null}

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-sm text-[#7C3E06]">{erreur}</p> : null}
    </div>
  );
}
