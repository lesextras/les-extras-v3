'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appel as appelAssociation } from '../../association/_client';
import { appel as appelAcademie } from '../../academie/_client';
import { TEINTE_ACADEMIE } from '../projets/contexte';
import type { LienEspace, ListeLiaisons } from './types';

const BADGES: Record<LienEspace['sens'], { libelle: string; ton: string }> = {
  ACTIF: { libelle: 'Relié', ton: 'bg-[#E3F5EC] text-[#0F5F3E]' },
  ENVOYEE: { libelle: 'En attente', ton: 'bg-[#FEF3E2] text-[#7C3E06]' },
  A_REPONDRE: { libelle: 'À accepter', ton: 'bg-[#FEF3E2] text-[#7C3E06]' },
  REFUSEE: { libelle: 'Refusé', ton: 'bg-[#FDE7EC] text-[#8A1B3D]' },
};

const TYPE: Record<string, string> = { ASSOCIATION: 'Association', ACADEMIE: 'Académie' };

/**
 * RÉGLAGES → ESPACES RELIÉS.
 *
 * Relier l'association et l'académie : elles partagent alors leurs projets,
 * les formations de ces projets et les agréments. Les deux espaces lisent les
 * mêmes données, rien n'est recopié.
 */
export function EspacesRelies({ espace, initial }: { espace: 'association' | 'academie'; initial: ListeLiaisons | null }) {
  const router = useRouter();
  const appel = espace === 'academie' ? appelAcademie : appelAssociation;
  const [donnees, setDonnees] = useState<ListeLiaisons | null>(initial);
  const [choix, setChoix] = useState(initial?.reliables[0]?.accountId ?? '');
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const autreType = espace === 'academie' ? 'association' : 'académie';

  async function agir(cle: string, action: () => Promise<unknown>) {
    setErreur(null);
    setEnCours(cle);
    try {
      await action();
      const frais = await appel<ListeLiaisons>('/liaisons');
      setDonnees(frais);
      setChoix(frais.reliables[0]?.accountId ?? '');
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'action a échoué.");
    } finally {
      setEnCours(null);
    }
  }

  if (!donnees) {
    return <p className="text-sm text-[var(--pj-gris,#6B6A8A)]">Les espaces reliés ne se chargent pas pour le moment.</p>;
  }

  const visibles = donnees.liens.filter((l) => l.sens !== 'REFUSEE' || donnees.peutGerer);
  const choisi = donnees.reliables.find((r) => r.accountId === choix);

  return (
    <div style={espace === 'academie' ? TEINTE_ACADEMIE : undefined} className="space-y-4">
      <p className="text-[15px] leading-relaxed text-[var(--pj-texte,#3B3A66)]">
        Relie ton {autreType} : projets, formations et agréments partagés, sans double saisie.
      </p>

      {visibles.length ? (
        <ul className="divide-y divide-[var(--pj-bord,#E6E4F3)] rounded-xl border border-[var(--pj-bord,#E6E4F3)]">
          {visibles.map((l) => {
            const badge = BADGES[l.sens];
            return (
              <li key={l.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold text-[var(--pj-encre,#1D1B5C)]">{l.autre.nom}</span>
                  <span className="text-xs font-bold text-[var(--pj-gris,#6B6A8A)]">{TYPE[l.autre.type] ?? l.autre.type}</span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.ton}`}>{badge.libelle}</span>
                {l.sens === 'A_REPONDRE' && donnees.peutGerer ? (
                  <>
                    <button
                      type="button"
                      disabled={enCours !== null}
                      onClick={() => void agir(`ok-${l.id}`, () => appel(`/liaisons/${l.id}/accepter`, { method: 'POST' }))}
                      className="rounded-lg bg-[var(--pj-accent,#4F46E5)] px-3 py-1.5 text-sm font-bold text-white hover:bg-[var(--pj-accent-fonce,#4338CA)] disabled:opacity-60"
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      disabled={enCours !== null}
                      onClick={() => void agir(`non-${l.id}`, () => appel(`/liaisons/${l.id}/refuser`, { method: 'POST' }))}
                      className="rounded-lg px-3 py-1.5 text-sm font-bold text-[#8A2419] hover:bg-[#FDE8E6] disabled:opacity-60"
                    >
                      Refuser
                    </button>
                  </>
                ) : null}
                {donnees.peutGerer && l.sens !== 'A_REPONDRE' ? (
                  <button
                    type="button"
                    disabled={enCours !== null}
                    onClick={() => {
                      if (l.sens === 'ACTIF' && !window.confirm(`Retirer le lien avec « ${l.autre.nom} » ? Les formations reliées aux projets seront détachées.`)) return;
                      void agir(`x-${l.id}`, () => appel(`/liaisons/${l.id}`, { method: 'DELETE' }));
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--pj-gris,#6B6A8A)] hover:bg-[var(--pj-fond,#F0EFF7)] hover:text-[#8A2419] disabled:opacity-60"
                  >
                    {l.sens === 'ENVOYEE' ? 'Annuler' : 'Retirer'}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-[var(--pj-fond-doux,#F5F4FC)] px-4 py-3 text-sm text-[var(--pj-gris,#6B6A8A)]">Aucun espace relié.</p>
      )}

      {donnees.reliables.length ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-sm">
            <span className="font-bold text-[var(--pj-encre,#1D1B5C)]">Relier un espace</span>
            <select
              value={choix}
              onChange={(e) => setChoix(e.target.value)}
              className="rounded-xl border border-[var(--pj-bord-champ,#D9D6EE)] bg-white px-3 py-2.5 text-base text-[var(--pj-encre,#1D1B5C)] focus:border-[var(--pj-accent,#4F46E5)] focus:outline-none"
            >
              {donnees.reliables.map((r) => (
                <option key={r.accountId} value={r.accountId}>
                  {r.nom} ({TYPE[r.type] ?? r.type})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!choix || !donnees.peutGerer || enCours !== null}
            onClick={() => void agir('relier', () => appel('/liaisons', { method: 'POST', body: { accountId: choix } }))}
            className="rounded-xl bg-[var(--pj-accent,#4F46E5)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--pj-accent-fonce,#4338CA)] disabled:opacity-50"
          >
            {enCours === 'relier' ? '…' : 'Relier'}
          </button>
          {choisi ? (
            <p className="w-full text-xs text-[var(--pj-gris,#6B6A8A)]">
              {!donnees.peutGerer
                ? 'Réservé aux administrateurs de cet espace.'
                : choisi.jeSuisAdmin
                  ? 'Tu administres les deux : le lien est actif tout de suite.'
                  : "Un administrateur de l'autre espace devra accepter."}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-[var(--pj-gris,#6B6A8A)]">Aucun autre espace de type {autreType} à relier.</p>
      )}

      {erreur ? <p className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-3 py-2 text-sm text-[#7C3E06]">{erreur}</p> : null}
    </div>
  );
}
