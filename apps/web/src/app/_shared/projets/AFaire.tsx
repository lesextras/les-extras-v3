'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjets } from './contexte';
import type { ActionAssociation, MembreEquipe, TacheProjet } from '../../association/espace/_types';
import { Avatar, CARTE, Echeance, Icone, STATUT, enRetard, nomResponsable } from './_taches';
import { FormTache } from './FormTache';

type Filtre = 'TOUTES' | 'MIENNES' | 'RETARD';

const PLIE = 6;

/**
 * « À FAIRE » : toutes les tâches ouvertes de tous les projets, de la plus
 * proche (ou dépassée) à la plus lointaine ; les tâches sans date à la fin.
 * L'ordre vient de l'API.
 */
export function AFaire({ taches, equipe, projets }: { taches: TacheProjet[]; equipe: MembreEquipe[]; projets: ActionAssociation[] }) {
  const router = useRouter();
  const { appel, chemins } = useProjets();
  const [filtre, setFiltre] = useState<Filtre>('TOUTES');
  const [cochees, setCochees] = useState<Set<string>>(new Set());
  const [ouverte, setOuverte] = useState<TacheProjet | 'nouvelle' | null>(null);
  const [tout, setTout] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const ouvertes = taches.filter((t) => t.statut !== 'FAITE');
  const miennes = ouvertes.filter((t) => t.aMoi);
  const retard = ouvertes.filter((t) => enRetard(t));
  const liste = filtre === 'MIENNES' ? miennes : filtre === 'RETARD' ? retard : ouvertes;
  const visibles = tout ? liste : liste.slice(0, PLIE);

  async function cocher(t: TacheProjet) {
    setErreur(null);
    setCochees((x) => new Set(x).add(t.id));
    try {
      await appel(`${chemins.taches}/${t.id}`, { method: 'PATCH', body: { statut: 'FAITE' } });
      router.refresh();
    } catch (err) {
      setCochees((x) => {
        const suite = new Set(x);
        suite.delete(t.id);
        return suite;
      });
      setErreur(err instanceof Error ? err.message : "La tâche n'a pas pu être cochée.");
    }
  }

  const filtres: { code: Filtre; libelle: string; nombre: number }[] = [
    { code: 'TOUTES', libelle: 'Toutes', nombre: ouvertes.length },
    { code: 'MIENNES', libelle: 'Les miennes', nombre: miennes.length },
    { code: 'RETARD', libelle: 'En retard', nombre: retard.length },
  ];

  return (
    <section className={`${CARTE} mb-6 p-4 sm:p-5`} aria-labelledby="a-faire">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="a-faire" className="mr-2 flex items-center gap-2 text-lg font-extrabold text-[var(--pj-encre,#1D1B5C)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--pj-teinte,#ECEBFC)] text-[var(--pj-accent,#4F46E5)]">
            <Icone nom="coche" />
          </span>
          À faire
        </h2>
        {filtres.map((f) => (
          <button
            key={f.code}
            type="button"
            onClick={() => setFiltre(f.code)}
            aria-pressed={filtre === f.code}
            className={`rounded-full px-3 py-1.5 text-sm font-bold ${
              filtre === f.code ? (f.code === 'RETARD' ? 'bg-[#8A1B3D] text-white' : 'bg-[var(--pj-encre,#1D1B5C)] text-white') : 'bg-[var(--pj-fond-doux,#F5F4FC)] text-[var(--pj-texte,#3B3A66)] hover:bg-[var(--pj-teinte,#ECEBFC)]'
            }`}
          >
            {f.libelle}{' '}
            <span className={filtre === f.code ? 'opacity-70' : f.code === 'RETARD' && f.nombre ? 'text-[#D6335C]' : 'text-[var(--pj-gris-clair,#9A99B5)]'}>{f.nombre}</span>
          </button>
        ))}
        {projets.length ? (
          <button
            type="button"
            onClick={() => setOuverte('nouvelle')}
            className="ml-auto inline-flex items-center gap-1 rounded-xl border border-[var(--pj-bord-champ,#D9D6EE)] px-3 py-1.5 text-sm font-bold text-[var(--pj-accent,#4F46E5)] hover:border-[var(--pj-accent,#4F46E5)] hover:bg-[var(--pj-teinte,#ECEBFC)]"
          >
            <Icone nom="plus" /> Tâche
          </button>
        ) : null}
      </div>

      {erreur ? <p className="mt-3 rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-sm text-[#7C3E06]">{erreur}</p> : null}
      {ouverte === 'nouvelle' ? (
        <div className="mt-3">
          <FormTache tache={null} actionId={projets[0].id} equipe={equipe} projets={projets} onFermer={() => setOuverte(null)} />
        </div>
      ) : null}

      {liste.length === 0 ? (
        <p className="mt-4 rounded-xl bg-[var(--pj-fond-doux,#F5F4FC)] px-4 py-5 text-center text-sm text-[var(--pj-gris,#6B6A8A)]">
          {filtre === 'RETARD' ? 'Rien en retard.' : filtre === 'MIENNES' ? 'Rien pour toi.' : projets.length ? 'Rien à faire. Ouvre un projet pour ajouter des tâches.' : 'Ajoute un projet, puis ses tâches.'}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--pj-fond,#F0EFF7)]">
          {visibles.map((t) => {
            if (ouverte && ouverte !== 'nouvelle' && ouverte.id === t.id) {
              return (
                <li key={t.id} className="py-2">
                  <FormTache tache={t} actionId={t.actionId} equipe={equipe} projets={projets} onFermer={() => setOuverte(null)} />
                </li>
              );
            }
            const faite = cochees.has(t.id);
            const r = nomResponsable(t, equipe);
            return (
              <li key={t.id} className={`flex items-center gap-3 py-2.5 ${faite ? 'opacity-50' : ''}`}>
                <button
                  type="button"
                  onClick={() => void cocher(t)}
                  disabled={faite}
                  aria-label={`Marquer « ${t.titre} » comme faite`}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                    faite ? 'border-[#1E9E6A] bg-[#1E9E6A] text-white' : 'border-[var(--pj-bord-vif,#C7C4F2)] text-transparent hover:border-[#1E9E6A] hover:text-[#1E9E6A]'
                  }`}
                >
                  <Icone nom="coche" className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setOuverte(t)} className="flex min-w-0 flex-1 flex-col gap-1 text-left sm:flex-row sm:items-center sm:gap-3">
                  <span className={`flex min-w-0 items-center gap-1.5 font-bold text-[var(--pj-encre,#1D1B5C)] ${faite ? 'line-through' : ''}`}>
                    {t.priorite === 'HAUTE' ? <Icone nom="drapeau" className="h-3.5 w-3.5 shrink-0 text-[#D6335C]" /> : null}
                    {t.statut === 'BLOQUEE' ? <Icone nom="alerte" className="h-3.5 w-3.5 shrink-0 text-[#8A1B3D]" /> : null}
                    <span className="truncate">{t.titre}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2 sm:ml-auto">
                    <span className="max-w-[12rem] truncate rounded-full bg-[var(--pj-teinte,#ECEBFC)] px-2 py-0.5 text-xs font-bold text-[var(--pj-accent-fonce,#4338CA)]" title={t.projet.intitule}>
                      {t.projet.intitule}
                    </span>
                    {t.statut !== 'A_FAIRE' ? (
                      <span className="hidden rounded-full px-2 py-0.5 text-xs font-bold sm:inline" style={{ background: STATUT[t.statut].fond, color: STATUT[t.statut].texte }}>
                        {STATUT[t.statut].libelle}
                      </span>
                    ) : null}
                    <Echeance tache={t} />
                  </span>
                </button>
                <Avatar nom={r.nom} moi={r.moi} />
              </li>
            );
          })}
        </ul>
      )}

      {liste.length > PLIE ? (
        <button type="button" onClick={() => setTout(!tout)} className="mt-2 text-sm font-bold text-[var(--pj-accent,#4F46E5)] hover:underline">
          {tout ? 'Moins' : `Voir tout (${liste.length})`}
        </button>
      ) : null}
    </section>
  );
}
