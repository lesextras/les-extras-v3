'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../../_client';
import { pourInput, type ActionAssociation, type MembreEquipe, type StatutTache, type TacheProjet } from '../_types';
import { Icone, PRIORITES, STATUT, STATUTS, type ValeursTache } from './_taches';

const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-3 py-2.5 text-base text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';

function depuis(t: TacheProjet | null, actionId: string, statut: StatutTache): ValeursTache {
  return {
    actionId: t?.actionId ?? actionId,
    titre: t?.titre ?? '',
    description: t?.description ?? '',
    responsable: t?.responsable?.cle ?? '',
    debut: pourInput(t?.debut),
    echeance: pourInput(t?.echeance),
    priorite: t?.priorite ?? 'NORMALE',
    statut: t?.statut ?? statut,
  };
}

/**
 * Le formulaire complet d'une tâche : quoi, qui, quand, à quel point c'est
 * urgent, où on en est. `projets` permet de changer la tâche de projet.
 */
export function FormTache({
  tache,
  actionId,
  statutInitial = 'A_FAIRE',
  equipe,
  projets,
  onFermer,
}: {
  tache: TacheProjet | null;
  actionId: string;
  statutInitial?: StatutTache;
  equipe: MembreEquipe[];
  projets?: ActionAssociation[];
  onFermer: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState<ValeursTache>(depuis(tache, actionId, statutInitial));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const membresEquipe = equipe.filter((m) => m.source === 'EQUIPE');
  const membresAcces = equipe.filter((m) => m.source === 'ACCES');
  /* Un responsable parti de l'équipe reste affiché, pour ne pas l'effacer sans le vouloir. */
  const horsEquipe = tache?.responsable && !equipe.some((m) => m.cle === tache.responsable?.cle) ? tache.responsable : null;

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (v.debut && v.echeance && v.echeance < v.debut) {
      setErreur("L'échéance doit venir après le début.");
      return;
    }
    setErreur(null);
    setEnCours(true);
    const body = {
      actionId: v.actionId,
      titre: v.titre.trim(),
      description: v.description.trim() || null,
      responsable: v.responsable || null,
      debut: v.debut || null,
      echeance: v.echeance || null,
      priorite: v.priorite,
      statut: v.statut,
    };
    try {
      if (tache) await appel(`/association/taches/${tache.id}`, { method: 'PATCH', body });
      else await appel('/association/taches', { method: 'POST', body });
      router.refresh();
      onFermer();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!tache || !window.confirm(`Supprimer « ${tache.titre} » ?`)) return;
    setEnCours(true);
    try {
      await appel(`/association/taches/${tache.id}`, { method: 'DELETE' });
      router.refresh();
      onFermer();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'La suppression a échoué.');
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-3 rounded-2xl border-2 border-[#4F46E5] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-extrabold text-[#1D1B5C]">
          <Icone nom="liste" className="h-4 w-4 text-[#4F46E5]" />
          {tache ? 'La tâche' : 'Une tâche'}
        </p>
        <button type="button" onClick={onFermer} aria-label="Fermer" className="rounded-lg p-1 text-[#6B6A8A] hover:bg-[#ECEBFC] hover:text-[#1D1B5C]">
          <Icone nom="croix" />
        </button>
      </div>

      <input
        type="text"
        required
        maxLength={200}
        autoFocus={!tache}
        value={v.titre}
        onChange={(e) => setV({ ...v, titre: e.target.value })}
        placeholder="Réserver la salle, appeler la mairie…"
        aria-label="Titre de la tâche"
        className={CHAMP}
      />
      <textarea rows={2} maxLength={4000} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Détails (facultatif)" aria-label="Détails" className={CHAMP} />

      <div className="grid gap-3 sm:grid-cols-2">
        {projets && projets.length > 1 ? (
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-bold text-[#1D1B5C]">Projet</span>
            <select value={v.actionId} onChange={(e) => setV({ ...v, actionId: e.target.value })} className={CHAMP}>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.intitule}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="flex items-center gap-1.5 font-bold text-[#1D1B5C]">
            <Icone nom="personne" className="h-3.5 w-3.5" /> Responsable
          </span>
          <select value={v.responsable} onChange={(e) => setV({ ...v, responsable: e.target.value })} className={CHAMP}>
            <option value="">Personne pour l’instant</option>
            {horsEquipe ? <option value={horsEquipe.cle}>{horsEquipe.nom}</option> : null}
            {membresEquipe.length ? (
              <optgroup label="Mon équipe">
                {membresEquipe.map((m) => (
                  <option key={m.cle} value={m.cle}>
                    {m.nom}
                    {m.moi ? ' (moi)' : ''}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {membresAcces.length ? (
              <optgroup label="Accès à l’espace">
                {membresAcces.map((m) => (
                  <option key={m.cle} value={m.cle}>
                    {m.nom}
                    {m.moi ? ' (moi)' : ''}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
          {equipe.length === 0 ? (
            <Link href="/espace/repertoire" className="text-xs font-bold text-[#4F46E5] underline underline-offset-2">
              + Ajouter quelqu’un à mon équipe
            </Link>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold text-[#1D1B5C]">Début</span>
          <input type="date" value={v.debut} onChange={(e) => setV({ ...v, debut: e.target.value })} className={CHAMP} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-1.5 font-bold text-[#1D1B5C]">
            <Icone nom="drapeau" className="h-3.5 w-3.5" /> Échéance
          </span>
          <input type="date" value={v.echeance} min={v.debut || undefined} onChange={(e) => setV({ ...v, echeance: e.target.value })} className={CHAMP} />
        </label>
      </div>

      <fieldset className="text-sm">
        <legend className="mb-1 font-bold text-[#1D1B5C]">Priorité</legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITES.map((p) => (
            <label
              key={p.code}
              className={`cursor-pointer rounded-xl border px-3 py-1.5 font-bold ${
                v.priorite === p.code
                  ? p.code === 'HAUTE'
                    ? 'border-[#D6335C] bg-[#FDE7EC] text-[#8A1B3D]'
                    : 'border-[#4F46E5] bg-[#ECEBFC] text-[#4338CA]'
                  : 'border-[#D9D6EE] bg-white text-[#3B3A66]'
              }`}
            >
              <input type="radio" name="priorite" checked={v.priorite === p.code} onChange={() => setV({ ...v, priorite: p.code })} className="sr-only" />
              {p.libelle}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="text-sm">
        <legend className="mb-1 font-bold text-[#1D1B5C]">Statut</legend>
        <div className="flex flex-wrap gap-2">
          {STATUTS.map((s) => (
            <label
              key={s.code}
              className="cursor-pointer rounded-xl border px-3 py-1.5 font-bold"
              style={v.statut === s.code ? { borderColor: s.barre, background: s.fond, color: s.texte } : { borderColor: '#D9D6EE', background: '#fff', color: '#3B3A66' }}
            >
              <input type="radio" name="statut" checked={v.statut === s.code} onChange={() => setV({ ...v, statut: s.code })} className="sr-only" />
              {STATUT[s.code].libelle}
            </label>
          ))}
        </div>
      </fieldset>

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-sm text-[#7C3E06]">{erreur}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={enCours} className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4338CA] disabled:opacity-60">
          <Icone nom="coche" />
          {enCours ? '…' : tache ? 'Enregistrer' : 'Ajouter'}
        </button>
        {tache ? (
          <button type="button" onClick={supprimer} disabled={enCours} className="ml-auto rounded-xl px-3 py-2.5 text-sm font-bold text-[#8A2419] hover:bg-[#FDE8E6]">
            Supprimer
          </button>
        ) : null}
      </div>
    </form>
  );
}
