'use client';

import { useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useProjets } from './contexte';
import type { ActionAssociation, MembreEquipe, StatutTache, TacheProjet } from '../../association/espace/_types';
import { Avatar, CARTE, Echeance, Icone, STATUTS, nomResponsable } from './_taches';
import { FormTache } from './FormTache';

/** Range une colonne : rang, puis date de création. */
const parOrdre = (a: TacheProjet, b: TacheProjet) => a.ordre - b.ordre || a.createdAt.localeCompare(b.createdAt);

/**
 * LES TÂCHES D'UN PROJET, EN COLONNES.
 *
 * À faire, en cours, bloquée, faite : on attrape une carte et on la pose, à la
 * hauteur voulue. Sur téléphone, le menu « Déplacer vers » fait pareil.
 */
export function TachesProjet({
  projet,
  taches: initiales,
  equipe,
  projets,
}: {
  projet: ActionAssociation;
  taches: TacheProjet[];
  equipe: MembreEquipe[];
  projets: ActionAssociation[];
}) {
  const router = useRouter();
  const { appel, chemins } = useProjets();
  const [taches, setTaches] = useState<TacheProjet[]>(initiales);
  const [ouverte, setOuverte] = useState<TacheProjet | { nouvelle: StatutTache } | null>(null);
  const [attrapee, setAttrapee] = useState<string | null>(null);
  const [survol, setSurvol] = useState<{ statut: StatutTache; position: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  /* Les données du serveur font foi dès qu'elles changent (après router.refresh). */
  const signature = JSON.stringify(initiales);
  const [vue, setVue] = useState(signature);
  if (vue !== signature) {
    setVue(signature);
    setTaches(initiales);
  }

  const colonne = (s: StatutTache) => taches.filter((t) => t.statut === s).sort(parOrdre);
  const faites = taches.filter((t) => t.statut === 'FAITE').length;

  async function deplacer(id: string, statut: StatutTache, position?: number) {
    const avant = taches;
    const t = taches.find((x) => x.id === id);
    if (!t) return;
    const cible = colonne(statut).filter((x) => x.id !== id);
    const p = position === undefined ? cible.length : Math.min(position, cible.length);
    const range = [...cible.slice(0, p), { ...t, statut }, ...cible.slice(p)].map((x, i) => ({ ...x, ordre: i }));
    setTaches([...taches.filter((x) => x.statut !== statut && x.id !== id), ...range]);
    setErreur(null);
    try {
      await appel(`${chemins.taches}/${id}/deplacer`, { method: 'POST', body: { statut, position: p } });
      router.refresh();
    } catch (err) {
      setTaches(avant);
      setErreur(err instanceof Error ? err.message : 'Le déplacement a échoué.');
    }
  }

  function surDepot(e: DragEvent, statut: StatutTache) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData('text/plain') || attrapee;
    let position = survol?.statut === statut ? survol.position : undefined;
    /* Dans sa propre colonne, la carte attrapée libère sa place : le rang visé remonte d'un cran. */
    const depart = colonne(statut).findIndex((x) => x.id === id);
    if (position !== undefined && depart !== -1 && depart < position) position -= 1;
    setSurvol(null);
    setAttrapee(null);
    if (id) void deplacer(id, statut, position);
  }

  const formulaire = (t: TacheProjet | null, statut: StatutTache = 'A_FAIRE') => (
    <FormTache key={t?.id ?? `nouvelle-${statut}`} tache={t} actionId={projet.id} statutInitial={statut} equipe={equipe} projets={projets} onFermer={() => setOuverte(null)} />
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {taches.length ? (
          <div className="flex min-w-[10rem] flex-1 items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--pj-teinte,#ECEBFC)]">
              <div className="h-full rounded-full bg-[#1E9E6A]" style={{ width: `${Math.round((faites / taches.length) * 100)}%` }} />
            </div>
            <span className="text-xs font-bold text-[var(--pj-gris,#6B6A8A)]">
              {faites}/{taches.length}
            </span>
          </div>
        ) : (
          <p className="flex-1 text-sm text-[var(--pj-gris,#6B6A8A)]">Découpe le projet en tâches.</p>
        )}
        <button
          type="button"
          onClick={() => setOuverte({ nouvelle: 'A_FAIRE' })}
          className="inline-flex items-center gap-1 rounded-xl bg-[var(--pj-accent,#4F46E5)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--pj-accent-fonce,#4338CA)]"
        >
          <Icone nom="plus" /> Tâche
        </button>
      </div>

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-sm text-[#7C3E06]">{erreur}</p> : null}
      {ouverte && 'nouvelle' in ouverte ? formulaire(null, ouverte.nouvelle) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STATUTS.map((s) => {
          const siennes = colonne(s.code);
          const cible = survol?.statut === s.code;
          return (
            <div
              key={s.code}
              onDragOver={(e) => {
                e.preventDefault();
                if (!cible) setSurvol({ statut: s.code, position: siennes.length });
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSurvol((x) => (x?.statut === s.code ? null : x));
              }}
              onDrop={(e) => surDepot(e, s.code)}
              className={`rounded-2xl p-2 transition ${cible ? 'ring-2 ring-[var(--pj-accent,#4F46E5)]' : ''}`}
              style={{ background: cible ? s.fond : `color-mix(in srgb, ${s.fond} 60%, transparent)` }}
            >
              <p className="flex items-center gap-2 px-1.5 py-1 text-sm font-extrabold" style={{ color: s.texte }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.barre }} />
                {s.libelle}
                <span className="font-bold opacity-70">{siennes.length}</span>
              </p>
              <ul className="mt-1 space-y-2">
                {siennes.map((t, i) => {
                  const r = nomResponsable(t, equipe);
                  if (ouverte && !('nouvelle' in ouverte) && ouverte.id === t.id) return <li key={t.id}>{formulaire(t)}</li>;
                  return (
                    <li
                      key={t.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const haut = e.currentTarget.getBoundingClientRect();
                        const position = e.clientY < haut.top + haut.height / 2 ? i : i + 1;
                        if (survol?.statut !== s.code || survol.position !== position) setSurvol({ statut: s.code, position });
                      }}
                      onDrop={(e) => surDepot(e, s.code)}
                    >
                      {cible && survol?.position === i && attrapee !== t.id ? <div className="mb-2 h-1 rounded-full bg-[var(--pj-accent,#4F46E5)]" /> : null}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', t.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setAttrapee(t.id);
                        }}
                        onDragEnd={() => {
                          setAttrapee(null);
                          setSurvol(null);
                        }}
                        className={`${CARTE} cursor-grab p-2.5 active:cursor-grabbing ${attrapee === t.id ? 'opacity-50' : ''}`}
                        style={t.enRetard && t.statut !== 'FAITE' ? { borderColor: '#F3B0C2' } : undefined}
                      >
                        <button type="button" onClick={() => setOuverte(t)} className="block w-full text-left">
                          <span className={`flex items-start gap-1.5 text-sm font-bold leading-snug ${t.statut === 'FAITE' ? 'text-[var(--pj-gris,#6B6A8A)] line-through' : 'text-[var(--pj-encre,#1D1B5C)]'}`}>
                            {t.priorite === 'HAUTE' ? <Icone nom="drapeau" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D6335C]" /> : null}
                            {t.titre}
                          </span>
                          <span className="mt-2 flex items-center justify-between gap-2">
                            <Avatar nom={r.nom} moi={r.moi} taille="sm" />
                            <Echeance tache={t} />
                          </span>
                        </button>
                        <label className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[var(--pj-gris,#6B6A8A)] sm:hidden">
                          Déplacer vers
                          <select
                            value={t.statut}
                            onChange={(e) => void deplacer(t.id, e.target.value as StatutTache)}
                            className="flex-1 rounded-lg border border-[var(--pj-bord-champ,#D9D6EE)] bg-white px-2 py-1 text-xs font-bold text-[var(--pj-encre,#1D1B5C)] focus:border-[var(--pj-accent,#4F46E5)] focus:outline-none"
                          >
                            {STATUTS.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.libelle}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </li>
                  );
                })}
                {cible && survol?.position === siennes.length && siennes.length > 0 ? <li className="h-1 rounded-full bg-[var(--pj-accent,#4F46E5)]" /> : null}
                {siennes.length === 0 ? <li className="px-2 py-4 text-center text-xs text-[var(--pj-gris-clair,#9A99B5)]">{cible ? 'Pose ici' : '—'}</li> : null}
              </ul>
              <button
                type="button"
                onClick={() => setOuverte({ nouvelle: s.code })}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold text-[var(--pj-gris,#6B6A8A)] hover:bg-white/70 hover:text-[var(--pj-encre,#1D1B5C)]"
                aria-label={`Ajouter une tâche : ${s.libelle}`}
              >
                <Icone nom="plus" className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
